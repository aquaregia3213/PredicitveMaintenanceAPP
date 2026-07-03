import React, { useState } from 'react';
import { 
  GitFork, Layers, Settings, FileText, CheckCircle, ChevronRight, 
  Terminal, ShieldCheck, Database, Award, Info, AlertTriangle, ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModelViewProps {
  setActiveTab?: (tab: 'home' | 'live-predictor' | 'analytics' | 'about-model' | 'sip-submission') => void;
}

export default function ModelView({ setActiveTab }: ModelViewProps) {
  const [selectedPipeline, setSelectedPipeline] = useState<string>('p5');

  // AutoAI pipelines list based on IBM watsonx.ai results
  const pipelines = [
    {
      id: 'p5',
      name: 'Pipeline 5 (Snap Random Forest Classifier)',
      algorithm: 'Snap Random Forest (Batched Tree Ensemble)',
      accuracy: '99.6%',
      f1: '0.797',
      precision: '79.7%',
      recall: '79.7%',
      enhancements: ['HPO-1', 'Feature Engineering (FE)', '+2', 'BATCH (INCR)'],
      status: 'Winner & Deployed',
      isDeployed: true,
      confusion: { tp: 33, tn: 965, fp: 0, fn: 2 },
      hyperparameters: {
        n_estimators: 250,
        max_depth: 10,
        min_samples_split: 5,
        min_samples_leaf: 2,
        criterion: 'gini',
        increment_learning: true,
        learning_type: 'classification',
        specialization: 'INCR'
      }
    },
    {
      id: 'p4',
      name: 'Pipeline 4 (LightGBM Classifier)',
      algorithm: 'LightGBM Gradient Boosting',
      accuracy: '99.2%',
      f1: '0.760',
      precision: '76.5%',
      recall: '75.5%',
      enhancements: ['HPO-1', 'Feature Engineering (FE)', 'HPO-2'],
      status: 'Rank 2',
      isDeployed: false,
      confusion: { tp: 31, tn: 961, fp: 4, fn: 4 },
      hyperparameters: {
        learning_rate: 0.08,
        num_leaves: 64,
        max_depth: 8,
        n_estimators: 200,
        feature_fraction: 0.75,
        bagging_fraction: 0.8
      }
    },
    {
      id: 'p3',
      name: 'Pipeline 3 (XGBoost Classifier)',
      algorithm: 'eXtreme Gradient Boosting (XGBoost)',
      accuracy: '98.9%',
      f1: '0.730',
      precision: '74.0%',
      recall: '72.0%',
      enhancements: ['HPO-1', 'Feature Engineering (FE)'],
      status: 'Rank 3',
      isDeployed: false,
      confusion: { tp: 29, tn: 960, fp: 5, fn: 6 },
      hyperparameters: {
        learning_rate: 0.1,
        max_depth: 6,
        n_estimators: 150,
        subsample: 0.8,
        colsample_bytree: 0.8
      }
    },
    {
      id: 'p2',
      name: 'Pipeline 2 (Extra Trees Classifier)',
      algorithm: 'Extra Trees Ensemble',
      accuracy: '98.5%',
      f1: '0.700',
      precision: '71.0%',
      recall: '69.0%',
      enhancements: ['HPO-1'],
      status: 'Rank 4',
      isDeployed: false,
      confusion: { tp: 27, tn: 958, fp: 7, fn: 8 },
      hyperparameters: {
        n_estimators: 150,
        max_depth: 12,
        min_samples_split: 5,
        min_samples_leaf: 2
      }
    },
    {
      id: 'p1',
      name: 'Pipeline 1 (Decision Tree Classifier)',
      algorithm: 'Standard Decision Tree',
      accuracy: '98.0%',
      f1: '0.650',
      precision: '66.0%',
      recall: '64.0%',
      enhancements: ['None - Baseline'],
      status: 'Rank 5 (Baseline)',
      isDeployed: false,
      confusion: { tp: 24, tn: 956, fp: 9, fn: 11 },
      hyperparameters: {
        max_depth: 10,
        criterion: 'gini',
        splitter: 'best'
      }
    }
  ];

  const activePipeline = pipelines.find(p => p.id === selectedPipeline) || pipelines[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 300, damping: 28 } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      
      {/* Page Header */}
      <motion.div variants={itemVariants} className="border-b border-[#121212] pb-6">
        <span className="inline-block text-[10px] font-mono uppercase tracking-widest font-bold text-[#121212] bg-[#121212]/5 px-3 py-1.5 rounded-none border border-[#121212]">
          IBM watsonx.ai Workspace
        </span>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#121212] mt-4">About the Model & Pipeline</h2>
        <p className="text-[#121212]/70 text-sm mt-1">Technical specification, limitations, methodology, and pipeline evaluation for the deployed maintenance classifier.</p>
      </motion.div>

      {/* Model Identity Block & Plain-Language Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Model Identity Block */}
        <motion.div variants={itemVariants} className="lg:col-span-5 bg-white p-6 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#121212] border-b border-[#121212]/10 pb-2 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Model Identity
          </h3>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">PROJECT</span>
              <span className="font-bold">Predictive_Maintenance</span>
            </div>
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">PIPELINE RANK</span>
              <span className="font-bold text-emerald-800">Pipeline 5 (Rank 1)</span>
            </div>
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">ALGORITHM</span>
              <span className="font-bold">Snap Random Forest Classifier</span>
            </div>
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">SPECIALIZATION</span>
              <span className="font-bold">INCR (Incremental Learning)</span>
            </div>
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">ENHANCEMENTS</span>
              <span className="font-bold">HPO-1, FE, +2</span>
            </div>
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">PREDICTION COLUMN</span>
              <span className="font-bold text-red-800">Failure Type</span>
            </div>
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">FEATURES USED</span>
              <span className="font-bold">5 Transformed Features</span>
            </div>
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">EVALUATION INSTANCES</span>
              <span className="font-bold">1000 Rows (Holdout)</span>
            </div>
            <div className="flex justify-between border-b border-[#121212]/5 pb-1">
              <span className="text-[#121212]/60">MODEL CREATED ON</span>
              <span className="font-bold">29/06/2026, 11:05:19</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[#121212]/60">POWERED BY</span>
              <span className="font-bold text-blue-800">IBM watsonx.ai (AutoAI)</span>
            </div>
          </div>
        </motion.div>

        {/* Plain-Language Explanation */}
        <motion.div variants={itemVariants} className="lg:col-span-7 bg-white p-6 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#121212] border-b border-[#121212]/10 pb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-[#121212]" />
              Model Overview
            </h3>
            <p className="text-xs sm:text-sm text-[#121212]/80 leading-relaxed font-sans">
              The Predictive Maintenance model is designed to optimize manufacturing uptime by predicting machine failure events before they cause critical damage. Operating as a multi-class classifier, it monitors real-time telemetry from five raw physical sensors (Torque, Tool Wear, Rotational Speed, Temperature Difference, and Ambient Air/Process Temperatures) to predict one of six possible outcomes: <strong>No Failure, Heat Dissipation Failure, Power Failure, Overstrain Failure, Tool Wear Failure, or Random Failures</strong>. 
            </p>
            <p className="text-xs sm:text-sm text-[#121212]/80 leading-relaxed font-sans">
              Among the raw sensor signals, <strong>Torque</strong> and <strong>Tool Wear</strong> have been identified as the most critical features driving fatigue and wear-related breakdowns. By capturing subtle correlation patterns across these sensors, the model provides early alert diagnostics that calendar-based maintenance schedules completely overlook.
            </p>
          </div>
          <div className="mt-6 p-4 bg-[#F6F4F1] border border-[#121212] text-xs font-mono text-[#121212]/70 leading-relaxed">
            * Deployed model uses optimized pipelines to run serverless inference in less than 25 milliseconds.
          </div>
        </motion.div>
      </div>

      {/* Honest Limitations Section */}
      <motion.section variants={itemVariants} className="bg-red-50/50 p-6 border border-red-800 shadow-[4px_4px_0px_0px_#991b1b] space-y-4">
        <h3 className="font-serif font-bold text-lg text-red-950 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-800" />
          Honest Limitations & Caveats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-red-950/80 leading-relaxed font-sans font-medium">
          <div className="space-y-3">
            <p>
              <strong className="text-red-900">1. Severe Class Imbalance:</strong> The telemetry dataset is heavily skewed, with 96.6% representing normal, healthy operation ('No Failure'). This extreme class imbalance artificially inflates the headline accuracy (99.6%) and weighted metrics (F1/Precision/Recall ~99.5%), which are dominated by the majority class.
            </p>
            <p>
              <strong className="text-red-900">2. Macro-Averaged Score Discrepancy:</strong> The macro-averaged scores (<strong>F1 Macro 0.797, Precision Macro 79.7%, Recall Macro 79.7%</strong>) are the only honest metrics of how the model performs on the minority failure classes, and they are significantly lower. Do not rely solely on the 99%+ accuracy metric.
            </p>
            <p>
              <strong className="text-red-900">3. Failure Code Data Volume Constraints:</strong> The model suffers from extremely limited training volume for failure classes, with counts as low as 18–45 samples in the dataset. This sparsity inherently limits the statistical reliability and generalization of class-level metrics.
            </p>
          </div>
          <div className="space-y-3">
            <p>
              <strong className="text-red-900">4. 0% Detection for Random Failures:</strong> In the holdout evaluation set, the <strong>Random Failures (RNF)</strong> class had a 0% detection rate (both instances were misclassified as 'No Failure'). Because random failures are structurally uncorrelated with the raw sensors, the model is currently blind to them.
            </p>
            <p>
              <strong className="text-red-900">5. Class-Dependent Threshold Trade-offs:</strong> Tuning the model threshold is not one-size-fits-all. Pushing the threshold to catch every failure (100% recall) forces precision to collapse for most rare classes, resulting in excessive false-positive alarms that could disrupt production lines.
            </p>
            <div className="pt-2 border-t border-red-800/20 text-xs font-mono font-bold text-red-800 flex items-center gap-1">
              <span>● Reference diagnostic charts on Analytics page for empirical evidence.</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* AutoAI Pipeline Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Leaderboard list */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#121212]" />
            <h3 className="font-serif font-bold text-lg text-[#121212]">AutoAI Pipeline Leaderboard</h3>
          </div>

          <div className="space-y-4">
            {pipelines.map(p => (
              <motion.div
                key={p.id}
                onClick={() => setSelectedPipeline(p.id)}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className={`p-4 rounded-none border cursor-pointer select-none transition-all ${
                  selectedPipeline === p.id
                    ? 'bg-[#F6F4F1] border-[#121212] shadow-[4px_4px_0px_0px_#121212]'
                    : 'bg-white border-[#121212]/30 hover:border-[#121212]/80 hover:bg-[#F6F4F1]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#121212] flex items-center gap-1.5">
                      {p.name}
                      {p.isDeployed && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                      )}
                    </h4>
                    <p className="text-xs text-[#121212]/70 mt-1 font-mono">{p.algorithm}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-none uppercase font-bold border ${
                    p.isDeployed 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-800/30' 
                      : 'bg-[#121212]/5 text-[#121212]/50 border-[#121212]/10'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#121212]/10 text-center">
                  <div>
                    <span className="text-[9px] text-[#121212]/60 font-mono uppercase font-bold">Accuracy</span>
                    <div className="text-xs font-bold text-[#121212] mt-0.5">{p.accuracy}</div>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#121212]/60 font-mono uppercase font-bold">F1 Macro</span>
                    <div className="text-xs font-bold text-[#121212] mt-0.5">{p.f1}</div>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#121212]/60 font-mono uppercase font-bold">Recall</span>
                    <div className="text-xs font-bold text-[#121212] mt-0.5">{p.recall}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right column: Active Pipeline Deep Dive */}
        <motion.div variants={itemVariants} className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedPipeline}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] space-y-6 rounded-none"
            >
              <div className="flex items-center justify-between border-b border-[#121212]/10 pb-4">
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#121212]/60 font-bold">Pipeline Deep Dive</span>
                  <h3 className="font-serif font-bold text-lg text-[#121212] mt-0.5">{activePipeline.algorithm}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-[#121212]/60 uppercase block font-bold">F1 Macro Score</span>
                  <span className="font-serif font-extrabold text-lg text-[#121212] block">{activePipeline.f1}</span>
                </div>
              </div>

              {/* Confusion Matrix Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase text-[#121212]/80 font-bold flex items-center gap-1.5">
                    <GitFork className="h-3.5 w-3.5 text-[#121212]" />
                    Performance Binary Confusion Matrix
                  </h4>
                  <span className="text-[11px] text-[#121212]/50 font-mono">Holdout sample size: 1,000 Rows</span>
                </div>

                {/* Confusion Matrix Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Visual grid */}
                  <div className="grid grid-cols-2 gap-2 p-2 bg-[#F6F4F1] rounded-none border border-[#121212] relative">
                    {/* Grid labels */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-mono text-[#121212]/50 tracking-wider uppercase font-bold">Actual</div>
                    <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#121212]/50 tracking-wider uppercase font-bold">Predicted</div>

                    {/* Cell 1: TN */}
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      className="p-4 bg-white rounded-none border border-[#121212] text-center space-y-1 cursor-default transition-all"
                    >
                      <span className="text-[9px] font-mono text-[#121212]/60 uppercase font-bold block">True Neg (TN)</span>
                      <div className="text-2xl font-serif font-bold text-[#121212]">{activePipeline.confusion.tn.toLocaleString()}</div>
                      <span className="text-[9px] text-emerald-800 block font-mono font-bold">Healthy Checked</span>
                    </motion.div>

                    {/* Cell 2: FP */}
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      className="p-4 bg-white rounded-none border border-[#121212] text-center space-y-1 cursor-default transition-all"
                    >
                      <span className="text-[9px] font-mono text-[#121212]/60 uppercase font-bold block">False Pos (FP)</span>
                      <div className="text-2xl font-serif font-bold text-amber-800">{activePipeline.confusion.fp}</div>
                      <span className="text-[9px] text-[#121212]/50 block font-mono">False Alarms</span>
                    </motion.div>

                    {/* Cell 3: FN */}
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      className="p-4 bg-white rounded-none border border-[#121212] text-center space-y-1 cursor-default transition-all"
                    >
                      <span className="text-[9px] font-mono text-[#121212]/60 uppercase font-bold block">False Neg (FN)</span>
                      <div className="text-2xl font-serif font-bold text-red-800">{activePipeline.confusion.fn}</div>
                      <span className="text-[9px] text-red-800 block font-mono font-bold">Missed Failures</span>
                    </motion.div>

                    {/* Cell 4: TP */}
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      className="p-4 bg-white rounded-none border border-[#121212] text-center space-y-1 cursor-default transition-all"
                    >
                      <span className="text-[9px] font-mono text-[#121212]/60 uppercase font-bold block">True Pos (TP)</span>
                      <div className="text-2xl font-serif font-bold text-emerald-800">{activePipeline.confusion.tp}</div>
                      <span className="text-[9px] text-emerald-800 block font-mono font-bold">Anomalies caught</span>
                    </motion.div>
                  </div>

                  {/* Performance Diagnosis Text */}
                  <div className="space-y-3 text-[#121212]/80 text-xs leading-relaxed">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-bold uppercase">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Pipeline Evaluation Analysis</span>
                    </div>
                    <p>
                      Under the active parameters, this pipeline successfully intercepted <strong>{activePipeline.confusion.tp} out of {activePipeline.confusion.tp + activePipeline.confusion.fn}</strong> total actual failures in the holdout evaluation set.
                    </p>
                    <p>
                      The false-alarm profile is extremely low with just <strong>{activePipeline.confusion.fp} normal operating points</strong> flagged incorrectly as failure risks, yielding an optimal Precision profile of <strong>{activePipeline.precision}</strong>.
                    </p>
                  </div>

                </div>
              </div>

              <div className="h-px bg-[#121212]/10" />

              {/* Hyperparameter Explorer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase text-[#121212]/60 font-bold flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-[#121212]" />
                    Hyperparameter Optimization (HPO) Configuration
                  </h4>
                  <span className="text-[10px] text-[#121212]/50 font-mono uppercase font-bold">JSON Schema</span>
                </div>

                <div className="bg-[#F6F4F1] p-4 rounded-none border border-[#121212] text-[11px] font-mono text-[#121212] overflow-x-auto max-h-48 scrollbar-thin">
                  <pre className="font-semibold">{JSON.stringify(activePipeline.hyperparameters, null, 2)}</pre>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Methodology Block & AutoAI Workflow Diagram */}
      <motion.section 
        variants={itemVariants}
        className="bg-white p-6 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] space-y-6 rounded-none"
      >
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-lg text-[#121212]">AutoAI Methodology & Optimization Workflow</h3>
          <p className="text-xs text-[#121212]/70 leading-relaxed font-sans max-w-4xl">
            Candidate pipelines are generated automatically by <strong>IBM watsonx.ai AutoAI</strong>. Pipeline 5 was selected as the champion due to its superior holdout accuracy. The underlying classifier is a <strong>Snap Random Forest Classifier</strong> wrapped in a <strong>Batched Tree Ensemble</strong>, enabling <strong>incremental learning (INCR)</strong> so the model can adapt to stream data without full retraining. Enhanced optimization loops included <strong>Hyperparameter Optimization (HPO-1)</strong> and custom <strong>Feature Engineering (FE)</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          
          {/* Step 1 */}
          <motion.div 
            whileHover={{ y: -4, shadow: '5px 5px 0px 0px #121212' }}
            className="p-4 rounded-none bg-[#F6F4F1] border border-[#121212] space-y-2 relative transition-all cursor-default"
          >
            <div className="absolute top-3 right-3 text-xs font-mono text-[#121212]/40 font-bold">01</div>
            <div className="text-[#121212]/60 font-mono text-[10px] font-bold uppercase tracking-wider">Telemetry Ingestion</div>
            <h5 className="font-serif font-bold text-[#121212] text-sm">Data Preprocessing</h5>
            <p className="text-xs text-[#121212]/70 leading-relaxed">Loads the raw AI Maintenance file, cleans timestamp offsets, scales temperatures to Kelvin, and normalizes RPM values.</p>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            whileHover={{ y: -4, shadow: '5px 5px 0px 0px #121212' }}
            className="p-4 rounded-none bg-[#F6F4F1] border border-[#121212] space-y-2 relative transition-all cursor-default"
          >
            <div className="absolute top-3 right-3 text-xs font-mono text-[#121212]/40 font-bold">02</div>
            <div className="text-[#121212]/60 font-mono text-[10px] font-bold uppercase tracking-wider">Feature Generation</div>
            <h5 className="font-serif font-bold text-[#121212] text-sm">Feature Engineering (FE)</h5>
            <p className="text-xs text-[#121212]/70 leading-relaxed">Computes critical physical attributes: Temperature Difference (ΔT), Calculated Torque Power (Watts), and Tool Cumulative Fatigue Strain.</p>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            whileHover={{ y: -4, shadow: '5px 5px 0px 0px #121212' }}
            className="p-4 rounded-none bg-[#F6F4F1] border border-[#121212] space-y-2 relative transition-all cursor-default"
          >
            <div className="absolute top-3 right-3 text-xs font-mono text-[#121212]/40 font-bold">03</div>
            <div className="text-[#121212]/60 font-mono text-[10px] font-bold uppercase tracking-wider">Algorithm Search</div>
            <h5 className="font-serif font-bold text-[#121212] text-sm">Hyperparameter Tuning</h5>
            <p className="text-xs text-[#121212]/70 leading-relaxed">Evaluates gradient boost trees, decision branches, and random forest parameters to maximize the metric F1-Macro score.</p>
          </motion.div>

          {/* Step 4 */}
          <motion.div 
            whileHover={{ y: -4, shadow: '5px 5px 0px 0px #121212' }}
            className="p-4 rounded-none bg-[#F6F4F1] border border-[#121212] space-y-2 relative transition-all cursor-default"
          >
            <div className="absolute top-3 right-3 text-xs font-mono text-[#121212]/40 font-bold">04</div>
            <div className="text-[#121212]/60 font-mono text-[10px] font-bold uppercase tracking-wider">API Deployment</div>
            <h5 className="font-serif font-bold text-[#121212] text-sm">Live REST endpoint</h5>
            <p className="text-xs text-[#121212]/70 leading-relaxed">Deploys the champion Snap Random Forest classifier as an incremental learning function with OAuth verification protocols.</p>
          </motion.div>

        </div>
      </motion.section>

      {/* Diagnostics Dashboard Link */}
      <motion.section 
        variants={itemVariants}
        className="bg-[#F6F4F1] p-6 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 rounded-none"
      >
        <div className="space-y-1 max-w-2xl">
          <h4 className="font-serif font-bold text-lg text-[#121212] flex items-center gap-2">
            <GitFork className="h-5 w-5 text-[#121212]" />
            Looking for Empirical Evidence & Diagnostic Curves?
          </h4>
          <p className="text-xs text-[#121212]/80 leading-relaxed font-sans">
            Detailed Precision-Threshold charts, Precision-Recall curves, ROC Curves, and multi-class confusion heatmaps are available on the Analytics Dashboard. Explore model evaluation diagnostics to audit performance boundaries.
          </p>
        </div>
        
        {setActiveTab && (
          <motion.button
            onClick={() => setActiveTab('analytics')}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-[#121212] text-white font-mono uppercase tracking-wider text-xs font-bold border border-[#121212] shadow-[3px_3px_0px_0px_#121212] hover:bg-[#1d1d1d] hover:shadow-[4px_4px_0px_0px_#121212] transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            Go to Diagnostics
          </motion.button>
        )}
      </motion.section>
 
    </motion.div>
  );
}
