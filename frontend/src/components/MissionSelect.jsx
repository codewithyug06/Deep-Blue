// frontend/src/components/MissionSelect.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MissionCard = ({ mission, onClick }) => {
  const difficultyColors = {
    Easy: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 group-hover:border-emerald-500/50',
    Medium: 'text-amber-400 border-amber-500/20 bg-amber-500/5 group-hover:border-amber-500/50',
    Hard: 'text-rose-400 border-rose-500/20 bg-rose-500/5 group-hover:border-rose-500/50',
  };
  
  const diffClass = difficultyColors[mission.difficulty] || difficultyColors['Medium'];

  return (
    <div 
      onClick={() => onClick(mission)}
      className="group relative bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 cursor-pointer hover:-translate-y-1 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 pr-2">
            {mission.title}
          </h3>
          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${diffClass}`}>
            {mission.difficulty}
          </span>
        </div>
        
        <p className="text-slate-400 text-sm mb-6 line-clamp-2 h-10">
          {mission.description}
        </p>
        
        <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">Logic</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">Syntax</span>
            </div>
            <span className="text-blue-500/50 group-hover:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-transparent hover:border-slate-600'
        }`}
    >
        {label}
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
      <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
  );

  return (
    <div className="font-sans">
      <header className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-2">Mission Protocol</h2>
        <p className="text-slate-400">Select a simulation to calibrate your logic circuits.</p>
        
        <div className="mt-8 max-w-xl mx-auto flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search protocols..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-10 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 shadow-inner"
                />
                <svg className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>

            {/* Filters */}
            <div className="flex justify-center gap-2 flex-wrap">
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
            <div className="col-span-full text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700">
                <p className="text-slate-500">No protocols match your query.</p>
                <button 
                    onClick={() => {setSearchQuery(''); setActiveFilter('All');}}
                    className="mt-4 text-blue-400 hover:underline text-sm"
                >
                    Reset Filters
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default MissionSelect;