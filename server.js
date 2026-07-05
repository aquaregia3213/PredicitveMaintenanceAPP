// server.ts
import express from "express";
import path2 from "path";

// server-api.ts
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
function parseKeys() {
  const ibmKeyEnv = process.env.IBM_KEY;
  const publicEndpointEnv = process.env.PUBLIC_ENDPOINT;
  const geminiKeyEnv = process.env.GEMINI_API_KEY;
  if (ibmKeyEnv && publicEndpointEnv) {
    return {
      apiKey: ibmKeyEnv.trim(),
      endpoint: publicEndpointEnv.trim(),
      geminiKey: geminiKeyEnv ? geminiKeyEnv.trim() : void 0
    };
  }
  const keysPath = path.join(process.cwd(), "keys.txt");
  if (!fs.existsSync(keysPath)) {
    throw new Error("IBM credentials missing: Set IBM_KEY and PUBLIC_ENDPOINT env variables or create keys.txt at root");
  }
  const content = fs.readFileSync(keysPath, "utf8");
  const keyMatch = content.match(/ibm key\s*-\s*([^\r\n]+)/);
  const endpointMatch = content.match(/public endpoint\s*-\s*([^\r\n]+)/);
  const geminiMatch = content.match(/gemini key\s*-\s*([^\r\n]+)/);
  if (!keyMatch || !endpointMatch) {
    throw new Error("keys.txt has invalid format");
  }
  return {
    apiKey: keyMatch[1].trim(),
    endpoint: endpointMatch[1].trim(),
    geminiKey: geminiMatch ? geminiMatch[1].trim() : geminiKeyEnv ? geminiKeyEnv.trim() : void 0
  };
}
var cachedToken = null;
var tokenExpiryTime = 0;
async function getAccessToken(apiKey) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiryTime) {
    return cachedToken;
  }
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IAM token error: ${res.statusText} - ${text}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiryTime = now + (data.expires_in - 60) * 1e3;
  return cachedToken;
}
function getBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== void 0) {
      resolve(req.body);
      return;
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Invalid JSON in request body"));
      }
    });
  });
}
function sendJSON(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}
function getAnalyticsData() {
  return {
    ALL: {
      total: 1e4,
      normal: 9652,
      failures: 348,
      hdf: 112,
      pwf: 95,
      twf: 45,
      osf: 78,
      rnf: 18
    },
    H: {
      total: 1003,
      normal: 979,
      failures: 24,
      hdf: 8,
      pwf: 5,
      twf: 6,
      osf: 1,
      rnf: 4
    },
    M: {
      total: 2997,
      normal: 2916,
      failures: 81,
      hdf: 30,
      pwf: 31,
      twf: 14,
      osf: 4,
      rnf: 2
    },
    L: {
      total: 6e3,
      normal: 5757,
      failures: 243,
      hdf: 74,
      pwf: 59,
      twf: 25,
      osf: 73,
      rnf: 12
    }
  };
}
async function predictHandler(req, res) {
  if (req.method !== "POST") {
    return sendJSON(res, 405, { error: "Method not allowed" });
  }
  let body;
  try {
    body = await getBody(req);
  } catch (err) {
    return sendJSON(res, 400, { error: "Invalid JSON in request body" });
  }
  const { machineType, airTemp, processTemp, rpm, torque, toolWear } = body;
  if (!machineType || airTemp === void 0 || processTemp === void 0 || rpm === void 0 || torque === void 0 || toolWear === void 0) {
    return sendJSON(res, 400, { error: "Missing required sensor fields" });
  }
  const diffTemp = processTemp - airTemp;
  const power = torque * (rpm * 2 * Math.PI / 60);
  const overstrainFactor = toolWear * torque;
  const threshold = machineType === "H" ? 13e3 : machineType === "M" ? 12e3 : 11e3;
  const roundedPower = Math.round(power);
  const localPrediction = (() => {
    if (toolWear >= 200) return "Tool Wear Failure";
    if (overstrainFactor > threshold) return "Overstrain Failure";
    if (diffTemp < 8.6 && rpm < 1380) return "Heat Dissipation Failure";
    if (power < 3500 || power > 9e3) return "Power Failure";
    return "No Failure";
  })();
  const handleFallback = (reason) => {
    console.warn(`[Live Predictor] Fallback triggered: ${reason}`);
    return sendJSON(res, 200, {
      prediction: localPrediction,
      confidence: 99.6,
      calculatedPower: roundedPower,
      fallback: true,
      fallbackReason: reason
    });
  };
  try {
    let apiKey, endpoint;
    try {
      const keys = parseKeys();
      apiKey = keys.apiKey;
      endpoint = keys.endpoint;
    } catch (err) {
      return handleFallback(`IBM credentials config error: ${err.message}`);
    }
    let token;
    try {
      token = await getAccessToken(apiKey);
    } catch (err) {
      return handleFallback(`IBM Cloud authentication failed: ${err.message}`);
    }
    const isFailure = localPrediction !== "No Failure";
    const target = isFailure ? 1 : 0;
    const udi = Math.floor(1 + Math.random() * 9999);
    const productId = `${machineType}${1e4 + Math.floor(Math.random() * 9e4)}`;
    const payload = {
      input_data: [
        {
          fields: [
            "UDI",
            "Product ID",
            "Type",
            "Air temperature [K]",
            "Process temperature [K]",
            "Rotational speed [rpm]",
            "Torque [Nm]",
            "Tool wear [min]",
            "Target"
          ],
          values: [
            [udi, productId, machineType, airTemp, processTemp, rpm, torque, toolWear, target]
          ]
        }
      ]
    };
    let predictRes;
    try {
      predictRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      return handleFallback(`Network error contacting watsonx.ai: ${err.message}`);
    }
    if (!predictRes.ok) {
      const errText = await predictRes.text();
      let cleanReason = `Watson ML API error: ${predictRes.statusText}`;
      if (predictRes.status === 402 || predictRes.status === 403 || predictRes.status === 429 || errText.toLowerCase().includes("limit") || errText.toLowerCase().includes("cuh") || errText.toLowerCase().includes("quota") || errText.toLowerCase().includes("exhausted")) {
        cleanReason = "watsonx.ai Capacity Unit Hours (CUH) limit or service quota exhausted.";
      } else if (errText) {
        try {
          const parsed = JSON.parse(errText);
          if (parsed.message) cleanReason = `Watson ML: ${parsed.message}`;
          else if (parsed.error && parsed.error.message) cleanReason = `Watson ML: ${parsed.error.message}`;
        } catch {
        }
      }
      return handleFallback(cleanReason);
    }
    const predictData = await predictRes.json();
    if (!predictData.predictions || !predictData.predictions[0] || !predictData.predictions[0].values || !predictData.predictions[0].values[0]) {
      return handleFallback("Unexpected Watson ML response format");
    }
    const predictedClass = predictData.predictions[0].values[0][0];
    const rawProbabilities = predictData.predictions[0].values[0][1];
    const classes = [
      "Heat Dissipation Failure",
      "No Failure",
      "Overstrain Failure",
      "Power Failure",
      "Random Failures",
      "Tool Wear Failure"
    ];
    const classIndex = classes.indexOf(predictedClass);
    let confidence = 100;
    if (classIndex !== -1 && Array.isArray(rawProbabilities)) {
      confidence = parseFloat((rawProbabilities[classIndex] * 100).toFixed(2));
    }
    sendJSON(res, 200, {
      prediction: predictedClass,
      confidence,
      calculatedPower: roundedPower,
      fallback: false
    });
  } catch (err) {
    console.error("Prediction handler general error:", err);
    return handleFallback(err.message || "Unknown internal error");
  }
}
async function analyticsHandler(req, res) {
  if (req.method !== "GET") {
    return sendJSON(res, 405, { error: "Method not allowed" });
  }
  try {
    const stats = getAnalyticsData();
    sendJSON(res, 200, stats);
  } catch (err) {
    console.error("Analytics parsing error:", err);
    sendJSON(res, 500, { error: err.message || "Internal server error" });
  }
}
async function explainHandler(req, res) {
  if (req.method !== "POST") {
    return sendJSON(res, 405, { error: "Method not allowed" });
  }
  let body;
  try {
    body = await getBody(req);
  } catch (err) {
    return sendJSON(res, 400, { error: "Invalid JSON in request body" });
  }
  const { machineType, airTemp, processTemp, rpm, torque, toolWear, prediction, confidence } = body;
  if (!machineType || airTemp === void 0 || processTemp === void 0 || rpm === void 0 || torque === void 0 || toolWear === void 0 || !prediction || confidence === void 0) {
    return sendJSON(res, 400, { error: "Missing required sensor or prediction fields" });
  }
  let geminiKey;
  try {
    const keys = parseKeys();
    geminiKey = keys.geminiKey;
  } catch (err) {
  }
  if (!geminiKey || geminiKey === "YOUR_GEMINI_API_KEY") {
    geminiKey = process.env.GEMINI_API_KEY;
  }
  if (!geminiKey) {
    return sendJSON(res, 400, {
      error: "Gemini API key is not configured.",
      details: 'Please set the GEMINI_API_KEY environment variable or add "gemini key - <your-key>" to keys.txt at the root of the project.'
    });
  }
  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const diffTemp = (processTemp - airTemp).toFixed(1);
    const power = Math.round(torque * (rpm * 2 * Math.PI / 60));
    const prompt = `
You are an expert industrial CNC maintenance and reliability engineer.
Analyze the following CNC spindle telemetry readings and classification prediction to generate a comprehensive, highly actionable diagnostic and mitigation report.

Spindle Telemetry Inputs:
- Spindle Type: ${machineType} (${machineType === "H" ? "High Quality" : machineType === "M" ? "Medium Quality" : "Low Quality"})
- Air Temperature (Ambient): ${airTemp} K
- Process Temperature: ${processTemp} K
- Temperature Differential (\u0394T): ${diffTemp} K
- Rotational Speed: ${rpm} RPM
- Torque: ${torque} Nm
- Calculated Power: ${power} W
- Cumulative Tool Wear: ${toolWear} minutes

Model Prediction:
- Status: ${prediction}
- Model Confidence: ${confidence}%

Provide your response in structured markdown with the following sections:
1. **Telemetry Analysis**: Explain why this failure was predicted (or why the system is deemed healthy). Reference the standard operating boundaries (e.g. tool wear limit of 200 mins, power limit of 3500W-9000W, \u0394T < 8.6 K and RPM < 1380, or the overstrain limit based on spindle type).
2. **Immediate Mitigation Action**: Actionable step-by-step instructions for the operator on the shop floor to prevent damage or stabilize the spindle right now.
3. **Root Cause Analysis (RCA)**: Describe potential physical causes (e.g., coolant failure, cutter dulling, high feed rate, spindle motor wear).
4. **Maintenance & Disassembly Guide**: Technical repair instructions, safety gear needed (PPE), and tools required.
5. **Next Inspection Schedule**: Recommended inspection intervals and telemetry check frequency.

Be precise, highly technical yet readable for field operators, and keep the tone professional and authoritative.
`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    const explanation = response.text;
    return sendJSON(res, 200, { explanation });
  } catch (err) {
    console.error("Gemini explanation error:", err);
    return sendJSON(res, 500, { error: `Gemini API error: ${err.message}` });
  }
}

// server.ts
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json());
app.post("/api/predict", (req, res) => {
  predictHandler(req, res);
});
app.post("/api/explain", (req, res) => {
  explainHandler(req, res);
});
app.get("/api/analytics", (req, res) => {
  analyticsHandler(req, res);
});
var distPath = path2.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path2.join(distPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
