import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENTS ---

// 1. NEON FLUX SEARCH BAR
const NeonSearchBar = ({ value, onChange, placeholder = "Query database..." }) => (
    <div className="relative w-full md:w-96 group z-20">
      
      {/* 1. Outer Glow (Reduced opacity for list view) */}
      <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-600 via-cyan-500 to-blue-600 rounded-full opacity-20 blur-md group-focus-within:opacity-80 group-focus-within:blur-lg transition-all duration-500"></div>
      
      {/* 2. Sharp Border */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-500 rounded-full opacity-40 group-focus-within:opacity-100 transition-opacity duration-300"></div>

      {/* 3. Input Box */}
      <div className="relative flex items-center bg-[#0a0f1e] rounded-full p-1 h-12 shadow-xl">
        
        {/* Search Icon */}
        <div className="pl-4 pr-2 text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0 placeholder-slate-500 font-medium tracking-wide h-full"
        />
        
        {/* Filter Icon */}
        <div className="pr-4 pl-2 text-slate-500 group-focus-within:text-purple-400 transition-colors duration-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
        </div>
      </div>
    </div>
);

// 2. Filter Dropdown (Glassmorphic)
const FilterSelect = ({ value, onChange, options, icon }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-cyan-500">
      {icon}
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none bg-[#0f172a]/60 backdrop-blur-md border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg pl-10 pr-8 py-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 hover:bg-white/5 transition-all cursor-pointer min-w-[140px]"
    >
      {options.map(opt => (
        <option key={opt} value={opt} className="bg-[#0f172a] text-slate-300">{opt}</option>
      ))}
    </select>
    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
);

// 3. The Problem "Data Strip" (Row Replacement)
const ProblemDataStrip = ({ problem, index, onClick }) => {
  const difficultyColor = {
    Easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    Medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    Hard: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  }[problem.difficulty] || 'text-blue-400 border-blue-500/30 bg-blue-500/10';

  const acceptanceVal = parseFloat(problem.acceptance) || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onClick(problem)}
      className="group relative flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 mb-3 rounded-xl bg-[#0f172a]/40 border border-white/5 hover:border-cyan-500/30 hover:bg-[#0f172a]/80 backdrop-blur-sm transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>

      {/* Status Beacon */}
      <div className="flex-shrink-0">
        {problem.status === 'Solved' ? (
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-600 group-hover:border-cyan-500/30 group-hover:text-cyan-500 transition-colors">
            <span className="font-mono text-xs">{index + 1}</span>
          </div>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 grid gap-1">
        <h3 className="text-white font-bold text-lg truncate group-hover:text-cyan-400 transition-colors">
          {problem.title}
        </h3>
        <div className="flex items-center gap-3">
          {problem.topic && (
            <span className="text-[10px] font-mono text-blue-300 bg-blue-900/30 border border-blue-500/20 px-2 py-0.5 rounded">
              {problem.topic}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            ID: {problem.id || '000'}
          </span>
        </div>
      </div>

      {/* Stats & Meta */}
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
        
        {/* Visual Acceptance Bar */}
        <div className="flex flex-col gap-1 w-24">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Acceptance</span>
                <span>{problem.acceptance || '0%'}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${acceptanceVal}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                />
            </div>
        </div>

        {/* Difficulty Badge */}
        <div className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider shadow-sm ${difficultyColor}`}>
          {problem.difficulty}
        </div>

        {/* Arrow Action */}
        <div className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

const ProblemList = ({ user, onSelectMission }) => {
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Difficulty');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/problems?user_id=${user.id}`);
        setMissions(response.data);
        setFilteredMissions(response.data);
      } catch (error) {
        console.error("Failed to fetch problems", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProblems();
  }, [user]);

  // Handle Filtering
  useEffect(() => {
    let result = missions;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(lowerTerm) ||
        (m.topic && m.topic.toLowerCase().includes(lowerTerm))
      );
    }

    if (selectedCategory !== 'All Topics') {
      result = result.filter(m => m.topic === selectedCategory);
    }

    if (selectedDifficulty !== 'Difficulty') {
      result = result.filter(m => 
          m.difficulty && m.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    setFilteredMissions(result);
    setCurrentPage(1); 
  }, [searchTerm, selectedCategory, selectedDifficulty, missions]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);

  const categories = ['All Topics', ...new Set(missions.map(m => m.topic).filter(Boolean))];

  return (
    <div className="font-sans text-slate-300">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-slate-500 mb-2 drop-shadow-lg">
                PROBLEM SET
            </h2>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Access the global algorithm repository. Solve challenges to upgrade your neural rank.
            </p>
        </div>
        
        {/* Stats Summary */}
        <div className="flex gap-4">
            <div className="bg-[#0f172a]/60 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-sm">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
                <span className="text-xl font-mono text-white">{missions.length}</span>
            </div>
            <div className="bg-[#0f172a]/60 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-sm">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Solved</span>
                <span className="text-xl font-mono text-emerald-400">{missions.filter(m => m.status === 'Solved').length}</span>
            </div>
        </div>
      </div>

      {/* Control Bar with NEON SEARCH BAR */}
      <div className="flex flex-col xl:flex-row items-center gap-4 mb-8 bg-[#0a0f1e]/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl relative z-30">
        
        <NeonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Query algorithm database..." />
        
        <div className="flex gap-3 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 md:ml-auto no-scrollbar z-20">
            <FilterSelect 
                value={selectedCategory} 
                onChange={setSelectedCategory} 
                options={categories}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
            />
            <FilterSelect 
                value={selectedDifficulty} 
                onChange={setSelectedDifficulty} 
                options={['Difficulty', 'Easy', 'Medium', 'Hard']}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
        </div>
      </div>

      {/* List Content */}
      <div className="space-y-1 min-h-[400px] relative z-10">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-mono tracking-widest text-cyan-500">DECRYPTING ARCHIVES...</p>
            </div>
        ) : (
            <AnimatePresence mode='wait'>
                {currentItems.length > 0 ? (
                    <motion.div layout className="space-y-3">
                    {currentItems.map((problem, idx) => (
                        <ProblemDataStrip 
                            key={problem.id} 
                            problem={problem} 
                            index={idx} 
                            onClick={onSelectMission} 
                        />
                    ))}
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-20 text-slate-500 bg-[#0f172a]/30 rounded-xl border border-dashed border-slate-700"
                    >
                        <p className="text-lg mb-2 font-mono">No data fragments found.</p>
                        <button onClick={() => {setSearchTerm(''); setSelectedCategory('All Topics'); setSelectedDifficulty('Difficulty');}} className="text-cyan-400 text-sm hover:underline tracking-wider">RESET FILTERS</button>
                    </motion.div>
                )}
            </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0f172a] border border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-slate-500 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="px-4 py-2 bg-[#0f172a] rounded-lg border border-white/5 font-mono text-sm">
            <span className="text-cyan-400">{currentPage}</span> <span className="text-slate-600">/</span> <span className="text-slate-400">{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0f172a] border border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-slate-500 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemList;