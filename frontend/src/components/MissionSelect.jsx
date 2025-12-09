import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// --- ANIMATED CARD ---
const MissionCard = ({ mission, onClick }) => {
  const difficultyConfig = {
    Easy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    Medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    Hard: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  };
  
  const diff = difficultyConfig[mission.difficulty] || difficultyConfig['Medium'];

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(mission)}
      className="group relative cursor-pointer"
    >
      {/* Animated Border Container */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm group-hover:animate-border-flow"></div>
      
      {/* Card Content */}
      <div className="relative h-full bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col justify-between overflow-hidden hover:bg-[#0f1623] transition-colors">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 pr-4">
              {mission.title}
            </h3>
            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${diff.bg} ${diff.color} ${diff.border}`}>
              {mission.difficulty}
            </span>
          </div>
          
          <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
            {mission.description}
          </p>
        </div>
        
        <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-2">
                <span className="text-[10px] font-mono text-slate-500 bg-black/40 px-2 py-1 rounded border border-white/5">Logic</span>
                <span className="text-[10px] font-mono text-slate-500 bg-black/40 px-2 py-1 rounded border border-white/5">Python</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

const FilterButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden ${
            active 
            ? 'text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
            : 'text-slate-400 hover:text-white bg-[#0f172a]/50 hover:bg-[#1e293b]'
        }`}
    >
        {active && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-100"></div>}
        <span className="relative z-10">{label}</span>
    </button>
);

const MissionSelect = ({ onSelectMission }) => {
  const [allMissions, setAllMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState(''); 

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/missions?is_premium=true') 
      .then(res => {
        setAllMissions(res.data);
        setFilteredMissions(res.data); 
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = allMissions;
    if (activeFilter !== 'All') {
        result = result.filter(m => m.difficulty?.trim().toLowerCase() === activeFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(m => 
            (m.title && m.title.toLowerCase().includes(query)) || 
            (m.description && m.description.toLowerCase().includes(query))
        );
    }
    setFilteredMissions(result);
  }, [activeFilter, searchQuery, allMissions]);

  if (loading) return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-blue-400 animate-pulse">DOWNLOADING PROTOCOLS...</p>
      </div>
  );

  return (
    <div className="font-sans">
      <header className="mb-12 text-center">
        <h2 className="text-5xl font-black text-white mb-3 tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            MISSION PROTOCOL
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Select a simulation to calibrate your logic circuits.
        </p>
        
        <div className="mt-10 max-w-xl mx-auto flex flex-col gap-6">
            
            {/* GLOWING SEARCH BAR */}
            <div className="relative group p-[2px] rounded-2xl bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-500 animate-border-flow transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)]">
                <div className="relative bg-[#020617] rounded-2xl flex items-center px-4 py-4">
                    <svg className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search mission database..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-white focus:outline-none focus:ring-0 placeholder-slate-600 text-sm font-medium tracking-wide"
                    />
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex justify-center gap-3 flex-wrap">
                {['All', 'Easy', 'Medium', 'Hard'].map(filter => (
                    <FilterButton 
                        key={filter} 
                        label={filter} 
                        active={activeFilter === filter} 
                        onClick={() => setActiveFilter(filter)} 
                    />
                ))}
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {filteredMissions.length > 0 ? (
            filteredMissions.map(mission => (
                <MissionCard key={mission.id} mission={mission} onClick={onSelectMission} />
            ))
        ) : (
            <div className="col-span-full py-20 text-center">
                <div className="inline-block p-6 rounded-full bg-slate-900/50 mb-4 border border-slate-800">
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-slate-500 font-mono text-sm">NO DATA FOUND IN ARCHIVES.</p>
                <button 
                    onClick={() => {setSearchQuery(''); setActiveFilter('All');}}
                    className="mt-4 text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest hover:underline"
                >
                    Reset Parameters
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default MissionSelect;