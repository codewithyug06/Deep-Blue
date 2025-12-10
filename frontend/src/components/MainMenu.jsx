import React from 'react';
import MissionSelect from './MissionSelect';
import ProblemList from './problems/ProblemList';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTS ---

const NavTab = ({ label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className="relative group px-6 py-3 rounded-xl transition-all duration-300 overflow-hidden"
  >
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-blue-500/10 border border-blue-400/30 rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)]"
      />
    )}
    <div className={`relative z-10 flex items-center gap-3 text-sm font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
      <Icon className={`w-4 h-4 ${active ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-500 group-hover:text-cyan-300'}`} />
      <span>{label}</span>
    </div>
  </button>
);

const UserBadge = ({ username, onLogout }) => (
    <div className="flex items-center gap-4 bg-[#0a0f1e]/40 backdrop-blur-md border border-white/5 rounded-full p-1.5 pr-6 hover:border-white/10 transition-colors group">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
            {username[0].toUpperCase()}
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                Commander
            </span>
            <span className="text-sm text-white font-mono leading-none">{username}</span>
        </div>
        <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
        <button onClick={onLogout} className="text-slate-400 hover:text-red-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
    </div>
);

// Accepting viewMode and setViewMode from props
const MainMenu = ({ user, onSelectMission, onLogout, viewMode, setViewMode }) => {
  
  return (
    <div className="min-h-screen flex flex-col font-sans relative z-10">
      
      {/* --- FLOATING NAV BAR --- */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="sticky top-6 z-50 px-6 lg:px-12 mb-8"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                    <svg className="w-8 h-8 text-cyan-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <h1 className="text-xl font-black text-white tracking-widest hidden md:block">
                    DEEP BLUE <span className="text-cyan-500 text-xs align-top">OS</span>
                </h1>
            </div>

            {/* Centered Tabs - Using passed props */}
            <div className="flex bg-[#0f172a]/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                <NavTab 
                  label="Missions" 
                  active={viewMode === 'missions'} 
                  onClick={() => setViewMode('missions')}
                  icon={(props) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
                <NavTab 
                  label="Problems" 
                  active={viewMode === 'problems'} 
                  onClick={() => setViewMode('problems')}
                  icon={(props) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                />
            </div>

            {/* Profile */}
            <UserBadge username={user.username} onLogout={onLogout} />
        </div>
      </motion.div>

      {/* --- CONTENT HERO --- */}
      <div className="flex-1 relative px-6 lg:px-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto pb-20">
            
            <AnimatePresence mode='wait'>
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {viewMode === 'missions' ? (
                        <MissionSelect onSelectMission={onSelectMission} />
                    ) : (
                        <div className="bg-[#0f172a]/60 backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-2xl">
                            <ProblemList user={user} onSelectMission={onSelectMission} />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default MainMenu;