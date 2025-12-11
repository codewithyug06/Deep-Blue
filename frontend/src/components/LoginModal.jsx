import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import LoginScene from '../three-scene/LoginScene';

// --- ICONS (SVG) ---
const Icons = {
  User: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Mail: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Key: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
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
  const [confirmPassword, setConfirmPassword] = useState(''); // New State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  
  // Registration States
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async (e) => {
      e.preventDefault();
      if (!email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
          setError('Fill all fields to request OTP.');
          return;
      }
      if (password !== confirmPassword) {
          setError('Passkeys do not match.');
          return;
      }
      if (password.length < 8) {
          setError('Passkey is too weak.');
          return;
      }

      setLoading(true);
      setError('');
      try {
          await axios.post('http://localhost:8000/send-otp', { email });
          setOtpSent(true);
      } catch (err) {
          setError(err.response?.data?.detail || 'Failed to send OTP.');
      } finally {
          setLoading(false);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- LOGIN FLOW ---
    if (activeTab === 'login') {
        if (!username.trim() || !password.trim()) {
            setError('Credentials Missing.');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/login', { username, password });
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
    } 
    // --- REGISTER FLOW ---
    else {
        if (!otpSent) {
            handleSendOTP(e);
            return;
        }
        if (!otp.trim()) {
            setError('Enter Verification Code.');
            return;
        }
        
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/register', { 
                username, 
                email, 
                password, 
                otp 
            });
            setTimeout(() => {
                onLogin({
                    id: response.data.user_id,
                    username: username,
                    is_premium: response.data.is_premium
                });
            }, 500);
        } catch (err) {
            setError(err.response?.data?.detail || 'Verification Failed.');
            setLoading(false);
        }
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
                            onClick={() => { setActiveTab(tab); setError(''); setOtpSent(false); }}
                            className={`flex-1 relative z-10 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Identity Input */}
                    <div className="group space-y-1">
                        <label className="text-[10px] font-bold uppercase ml-1 block tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                            Identity
                        </label>
                        <div className="relative bg-[#020617] rounded-[10px] flex items-center h-full border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                            <div className="pl-4 text-slate-500 group-focus-within:text-cyan-400"><Icons.User /></div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-transparent border-none text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-0 py-3.5 pl-3 pr-4 rounded-xl"
                                placeholder="Username"
                            />
                        </div>
                    </div>

                    {/* Email Input (Register Only) */}
                    {activeTab === 'register' && (
                        <div className="group space-y-1">
                            <label className="text-[10px] font-bold uppercase ml-1 block tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                                Neural Link (Email)
                            </label>
                            <div className="relative bg-[#020617] rounded-[10px] flex items-center h-full border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                                <div className="pl-4 text-slate-500 group-focus-within:text-cyan-400"><Icons.Mail /></div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-transparent border-none text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-0 py-3.5 pl-3 pr-4 rounded-xl"
                                    placeholder="operative@deepblue.net"
                                    disabled={otpSent}
                                />
                            </div>
                        </div>
                    )}

                    {/* PASSKEY SECTION */}
                    {activeTab === 'login' ? (
                        /* LOGIN: Single Password Field */
                        <div className="group space-y-1">
                            <label className="text-[10px] font-bold uppercase ml-1 block tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                                Passkey
                            </label>
                            <div className="relative bg-[#020617] rounded-[10px] flex items-center h-full border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                                <div className="pl-4 text-slate-500 group-focus-within:text-cyan-400"><Icons.Lock /></div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent border-none text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-0 py-3.5 pl-3 pr-4 rounded-xl"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    ) : (
                        /* REGISTER: Two Columns for Passwords */
                        <div className="space-y-1">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Create Password */}
                                <div className="group space-y-1">
                                    <label className="text-[10px] font-bold uppercase ml-1 block tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                                        Create Key
                                    </label>
                                    <div className="relative bg-[#020617] rounded-[10px] flex items-center h-full border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                                        <div className="pl-3 text-slate-500 group-focus-within:text-cyan-400 scale-75"><Icons.Lock /></div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-transparent border-none text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-0 py-3.5 pl-1 pr-2 rounded-xl"
                                            placeholder="••••••••"
                                            disabled={otpSent}
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="group space-y-1">
                                    <label className="text-[10px] font-bold uppercase ml-1 block tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                                        Confirm
                                    </label>
                                    <div className="relative bg-[#020617] rounded-[10px] flex items-center h-full border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                                        <div className="pl-3 text-slate-500 group-focus-within:text-cyan-400 scale-75"><Icons.Lock /></div>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-transparent border-none text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-0 py-3.5 pl-1 pr-2 rounded-xl"
                                            placeholder="••••••••"
                                            disabled={otpSent}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Strong Password Hint */}
                            <p className="text-[9px] text-cyan-500/60 font-mono tracking-wide text-center">
                                * SECURITY ADVISORY: Use 8+ chars, mixed case & symbols.
                            </p>
                        </div>
                    )}

                    {/* OTP Input (Register Only & Sent) */}
                    <AnimatePresence>
                        {activeTab === 'register' && otpSent && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                className="group space-y-1 overflow-hidden"
                            >
                                <label className="text-[10px] font-bold uppercase ml-1 block tracking-widest text-emerald-400">
                                    Verification Code
                                </label>
                                <div className="relative bg-[#020617] rounded-[10px] flex items-center h-full border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    <div className="pl-4 text-emerald-500"><Icons.Key /></div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-transparent border-none text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-0 py-3.5 pl-3 pr-4 rounded-xl tracking-widest"
                                        placeholder="000000"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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

                    {/* Action Button */}
                    <div className="pt-2">
                        {activeTab === 'register' && !otpSent ? (
                            <motion.button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={loading}
                                className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase text-white bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Icons.Spinner /> : <span>Send Verification Code</span>}
                            </motion.button>
                        ) : (
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={!loading ? { scale: 1.02 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                                className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase text-white shadow-lg shadow-blue-900/20 transition-all relative overflow-hidden group ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 transition-transform duration-300 group-hover:scale-105"></div>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                <div className="relative flex items-center justify-center gap-2">
                                    {loading && <Icons.Spinner />}
                                    <span>
                                        {loading ? 'Processing...' : (activeTab === 'login' ? 'Initialize Link' : 'Verify & Create Identity')}
                                    </span>
                                </div>
                            </motion.button>
                        )}
                    </div>
                </form>

            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;