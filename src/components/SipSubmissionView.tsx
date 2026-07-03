import React, { useState } from 'react';
import {
  GraduationCap, Calendar, Award, Github, FileText, Download,
  MapPin, CheckCircle, ChevronRight, Briefcase, FileCode, Presentation, X, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SipSubmissionView() {
  const [modalImage, setModalImage] = useState<{ title: string; image: string; url?: string } | null>(null);

  // Custom student details matching User Email context (Madan Jadhav)
  const student = {
    name: 'Atharva Jadhav',
    email: 'jatharvajadhav2007@gmail.com',
    college: 'MIT Academy Of Engineering',
    branch: 'Computer Engineering',
    role: 'Student',
    duration: '4 Weeks (June - July 2026)',
    location: 'Pune, Maharashtra, India'
  };

  const projectLinks = {
    github: 'https://github.com/aquaregia3213/Predictive_Maintenance_IBM',
    ppt: 'https://docs.google.com/presentation/d/1YZy53_oUUZo_THMd6eZ1myPRottzQEuC/edit?usp=sharing&ouid=103222535009742353780&rtpof=true&sd=true', // Simulator download trigger
  };

  // Week-wise Internship plan from PDF Page 5
  const timeline = [
    {
      week: 'Week 1',
      title: 'AICTE Orientation & Agentic AI Basics',
      desc: '• Day 01: AICTE Learning Plan registration, IBM Cloud lite services demo, and Jupyter Notebook setup.\n• Day 02: Granite model in Prompt Lab, Intro to Agentic AI.\n• Day 03: Built Nutrition Agent on watsonx orchestrate, triage Project Problem statements.',
      status: 'Completed'
    },
    {
      week: 'Week 2',
      title: 'AI & Cybersecurity Credentials',
      desc: '• Day 01: IBM Badge Course: Getting started with Artificial Intelligence.\n• Day 02: IBM Badge Course: Getting started with Cybersecurity, AMA session.\n• Day 03: Groundwork on Machine Learning foundations & classification boundaries.',
      status: 'Completed'
    },
    {
      week: 'Week 3',
      title: 'Generative AI & Data Pipelines',
      desc: '• Day 01: Cybersecurity with Generative AI course, code troubleshooting with IBM Bob.\n• Day 02: IBM Bob installation, IBM Data Refinery pipeline ingestion.\n• Day 03: Developed a RAG-based Thai receipt generator agent via watsonx orchestrate, Project Review.',
      status: 'Completed'
    },
    {
      week: 'Week 4',
      title: 'Assistant Design & Quantum Circuits',
      desc: '• Day 01: Chatbot assistant for College Admission System using watsonx assistant.\n• Day 02: Course Demo: Exploring Quantum computing, execution of a Basic Quantum Circuit on IBM Quantum Platform.\n• Day 03: Final project compilation, AMA, and submission.',
      status: 'Completed'
    }
  ];

  // 3 Verified Certificates from PDF Pages 1-3
  const certificates = [
    {
      title: 'Journey to Cloud: Envisioning Your Solution',
      issuer: 'IBM SkillsBuild',
      id: 'CRED-IBM-J2C',
      date: 'Jun 26, 2026',
      image: '/cert1_journey_to_cloud.png',
      url: 'https://www.credly.com/badges/7a354026-711a-47c5-a855-d0f427084b82'
    },
    {
      title: 'Getting Started with Artificial Intelligence',
      issuer: 'IBM SkillsBuild',
      id: 'CRED-IBM-AI',
      date: 'Jun 18, 2026',
      image: '/cert2_getting_started_ai.png',
      url: 'https://www.credly.com/badges/8b8d54d9-cd80-4198-8241-5e51216ca4a4'
    },
    {
      title: 'Getting Started with Cybersecurity',
      issuer: 'IBM SkillsBuild',
      id: 'CRED-IBM-SEC',
      date: 'Jun 18, 2026',
      image: '/cert3_getting_started_cybersecurity.png',
      url: 'https://www.credly.com/badges/097ae989-f4f9-42d1-a51a-ab4dcf5321b8'
    }
  ];

  const triggerDownload = (type: string) => {
    alert(`Generating ${type} file from server and initiating download...`);
  };

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
      <motion.div variants={itemVariants} className="border-b border-[#121212] dark:border-white/20 pb-6">
        <span className="inline-block text-[10px] font-mono uppercase tracking-widest font-bold text-[#121212] dark:text-white bg-[#121212]/5 dark:bg-white/10 px-3 py-1.5 rounded-none border border-[#121212] dark:border-white/30">
          Academic Portfolio
        </span>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#121212] dark:text-white mt-4">Internship Details</h2>
        <p className="text-[#121212]/70 dark:text-white/60 text-sm mt-1 font-sans">Official submission portal for the Student Internship Program (SIP), detailing weekly plans, certificates, and the ML problem statement.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Student Profile card */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">

          <div className="bg-white dark:bg-zinc-900 p-6 border border-[#121212] dark:border-white/20 shadow-[4px_4px_0px_0px_#121212] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] space-y-6 rounded-none relative overflow-hidden">

            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#F6F4F1] dark:bg-zinc-800 rounded-none border border-[#121212] dark:border-white/20 text-[#121212] dark:text-white">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase text-[#121212]/60 dark:text-white/50 font-bold block">Intern Candidate</span>
                <h3 className="font-serif font-bold text-xl text-[#121212] dark:text-white mt-0.5">{student.name}</h3>
                <p className="text-xs text-[#121212]/70 dark:text-white/60 font-semibold">{student.role}</p>
              </div>
            </div>

            <div className="h-px bg-[#121212]/10 dark:bg-white/10" />

            {/* Profile Fields */}
            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#121212]/10 dark:border-white/10">
                <span className="text-[#121212]/60 dark:text-white/50 font-bold">College:</span>
                <span className="text-[#121212] dark:text-white text-right max-w-[240px] font-semibold">{student.college}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#121212]/10 dark:border-white/10">
                <span className="text-[#121212]/60 dark:text-white/50 font-bold">Department:</span>
                <span className="text-[#121212] dark:text-white text-right font-semibold">{student.branch}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#121212]/10 dark:border-white/10">
                <span className="text-[#121212]/60 dark:text-white/50 font-bold">Duration:</span>
                <span className="text-[#121212] dark:text-white text-right font-semibold">{student.duration}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#121212]/10 dark:border-white/10">
                <span className="text-[#121212]/60 dark:text-white/50 font-bold">Email:</span>
                <span className="text-[#121212] dark:text-white text-right font-semibold">{student.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#121212]/60 dark:text-white/50 font-bold">Location:</span>
                <span className="text-[#121212] dark:text-white text-right font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {student.location}
                </span>
              </div>
            </div>

            <div className="h-px bg-[#121212]/10 dark:bg-white/10" />

            {/* Action Cards / Links */}
            <div className="grid grid-cols-2 gap-3">
              <motion.a
                href={projectLinks.github}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="p-3 bg-white dark:bg-zinc-800 hover:bg-[#F6F4F1] dark:hover:bg-zinc-700 border border-[#121212] dark:border-white/20 shadow-[2px_2px_0px_0px_#121212] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] rounded-none flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer"
              >
                <Github className="h-5 w-5 text-[#121212] dark:text-white" />
                <span className="text-xs font-bold text-[#121212] dark:text-white">GitHub Repo</span>
              </motion.a>

              <motion.a 
                href={projectLinks.ppt}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="p-3 bg-white dark:bg-zinc-800 hover:bg-[#F6F4F1] dark:hover:bg-zinc-700 border border-[#121212] dark:border-white/20 shadow-[2px_2px_0px_0px_#121212] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] rounded-none flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer"
              >
                <Presentation className="h-5 w-5 text-[#121212] dark:text-white" />
                <span className="text-xs font-bold text-[#121212] dark:text-white">View PPT</span>
              </motion.a>
            </div>
          </div>

          {/* Certificate Showcase */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-[#121212] dark:text-white" />
              Verified Credentials (Click to view)
            </h4>

            <div className="space-y-3">
              {certificates.map((cert, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  onClick={() => setModalImage({ title: cert.title, image: cert.image, url: cert.url })}
                  className="p-4 rounded-none border border-[#121212] dark:border-white/20 bg-white dark:bg-zinc-900 text-[#121212] dark:text-white flex justify-between items-center shadow-[2px_2px_0px_0px_#121212] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="space-y-1">
                    <h5 className="font-serif font-bold text-xs text-[#121212] dark:text-white flex items-center gap-1">
                      {cert.title}
                      <Eye className="h-3 w-3 opacity-60" />
                    </h5>
                    <p className="text-[10px] text-[#121212]/60 dark:text-white/40 font-mono">{cert.issuer} • ID: {cert.id}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#121212] dark:text-white bg-[#121212]/5 dark:bg-white/5 border border-[#121212]/20 dark:border-white/20 px-2 py-1 rounded-none font-bold">
                    {cert.date}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

        </motion.div>

        {/* Right Column: Problem Statement & Delivery Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">

          {/* Problem Statement Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 border border-[#121212] dark:border-white/20 shadow-[4px_4px_0px_0px_#121212] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] space-y-4 rounded-none">
            <div className="flex justify-between items-center border-b border-[#121212]/10 dark:border-white/10 pb-2">
              <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center gap-1.5">
                <FileCode className="h-4.5 w-4.5 text-[#121212] dark:text-white" />
                Problem Statement No.39
              </h3>
              <button
                onClick={() => setModalImage({ title: 'Problem Statement No.39 – Machine Learning Project Document', image: '/problem_statement.png' })}
                className="text-[9px] font-mono uppercase bg-[#121212]/5 dark:bg-white/5 border border-[#121212]/20 dark:border-white/20 text-[#121212] dark:text-white px-2 py-1 rounded-none font-bold cursor-pointer hover:bg-[#121212]/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View Original Sheet
              </button>
            </div>

            <div className="space-y-3 text-[#121212]/80 dark:text-white/85 text-xs leading-relaxed font-sans">
              <p className="font-semibold text-sm font-serif border-l-2 border-[#121212] dark:border-white pl-2 py-0.5">
                Mechanical Engineering: Predictive Maintenance of Industrial Machinery
              </p>
              <p>
                <strong>The Challenge:</strong> Develop a predictive maintenance model for a fleet of industrial machines to anticipate failures before they occur. This project will involve analyzing sensor data from machinery to identify patterns that precede a failure. The goal is to create a classification model that can predict the type of failure (e.g., tool wear, heat dissipation, power failure) based on real-time operational data. This will enable proactive maintenance, reducing downtime and operational costs.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-[#121212]/10 dark:border-white/10 text-[10px] font-mono">
                <span><strong>Technology:</strong> IBM Cloud lite services (Mandatory)</span>
                <a
                  href="https://www.kaggle.com/datasets/shivamb/machine-predictive-maintenance-classification"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-[#121212] dark:text-white hover:opacity-80"
                >
                  Kaggle Dataset Link →
                </a>
              </div>
            </div>
          </div>

          {/* Internship Timeline Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 border border-[#121212] dark:border-white/20 shadow-[4px_4px_0px_0px_#121212] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] space-y-6 rounded-none">
            <div className="flex justify-between items-center border-b border-[#121212]/10 dark:border-white/10 pb-2">
              <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center gap-1.5">
                <Briefcase className="h-4.5 w-4.5 text-[#121212] dark:text-white" />
                Internship Week Plan
              </h3>
              <button
                onClick={() => setModalImage({ title: 'Internship Week-Wise Deliverable Plan Matrix', image: '/internship_plan_weeks.png' })}
                className="text-[9px] font-mono uppercase bg-[#121212]/5 dark:bg-white/5 border border-[#121212]/20 dark:border-white/20 text-[#121212] dark:text-white px-2 py-1 rounded-none font-bold cursor-pointer hover:bg-[#121212]/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View Original Matrix
              </button>
            </div>

            <div className="relative border-l border-[#121212]/20 dark:border-white/15 ml-3 pl-6 space-y-6">
              {timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-9 top-1.5 h-6 w-6 rounded-none bg-white dark:bg-zinc-800 border border-[#121212] dark:border-white/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#121212]">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-800 dark:text-emerald-500" />
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="font-serif font-bold text-sm text-[#121212] dark:text-white">{step.title}</h4>
                      <span className="text-[9px] font-mono uppercase bg-[#121212]/5 dark:bg-white/5 border border-[#121212]/20 dark:border-white/20 text-[#121212] dark:text-white px-2 py-0.5 rounded-none font-bold">
                        {step.week}
                      </span>
                    </div>
                    <p className="text-xs text-[#121212]/70 dark:text-white/60 leading-relaxed whitespace-pre-line font-sans">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </motion.div>

      </div>

      {/* Visual Asset Lightbox Modal Overlay */}
      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalImage(null)}
            className="fixed inset-0 z-50 bg-[#121212]/85 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-[#121212] dark:border-white/20 p-5 max-w-4xl w-full shadow-[6px_6px_0px_0px_#121212] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.15)] flex flex-col gap-4 text-[#121212] dark:text-white cursor-default"
            >
              <div className="flex justify-between items-center border-b border-[#121212]/10 dark:border-white/10 pb-2">
                <h4 className="font-serif font-bold text-xs sm:text-sm md:text-base leading-tight">{modalImage.title}</h4>
                <button
                  onClick={() => setModalImage(null)}
                  className="font-mono text-[10px] uppercase font-bold border border-[#121212] dark:border-white/30 bg-[#121212]/5 dark:bg-white/5 hover:bg-[#121212]/10 dark:hover:bg-white/10 px-2.5 py-1.5 cursor-pointer flex items-center gap-1 rounded-none"
                >
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>
              </div>
              <div className="border border-[#121212]/10 dark:border-white/10 overflow-hidden bg-[#F6F4F1] dark:bg-zinc-800 flex justify-center items-center p-2">
                <img
                  src={modalImage.image}
                  alt={modalImage.title}
                  className="max-w-full h-auto object-contain max-h-[70vh] shadow-sm select-none"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono border-t border-[#121212]/10 dark:border-white/10 pt-2">
                {modalImage.url ? (
                  <a
                    href={modalImage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-[#121212]/70 dark:hover:text-white/70 font-bold flex items-center gap-1"
                  >
                    Verify Credly Badge →
                  </a>
                ) : (
                  <span className="text-[#121212]/60 dark:text-white/50">Internship Project Document Asset</span>
                )}
                <span className="text-[#121212]/60 dark:text-white/50">Atharva Jadhav • MITAOE</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
