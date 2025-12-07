// frontend/src/components/MainMenu.jsx
import React, { useState } from 'react';
import MissionSelect from './MissionSelect';
import ProblemList from './problems/ProblemList';

const MainMenu = ({ user, onSelectMission, onLogout }) => {
  const [viewMode, setViewMode] = useState('missions'); 

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* --- GLASS NAVIGATION BAR --- */}
      <div className="sticky top-0 z-50 glass-panel border-b border-slate-700/50 px-8 py-4 flex justify-between items-center shadow-2xl">
        
        {/* Logo & Tabs */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20 flex items-center justify-center font-bold text-black text-xl">D</div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-cyan-200 tracking-tight">
              DEEP BLUE
            </h1>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex bg-slate-900/50 rounded-xl p-1 border border-slate-700/50 backdrop-blur-md">
            <button
              onClick={() => setViewMode('missions')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                viewMode === 'missions'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              🚀 Operations
            </button>
            <button
              onClick={() => setViewMode('problems')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                viewMode === 'problems'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              ⚡ Problems
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">Commander</span>
            <span className="text-sm text-slate-200 font-mono font-bold">{user.username}</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-700/50"></div>
          <button 
            onClick={onLogout}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <span>Logout</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 relative p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {viewMode === 'missions' ? (
             <MissionSelect onSelectMission={onSelectMission} />
          ) : (
            <ProblemList user={user} onSelectMission={onSelectMission} />
          )}
        </div>
      </div>

    </div>
  );
};

export default MainMenu;