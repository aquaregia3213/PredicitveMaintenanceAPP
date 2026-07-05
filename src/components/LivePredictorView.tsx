import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { SensorData, PredictionResult, FailureType } from '../types';
import { 
  Play, RotateCcw, AlertCircle, CheckCircle2, AlertTriangle, 
  Trash2, Download, HelpCircle, Thermometer, ShieldCheck, 
  Settings, Layers, Cpu, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LivePredictorViewProps {
  predictionLogs: PredictionResult[];
  addPredictionLog: (log: PredictionResult) => void;
  clearPredictionLogs: () => void;
}

export default function LivePredictorView({ 
  predictionLogs, 
  addPredictionLog, 
  clearPredictionLogs 
}: LivePredictorViewProps) {

  // Default sensor values
  const defaultSensors: SensorData = {
    machineType: 'L',
    airTemp: 300.2,
    processTemp: 310.4,
    rpm: 1500,
    torque: 42.8,
    toolWear: 60,
  };

  const [sensors, setSensors] = useState<SensorData>(defaultSensors);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('normal');
  const [apiError, setApiError] = useState<string | null>(null);

  // Presets — values confirmed against live IBM watsonx.ai API (2026-07-02)
  // Each preset uses exact sensor values from real CSV rows for each failure class
  const presets = [
    {
      id: 'normal',
      label: 'Optimal Baseline',
      desc: 'Grade M machine in nominal ranges — IBM model: No Failure.',
      expectedResult: 'No Failure',
      data: { machineType: 'M' as const, airTemp: 298.5, processTemp: 308.5, rpm: 1520, torque: 38.0, toolWear: 45 }
    },
    {
      id: 'hdf',
      label: 'Heat Dissipation',
      desc: 'Low ΔT + low RPM — IBM model: Heat Dissipation Failure.',
      expectedResult: 'Heat Dissipation Failure',
      data: { machineType: 'M' as const, airTemp: 303.5, processTemp: 311.0, rpm: 1250, torque: 55.0, toolWear: 90 }
    },
    {
      id: 'pwf_low',
      label: 'Power Underflow',
      desc: 'Very high RPM + low torque (1378 W) — IBM model: Power Failure.',
      expectedResult: 'Power Failure',
      data: { machineType: 'L' as const, airTemp: 298.9, processTemp: 309.1, rpm: 2861, torque: 4.6, toolWear: 143 }
    },
    {
      id: 'pwf_high',
      label: 'Power Overflow',
      desc: 'High torque + high RPM (9701 W) — IBM model: Power Failure.',
      expectedResult: 'Power Failure',
      data: { machineType: 'L' as const, airTemp: 298.9, processTemp: 309.0, rpm: 1410, torque: 65.7, toolWear: 191 }
    },
    {
      id: 'osf',
      label: 'Overstrain Load',
      desc: 'High wear × torque factor — IBM model: Overstrain Failure.',
      expectedResult: 'Overstrain Failure',
      data: { machineType: 'L' as const, airTemp: 298.4, processTemp: 308.2, rpm: 1282, torque: 60.7, toolWear: 216 }
    },
    {
      id: 'twf',
      label: 'Tool Worn Out',
      desc: 'Cumulative tool wear ≥ 220 min — IBM model: Tool Wear Failure.',
      expectedResult: 'Tool Wear Failure',
      data: { machineType: 'L' as const, airTemp: 298.0, processTemp: 308.5, rpm: 1429, torque: 37.7, toolWear: 220 }
    }
  ];

  const applyPreset = (presetId: string, data: SensorData) => {
    setSensors(data);
    setActivePreset(presetId);
  };

  const handleSliderChange = (field: keyof SensorData, value: number) => {
    setSensors(prev => ({ ...prev, [field]: value }));
    setActivePreset('custom');
  };

  const handleTypeChange = (type: 'H' | 'M' | 'L') => {
    setSensors(prev => ({ ...prev, machineType: type }));
    setActivePreset('custom');
  };

  const getFailureDetails = (failure: FailureType, power: number): { risk: 'Low' | 'Medium' | 'High' | 'Critical'; action: string } => {
    switch (failure) {
      case 'Tool Wear Failure':
        return {
          risk: 'Critical',
          action: 'EMERGENCY SHUTDOWN. Replace mechanical cutting tool bit immediately. Lubricate slider rails.'
        };
      case 'Overstrain Failure':
        return {
          risk: 'Critical',
          action: 'CRITICAL WARNING. Reduce output torque load immediately. Cool cutter head and lower material feed rate.'
        };
      case 'Power Failure':
        return {
          risk: 'High',
          action: `SYSTEM SHUTDOWN RECOMMENDED. Power generation is outside safe range (${Math.round(power)} W). Inspect stator windings or speed governor.`
        };
      case 'Heat Dissipation Failure':
        return {
          risk: 'High',
          action: 'WARNING. Thermal dissipation rate insufficient. Increase airflow/cooling pump speed, or elevate rotation RPM to clear hot zones.'
        };
      case 'Random Failure':
      case 'Random Failures':
        return {
          risk: 'Medium',
          action: 'ADVISORY WARNING. Uncorrelated signal distortion detected. Check bearing alignment or recalibrate sensor telemetry.'
        };
      case 'No Failure':
      default:
        return {
          risk: 'Low',
          action: 'Nominal operations. Schedule next routine telemetry sweep in 24 operating hours.'
        };
    }
  };

  const executeDiagnosis = async () => {
    setIsDiagnosing(true);
    setApiError(null);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sensors)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Watson ML prediction request failed');
      }

      const result = await response.json();
      
      const calculatedPower = result.calculatedPower || 0;
      const details = getFailureDetails(result.prediction, calculatedPower);

      const newResult: PredictionResult = {
        id: 'TX-' + Math.floor(100000 + Math.random() * 900000),
        timestamp: new Date().toLocaleTimeString(),
        inputs: { ...sensors },
        failurePrediction: result.prediction,
        confidence: result.confidence,
        riskLevel: details.risk,
        suggestedAction: details.action,
        fallback: result.fallback,
        fallbackReason: result.fallbackReason
      };
      
      addPredictionLog(newResult);
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setApiError(err.message || 'An unknown error occurred while calling the prediction endpoint.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const downloadDetailedReport = (log: PredictionResult) => {
    const power = Math.round(log.inputs.torque * (log.inputs.rpm * 2 * Math.PI / 60));
    const tempDiff = +(log.inputs.processTemp - log.inputs.airTemp).toFixed(1);
    
    // Estimate remaining useful life (RUL) of the cutter tool
    const maxWear = 250;
    const remainingWear = Math.max(0, maxWear - log.inputs.toolWear);
    const wearPercentage = ((remainingWear / maxWear) * 100).toFixed(0);
    
    let futureOutlook = '';
    let recommendationRoadmap: string[] = [];
    
    if (log.failurePrediction === 'No Failure') {
      futureOutlook = 'OPTIMAL. The machinery is running within nominal mechanical and thermal tolerances. No immediate fatigue risks detected.';
      recommendationRoadmap = [
        '1. Continue normal operations.',
        '2. Lubricate cutter spindle within the next 48 operating hours.',
        '3. Schedule next telemetry sweep in 24 operating hours.',
        `4. Estimated Tool Life Remaining: ${remainingWear} minutes (${wearPercentage}% capacity).`
      ];
    } else {
      futureOutlook = `ATTENTION REQUIRED. An active failure signature [${log.failurePrediction}] has been flagged by Watsonx.ai. Structural fatigue is elevated.`;
      
      switch (log.failurePrediction) {
        case 'Tool Wear Failure':
          recommendationRoadmap = [
            '1. EMERGENCY SHUTDOWN: Immediately power down the spindle drive.',
            '2. MECHANICAL SERVICE: Replace the cutter insert tip.',
            '3. MAINTENANCE: Clear any debris from the slide bed and lubricate runner bearings.',
            '4. CALIBRATION: Reset the tool wear cumulative timer to 0 minutes before restarting.'
          ];
          break;
        case 'Overstrain Failure':
          recommendationRoadmap = [
            '1. REDUCE LOAD: Lower feed rate by 30% and reduce torque demands.',
            '2. ROTATIONAL ADJUSTMENT: Increase spindle speed slightly to clear heavy cuts.',
            '3. COOLING CHECK: Ensure lubricant flow rate is active at maximum gpm.',
            `4. Plan tool swap in next maintenance shift (Tool wear remaining: ${remainingWear} min).`
          ];
          break;
        case 'Power Failure':
          recommendationRoadmap = [
            '1. ELECTRICAL INSPECTION: Verify stator coils and speed governor calibrations.',
            '2. MECHANICAL COUPLING: Check the torque converter and belt alignment.',
            '3. POWER ADJUSTMENT: Calibrate electrical supply phase lines to match nominal rating (3.5 kW - 9.0 kW).',
            `4. Current Calculated Load: ${power} W (Outside safe envelope).`
          ];
          break;
        case 'Heat Dissipation Failure':
          recommendationRoadmap = [
            '1. THERMAL RELIEF: Increase auxiliary fan flow rate or chiller pressure.',
            '2. LOAD ADJUSTMENT: Reduce spindle load torque to decrease friction heat generation.',
            `3. TEMPERATURE GRADIENT: Current differential is ${tempDiff} K (Critical range is < 8.6 K).`,
            '4. Keep the spindle spinning without load for 5 minutes to dissipate heat.'
          ];
          break;
        case 'Random Failure':
        case 'Random Failures':
        default:
          recommendationRoadmap = [
            '1. SENSOR AUDIT: Recalibrate thermocouples and vibration sensors.',
            '2. SIGNAL CHECK: Verify sensor cabling shields are grounded.',
            '3. DATA SWEEP: Perform manual backup check of physical bearing temperatures.',
            '4. Schedule next telemetry sweep in 8 operating hours.'
          ];
          break;
      }
    }

    // Initialize jsPDF document (A4 page format: 210mm x 297mm)
    const doc = new jsPDF('p', 'mm', 'a4');

    // 1. BRAND HEADER BANNER
    // Dark ink banner
    doc.setFillColor(18, 18, 18);
    doc.rect(15, 15, 180, 24, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PREDICTX MACHINERY HEALTH REPORT', 20, 24);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 200, 200);
    doc.text('AICTE IBM SkillsBuild Program · AutoAI Pipeline 5 Winner Endpoint', 20, 32);

    // 2. SYSTEM STATUS FLAG CARD
    const isNominal = log.failurePrediction === 'No Failure';
    if (isNominal) {
      // Soft green nominal banner
      doc.setFillColor(222, 245, 230);
      doc.rect(15, 43, 180, 14, 'F');
      doc.setDrawColor(25, 81, 50);
      doc.setLineWidth(0.4);
      doc.rect(15, 43, 180, 14, 'D');
      doc.setTextColor(15, 81, 50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('SYSTEM STATUS: NOMINAL (NO PHYSICAL ANOMALIES DETECTED)', 22, 51.5);
    } else {
      // Soft red anomaly banner
      doc.setFillColor(248, 215, 218);
      doc.rect(15, 43, 180, 14, 'F');
      doc.setDrawColor(132, 32, 41);
      doc.setLineWidth(0.4);
      doc.rect(15, 43, 180, 14, 'D');
      doc.setTextColor(132, 32, 41);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`SYSTEM STATUS: ANOMALY DETECTED [${log.failurePrediction.toUpperCase()}]`, 22, 51.5);
    }

    // 3. EQUIPMENT TELEMETRY PROFILE TABLE
    doc.setTextColor(18, 18, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. EQUIPMENT TELEMETRY PROFILE', 15, 69);
    
    doc.setDrawColor(18, 18, 18);
    doc.setLineWidth(0.5);
    doc.line(15, 71, 195, 71);

    // Render 2-column key-value grid
    const tableItems = [
      { label: 'Machine Quality Grade', val: `Grade ${log.inputs.machineType}` },
      { label: 'Rotational Speed', val: `${log.inputs.rpm} RPM` },
      { label: 'Ambient Air Temp', val: `${log.inputs.airTemp.toFixed(1)} K (${(log.inputs.airTemp - 273.15).toFixed(1)} °C)` },
      { label: 'Applied Spindle Torque', val: `${log.inputs.torque.toFixed(1)} Nm` },
      { label: 'Process Operating Temp', val: `${log.inputs.processTemp.toFixed(1)} K (${(log.inputs.processTemp - 273.15).toFixed(1)} °C)` },
      { label: 'Calculated Spindle Power', val: `${power} W` },
      { label: 'Temperature Gradient', val: `${tempDiff} K` },
      { label: 'Cumulative Tool Wear', val: `${log.inputs.toolWear} min` }
    ];

    let currentY = 74;
    doc.setFontSize(9);
    for (let i = 0; i < tableItems.length; i += 2) {
      // Row zebra background
      if ((i / 2) % 2 === 0) {
        doc.setFillColor(246, 244, 241);
        doc.rect(15, currentY, 180, 7.5, 'F');
      }

      // Column 1
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(tableItems[i].label, 20, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(18, 18, 18);
      doc.text(tableItems[i].val, 65, currentY + 5);

      // Column 2
      if (i + 1 < tableItems.length) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(tableItems[i+1].label, 110, currentY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(18, 18, 18);
        doc.text(tableItems[i+1].val, 155, currentY + 5);
      }

      currentY += 7.5;
    }

    // 4. AI DIAGNOSTIC EVALUATION WIDGETS
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(18, 18, 18);
    doc.text('2. AI DIAGNOSTIC EVALUATION (IBM watsonx.ai)', 15, currentY);
    
    doc.setLineWidth(0.5);
    doc.line(15, currentY + 2, 195, currentY + 2);

    currentY += 6;
    
    // Risk Card (Col 1)
    let riskBg = [209, 231, 221]; // light green
    let riskText = [15, 81, 50]; // dark green
    if (log.riskLevel === 'Critical') {
      riskBg = [248, 215, 218];
      riskText = [132, 32, 41];
    } else if (log.riskLevel === 'High') {
      riskBg = [255, 243, 205];
      riskText = [102, 77, 3];
    } else if (log.riskLevel === 'Medium') {
      riskBg = [255, 243, 205];
      riskText = [102, 77, 3];
    }
    doc.setFillColor(riskBg[0], riskBg[1], riskBg[2]);
    doc.rect(15, currentY, 87, 16, 'F');
    doc.setDrawColor(riskText[0], riskText[1], riskText[2]);
    doc.setLineWidth(0.3);
    doc.rect(15, currentY, 87, 16, 'D');

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('CLASSIFICATION RISK LEVEL', 20, currentY + 5);
    doc.setTextColor(riskText[0], riskText[1], riskText[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(log.riskLevel.toUpperCase(), 20, currentY + 11);

    // Confidence Card (Col 2)
    doc.setFillColor(207, 244, 252);
    doc.rect(108, currentY, 87, 16, 'F');
    doc.setDrawColor(8, 121, 144);
    doc.rect(108, currentY, 87, 16, 'D');

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('AI MODEL PREDICTION CONFIDENCE', 113, currentY + 5);
    doc.setTextColor(8, 121, 144);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${log.confidence.toFixed(2)}% CONFIDENCE`, 113, currentY + 11);

    // 5. SUGGESTED ACTION DIRECTIVE
    currentY += 23;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(18, 18, 18);
    doc.text('3. SUGGESTED ACTION DIRECTIVE', 15, currentY);
    doc.setLineWidth(0.5);
    doc.line(15, currentY + 2, 195, currentY + 2);

    currentY += 6;
    doc.setFillColor(246, 244, 241);
    doc.rect(15, currentY, 180, 18, 'F');
    doc.setDrawColor(18, 18, 18);
    doc.setLineWidth(0.3);
    doc.rect(15, currentY, 180, 18, 'D');

    doc.setTextColor(18, 18, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const actionTextLines = doc.splitTextToSize(log.suggestedAction, 170);
    doc.text(actionTextLines, 20, currentY + 6);

    // 6. FUTURE OUTLOOK & SERVICE DIRECTIVES
    currentY += 25;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. PREDICTIVE MACHINERY ROADMAP (FUTURE OUTLOOK)', 15, currentY);
    doc.setLineWidth(0.5);
    doc.line(15, currentY + 2, 195, currentY + 2);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Machinery Health Outlook:', 15, currentY);
    
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const outlookLines = doc.splitTextToSize(futureOutlook, 180);
    doc.text(outlookLines, 15, currentY);

    currentY += (outlookLines.length * 4) + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(18, 18, 18);
    doc.text('Mandatory Service Directives:', 15, currentY);

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    recommendationRoadmap.forEach((line) => {
      const wrappedLine = doc.splitTextToSize(line, 180);
      doc.text(wrappedLine, 15, currentY);
      currentY += (wrappedLine.length * 4) + 1;
    });

    // 7. BRAND FOOTER
    doc.setDrawColor(18, 18, 18);
    doc.setLineWidth(0.4);
    doc.line(15, 275, 195, 275);
    
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Atharva Jadhav | MIT Academy of Engineering, Pune | AICTE IBM SkillsBuild Anomaly Report', 15, 280);
    doc.text('Page 1 of 1', 183, 280);

    // Save generated PDF
    doc.save(`predictx_machinery_report_${log.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportLogsToCSV = () => {
    if (predictionLogs.length === 0) return;
    
    const headers = 'ID,Timestamp,MachineType,AirTemp_K,ProcessTemp_K,RPM,Torque_Nm,ToolWear_Min,Prediction,Confidence_Pct,RiskLevel,SuggestedAction\n';
    const rows = predictionLogs.map(log => {
      return `${log.id},"${log.timestamp}",${log.inputs.machineType},${log.inputs.airTemp},${log.inputs.processTemp},${log.inputs.rpm},${log.inputs.torque},${log.inputs.toolWear},"${log.failurePrediction}",${log.confidence},${log.riskLevel},"${log.suggestedAction.replace(/"/g, '""')}"`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `predictx_watsonx_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeResult = predictionLogs[0] || null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="space-y-12"
    >
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#121212] dark:border-white/20 pb-6">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#121212] dark:text-white">Live Prediction Console</h2>
          <p className="text-[#121212]/70 dark:text-white/60 text-sm">Fine-tune machine sensor inputs and query the live IBM watsonx.ai AutoAI endpoint.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#121212] dark:text-white bg-[#121212]/5 dark:bg-white/10 px-3 py-1.5 rounded-none border border-[#121212] dark:border-white/30">
            AutoAI Pipeline 5 · Live
          </span>
        </div>
      </div>

      {/* Grid of Sliders and Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Controller Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 border border-[#121212] dark:border-white/20 shadow-[4px_4px_0px_0px_#121212] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] space-y-6 rounded-none">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#121212] dark:text-white" />
                Telemetry Sliders
              </h3>
              <motion.button 
                onClick={() => setSensors(defaultSensors)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#121212] dark:text-white hover:bg-[#121212]/10 dark:hover:bg-white/10 flex items-center gap-1 bg-[#121212]/5 dark:bg-white/5 px-2.5 py-1.5 border border-[#121212] dark:border-white/30 transition-colors rounded-none cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Defaults
              </motion.button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono uppercase text-[#121212]/60 dark:text-white/50 tracking-widest block font-bold">Load Diagnostics Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {presets.map(p => (
                  <motion.button
                    key={p.id}
                    onClick={() => applyPreset(p.id, p.data)}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 text-left rounded-none border text-xs transition-all cursor-pointer ${
                      activePreset === p.id 
                        ? 'bg-[#121212] dark:bg-white border-[#121212] dark:border-white text-white dark:text-[#121212] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]' 
                        : 'bg-white dark:bg-zinc-800 border-[#121212]/30 dark:border-white/20 text-[#121212]/70 dark:text-white/60 hover:text-[#121212] dark:hover:text-white hover:bg-[#121212]/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="font-serif font-bold block truncate">{p.label}</div>
                    <span className="text-[9px] font-mono uppercase tracking-wider block truncate mt-0.5 opacity-70">{p.desc}</span>
                    <span className="text-[8px] font-mono mt-1 block opacity-50">→ {p.expectedResult}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#121212]/20" />

            {/* Telemetry Control Fields */}
            <div className="space-y-6">
              
              {/* Machine Quality Type */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono uppercase font-bold tracking-widest text-[#121212] flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#121212]/60" />
                    Machine Quality Grade
                  </span>
                  <span className="text-xs font-mono text-[#121212] font-bold">
                    {sensors.machineType === 'H' ? 'High (H) - Variant' : sensors.machineType === 'M' ? 'Medium (M) - Variant' : 'Low (L) - Variant'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['L', 'M', 'H'] as const).map(grade => (
                    <motion.button
                      key={grade}
                      onClick={() => handleTypeChange(grade)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`py-2 rounded-none text-xs font-mono font-bold border transition-all cursor-pointer ${
                        sensors.machineType === grade
                          ? 'bg-[#121212] border-[#121212] text-white shadow-[2px_2px_0px_0px_#121212]'
                          : 'bg-white border-[#121212]/30 text-[#121212]/70 hover:text-[#121212] hover:bg-[#121212]/5'
                      }`}
                    >
                      Grade {grade}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Air Temp Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#121212]/70">
                  <span className="text-[#121212] font-semibold flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-[#121212]" />
                    Air Temperature
                  </span>
                  <span className="text-[#121212] font-bold">{sensors.airTemp.toFixed(1)} K <span className="text-[#121212]/50">({(sensors.airTemp - 273.15).toFixed(1)} °C)</span></span>
                </div>
                <input
                  type="range"
                  min="290"
                  max="315"
                  step="0.1"
                  value={sensors.airTemp}
                  onChange={(e) => handleSliderChange('airTemp', parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#EFECE8] border border-[#121212]/30 rounded-none appearance-none cursor-pointer accent-[#121212]"
                />
              </div>

              {/* Process Temp Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#121212]/70">
                  <span className="text-[#121212] font-semibold flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-[#121212]" />
                    Process Temperature
                  </span>
                  <span className="text-[#121212] font-bold">{sensors.processTemp.toFixed(1)} K <span className="text-[#121212]/50">({(sensors.processTemp - 273.15).toFixed(1)} °C)</span></span>
                </div>
                <input
                  type="range"
                  min="295"
                  max="325"
                  step="0.1"
                  value={sensors.processTemp}
                  onChange={(e) => handleSliderChange('processTemp', parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#EFECE8] border border-[#121212]/30 rounded-none appearance-none cursor-pointer accent-[#121212]"
                />
                <div className="flex justify-between text-[10px] text-[#121212]/60 font-mono">
                  <span>Temp Differential:</span>
                  <span className={sensors.processTemp - sensors.airTemp < 8.6 ? "text-red-700 font-bold" : "text-[#121212]/80"}>
                    {(sensors.processTemp - sensors.airTemp).toFixed(1)} K {sensors.processTemp - sensors.airTemp < 8.6 && "(HDF Risk < 8.6 K)"}
                  </span>
                </div>
              </div>

              {/* Rotational Speed (RPM) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#121212]/70">
                  <span className="text-[#121212] font-semibold flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5 text-[#121212]/60" />
                    Rotational Speed (RPM)
                  </span>
                  <span className="text-[#121212] font-bold">{sensors.rpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="2900"
                  step="10"
                  value={sensors.rpm}
                  onChange={(e) => handleSliderChange('rpm', parseInt(e.target.value))}
                  className="w-full h-1 bg-[#EFECE8] border border-[#121212]/30 rounded-none appearance-none cursor-pointer accent-[#121212]"
                />
              </div>

              {/* Torque (Nm) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#121212]/70">
                  <span className="text-[#121212] font-semibold flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-[#121212]/60" />
                    Torque (Nm)
                  </span>
                  <span className="text-[#121212] font-bold">{sensors.torque.toFixed(1)} Nm</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="80"
                  step="0.5"
                  value={sensors.torque}
                  onChange={(e) => handleSliderChange('torque', parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#EFECE8] border border-[#121212]/30 rounded-none appearance-none cursor-pointer accent-[#121212]"
                />
                <div className="flex justify-between text-[10px] text-[#121212]/60 font-mono">
                  <span>Calculated Power:</span>
                  <span>{Math.round(sensors.torque * (sensors.rpm * 2 * Math.PI / 60))} W</span>
                </div>
              </div>

              {/* Tool Wear (min) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#121212]/70">
                  <span className="text-[#121212] font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#121212]/60" />
                    Tool Wear Cumulative (min)
                  </span>
                  <span className="text-[#121212] font-bold">{sensors.toolWear} min</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="280"
                  step="1"
                  value={sensors.toolWear}
                  onChange={(e) => handleSliderChange('toolWear', parseInt(e.target.value))}
                  className="w-full h-1 bg-[#EFECE8] border border-[#121212]/30 rounded-none appearance-none cursor-pointer accent-[#121212]"
                />
              </div>

            </div>

            {/* Diagnostic trigger Button */}
            <motion.button
              onClick={executeDiagnosis}
              disabled={isDiagnosing}
              whileHover={isDiagnosing ? {} : { scale: 1.01, y: -1 }}
              whileTap={isDiagnosing ? {} : { scale: 0.99 }}
              className={`w-full py-4 rounded-none font-bold font-mono text-xs uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer ${
                isDiagnosing 
                  ? 'bg-[#121212]/10 text-[#121212]/50 border border-[#121212]/20 cursor-not-allowed' 
                  : 'bg-[#121212] text-white hover:bg-[#1d1d1d] border border-[#121212] shadow-[3px_3px_0px_0px_#121212] hover:shadow-[4px_4px_0px_0px_#121212]'
              }`}
            >
              {isDiagnosing ? (
                <>
                  <span className="h-4 w-4 border-2 border-[#121212]/30 border-t-[#121212] rounded-full animate-spin" />
                  <span>watsonx.ai Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Calculate AI Diagnosis</span>
                </>
              )}
            </motion.button>

          </div>
        </div>

        {/* Right Hand: AI Diagnostic Outcome Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          
          <div className="bg-white p-6 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] flex-1 flex flex-col justify-between overflow-hidden relative rounded-none">
            
            <AnimatePresence>
              {isDiagnosing && (
                /* Loading Skeleton overlay */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-[#FDFCFB]/95 z-10 flex flex-col items-center justify-center p-6 space-y-4"
                >
                  <div className="p-4 bg-[#121212]/5 rounded-none border border-[#121212] animate-bounce">
                    <Cpu className="h-8 w-8 text-[#121212]" />
                  </div>
            <div className="space-y-2 text-center">
                    <h4 className="font-serif font-bold text-lg text-[#121212] dark:text-white">Contacting watsonx.ai Endpoint</h4>
                    <p className="text-xs text-[#121212]/70 dark:text-white/50 max-w-xs leading-relaxed">
                      Querying AutoAI Pipeline 5 XGBoost Champion classifier. Please wait...
                    </p>
                  </div>
                  <div className="w-48 bg-[#EFECE8] border border-[#121212]/30 h-2 rounded-none overflow-hidden">
                    <div className="bg-[#121212] h-full w-1/2 animate-pulse" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {apiError ? (
              /* API Connection Error */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-4 bg-red-50 border border-red-800 text-red-800">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-lg text-red-800">API Connection Error</h4>
                  <p className="text-xs text-red-800/80 max-w-xs leading-relaxed">
                    {apiError}
                  </p>
                  <p className="text-[10px] text-[#121212]/60 leading-relaxed pt-2">
                    Please verify that `keys.txt` is present at the root of the project and contains valid IBM Cloud credentials.
                  </p>
                </div>
              </div>
            ) : activeResult ? (
              /* Actual Real Outcome */
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#121212]/20 pb-4">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-[#121212]/60 tracking-wider block">Diagnosis Token</span>
                      <h4 className="text-sm font-mono font-bold text-[#121212] mt-0.5">{activeResult.id}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-[#121212]/60">
                      Calculated at {activeResult.timestamp}
                    </span>
                  </div>

                  {activeResult.fallback && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-500 text-amber-850 dark:text-amber-300 text-[11px] font-mono leading-relaxed flex items-start gap-2 rounded-none text-left">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <span className="font-bold">LOCAL FALLBACK MODE ACTIVE</span>
                        <p className="mt-0.5 opacity-90 text-[10px]">
                          {activeResult.fallbackReason || 'Switched to local physical rules model due to Watson ML resource constraints.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 space-y-5 text-center">
                    {activeResult.failurePrediction === 'No Failure' ? (
                      /* Healthy Outcome */
                      <div className="space-y-4">
                        <div className="mx-auto p-4 bg-emerald-50 text-emerald-800 border border-emerald-800 flex items-center justify-center w-fit">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 border border-emerald-800">
                            System Healthy
                          </span>
                          <h3 className="font-serif font-bold text-2xl text-[#121212] pt-2">
                            Nominal Operation
                          </h3>
                          <p className="text-xs text-[#121212]/70 max-w-xs mx-auto leading-relaxed">
                            No physical telemetry thresholds breached. The model anticipates stable operations for subsequent work cycles.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Failure Warning */
                      <div className="space-y-4">
                        <div className="mx-auto p-4 bg-red-50 text-red-800 border border-red-800 flex items-center justify-center w-fit">
                          <AlertTriangle className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-800 bg-red-50 px-3 py-1 border border-red-800">
                            Anomaly Detected
                          </span>
                          <h3 className="font-serif font-bold text-xl text-[#121212] pt-2 leading-tight">
                            {activeResult.failurePrediction}
                          </h3>
                          <p className="text-xs text-[#121212]/70 max-w-xs mx-auto leading-relaxed">
                            A specific physical threshold anomaly has been classified by the AutoAI pipeline.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score indicators */}
                <div className="space-y-4 bg-[#F6F4F1] p-4 border border-[#121212] mt-6 rounded-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-[#121212]/60 uppercase block">Model Confidence</span>
                      <span className="font-serif font-bold text-lg text-[#121212]">
                        {activeResult.confidence}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-[#121212]/60 uppercase block">Risk Class</span>
                      <span className={`font-serif font-bold text-lg ${
                        activeResult.riskLevel === 'Critical' ? 'text-red-700' : activeResult.riskLevel === 'High' ? 'text-orange-700' : activeResult.riskLevel === 'Medium' ? 'text-amber-700' : 'text-emerald-800'
                      }`}>
                        {activeResult.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-[#121212]/20" />

                  <div className="space-y-2.5">
                    <span className="text-[9px] font-mono text-[#121212]/60 uppercase flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Suggested Action Directive
                    </span>
                    <p className="text-xs text-[#121212] font-semibold leading-relaxed bg-white p-2.5 border border-[#121212]">
                      {activeResult.suggestedAction}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#121212]/15">
                    <button
                      onClick={() => downloadDetailedReport(activeResult)}
                      className="w-full py-3 bg-[#121212] text-white hover:bg-[#202020] font-bold font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-[#121212] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all rounded-none cursor-pointer"
                    >
                      <Download className="h-4 w-4 text-white" />
                      <span>Download Full Health Report</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* No Prediction Made Yet card */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-4 bg-[#121212]/5 border border-[#121212] text-[#121212]">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-lg text-[#121212]">Diagnosis Uninitiated</h4>
                  <p className="text-xs text-[#121212]/70 max-w-xs leading-relaxed">
                    Configure the telemetry sliders on the left, or apply a pre-configured failure preset, then trigger the predictive calculation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Prediction History Table */}
      <div className="bg-white p-6 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] space-y-4 rounded-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#121212]">Prediction Run Logs</h3>
            <p className="text-xs text-[#121212]/70">Historic log of evaluated sensor values and classified failure modes.</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={exportLogsToCSV}
              disabled={predictionLogs.length === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer rounded-none ${
                predictionLogs.length === 0 
                  ? 'bg-[#121212]/5 text-[#121212]/40 border-[#121212]/10 cursor-not-allowed' 
                  : 'bg-white text-[#121212] border-[#121212] hover:bg-[#121212]/5'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={clearPredictionLogs}
              disabled={predictionLogs.length === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer rounded-none ${
                predictionLogs.length === 0 
                  ? 'bg-[#121212]/5 text-[#121212]/40 border-[#121212]/10 cursor-not-allowed' 
                  : 'bg-red-50 text-red-700 border-red-700 hover:bg-red-50'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {predictionLogs.length > 0 ? (
          <div className="overflow-x-auto border border-[#121212] rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4F1] text-[#121212] font-mono border-b border-[#121212]">
                  <th className="p-3">ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Machine Quality</th>
                  <th className="p-3">ΔT (K)</th>
                  <th className="p-3">RPM</th>
                  <th className="p-3">Torque (Nm)</th>
                  <th className="p-3">Wear (min)</th>
                  <th className="p-3">Predicted Diagnosis</th>
                  <th className="p-3 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#121212]/15 bg-white">
                {predictionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F6F4F1]/40 text-[#121212]/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#121212]">{log.id}</td>
                    <td className="p-3 font-mono text-[#121212]/60">{log.timestamp}</td>
                    <td className="p-3 font-mono">Grade {log.inputs.machineType}</td>
                    <td className="p-3 font-mono text-[#121212]">
                      {(log.inputs.processTemp - log.inputs.airTemp).toFixed(1)} K
                    </td>
                    <td className="p-3 font-mono text-[#121212]">{log.inputs.rpm}</td>
                    <td className="p-3 font-mono text-[#121212]">{log.inputs.torque} Nm</td>
                    <td className="p-3 font-mono text-[#121212]">{log.inputs.toolWear} min</td>
                    <td className="p-3 font-mono">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                          log.failurePrediction === 'No Failure'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-800/30'
                            : 'bg-red-50 text-red-800 border-red-800/30'
                        }`}>
                          {log.failurePrediction}
                        </span>
                        {log.fallback && (
                          <span className="text-[9px] text-amber-700 font-mono font-bold tracking-tight uppercase flex items-center gap-0.5">
                            ⚠️ Local
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#121212]">{log.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-[#121212]/60 text-xs font-mono bg-[#121212]/5 border border-dashed border-[#121212]/30 rounded-none">
            No prediction runs documented yet.
          </div>
        )}
      </div>

    </motion.div>
  );
}
