import React, { useState } from 'react';
import { TabType } from '../types';
import { Menu, X, Activity, Cpu, Database, BarChart3, GraduationCap, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export default function Navigation({ activeTab, setActiveTab, isDark, toggleTheme }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home' as TabType, label: 'Home', icon: Activity },
    { id: 'live-predictor' as TabType, label: 'Live Predictor', icon: Cpu },
    { id: 'analytics' as TabType, label: 'Analytics Dashboard', icon: BarChart3 },
    { id: 'about-model' as TabType, label: 'About Model', icon: Database },
    { id: 'sip-submission' as TabType, label: 'Internship Details', icon: GraduationCap },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FDFCFB] dark:bg-[#0f0f0f] border-b border-[#121212] dark:border-white/10 px-6 md:px-12 py-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand/Logo Area */}
        <motion.div 
          className="flex items-center gap-4 cursor-pointer select-none" 
          onClick={() => setActiveTab('home')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-2 bg-[#121212] dark:bg-white text-white dark:text-[#121212] rounded-none border border-[#121212] dark:border-white flex items-center justify-center">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif italic font-bold text-2xl tracking-tight text-[#121212] dark:text-white">
                PredictX
              </span>
              <span className="text-[9px] font-mono uppercase bg-[#121212] dark:bg-white text-white dark:text-[#121212] px-1.5 py-0.5 rounded-none tracking-widest">
                AI
              </span>
            </div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-[#121212]/60 dark:text-white/40 mt-0.5">
              Powered by IBM watsonx.ai
            </p>
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-none text-xs font-mono uppercase tracking-widest font-bold cursor-pointer select-none transition-colors duration-200 overflow-hidden ${
                  isActive
                    ? 'text-white dark:text-[#121212] border border-[#121212] dark:border-white'
                    : 'text-[#121212]/80 dark:text-white/70 hover:text-[#121212] dark:hover:text-white border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeTabUnderline"
                    className="absolute inset-0 bg-[#121212] dark:bg-white -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* IBM Live Status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[#121212] dark:border-white/20 bg-[#121212]/5 dark:bg-white/5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#121212] dark:text-white/80 font-semibold">
              watsonx.ai: <strong>LIVE</strong>
            </span>
          </div>

          {/* Dark mode toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-none border border-[#121212] dark:border-white/30 bg-[#121212]/5 dark:bg-white/5 text-[#121212] dark:text-white hover:bg-[#121212]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.button>

          {/* Mobile menu button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.92 }}
            className="lg:hidden p-2 text-[#121212] dark:text-white hover:bg-[#121212]/5 dark:hover:bg-white/5 rounded-none border border-[#121212] dark:border-white/30 cursor-pointer"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="lg:hidden mt-4 pt-4 border-t border-[#121212]/20 dark:border-white/10 space-y-2 overflow-hidden"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-none text-xs font-mono uppercase tracking-widest font-bold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#121212] dark:bg-white text-white dark:text-[#121212] border border-[#121212] dark:border-white'
                      : 'text-[#121212]/80 dark:text-white/70 hover:text-[#121212] dark:hover:text-white hover:bg-[#121212]/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
            
            <div className="p-3 bg-[#121212]/5 dark:bg-white/5 rounded-none border border-[#121212] dark:border-white/20 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#121212] dark:text-white font-semibold">
                watsonx.ai AutoAI API Connected
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
