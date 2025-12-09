import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- ICONS ---
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
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
        setError('Credentials required for neural link.');
        return;
    }

    setLoading(true);
    setError('');

    // DYNAMICALLY CHOOSE ENDPOINT BASED ON TAB
    const endpoint = activeTab === 'login' ? '/login' : '/register';

    try {
      const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, {
          username: username,
          password: password
      });
      
      const successMessage = activeTab === 'register' ? 'Identity Created. Initializing...' : 'Access Granted.';
      
      // Delay for UX
      setTimeout(() => {
        onLogin({
          id: response.data.user_id,
          username: username,
          is_premium: response.data.is_premium
        });
      }, 1000);

    } catch (err) {
      console.error(err);
      if (err.response) {
          // Display specific error from backend (e.g., "Username already taken" or "Invalid credentials")
          setError(err.response.data.detail || 'Authentication Failed.');
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
        
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          
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
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Neural Interface Portal</p>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700/50">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === 'login' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === 'register' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              Register
            </button>
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
                    placeholder={activeTab === 'login' ? "Enter username" : "Create username"}
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
                    placeholder={activeTab === 'login' ? "••••••••" : "Create password"}
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
                    : activeTab === 'login' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-0.5'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-center gap-2 relative z-10">
                  {loading && <Spinner />}
                  <span>{loading ? 'Authenticating...' : (activeTab === 'login' ? 'Initialize System' : 'Create Identity')}</span>
                </div>
              </button>

            </form>
          </div>
          
          {/* Footer Status */}
          <div className="bg-slate-950/30 p-3 border-t border-slate-700/50 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase px-8">
            <span>System Status: <span className="text-green-500">Online</span></span>
            <span>Secure Connection</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;