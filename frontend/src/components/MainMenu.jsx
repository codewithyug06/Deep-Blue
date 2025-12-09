import React, { useState } from 'react';
import MissionSelect from './MissionSelect';
import ProblemList from './problems/ProblemList';
import { motion, AnimatePresence } from 'framer-motion';

// --- NAV BUTTON COMPONENT ---
const NavTab = ({ label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className="relative group px-6 py-2.5 rounded-xl transition-all duration-300 overflow-hidden"
  >
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 border border-cyan-500/30 rounded-xl backdrop-blur-md"
      />
    )}
    <div className={`relative z-10 flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${active ? 'text-cyan-50' : 'text-slate-400 group-hover:text-cyan-200'}`}>
      <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'} transition-colors`} />
      <span>{label}</span>
    </div>
    {!active && <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-xl transition-colors" />}
  </button>
);

const MainMenu = ({ user, onSelectMission, onLogout }) => {
  const [viewMode, setViewMode] = useState('missions'); 

  return (
    <div className="min-h-screen flex flex-col font-sans bg-transparent relative z-10">
      
      {/* --- HOLOGRAPHIC NAV BAR --- */}
      <div className="sticky top-6 z-50 px-6 mb-8">
        <div className="max-w-7xl mx-auto bg-[#0a0f1e]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex justify-between items-center relative overflow-hidden">
          
          {/* Animated Glow Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

          {/* Logo Section */}
          <div className="flex items-center gap-4 pl-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/10">
                D
              </div>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-white tracking-wide">DEEP BLUE</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-semibold">System Online</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-[#020617]/50 p-1 rounded-xl border border-white/5">
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
              icon={(props) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-6 pr-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">Commander</span>
              <span className="text-sm text-slate-200 font-mono font-bold text-shadow-sm">{user.username}</span>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-700/50 mx-2"></div>
            
            <button 
              onClick={onLogout}
              className="group relative px-4 py-2 rounded-lg overflow-hidden transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              <div className="absolute inset-0 border border-red-500/30 rounded-lg group-hover:border-red-500/60 transition-colors"></div>
              <div className="absolute inset-0 bg-red-500/10 group-hover:bg-red-500/20 transition-colors"></div>
              <div className="relative flex items-center gap-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider group-hover:text-red-300">Abort</span>
                <svg className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 relative px-6 md:px-12 pb-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode='wait'>
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {viewMode === 'missions' ? (
                 <MissionSelect onSelectMission={onSelectMission} />
              ) : (
                <ProblemList user={user} onSelectMission={onSelectMission} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

export default MainMenu;