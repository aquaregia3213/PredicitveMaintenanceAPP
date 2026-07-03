# SpindleCare: IBM watsonx.ai Predictive Maintenance Dashboard

SpindleCare is an AI-powered, real-time industrial telemetry monitoring and predictive maintenance system. Built on a 10,000-row CNC Spindle telemetry dataset, the application integrates a machine learning classifier deployed on **IBM watsonx.ai** (using IBM Cloud Watson Machine Learning REST APIs) to anticipate and classify spindle failures before they occur.

---

## 🚀 Key Features

* **Live Spindle Predictor**: Interactive console to adjust Spindle Type (L, M, H), Temperatures (Air/Process), Rotational Speed (RPM), Torque (Nm), and Tool Wear (min). Fetches real-time prediction and confidence scores directly from watsonx.ai.
* **Analytics Dashboard**: Comprehensive dataset analytics, pre-computed Gini Feature Importances (showing Torque and Temperature Differential as the primary leading indicators of failure), and model performance metrics.
* **Model Performance Metrics**: Displays the champion model's Holdout Score (99.60% Accuracy), confusion matrix heatmaps, and F1 performance categories.
* **Internship Deliverables Hub**: Integrated week-by-week timeline, PowerPoint presentation downloads, and verified IBM SkillsBuild digital credential badging with visual overlay lightboxes.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, Tailwind CSS (Vanilla CSS UI styling matching modern neo-brutalist dark/cream aesthetics), Framer Motion (for page animations and transitions), Recharts, Lucide Icons.
* **Backend**: Node.js, Express, TypeScript (proxy API server to securely append IBM Cloud OAuth access tokens and handle communication with WML endpoint).
* **Machine Learning**: Decision Trees, XGBoost Classifier deployed on **IBM Cloud watsonx.ai**.

---

## 🏃 Running Locally

### Prerequisites
* **Node.js** (v16+)
* **Python** (optional, for offline verification scripts)

### Installation Steps

1. Clone this repository:
   ```bash
   git clone https://github.com/aquaregia3213/PredicitveMaintenanceAPP.git
   cd PredicitveMaintenanceAPP
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Watson ML Keys:
   Create a `keys.txt` file in the root directory and configure it as follows:
   ```text
   ibm key - <YOUR_IBM_CLOUD_API_KEY>
   
   public endpoint - <YOUR_WATSON_ML_DEPLOYMENT_PREDICTION_URL>
   ```

4. Launch the application:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000/`.

---

## 📊 Physical Safety Envelope & Failure Modes

The model boundary maps closely to the following physical machine constraints derived from the telemetry dataset:

1. **Tool Wear Failure (TWF)**: Triggered when cutter wear exceeds **200 minutes**.
2. **Heat Dissipation Failure (HDF)**: Triggered when the temperature difference ($\Delta T = \text{Process Temp} - \text{Air Temp}$) is **$< 8.6 \text{ K}$** and rotational speed is **$< 1380 \text{ RPM}$**.
3. **Power Failure (PWF)**: Triggered when Spindle Power ($Torque \times RPM \times \frac{2\pi}{60}$) is **$< 3500\text{W}$** or **$> 9000\text{W}$**.
4. **Overstrain Failure (OSF)**: Triggered when the product of Tool Wear and Torque exceeds the quality threshold:
   * **H (High)** Spindle: $> 13,000 \text{ min}\cdot\text{Nm}$
   * **M (Medium)** Spindle: $> 12,000 \text{ min}\cdot\text{Nm}$
   * **L (Low)** Spindle: $> 11,000 \text{ min}\cdot\text{Nm}$
5. **Random Failures (RNF)**: Stochastic failures that do not follow physical sensor rules.

---

## 🔗 API Integration

The proxy server routes client requests from `/api/predict` to the live IBM Watson Machine Learning REST API:

### Request Payload
```json
{
  "machineType": "M",
  "airTemp": 304.5,
  "processTemp": 312.0,
  "rpm": 1200,
  "torque": 40.0,
  "toolWear": 115
}
```

### Response Payload
```json
{
  "prediction": "Heat Dissipation Failure",
  "confidence": 70.0,
  "calculatedPower": 5027
}
```

---

## 🛡️ License

This project is licensed under the MIT License. Developed for the AICTE & IBM SkillsBuild Student Internship Program.
