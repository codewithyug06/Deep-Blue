import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- NEON FLUX SEARCH BAR ---
const NeonSearchBar = ({ value, onChange, placeholder = "Search database..." }) => (
    <div className="relative w-full max-w-lg mx-auto group z-20 mb-10">
      <div className="absolute -inset-[3px] bg-gradient-to-r from-purple-600 via-cyan-500 to-blue-600 rounded-full opacity-40 blur-md group-focus-within:opacity-100 group-focus-within:blur-xl transition-all duration-500"></div>
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-500 rounded-full opacity-60 group-focus-within:opacity-100 transition-opacity duration-300"></div>
      <div className="relative flex items-center bg-[#020617] rounded-full p-1.5 h-14 shadow-2xl">
        <div className="pl-5 pr-3 text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-300">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none text-white text-base focus:outline-none focus:ring-0 placeholder-slate-500 font-medium tracking-wide h-full"
        />
      </div>
    </div>
);

// --- LEADERBOARD COMPONENT ---
const LeaderboardModal = ({ missionId, onClose }) => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!missionId) return;
        axios.get(`http://localhost:8000/leaderboard/${missionId}`)
            .then(res => {
                setScores(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [missionId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0f1e] border border-cyan-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]"
            >
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-cyan-900/20">
                    <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm">Top Commanders</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500 text-xs animate-pulse">FETCHING DATA...</div>
                    ) : scores.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">NO RECORDS FOUND</div>
                    ) : (
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="text-slate-500 border-b border-white/5">
                                    <th className="pb-2">Rank</th>
                                    <th className="pb-2">Operative</th>
                                    <th className="pb-2 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {scores.map((s, i) => (
                                    <tr key={s.id} className="text-slate-300">
                                        <td className="py-2 pl-1 font-mono text-cyan-500">#{i + 1}</td>
                                        <td className="py-2 font-bold">{s.username}</td>
                                        <td className="py-2 text-right font-mono text-emerald-400">{s.execution_time.toFixed(4)}s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- HOLOGRAPHIC CARD ---
const MissionCard = ({ mission, onClick, onViewLeaderboard }) => {
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

  const difficultyColors = {
    Easy: 'from-emerald-500 to-teal-400',
    Medium: 'from-amber-500 to-orange-400',
    Hard: 'from-rose-500 to-red-600',
  };
  
  // New color configuration for text and borders
  const difficultyTextColors = {
    Easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    Medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    Hard: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  };

  const accentGradient = difficultyColors[mission.difficulty] || difficultyColors['Medium'];
  const textStyle = difficultyTextColors[mission.difficulty] || difficultyTextColors['Medium'];

  return (
    <motion.div 
      layout
      className="perspective-1000"
    >
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setRotation({ x: 0, y: 0 })}
        style={{ 
            transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
            transition: 'transform 0.1s ease-out' 
        }}
        className="group relative h-64 rounded-2xl p-[1px] bg-gradient-to-br from-white/10 to-transparent hover:from-cyan-500/50 hover:to-blue-600/50 transition-colors duration-500"
      >
        <div className="relative h-full bg-[#0f172a]/90 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accentGradient} opacity-10 rounded-full blur-[50px] group-hover:opacity-20 transition-opacity`}></div>

            <div onClick={() => onClick(mission)} className="cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                    {/* Updated Difficulty Badge with Specific Colors */}
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${textStyle} transition-colors`}>
                        {mission.difficulty}
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onViewLeaderboard(mission.id); }}
                        className="text-slate-600 hover:text-amber-400 transition-colors z-20"
                        title="View Leaderboard"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </button>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 transition-all">
                    {mission.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {mission.description}
                </p>
            </div>

            <div onClick={() => onClick(mission)} className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5 cursor-pointer">
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
  const [leaderboardMission, setLeaderboardMission] = useState(null); // ID for modal

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
      {/* --- LEADERBOARD MODAL --- */}
      <AnimatePresence>
        {leaderboardMission && (
            <LeaderboardModal 
                missionId={leaderboardMission} 
                onClose={() => setLeaderboardMission(null)} 
            />
        )}
      </AnimatePresence>

      <div className="relative mb-8 py-10 text-center">
        <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 tracking-tighter mb-4 drop-shadow-2xl">
            MISSIONS
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base font-medium mb-12">
            Select a simulation module to begin your neural training sequence.
        </p>
        
        <NeonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search mission protocols..." />

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

      {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {filteredMissions.length > 0 ? (
                    filteredMissions.map((mission) => (
                        <MissionCard 
                            key={mission.id} 
                            mission={mission} 
                            onClick={onSelectMission} 
                            onViewLeaderboard={setLeaderboardMission} // Pass handler
                        />
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