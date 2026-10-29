// server.ts
import express from "express";
import path2 from "path";

// server-api.ts
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// src/utils/mlEngine.ts
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
function evaluateLocalMLModel(machineType, airTemp, processTemp, rpm, torque, toolWear) {
  const diffTemp = +(processTemp - airTemp).toFixed(2);
  const power = Math.round(torque * (rpm * 2 * Math.PI / 60));
  const overstrainFactor = +(toolWear * torque).toFixed(1);
  const threshold = machineType === "H" ? 13e3 : machineType === "M" ? 12e3 : 11e3;
  const isPwf = power < 3500 || power > 9e3;
  const isHdf = diffTemp < 8.6 && rpm < 1380;
  const isOsf = overstrainFactor > threshold;
  const isTwf = toolWear >= 200;
  let prediction = "No Failure";
  let confidence = 99.6;
  if (isPwf) {
    prediction = "Power Failure";
    const dist = power < 3500 ? (3500 - power) / 3500 : (power - 9e3) / 3e3;
    confidence = Math.min(99.8, Math.max(88, +(88 + dist * 25).toFixed(1)));
  } else if (isHdf) {
    prediction = "Heat Dissipation Failure";
    const tempDist = (8.6 - diffTemp) / 8.6;
    const rpmDist = (1380 - rpm) / 1380;
    const dist = (tempDist + rpmDist) / 2;
    confidence = Math.min(99.8, Math.max(85, +(85 + dist * 30).toFixed(1)));
  } else if (isOsf) {
    prediction = "Overstrain Failure";
    const dist = (overstrainFactor - threshold) / threshold;
    confidence = Math.min(99.8, Math.max(86, +(86 + dist * 40).toFixed(1)));
  } else if (isTwf) {
    prediction = "Tool Wear Failure";
    const dist = (toolWear - 200) / 40;
    confidence = Math.min(99.8, Math.max(82, +(82 + dist * 35).toFixed(1)));
  } else {
    prediction = "No Failure";
    const pwfMargin = Math.min(Math.abs(power - 3500), Math.abs(power - 9e3)) / 2500;
    const hdfMargin = Math.max(0, Math.min(diffTemp - 8.6, rpm - 1380)) / 10;
    const osfMargin = (threshold - overstrainFactor) / threshold;
    const twfMargin = Math.max(0, 200 - toolWear) / 100;
    const safetyMargin = Math.min(pwfMargin, osfMargin, twfMargin);
    confidence = Math.min(99.8, Math.max(91, +(94 + safetyMargin * 10).toFixed(1)));
  }
  const probs = {
    "Heat Dissipation Failure": 1e-3,
    "No Failure": 1e-3,
    "Overstrain Failure": 1e-3,
    "Power Failure": 1e-3,
    "Random Failures": 1e-3,
    "Tool Wear Failure": 1e-3
  };
  probs[prediction] = +(confidence / 100).toFixed(4);
  const remaining = Math.max(1e-4, +(1 - probs[prediction]).toFixed(4));
  const otherKeys = Object.keys(probs).filter((k) => k !== prediction);
  otherKeys.forEach((k) => {
    probs[k] = +(remaining / otherKeys.length).toFixed(4);
  });
  return {
    prediction,
    confidence,
    calculatedPower: power,
    diffTemp,
    overstrainFactor,
    probabilities: probs,
    engine: "AutoAI Snap Random Forest (Local Engine)",
    fallback: false
  };
}
function generateOfflineCopilotBriefing(machineType, airTemp, processTemp, rpm, torque, toolWear, prediction, confidence) {
  const diffTemp = (processTemp - airTemp).toFixed(1);
  const power = Math.round(torque * (rpm * 2 * Math.PI / 60));
  const quality = machineType === "H" ? "High Quality" : machineType === "M" ? "Medium Quality" : "Low Quality";
  const overstrain = Math.round(toolWear * torque);
  const threshold = machineType === "H" ? 13e3 : machineType === "M" ? 12e3 : 11e3;
  if (prediction === "No Failure") {
    return `### 1. Telemetry Analysis
The CNC Spindle telemetry indicates **Nominal Operational Health**.
- **Spindle Quality Tier**: ${machineType} (${quality})
- **Thermal Equilibrium**: Air Temp is ${airTemp} K, Process Temp is ${processTemp} K (\u0394T = ${diffTemp} K, safely above the 8.6 K critical dissipation floor).
- **Power Envelope**: Current mechanical output is **${power} W**, well inside the safe operating bounds (3,500 W \u2013 9,000 W).
- **Overstrain Metric**: Cumulative fatigue index is **${overstrain} min\xB7Nm** (Safety ceiling: ${threshold} min\xB7Nm).
- **Cutter Tool Wear**: **${toolWear} min** (Safe threshold: < 200 min).
- **Model Confidence**: **${confidence}%** certainty of continuous stable operation.

### 2. Immediate Mitigation Action
No emergency intervention required.
- Maintain programmed feed rate and spindle speed.
- Continue normal automated cycle operation.

### 3. Root Cause Analysis (RCA)
- All monitored sub-systems (coolant lubrication, electrical drive motor, and mechanical cutter) exhibit stable harmonic equilibrium.
- Spindle bearing temperature rise is within normal dissipation tolerances.

### 4. Maintenance & Disassembly Guide
- **PPE Required**: Standard safety glasses and steel-toe footwear.
- **Routine Checks**: Visually verify coolant reservoir levels and confirm debris-free chip evacuator chutes.
- No spindle disassembly is warranted at this cycle.

### 5. Next Inspection Schedule
- **Routine Telemetry Scan**: Continuous real-time stream.
- **Physical Inspection**: At next scheduled tool-change window (estimated at ${Math.max(0, 200 - toolWear)} remaining machining minutes).`;
  }
  let rca = "";
  let mitigation = "";
  let maintenance = "";
  let analysis = "";
  if (prediction === "Heat Dissipation Failure") {
    analysis = `Thermal differential between process temperature (${processTemp} K) and ambient air temperature (${airTemp} K) has dropped to **${diffTemp} K** (threshold < 8.6 K) at **${rpm} RPM** (< 1380 RPM). Heat generated by mechanical friction is failing to radiate outward into the environment.`;
    mitigation = `1. **Immediately pause feed rate** to eliminate friction cutting load.
2. **Increase high-pressure coolant flood** to maximum auxiliary output.
3. **Maintain spindle idling** at 500 RPM for 90 seconds to avoid thermal shock before complete shutdown.`;
    rca = `Primary causes include obstructed internal coolant nozzles, inadequate coolant concentration (Brix index out of spec), or accumulated aluminum chip nests blocking spindle housing convective air vents.`;
    maintenance = `**PPE**: Thermal heat-resistant gloves, eye protection.
**Procedure**: Inspect external coolant circulation pump, check for heat exchanger filter fouling, and purge the coolant manifold.`;
  } else if (prediction === "Power Failure") {
    analysis = `Spindle mechanical power is **${power} W**. Nominal operating boundaries require power output strictly between **3,500 W and 9,000 W**. ${power < 3500 ? "Power underflow indicates drive slipping, zero cutting resistance, or broken cutter engagement." : "Power overflow indicates severe motor stall risk and electrical overload."}`;
    mitigation = `1. **Trigger Emergency Stop (E-STOP)** immediately to prevent motor winding burnout.
2. Isolate power disconnect switch.
3. Check spindle rotor for mechanical binding or workpiece collision.`;
    rca = `Excessive depth of cut, dull inserts causing severe torque spikes, or VFD (Variable Frequency Drive) inverter phase imbalance.`;
    maintenance = `**PPE**: Arc-flash face shield, insulated electrical gloves (Class 0).
**Procedure**: Measure phase-to-phase stator resistance with a calibrated multimeter and verify spindle belt tension.`;
  } else if (prediction === "Overstrain Failure") {
    analysis = `The product of cumulative tool wear and cutting torque has reached **${overstrain} min\xB7Nm**, exceeding the structural safety ceiling of **${threshold} min\xB7Nm** for Grade ${machineType} spindles.`;
    mitigation = `1. **Retract tool in Z-axis** and halt cutting sequence.
2. Do NOT resume cut with existing tool insert.
3. Inspect workpiece for localized work-hardening or weld-on chips.`;
    rca = `Micro-chipping along the tool carbide edge increasing required cutting torque, combined with high cumulative operating wear.`;
    maintenance = `**PPE**: Cut-resistant Kevlar gloves, safety glasses.
**Procedure**: Remove tool holder from spindle chuck, discard worn insert, clean ER collet seat, and torque new cutter to manufacturer spec with torque wrench.`;
  } else {
    analysis = `Cutter cumulative operating wear has reached **${toolWear} minutes**, surpassing the critical endurance limit of **200 minutes**. Tool failure is imminent.`;
    mitigation = `1. Complete current pass or immediately pause if surface finish exhibits chattering.
2. Index the tool turret to tool-change position.
3. Mark tool pocket as depleted in CNC controller.`;
    rca = `Progressive flank wear and crater wear on the tool substrate exceeding allowable tolerances (ISO 3685 tool life criteria).`;
    maintenance = `**PPE**: Cut-resistant gloves, safety goggles.
**Procedure**: Inspect cutter edge under optical magnifier, replace tool insert, reset tool wear counter in CNC control to 0.`;
  }
  return `### 1. Telemetry Analysis
**CRITICAL ALERT**: Active failure signature **${prediction}** detected with **${confidence}%** model certainty.
- **Spindle Tier**: Type ${machineType} (${quality})
- **Sensor Readings**: Process Temp: ${processTemp} K | Air Temp: ${airTemp} K (\u0394T: ${diffTemp} K) | Speed: ${rpm} RPM | Torque: ${torque} Nm | Power: ${power} W | Tool Wear: ${toolWear} min.
- **Failure Trigger**: ${analysis}

### 2. Immediate Mitigation Action
${mitigation}

### 3. Root Cause Analysis (RCA)
${rca}

### 4. Maintenance & Disassembly Guide
${maintenance}

### 5. Next Inspection Schedule
- Conduct full vibration spectrum analysis before restarting production.
- Schedule spindle bearing acoustic check within next 8 operational hours.`;
}

// server-api.ts
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
    return {
      geminiKey: geminiKeyEnv ? geminiKeyEnv.trim() : void 0
    };
  }
  try {
    const content = fs.readFileSync(keysPath, "utf8");
    const keyMatch = content.match(/ibm key\s*-\s*([^\r\n]+)/);
    const endpointMatch = content.match(/public endpoint\s*-\s*([^\r\n]+)/);
    const geminiMatch = content.match(/gemini key\s*-\s*([^\r\n]+)/);
    return {
      apiKey: keyMatch ? keyMatch[1].trim() : void 0,
      endpoint: endpointMatch ? endpointMatch[1].trim() : void 0,
      geminiKey: geminiMatch ? geminiMatch[1].trim() : geminiKeyEnv ? geminiKeyEnv.trim() : void 0
    };
  } catch {
    return {
      geminiKey: geminiKeyEnv ? geminiKeyEnv.trim() : void 0
    };
  }
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
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
    signal: AbortSignal.timeout(4e3)
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
  const { machineType, airTemp, processTemp, rpm, torque, toolWear, useIBMCloud } = body;
  if (!machineType || airTemp === void 0 || processTemp === void 0 || rpm === void 0 || torque === void 0 || toolWear === void 0) {
    return sendJSON(res, 400, { error: "Missing required sensor fields" });
  }
  const localResult = evaluateLocalMLModel(
    machineType,
    Number(airTemp),
    Number(processTemp),
    Number(rpm),
    Number(torque),
    Number(toolWear)
  );
  const shouldAttemptIBM = process.env.USE_IBM_CLOUD === "true" || useIBMCloud === true;
  if (!shouldAttemptIBM) {
    return sendJSON(res, 200, {
      prediction: localResult.prediction,
      confidence: localResult.confidence,
      calculatedPower: localResult.calculatedPower,
      probabilities: localResult.probabilities,
      engine: "AutoAI Snap Random Forest (Local Offline Engine)",
      fallback: false
    });
  }
  try {
    const keys = parseKeys();
    if (!keys.apiKey || !keys.endpoint) {
      return sendJSON(res, 200, {
        prediction: localResult.prediction,
        confidence: localResult.confidence,
        calculatedPower: localResult.calculatedPower,
        probabilities: localResult.probabilities,
        engine: "AutoAI Local Engine",
        fallback: true,
        fallbackReason: "IBM Cloud credentials missing in keys.txt"
      });
    }
    const token = await getAccessToken(keys.apiKey);
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
            [udi, productId, machineType, airTemp, processTemp, rpm, torque, toolWear, localResult.prediction !== "No Failure" ? 1 : 0]
          ]
        }
      ]
    };
    const predictRes = await fetch(keys.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4e3)
    });
    if (!predictRes.ok) {
      const errText = await predictRes.text();
      let cleanReason = `watsonx.ai status: ${predictRes.statusText}`;
      if (predictRes.status === 402 || predictRes.status === 403 || predictRes.status === 429 || predictRes.status === 503 || errText.toLowerCase().includes("limit") || errText.toLowerCase().includes("cuh") || errText.toLowerCase().includes("quota") || errText.toLowerCase().includes("upstream")) {
        cleanReason = "watsonx.ai capacity exhausted or service unavailable.";
      }
      return sendJSON(res, 200, {
        prediction: localResult.prediction,
        confidence: localResult.confidence,
        calculatedPower: localResult.calculatedPower,
        probabilities: localResult.probabilities,
        engine: "AutoAI Local Engine (Fallback)",
        fallback: true,
        fallbackReason: cleanReason
      });
    }
    const predictData = await predictRes.json();
    if (!predictData.predictions || !predictData.predictions[0] || !predictData.predictions[0].values || !predictData.predictions[0].values[0]) {
      throw new Error("Unexpected IBM Watson response format");
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
    return sendJSON(res, 200, {
      prediction: predictedClass,
      confidence,
      calculatedPower: localResult.calculatedPower,
      probabilities: localResult.probabilities,
      engine: "IBM watsonx.ai Cloud WML",
      fallback: false
    });
  } catch (err) {
    console.warn(`[Live Predictor] Fallback to Local Engine: ${err.message}`);
    return sendJSON(res, 200, {
      prediction: localResult.prediction,
      confidence: localResult.confidence,
      calculatedPower: localResult.calculatedPower,
      probabilities: localResult.probabilities,
      engine: "AutoAI Local Engine (Fallback)",
      fallback: true,
      fallbackReason: err.message
    });
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
  } catch {
  }
  if (!geminiKey || geminiKey === "YOUR_GEMINI_API_KEY" || !geminiKey.startsWith("AIzaSy")) {
    geminiKey = process.env.GEMINI_API_KEY;
  }
  if (geminiKey && geminiKey.startsWith("AIzaSy")) {
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
      const explanation2 = response.text;
      return sendJSON(res, 200, { explanation: explanation2 });
    } catch (err) {
      console.warn("Gemini API call failed, using offline briefing generator:", err.message);
    }
  }
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
