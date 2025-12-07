// frontend/src/components/LoginModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- ICONS (Inline for zero-dependency) ---
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const LoginModal = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'register' for UI state

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
        setError('Credentials required for neural link.');
        return;
    }

    setLoading(true);
    setError('');

    try {
      // Backend handles both Login and Registration in one endpoint logic
      // We preserve this functionality exactly as requested.
      const response = await axios.post(`http://127.0.0.1:8000/register`, {
          username: username,
          password: password
      });
      
      // Artificial delay for smooth UX transition
      setTimeout(() => {
        onLogin({
          id: response.data.user_id,
          username: username,
          is_premium: response.data.is_premium
        });
      }, 800);

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
          setError('Authentication Failed: Invalid Credentials.');
      } else {
          setError('Connection Error: Server Unreachable.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden font-sans text-white">
      
      {/* --- ANIMATED BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1e] to-black"></div>
        {/* Floating Orbs */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"
        />
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* --- MAIN CARD --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-1"
      >
        {/* Glowing Border Container */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl blur opacity-20 animate-pulse"></div>
        
        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header Section */}
          <div className="p-8 pb-6 text-center border-b border-slate-700/50">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-200">DEEP BLUE</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium">Secure Neural Interface</p>
            </motion.div>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Callsign</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-inner"
                    placeholder="Enter username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <p className="text-red-300 text-xs font-semibold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className={`relative w-full py-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 overflow-hidden group ${
                  loading 
                    ? 'bg-slate-800 cursor-not-allowed text-slate-400' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-center gap-2 relative z-10">
                  {loading && <Spinner />}
                  <span>{loading ? 'Authenticating...' : (mode === 'login' ? 'Initialize System' : 'Create Identity')}</span>
                </div>
                {/* Button Shine Effect */}
                {!loading && <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>}
              </button>

              {/* Mode Toggle (Visual Only as backend handles both) */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  {mode === 'login' ? "New to the protocol? " : "Already verified? "}
                  <button 
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline decoration-blue-500/30 hover:decoration-blue-400"
                  >
                    {mode === 'login' ? "Register Identity" : "Login Here"}
                  </button>
                </p>
              </div>

            </form>
          </div>
          
          {/* Footer Status */}
          <div className="bg-slate-950/30 p-3 border-t border-slate-700/50 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase px-8">
            <span>System Status: <span className="text-green-500">Online</span></span>
            <span>v2.4.0</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;