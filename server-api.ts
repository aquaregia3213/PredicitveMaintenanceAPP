import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';
import {
  evaluateLocalMLModel,
  generateOfflineCopilotBriefing,
  getAnalyticsData
} from './src/utils/mlEngine';

export { evaluateLocalMLModel, generateOfflineCopilotBriefing, getAnalyticsData };

function parseKeys(): { apiKey?: string; endpoint?: string; geminiKey?: string } {
  const ibmKeyEnv = process.env.IBM_KEY;
  const publicEndpointEnv = process.env.PUBLIC_ENDPOINT;
  const geminiKeyEnv = process.env.GEMINI_API_KEY;

  if (ibmKeyEnv && publicEndpointEnv) {
    return {
      apiKey: ibmKeyEnv.trim(),
      endpoint: publicEndpointEnv.trim(),
      geminiKey: geminiKeyEnv ? geminiKeyEnv.trim() : undefined
    };
  }

  const keysPath = path.join(process.cwd(), 'keys.txt');
  if (!fs.existsSync(keysPath)) {
    return {
      geminiKey: geminiKeyEnv ? geminiKeyEnv.trim() : undefined
    };
  }

  try {
    const content = fs.readFileSync(keysPath, 'utf8');
    const keyMatch = content.match(/ibm key\s*-\s*([^\r\n]+)/);
    const endpointMatch = content.match(/public endpoint\s*-\s*([^\r\n]+)/);
    const geminiMatch = content.match(/gemini key\s*-\s*([^\r\n]+)/);

    return {
      apiKey: keyMatch ? keyMatch[1].trim() : undefined,
      endpoint: endpointMatch ? endpointMatch[1].trim() : undefined,
      geminiKey: geminiMatch ? geminiMatch[1].trim() : (geminiKeyEnv ? geminiKeyEnv.trim() : undefined)
    };
  } catch {
    return {
      geminiKey: geminiKeyEnv ? geminiKeyEnv.trim() : undefined
    };
  }
}

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

async function getAccessToken(apiKey: string) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiryTime) {
    return cachedToken;
  }
  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
    signal: AbortSignal.timeout(4000)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IAM token error: ${res.statusText} - ${text}`);
  }
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiryTime = now + (data.expires_in - 60) * 1000;
  return cachedToken;
}

// Accumulated body parser helper
function getBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((req as any).body !== undefined) {
      resolve((req as any).body);
      return;
    }
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
  });
}

function sendJSON(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function analyticsHandler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  try {
    const stats = getAnalyticsData();
    sendJSON(res, 200, stats);
  } catch (err: any) {
    console.error('Analytics parsing error:', err);
    sendJSON(res, 500, { error: err.message || 'Internal server error' });
  }
}

export async function predictHandler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  let body: any;
  try {
    body = await getBody(req);
  } catch (err: any) {
    return sendJSON(res, 400, { error: 'Invalid JSON in request body' });
  }

  const { machineType, airTemp, processTemp, rpm, torque, toolWear, useIBMCloud } = body;
  if (!machineType || airTemp === undefined || processTemp === undefined || rpm === undefined || torque === undefined || toolWear === undefined) {
    return sendJSON(res, 400, { error: 'Missing required sensor fields' });
  }

  // 1. Evaluate Local ML Model
  const localResult = evaluateLocalMLModel(
    machineType as 'H' | 'M' | 'L',
    Number(airTemp),
    Number(processTemp),
    Number(rpm),
    Number(torque),
    Number(toolWear)
  );

  // Check if IBM Cloud was explicitly requested (e.g. via USE_IBM_CLOUD env or request body flag)
  const shouldAttemptIBM = process.env.USE_IBM_CLOUD === 'true' || useIBMCloud === true;

  if (!shouldAttemptIBM) {
    // Return high-speed local ML inference directly (0ms, 100% free forever)
    return sendJSON(res, 200, {
      prediction: localResult.prediction,
      confidence: localResult.confidence,
      calculatedPower: localResult.calculatedPower,
      probabilities: localResult.probabilities,
      engine: 'AutoAI Snap Random Forest (Local Offline Engine)',
      fallback: false
    });
  }

  // If user explicitly configured IBM Cloud, try IBM Cloud with strict fallback
  try {
    const keys = parseKeys();
    if (!keys.apiKey || !keys.endpoint) {
      return sendJSON(res, 200, {
        prediction: localResult.prediction,
        confidence: localResult.confidence,
        calculatedPower: localResult.calculatedPower,
        probabilities: localResult.probabilities,
        engine: 'AutoAI Local Engine',
        fallback: true,
        fallbackReason: 'IBM Cloud credentials missing in keys.txt'
      });
    }

    const token = await getAccessToken(keys.apiKey);
    const udi = Math.floor(1 + Math.random() * 9999);
    const productId = `${machineType}${10000 + Math.floor(Math.random() * 90000)}`;

    const payload = {
      input_data: [
        {
          fields: [
            "UDI", "Product ID", "Type", "Air temperature [K]",
            "Process temperature [K]", "Rotational speed [rpm]",
            "Torque [Nm]", "Tool wear [min]", "Target"
          ],
          values: [
            [udi, productId, machineType, airTemp, processTemp, rpm, torque, toolWear, localResult.prediction !== 'No Failure' ? 1 : 0]
          ]
        }
      ]
    };

    const predictRes = await fetch(keys.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000)
    });

    if (!predictRes.ok) {
      const errText = await predictRes.text();
      let cleanReason = `watsonx.ai status: ${predictRes.statusText}`;
      if (
        predictRes.status === 402 || 
        predictRes.status === 403 || 
        predictRes.status === 429 ||
        predictRes.status === 503 ||
        errText.toLowerCase().includes("limit") ||
        errText.toLowerCase().includes("cuh") ||
        errText.toLowerCase().includes("quota") ||
        errText.toLowerCase().includes("upstream")
      ) {
        cleanReason = "watsonx.ai capacity exhausted or service unavailable.";
      }
      return sendJSON(res, 200, {
        prediction: localResult.prediction,
        confidence: localResult.confidence,
        calculatedPower: localResult.calculatedPower,
        probabilities: localResult.probabilities,
        engine: 'AutoAI Local Engine (Fallback)',
        fallback: true,
        fallbackReason: cleanReason
      });
    }

    const predictData = await predictRes.json() as any;
    if (
      !predictData.predictions ||
      !predictData.predictions[0] ||
      !predictData.predictions[0].values ||
      !predictData.predictions[0].values[0]
    ) {
      throw new Error('Unexpected IBM Watson response format');
    }

    const predictedClass = predictData.predictions[0].values[0][0];
    const rawProbabilities = predictData.predictions[0].values[0][1];

    const classes = [
      'Heat Dissipation Failure',
      'No Failure',
      'Overstrain Failure',
      'Power Failure',
      'Random Failures',
      'Tool Wear Failure'
    ];

    const classIndex = classes.indexOf(predictedClass);
    let confidence = 100.0;
    if (classIndex !== -1 && Array.isArray(rawProbabilities)) {
      confidence = parseFloat((rawProbabilities[classIndex] * 100).toFixed(2));
    }

    return sendJSON(res, 200, {
      prediction: predictedClass,
      confidence,
      calculatedPower: localResult.calculatedPower,
      probabilities: localResult.probabilities,
      engine: 'IBM watsonx.ai Cloud WML',
      fallback: false
    });

  } catch (err: any) {
    console.warn(`[Live Predictor] Fallback to Local Engine: ${err.message}`);
    return sendJSON(res, 200, {
      prediction: localResult.prediction,
      confidence: localResult.confidence,
      calculatedPower: localResult.calculatedPower,
      probabilities: localResult.probabilities,
      engine: 'AutoAI Local Engine (Fallback)',
      fallback: true,
      fallbackReason: err.message
    });
  }
}

export async function explainHandler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  let body: any;
  try {
    body = await getBody(req);
  } catch (err: any) {
    return sendJSON(res, 400, { error: 'Invalid JSON in request body' });
  }

  const { machineType, airTemp, processTemp, rpm, torque, toolWear, prediction, confidence } = body;
  if (
    !machineType ||
    airTemp === undefined ||
    processTemp === undefined ||
    rpm === undefined ||
    torque === undefined ||
    toolWear === undefined ||
    !prediction ||
    confidence === undefined
  ) {
    return sendJSON(res, 400, { error: 'Missing required sensor or prediction fields' });
  }

  // Get Gemini API key if present
  let geminiKey: string | undefined;
  try {
    const keys = parseKeys();
    geminiKey = keys.geminiKey;
  } catch {}

  if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY' || !geminiKey.startsWith('AIzaSy')) {
    geminiKey = process.env.GEMINI_API_KEY;
  }

  // If valid Gemini key exists, try calling Gemini API; otherwise use offline generator
  if (geminiKey && geminiKey.startsWith('AIzaSy')) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const diffTemp = (processTemp - airTemp).toFixed(1);
      const power = Math.round(torque * (rpm * 2 * Math.PI / 60));

      const prompt = `
You are an expert industrial CNC maintenance and reliability engineer.
Analyze the following CNC spindle telemetry readings and classification prediction to generate a comprehensive, highly actionable diagnostic and mitigation report.

Spindle Telemetry Inputs:
- Spindle Type: ${machineType} (${machineType === 'H' ? 'High Quality' : machineType === 'M' ? 'Medium Quality' : 'Low Quality'})
- Air Temperature (Ambient): ${airTemp} K
- Process Temperature: ${processTemp} K
- Temperature Differential (ΔT): ${diffTemp} K
- Rotational Speed: ${rpm} RPM
- Torque: ${torque} Nm
- Calculated Power: ${power} W
- Cumulative Tool Wear: ${toolWear} minutes

Model Prediction:
- Status: ${prediction}
- Model Confidence: ${confidence}%

Provide your response in structured markdown with the following sections:
1. **Telemetry Analysis**: Explain why this failure was predicted (or why the system is deemed healthy). Reference the standard operating boundaries (e.g. tool wear limit of 200 mins, power limit of 3500W-9000W, ΔT < 8.6 K and RPM < 1380, or the overstrain limit based on spindle type).
2. **Immediate Mitigation Action**: Actionable step-by-step instructions for the operator on the shop floor to prevent damage or stabilize the spindle right now.
3. **Root Cause Analysis (RCA)**: Describe potential physical causes (e.g., coolant failure, cutter dulling, high feed rate, spindle motor wear).
4. **Maintenance & Disassembly Guide**: Technical repair instructions, safety gear needed (PPE), and tools required.
5. **Next Inspection Schedule**: Recommended inspection intervals and telemetry check frequency.

Be precise, highly technical yet readable for field operators, and keep the tone professional and authoritative.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const explanation = response.text;
      return sendJSON(res, 200, { explanation });
    } catch (err: any) {
      console.warn('Gemini API call failed, using offline briefing generator:', err.message);
    }
  }

  // High-reliability offline expert briefing
  const explanation = generateOfflineCopilotBriefing(
    machineType,
    airTemp,
    processTemp,
    rpm,
    torque,
    toolWear,
    prediction,
    confidence
  );

  return sendJSON(res, 200, { explanation });
}
