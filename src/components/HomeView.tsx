import React from 'react';
import { TabType, FailureCard } from '../types';
import { 
  ArrowRight, ShieldAlert, Thermometer, Hammer, Zap, Gauge, HelpCircle, 
  Settings, Award, Sparkles, AlertTriangle, Workflow, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface HomeViewProps {
  setActiveTab: (tab: TabType) => void;
}

export default function HomeView({ setActiveTab }: HomeViewProps) {
  const failureCards: FailureCard[] = [
    {
      type: 'Heat Dissipation Failure',
      title: 'Heat Dissipation Failure',
      color: 'bg-white border-[#121212] text-[#121212]',
      icon: 'Thermometer',
      description: 'Occurs if the difference between process temperature and air temperature is below 8.6 K and the rotational speed is below 1380 RPM.',
      triggerConditions: 'ΔT < 8.6 K & RPM < 1380'
    },
    {
      type: 'Tool Wear Failure',
      title: 'Tool Wear Failure',
      color: 'bg-white border-[#121212] text-[#121212]',
      icon: 'Hammer',
      description: 'Driven by mechanical rubbing. It triggers when the cumulative tool wear time exceeds threshold parameters of 200–240 minutes.',
      triggerConditions: 'Wear Time > 200 mins'
    },
    {
      type: 'Power Failure',
      title: 'Power Failure',
      color: 'bg-white border-[#121212] text-[#121212]',
      icon: 'Zap',
      description: 'Occurs when the calculated power (torque multiplied by rotational speed) falls outside the optimal operating range (3500W to 9000W).',
      triggerConditions: 'Power < 3500W or > 9000W'
    },
    {
      type: 'Overstrain Failure',
      title: 'Overstrain Failure',
      color: 'bg-white border-[#121212] text-[#121212]',
      icon: 'Gauge',
      description: 'Triggered by excessive load. Occurs when the product of tool wear time and torque exceeds material strain capabilities.',
      triggerConditions: 'Wear × Torque > 11,000 min-Nm'
    },
    {
      type: 'Random Failure',
      title: 'Random Failures',
      color: 'bg-white border-[#121212] text-[#121212]',
      icon: 'HelpCircle',
      description: 'Uncorrelated events independent of nominal sensory values, representing material fatigue, voltage surges, or ambient vibrations.',
      triggerConditions: 'Stochastic variance triggers'
    }
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Thermometer': return <Thermometer className="h-5 w-5 text-[#121212]" />;
      case 'Hammer': return <Hammer className="h-5 w-5 text-[#121212]" />;
      case 'Zap': return <Zap className="h-5 w-5 text-[#121212]" />;
      case 'Gauge': return <Gauge className="h-5 w-5 text-[#121212]" />;
      default: return <HelpCircle className="h-5 w-5 text-[#121212]" />;
    }
  };

  const techStack = [
    { name: 'IBM watsonx.ai', desc: 'AutoAI Pipeline Hosting', category: 'Platform' },
    { name: 'IBM Cloud', desc: 'Secure Serverless Functions', category: 'Infrastructure' },
    { name: 'AutoAI ML', desc: 'Pipeline Leaderboard Optimizer', category: 'Machine Learning' },
    { name: 'Kaggle AI', desc: 'Industry Benchmarks & Datasets', category: 'Source Data' },
    { name: 'React 19', desc: 'High Performance Dashboard UI', category: 'Framework' },
    { name: 'Tailwind CSS', desc: 'Clean Editorial Layouts', category: 'Styling' }
  ];

  // Motion variants for stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.01
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
      className="space-y-20"
    >
      
      {/* 1. Hero Section */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-4">
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121212]/5 border border-[#121212] text-[10px] font-mono uppercase tracking-widest text-[#121212] font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Industrial Predictive Intelligence</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#121212] leading-[1.1]">
            Predict Failures <br />
            <span className="italic font-normal">Before They Happen</span>
          </h1>

          <p className="text-sm sm:text-base text-[#121212]/80 max-w-xl leading-relaxed">
            Harness IBM watsonx.ai machine learning capabilities to monitor high-precision telemetry, diagnose equipment stress indicators, and mitigate industrial downtime with a 99.6% accuracy threshold.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <motion.button
              onClick={() => setActiveTab('live-predictor')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center justify-center gap-2 px-6 py-3 bg-[#121212] text-white font-mono uppercase tracking-wider text-xs font-bold border border-[#121212] shadow-[3px_3px_0px_0px_#121212] hover:bg-[#1d1d1d] hover:shadow-[5px_5px_0px_0px_#121212] transition-all cursor-pointer"
            >
              <span>Try Live Prediction</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('analytics')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#121212] font-mono uppercase tracking-wider text-xs font-bold border border-[#121212] shadow-[3px_3px_0px_0px_#121212] hover:bg-[#F6F4F1] hover:shadow-[5px_5px_0px_0px_#121212] transition-all cursor-pointer"
            >
              <span>View Live Analytics</span>
            </motion.button>
          </div>

          {/* IBM watsonx.ai Tag */}
          <div className="pt-8 border-t border-[#121212]/20 flex flex-wrap items-center gap-4">
            <div className="text-[10px] font-mono tracking-widest uppercase text-[#121212]/60">Strategic Integration</div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#121212]/5 border border-[#121212] text-xs font-mono font-bold text-[#121212]">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              IBM watsonx.ai
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#121212]/5 border border-[#121212] text-xs font-mono font-bold text-[#121212]">
              AutoAI Pipeline
            </div>
          </div>
        </motion.div>

        {/* 2. Hero Widget Panel (Accuracy & Live Telemetry Mock) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 relative">
          <div className="bg-white p-6 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#121212]" />
            
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-[#121212]/60 uppercase tracking-widest">Model Target</p>
                <h3 className="font-serif font-bold text-xl text-[#121212] mt-1">watsonx.ai AutoAI</h3>
              </div>
              <span className="px-2.5 py-1 border border-[#121212] bg-[#121212]/5 text-[10px] text-[#121212] font-mono font-bold">
                99.6% ACCURACY
              </span>
            </div>

            {/* Huge Accuracy Display */}
            <div className="bg-[#F6F4F1] p-5 border border-[#121212] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-[#121212]/60 uppercase">Optimized Classifier</span>
                <div className="text-3xl font-serif font-bold text-[#121212] tracking-tight mt-1">
                  99.6%
                </div>
                <p className="text-[11px] text-[#121212]/80 mt-1">F1 Macro: <span className="text-[#121212] font-mono font-bold">0.797</span></p>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <div className="p-2 bg-[#121212] text-white">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-[9px] text-[#121212]/60 font-mono">Pipeline 5 Optimized</span>
              </div>
            </div>

            {/* Live Stats Indicators */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#121212]/80 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#121212]" />
                  IBM Cloud Endpoint Response
                </span>
                <span className="text-[#121212] font-mono font-bold">24ms</span>
              </div>
              <div className="w-full bg-[#EFECE8] border border-[#121212] h-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: '94%' }} 
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="bg-[#121212] h-full" 
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-[#121212]/80 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#121212]" />
                  Kaggle Predictive Dataset
                </span>
                <span className="text-[#121212] font-mono font-bold">10,000 pts</span>
              </div>
              <div className="w-full bg-[#EFECE8] border border-[#121212] h-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: '100%' }} 
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  className="bg-[#121212] h-full" 
                />
              </div>
            </div>

            {/* Quick action block */}
            <div className="pt-2">
              <motion.button 
                onClick={() => setActiveTab('about-model')}
                whileHover={{ scale: 1.01, bg: '#121212/8' }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-2.5 bg-[#121212]/5 hover:bg-[#121212]/10 border border-[#121212] text-xs font-mono uppercase tracking-wider font-bold text-[#121212] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Explore Pipeline Details</span>
                <ChevronRight className="h-3 w-3" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Failure Mode Grid */}
      <section className="space-y-8">
        <motion.div variants={itemVariants} className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#121212]">
            Monitored Failure Modes
          </h2>
          <p className="text-[#121212]/70 text-sm leading-relaxed">
            The IBM AutoAI pipeline identifies and isolates five critical physical machine failure conditions based on multi-variate sensors.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {failureCards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ 
                y: -6, 
                x: -1, 
                shadow: '5px 5px 0px 0px #121212' 
              }}
              whileTap={{ scale: 0.98 }}
              className="bg-white p-5 border border-[#121212] shadow-[2px_2px_0px_0px_#121212] transition-all flex flex-col justify-between space-y-6 cursor-pointer select-none"
            >
              <div className="space-y-4">
                <div className="p-2 bg-[#121212]/5 border border-[#121212] w-fit">
                  {getIcon(card.icon)}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#121212] text-base leading-tight">
                    {card.title}
                  </h4>
                  <p className="text-xs text-[#121212]/80 mt-2 leading-relaxed font-sans">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#121212]/20">
                <span className="text-[9px] font-mono uppercase text-[#121212]/50 block">Trigger Formula</span>
                <span className="text-xs font-mono text-[#121212] font-bold mt-0.5 block">
                  {card.triggerConditions}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Problem Statement & Cost Savings Section */}
      <motion.section 
        variants={itemVariants} 
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-[#F6F4F1] p-8 md:p-12 border border-[#121212] shadow-[4px_4px_0px_0px_#121212] relative"
      >
        <div className="space-y-6">
          <span className="px-3 py-1 border border-[#121212] bg-white text-[10px] text-[#121212] font-mono font-bold uppercase tracking-wider">
            PROBLEM & IMPACT STATEMENTS
          </span>

          <h3 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#121212]">
            Eliminating Industrial Downtime Costs
          </h3>

          <div className="space-y-4 text-[#121212]/80 text-sm leading-relaxed">
            <p>
              In modern high-speed manufacturing, unexpected equipment failures cost global companies an estimated <strong>$50 Billion annually</strong>. Standard preventive cycles schedule maintenance based on arbitrary hours, leading to premature parts replacement or sudden critical failures between checks.
            </p>
            <p>
              By leveraging high-resolution telemetry—monitoring the precise interplay between <strong>RPM, torque, tool wear timelines, and thermal gradients</strong>—the model determines exactly when parts reach their true fatigue threshold. This shift from calendar-based to predictive action slashes maintenance costs by up to <strong>30%</strong> and unplanned downtime by up to <strong>45%</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -3, shadow: '4px 4px 0px 0px #121212' }} 
            className="p-5 bg-white border border-[#121212] space-y-2 cursor-default select-none transition-all"
          >
            <div className="text-[#121212] font-serif text-3xl font-bold">-45%</div>
            <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#121212]">Unplanned Outages</div>
            <div className="text-[11px] text-[#121212]/70 leading-normal">Sudden failures are intercepted before causing severe cascading system defects.</div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -3, shadow: '4px 4px 0px 0px #121212' }} 
            className="p-5 bg-white border border-[#121212] space-y-2 cursor-default select-none transition-all"
          >
            <div className="text-[#121212] font-serif text-3xl font-bold">+35%</div>
            <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#121212]">Tool Life Extension</div>
            <div className="text-[11px] text-[#121212]/70 leading-normal">Tools are operated right up to safety threshold rather than replaced early.</div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -3, shadow: '4px 4px 0px 0px #121212' }} 
            className="p-5 bg-white border border-[#121212] space-y-2 cursor-default select-none transition-all"
          >
            <div className="text-[#121212] font-serif text-3xl font-bold">-30%</div>
            <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#121212]">Maintenance Expense</div>
            <div className="text-[11px] text-[#121212]/70 leading-normal">Fewer labor hours are wasted on unnecessary manual inspections.</div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -3, shadow: '4px 4px 0px 0px #121212' }} 
            className="p-5 bg-white border border-[#121212] space-y-2 cursor-default select-none transition-all"
          >
            <div className="text-[#121212] font-serif text-3xl font-bold">10x</div>
            <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#121212]">ROI Multiplier</div>
            <div className="text-[11px] text-[#121212]/70 leading-normal">Watsonx.ai cloud deployment costs are covered by preventing a single hour of downtime.</div>
          </motion.div>
        </div>
      </motion.section>

      {/* 5. Technology Stack */}
      <section className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-[#121212]">Interactive Technology Architecture</h3>
            <p className="text-xs text-[#121212]/70">The software stack supporting our high-accuracy predictions.</p>
          </div>
          <div className="h-px bg-[#121212]/20 flex-1 mx-6 hidden md:block" />
          <div className="text-[10px] font-mono tracking-widest text-[#121212] uppercase font-bold whitespace-nowrap hidden md:block">
            End-to-End Enterprise Stack
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {techStack.map((tech, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01, backgroundColor: '#FDFCFB' }}
              className="p-4 bg-white border border-[#121212] space-y-2 cursor-default select-none transition-all"
            >
              <span className="text-[8px] font-mono tracking-widest text-white uppercase bg-[#121212] px-2 py-0.5 rounded-none w-fit block font-bold">
                {tech.category}
              </span>
              <h5 className="font-serif font-bold text-[#121212] text-sm pt-1">{tech.name}</h5>
              <p className="text-[11px] text-[#121212]/70 leading-normal">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

    </motion.div>
  );
}
