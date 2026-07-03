import React, { useState } from 'react';
import { TabType, PredictionResult } from './types';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import LivePredictorView from './components/LivePredictorView';
import AnalyticsView from './components/AnalyticsView';
import ModelView from './components/ModelView';
import SipSubmissionView from './components/SipSubmissionView';
import { Activity, ShieldCheck, HeartHandshake, FileText, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Persist preference in localStorage
    return localStorage.getItem('theme') === 'dark';
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Prepopulate history with 3 realistic telemetry checks so the table has baseline data on launch
  const [predictionLogs, setPredictionLogs] = useState<PredictionResult[]>([
    {
      id: 'TX-884920',
      timestamp: '10:14:22 AM',
      inputs: {
        machineType: 'M',
        airTemp: 298.5,
        processTemp: 308.2,
        rpm: 1510,
        torque: 38.5,
        toolWear: 45
      },
      failurePrediction: 'No Failure',
      confidence: 99.42,
      riskLevel: 'Low',
      suggestedAction: 'Nominal operations. Schedule next routine telemetry sweep in 24 operating hours.'
    },
    {
      id: 'TX-529048',
      timestamp: '09:41:05 AM',
      inputs: {
        machineType: 'L',
        airTemp: 302.1,
        processTemp: 311.2,
        rpm: 1350,
        torque: 64.2,
        toolWear: 205
      },
      failurePrediction: 'Overstrain Failure',
      confidence: 96.85,
      riskLevel: 'Critical',
      suggestedAction: 'CRITICAL WARNING. Reduce output torque load immediately. Cool cutter head and lower material feed rate.'
    },
    {
      id: 'TX-210493',
      timestamp: '08:12:59 AM',
      inputs: {
        machineType: 'L',
        airTemp: 300.2,
        processTemp: 307.8,
        rpm: 1210,
        torque: 54.0,
        toolWear: 115
      },
      failurePrediction: 'Heat Dissipation Failure',
      confidence: 94.12,
      riskLevel: 'High',
      suggestedAction: 'WARNING. Thermal dissipation rate insufficient. Increase airflow/cooling pump speed, or elevate rotation RPM to clear hot zones.'
    }
  ]);

  const addPredictionLog = (log: PredictionResult) => {
    setPredictionLogs(prev => [log, ...prev]);
  };

  const clearPredictionLogs = () => {
    setPredictionLogs([]);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView setActiveTab={setActiveTab} />;
      case 'live-predictor':
        return (
          <LivePredictorView 
            predictionLogs={predictionLogs} 
            addPredictionLog={addPredictionLog}
            clearPredictionLogs={clearPredictionLogs}
          />
        );
      case 'analytics':
        return <AnalyticsView />;
      case 'about-model':
        return <ModelView setActiveTab={setActiveTab} />;
      case 'sip-submission':
        return <SipSubmissionView />;
      default:
        return <HomeView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen text-[#121212] dark:text-white flex flex-col font-sans selection:bg-[#121212] selection:text-white transition-colors duration-300 ${isDark ? 'dark bg-[#0f0f0f]' : 'bg-[#FDFCFB]'}`}>
      {/* Editorial Rule Top Bar */}
      <div className="h-[3px] bg-[#121212] dark:bg-white w-full" />

      {/* Navigation Sticky Bar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleTheme={toggleTheme} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Brand & Editorial Footer */}
      <footer className="mt-auto border-t border-[#121212] dark:border-white/10 bg-[#F6F4F1] dark:bg-[#161616] py-16 px-6 md:px-12 text-xs text-[#121212]/80 dark:text-white/60 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Col 1: Project Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="font-serif italic font-bold text-lg tracking-tight text-[#121212]">PredictX Suite</span>
              <span className="text-[9px] font-mono bg-[#121212] text-white px-1.5 py-0.5 rounded-none tracking-widest uppercase font-bold">Prod v4</span>
            </div>
            <p className="leading-relaxed text-[#121212]/70">
              Industrial predictive analytics client framework utilizing high-resolution machine telemetry and IBM watsonx.ai machine learning models.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-4">
            <h5 className="font-bold text-[#121212] uppercase tracking-widest font-mono text-[11px]">System Views</h5>
            <ul className="space-y-2.5 font-medium">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-[#121212] hover:underline cursor-pointer transition-colors">
                  Overview Landing Page
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('live-predictor')} className="hover:text-[#121212] hover:underline cursor-pointer transition-colors">
                  Live Telemetry Predictor
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('analytics')} className="hover:text-[#121212] hover:underline cursor-pointer transition-colors">
                  Model Analytics Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Model Details Links */}
          <div className="space-y-4">
            <h5 className="font-bold text-[#121212] uppercase tracking-widest font-mono text-[11px]">Deep Learning</h5>
            <ul className="space-y-2.5 font-medium">
              <li>
                <button onClick={() => setActiveTab('about-model')} className="hover:text-[#121212] hover:underline cursor-pointer transition-colors">
                  AutoAI XGBoost Pipeline
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('sip-submission')} className="hover:text-[#121212] hover:underline cursor-pointer transition-colors">
                  Internship Details
                </button>
              </li>
              <li>
                <a href="https://github.com/aquaregia3213/Predictive_Maintenance_IBM" target="_blank" rel="noreferrer" className="hover:text-[#121212] hover:underline transition-colors">
                  GitHub Repository Source
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: SIP Details */}
          <div className="space-y-4">
            <h5 className="font-bold text-[#121212] uppercase tracking-widest font-mono text-[11px]">Program Details</h5>
            <div className="space-y-2">
              <p className="text-[11px] text-[#121212]/70 leading-relaxed">
                Prepared by <strong className="text-[#121212] font-semibold">Atharva Jadhav</strong> for the student internship program.
              </p>
              <div className="flex items-center gap-2 text-[#121212]/60 font-mono text-[10px]">
                <Globe className="h-3.5 w-3.5" />
                <span>MIT Academy Of Engineering</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#121212]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#121212]/60 font-mono text-[11px]">
          <div>
            &copy; 2026 PredictX. Under IBM watsonx.ai Academic Alliance. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Terms of Deployment</span>
            <span>Security Audits</span>
            <span className="text-[#121212] font-bold">● System Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
