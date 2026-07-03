export type TabType = 'home' | 'live-predictor' | 'analytics' | 'about-model' | 'sip-submission';

export interface SensorData {
  machineType: 'H' | 'M' | 'L'; // High, Medium, Low quality variants
  airTemp: number; // K
  processTemp: number; // K
  rpm: number; // Rotational speed
  torque: number; // Nm
  toolWear: number; // min
}

export type FailureType = 
  | 'No Failure'
  | 'Heat Dissipation Failure'
  | 'Tool Wear Failure'
  | 'Power Failure'
  | 'Overstrain Failure'
  | 'Random Failure'
  | 'Random Failures'; // IBM API returns this exact string

export interface PredictionResult {
  id: string;
  timestamp: string;
  inputs: SensorData;
  failurePrediction: FailureType;
  confidence: number; // Percentage, e.g. 98.4
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  suggestedAction: string;
}

export interface MetricStat {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export interface FailureCard {
  type: FailureType;
  title: string;
  color: string;
  icon: string;
  description: string;
  triggerConditions: string;
}
