import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import LoginScene from '../three-scene/LoginScene';

// --- ICONS (SVG) ---
const Icons = {
  User: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Google: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  Github: () => <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
  Apple: () => <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.13-.48-3.08.48-1.04 1.07-2.17 1.03-3.08.35-1.26-.94-2.45-3.32-2.39-5.93.07-2.92 2.18-4.75 4.39-4.8 1.07-.03 2.05.51 2.76.51.7 0 1.95-.62 3.23-.53 1.1.08 2.37.56 3.1 1.58-2.73 1.63-2.27 5.66.42 6.83-.58 1.48-1.39 2.91-2.27 1.16zm-5.69-12.7c-1.31.06-2.58-.79-3.01-2.09.91-1.38 2.45-1.92 3.65-1.92 1.34 0 2.58.82 2.93 2.09-.98 1.37-2.39 1.92-3.57 1.92z" /></svg>,
  Spinner: () => <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
};

// --- ANIMATED TERMINAL LOG ---
const SystemTerminal = () => {
    const [lines, setLines] = useState([
        "> SYSTEM_INIT...",
        "> LOADING_MODULES...",
        "> CONNECTING_TO_NEURAL_NET...",
        "> ENCRYPTION_ACTIVE: AES-256"
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
            const codes = ["SYNC", "ACK", "PING", "AUTH", "SECURE"];
            const action = codes[Math.floor(Math.random() * codes.length)];
            setLines(prev => [`> [${action}] PACKET_${hex} RECEIVED`, ...prev.slice(0, 4)]);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute bottom-4 left-4 z-40 pointer-events-none select-none opacity-50 mix-blend-plus-lighter hidden md:block">
            <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-bold tracking-widest">SYSTEM ONLINE</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex flex-col gap-0.5">
                {lines.map((l, i) => (
                    <motion.span 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1 - i * 0.2, x: 0 }}
                        className="truncate w-48"
                    >
                        {l}
                    </motion.span>
                ))}
            </div>
        </div>
    );
}

const LoginModal = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
        setError('Credentials Missing.');
        return;
    }
    setLoading(true);
    setError('');
    
    await new Promise(r => setTimeout(r, 1200));

    const endpoint = activeTab === 'login' ? '/login' : '/register';
    try {
      const response = await axios.post(`http://localhost:8000${endpoint}`, { username, password });
      setTimeout(() => {
        onLogin({
          id: response.data.user_id,
          username: username,
          is_premium: response.data.is_premium
        });
      }, 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Connection Refused.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden font-sans">
      
      {/* 1. BACKGROUND SCENE */}
      <LoginScene />
      
      {/* 2. TERMINAL OVERLAY */}
      <SystemTerminal />

      {/* 3. LOGIN CARD */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="relative z-30 w-full max-w-[420px] p-6"
      >
        {/* Glow border behind card */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 rounded-[2rem] opacity-30 blur-lg animate-pulse"></div>

        <div className="relative bg-[#0a0f1e]/70 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Header */}
            <div className="pt-10 pb-6 text-center relative">
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform rotate-3 border border-white/10">
                    <span className="text-3xl font-black text-white">D</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-1">DEEP BLUE</h1>
                <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-blue-300/60">Neural Interface</p>
                
                {/* Decorative Line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="p-8 pt-4">
                
                {/* Tabs */}
                <div className="flex bg-[#020617]/50 p-1 rounded-xl mb-6 relative border border-white/5">
                    <motion.div 
                        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg shadow-sm"
                        animate={{ left: activeTab === 'login' ? '4px' : 'calc(50%)' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    {['login', 'register'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => { setActiveTab(tab); setError(''); }}
                            className={`flex-1 relative z-10 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Identity Input (Animated Glow) */}
                    <div className="group space-y-1">
                        <label className="text-[10px] font-bold uppercase ml-1 block tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                            Identity
                        </label>
                        {/* Gradient Wrapper */}
                        <div className="relative p-[2px] rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 animate-border-flow transition-all duration-300 hover:scale-[1.01] focus-within:shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]">
                            {/* Inner Background */}
                            <div className="relative bg-[#020617] rounded-[10px] flex items-center h-full">
                                <div className="pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <Icons.User />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-transparent border-none text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-0 py-3.5 pl-3 pr-4 rounded-xl"
                                    placeholder="Enter Username"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Passkey Input (Animated Glow) */}
                    <div className="group space-y-1">
                        <label className="text-[10px] font-bold uppercase ml-1 block tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                            Passkey
                        </label>
                        {/* Gradient Wrapper */}
                        <div className="relative p-[2px] rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 animate-border-flow transition-all duration-300 hover:scale-[1.01] focus-within:shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]">
                            {/* Inner Background */}
                            <div className="relative bg-[#020617] rounded-[10px] flex items-center h-full">
                                <div className="pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <Icons.Lock />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent border-none text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-0 py-3.5 pl-3 pr-4 rounded-xl"
                                    placeholder="Enter Password"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 overflow-hidden"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-xs text-red-200 font-medium">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={!loading ? { scale: 1.02 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase text-white shadow-lg shadow-blue-900/20 transition-all relative overflow-hidden group ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 transition-transform duration-300 group-hover:scale-105"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

                        <div className="relative flex items-center justify-center gap-2">
                            {loading && <Icons.Spinner />}
                            <span>{loading ? 'Authenticating...' : (activeTab === 'login' ? 'Initialize Link' : 'Create Identity')}</span>
                        </div>
                    </motion.button>
                </form>

            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;