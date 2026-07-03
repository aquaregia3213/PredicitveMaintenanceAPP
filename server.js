// server.ts
import express from "express";
import path2 from "path";

// server-api.ts
import fs from "fs";
import path from "path";
function parseKeys() {
  if (process.env.IBM_KEY && process.env.PUBLIC_ENDPOINT) {
    return {
      apiKey: process.env.IBM_KEY.trim(),
      endpoint: process.env.PUBLIC_ENDPOINT.trim()
    };
  }
  const keysPath = path.join(process.cwd(), "keys.txt");
  if (!fs.existsSync(keysPath)) {
    throw new Error("IBM credentials missing: Set IBM_KEY and PUBLIC_ENDPOINT env variables or create keys.txt at root");
  }
  const content = fs.readFileSync(keysPath, "utf8");
  const keyMatch = content.match(/ibm key\s*-\s*([^\r\n]+)/);
  const endpointMatch = content.match(/public endpoint\s*-\s*([^\r\n]+)/);
  if (!keyMatch || !endpointMatch) {
    throw new Error("keys.txt has invalid format");
  }
  return {
    apiKey: keyMatch[1].trim(),
    endpoint: endpointMatch[1].trim()
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
  try {
    const { apiKey, endpoint } = parseKeys();
    const token = await getAccessToken(apiKey);
    const body = await getBody(req);
    const { machineType, airTemp, processTemp, rpm, torque, toolWear } = body;
    if (!machineType || airTemp === void 0 || processTemp === void 0 || rpm === void 0 || torque === void 0 || toolWear === void 0) {
      return sendJSON(res, 400, { error: "Missing required sensor fields" });
    }
    const diffTemp = processTemp - airTemp;
    const power = torque * (rpm * 2 * Math.PI / 60);
    const overstrainFactor = toolWear * torque;
    const threshold = machineType === "H" ? 13e3 : machineType === "M" ? 12e3 : 11e3;
    const isFailure = toolWear >= 200 || overstrainFactor > threshold || (power < 3500 || power > 9e3) || diffTemp < 8.6 && rpm < 1380;
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
    const predictRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!predictRes.ok) {
      const errText = await predictRes.text();
      return sendJSON(res, predictRes.status, { error: `Watson ML Error: ${errText}` });
    }
    const predictData = await predictRes.json();
    if (!predictData.predictions || !predictData.predictions[0] || !predictData.predictions[0].values || !predictData.predictions[0].values[0]) {
      return sendJSON(res, 500, { error: "Unexpected Watson ML response format", details: predictData });
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
    const roundedPower = Math.round(power);
    sendJSON(res, 200, {
      prediction: predictedClass,
      confidence,
      calculatedPower: roundedPower
    });
  } catch (err) {
    console.error("Prediction proxy error:", err);
    sendJSON(res, 500, { error: err.message || "Internal server error" });
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

// server.ts
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json());
app.post("/api/predict", (req, res) => {
  predictHandler(req, res);
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
