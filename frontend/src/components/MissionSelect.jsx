import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- NEON FLUX SEARCH BAR ---
const NeonSearchBar = ({ value, onChange, placeholder = "Search database..." }) => (
    <div className="relative w-full max-w-lg mx-auto group z-20 mb-10">
      
      {/* 1. Outer Glow Container (The "Neon" Effect) */}
      <div className="absolute -inset-[3px] bg-gradient-to-r from-purple-600 via-cyan-500 to-blue-600 rounded-full opacity-40 blur-md group-focus-within:opacity-100 group-focus-within:blur-xl transition-all duration-500"></div>
      
      {/* 2. Sharp Border Line */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-500 rounded-full opacity-60 group-focus-within:opacity-100 transition-opacity duration-300"></div>

      {/* 3. The Input Box (Dark Core) */}
      <div className="relative flex items-center bg-[#020617] rounded-full p-1.5 h-14 shadow-2xl">
        
        {/* Search Icon */}
        <div className="pl-5 pr-3 text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-300">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none text-white text-base focus:outline-none focus:ring-0 placeholder-slate-500 font-medium tracking-wide h-full"
        />

        {/* Filter/Command Icon (Right Side) */}
        <div className="pr-5 pl-3 text-slate-500 group-focus-within:text-purple-400 transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
        </div>
      </div>
    </div>
);

// --- HOLOGRAPHIC CARD ---
const MissionCard = ({ mission, onClick }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  const difficultyColors = {
    Easy: 'from-emerald-500 to-teal-400',
    Medium: 'from-amber-500 to-orange-400',
    Hard: 'from-rose-500 to-red-600',
  };
  
  const accentGradient = difficultyColors[mission.difficulty] || difficultyColors['Medium'];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="perspective-1000"
    >
      <div 
        onClick={() => onClick(mission)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
            transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
            transition: 'transform 0.1s ease-out' 
        }}
        className="group relative h-64 cursor-pointer rounded-2xl p-[1px] bg-gradient-to-br from-white/10 to-transparent hover:from-cyan-500/50 hover:to-blue-600/50 transition-colors duration-500"
      >
        <div className="relative h-full bg-[#0f172a]/90 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            
            {/* Ambient Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accentGradient} opacity-10 rounded-full blur-[50px] group-hover:opacity-20 transition-opacity`}></div>

            <div>
                <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10 ${mission.difficulty === 'Hard' ? 'text-red-400' : 'text-slate-400'} group-hover:text-white group-hover:bg-white/10 transition-colors`}>
                        {mission.difficulty}
                    </span>
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 transition-all">
                    {mission.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {mission.description}
                </p>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full w-2/3 bg-gradient-to-r ${accentGradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-white transition-colors">INITIATE</span>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

const MissionSelect = ({ onSelectMission }) => {
  const [allMissions, setAllMissions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/missions?is_premium=true') 
      .then(res => {
        setAllMissions(res.data);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const filteredMissions = useMemo(() => {
    let result = allMissions;
    if (activeFilter !== 'All') {
        result = result.filter(m => m.difficulty === activeFilter);
    }
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(m => 
            m.title.toLowerCase().includes(lowerTerm) || 
            m.description.toLowerCase().includes(lowerTerm)
        );
    }
    return result;
  }, [allMissions, activeFilter, searchTerm]);


  return (
    <div>
      {/* --- HERO HEADER --- */}
      <div className="relative mb-8 py-10 text-center">
        <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 tracking-tighter mb-4 drop-shadow-2xl">
            MISSIONS
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base font-medium mb-12">
            Select a simulation module to begin your neural training sequence.
        </p>
        
        {/* NEON SEARCH BAR */}
        <NeonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search mission protocols..." />

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mt-8">
            {['All', 'Easy', 'Medium', 'Hard'].map(filter => (
                <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                        activeFilter === filter 
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {filter}
                </button>
            ))}
        </div>
      </div>

      {/* --- GRID --- */}
      {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {filteredMissions.length > 0 ? (
                    filteredMissions.map((mission) => (
                        <MissionCard key={mission.id} mission={mission} onClick={onSelectMission} />
                    ))
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="col-span-full text-center py-12 text-slate-500 font-mono"
                    >
                        No missions matching query.
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default MissionSelect;