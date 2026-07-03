var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);

// server-api.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
function parseKeys() {
  const keysPath = import_path.default.join(process.cwd(), "keys.txt");
  if (!import_fs.default.existsSync(keysPath)) {
    throw new Error("keys.txt file is missing at root");
  }
  const content = import_fs.default.readFileSync(keysPath, "utf8");
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
  const csvPath = import_path.default.join(process.cwd(), "Predictive_Maintenance", "assets", "data_asset", "predictive_maintenance.csv");
  if (!import_fs.default.existsSync(csvPath)) {
    throw new Error("predictive_maintenance.csv file not found");
  }
  const content = import_fs.default.readFileSync(csvPath, "utf8");
  const lines = content.split("\n");
  const headers = lines[0].split(",");
  const typeIndex = headers.indexOf("Type");
  const failureTypeIndex = headers.findIndex((h) => h.includes("Failure Type") || h.trim() === "Failure Type");
  if (typeIndex === -1 || failureTypeIndex === -1) {
    throw new Error("Type or Failure Type column not found in CSV");
  }
  const createStats = () => ({
    total: 0,
    normal: 0,
    failures: 0,
    hdf: 0,
    pwf: 0,
    twf: 0,
    osf: 0,
    rnf: 0
  });
  const stats = {
    ALL: createStats(),
    H: createStats(),
    M: createStats(),
    L: createStats()
  };
  const recordRow = (grade, failureType) => {
    const inc = (s) => {
      s.total++;
      const cleaned = failureType.trim().toLowerCase();
      if (cleaned === "no failure" || cleaned === "") {
        s.normal++;
      } else {
        s.failures++;
        if (cleaned.includes("heat dissipation")) s.hdf++;
        else if (cleaned.includes("power")) s.pwf++;
        else if (cleaned.includes("tool wear")) s.twf++;
        else if (cleaned.includes("overstrain")) s.osf++;
        else s.rnf++;
      }
    };
    inc(stats.ALL);
    if (stats[grade]) {
      inc(stats[grade]);
    }
  };
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    if (cols.length <= Math.max(typeIndex, failureTypeIndex)) continue;
    const grade = cols[typeIndex].trim();
    const failureType = cols[failureTypeIndex];
    recordRow(grade, failureType);
  }
  return stats;
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
    const isFailure = toolWear >= 220 || overstrainFactor > threshold || (power < 3500 || power > 9e3) || diffTemp < 8.6 && rpm < 1380;
    const target = isFailure ? 1 : 0;
    const udi = 1;
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
    let mappedPrediction = predictedClass;
    if (mappedPrediction === "Random Failures") {
      mappedPrediction = "Random Failure";
    }
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
      prediction: mappedPrediction,
      confidence,
      calculatedPower: Math.round(power)
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
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
app.use(import_express.default.json());
app.post("/api/predict", (req, res) => {
  predictHandler(req, res);
});
app.get("/api/analytics", (req, res) => {
  analyticsHandler(req, res);
});
var distPath = import_path2.default.join(process.cwd(), "dist");
app.use(import_express.default.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(import_path2.default.join(distPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
