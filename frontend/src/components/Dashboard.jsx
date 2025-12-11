import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import CodeVisualizer from '../three-scene/CodeVisualizer.jsx';
import { motion, AnimatePresence } from 'framer-motion';

// --- ICONS ---
const Icons = {
  Run: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
  Analyze: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  Back: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Terminal: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Brain: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Send: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Save: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  Mic: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  Users: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Ghost: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 18A8 8 0 0012 2a8 8 0 00-8 8v8a8 8 0 0016 0h-4zm-4-4v-4a4 4 0 00-8 0v4h8z" /></svg>,
  Sword: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Refresh: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Copy: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Fire: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.847-.267c-.125.27-.091.606.017.967.191.638.563 1.241.986 1.726a5.547 5.547 0 00-2.222 3.074c-.007.028-.01.056-.013.085L4.092 12.7c-.23.15-.31.423-.19.663.593 1.186 1.702 2.307 3.328 3.365.942.615 1.996 1.056 3.09 1.258.913.169 1.777.05 2.55-.262a5.526 5.526 0 002.397-2.029c.74-1.24.97-2.61.682-3.856l-.015-.064a6.76 6.76 0 00-.637-1.842c-.22-.43-.48-.826-.77-1.175.302.26.621.492.95.688.35.21.755.228 1.059.083.333-.16.517-.553.43-1.01a6.67 6.67 0 00-.818-2.383 6.958 6.958 0 00-1.575-2.09c-.432-.423-.925-.79-1.418-1.123-.39-.264-.766-.5-1.113-.687zM8.03 15.65c.67.436 1.41.722 2.164.862.61.113 1.183.044 1.68-.16a3.525 3.525 0 001.53-1.296c.472-.792.618-1.666.434-2.46a4.773 4.773 0 00-.45-1.303c-.232-.45-.53-.865-.892-1.229a4.962 4.962 0 00-1.124-1.49c-.308-.302-.66-.563-1.013-.8.21.743.332 1.55.334 2.41 0 .276-.224.5-.5.5-.276 0-.5-.224-.5-.5a6.612 6.612 0 00-.172-1.517c-.365.26-.705.54-.997.834a4.57 4.57 0 00-1.077 1.79c-.235 1.013.065 2.213 1.082 3.86z" clipRule="evenodd" /></svg>
};

const highlightCode = (code) => {
  if (!code) return "";
  const escape = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const tokenRegex = /(#.*)|(["'](?:(?=(\\?))\3.)*?\2)|(\b\d+\b)|(\b(?:def|class|return|if|else|elif|while|for|in|pass|import|from|try|except|break|continue|and|or|not|is|None|True|False)\b)|(\b(?:print|len|range|sum|max|min|list|dict|str|int|float|bool|abs|round)\b)|([\s\S])/g;
  return code.replace(tokenRegex, (match, comment, string, number, keyword, builtin, other) => {
      if (comment) return `<span style="color: #64748b; font-style: italic;">${escape(comment)}</span>`;
      if (string) return `<span style="color: #34d399;">${escape(string)}</span>`;
      if (number) return `<span style="color: #fbbf24;">${number}</span>`;
      if (keyword) return `<span style="color: #c084fc; font-weight: bold;">${escape(keyword)}</span>`;
      if (builtin) return `<span style="color: #60a5fa;">${escape(builtin)}</span>`;
      return escape(match);
  });
};

const ChatInterface = ({ messages, onSend, loading, onMicClick }) => {
    const [input, setInput] = useState("");
    const scrollRef = useRef(null);

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if(!input.trim()) return;
        onSend(input);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f1e]/40 backdrop-blur-md">
            <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-500/20 text-blue-400"><Icons.Brain /></div>
                    <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Socratic Core</span>
                </div>
                <div className="flex gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`}></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
                {messages.length === 0 && (
                    <div className="text-center mt-10 opacity-40">
                        <div className="text-3xl mb-2 grayscale">太</div>
                        <p className="text-[10px] uppercase tracking-widest">Neural Link Offline</p>
                        <p className="p-xs">"Analyze" code to initiate handshake.</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-5 shadow-lg ${
                            msg.role === 'user' 
                            ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-br-sm' 
                            : msg.role === 'ai_mediator'
                            ? 'bg-purple-600/20 border border-purple-500/30 text-purple-200 rounded-bl-sm italic border-l-4'
                            : 'bg-[#1e293b]/80 border border-white/10 text-slate-300 rounded-bl-sm'
                        }`}>
                            {msg.role === 'ai_mediator' && <span className="block text-[9px] text-purple-400 font-bold uppercase tracking-widest mb-1">AI Mediator</span>}
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className="mb-1 last:mb-0">{line}</p>
                            ))}
                        </div>
                    </motion.div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-black/20 flex gap-2">
                <button
                    type="button"
                    onClick={() => {
                        const rec = onMicClick(); 
                        if(rec) {
                            rec.onresult = (e) => setInput(e.results[0][0].transcript);
                        }
                    }}
                    className="text-slate-400 hover:text-cyan-400 transition-colors p-2"
                >
                    <Icons.Mic />
                </button>

                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Query the system..."
                    className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    <Icons.Send />
                </button>
            </form>
        </div>
    );
};

const HeatmapOverlay = ({ code, stats, onClose }) => {
    const lines = code.split('\n');
    const maxScore = Math.max(...Object.values(stats).map(s => (s.edits * 2) + s.dwell), 1); // Avoid div by zero

    return (
        <div className="absolute inset-0 bg-[#020617] z-50 flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0a0f1e]">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-orange-500/20 text-orange-400"><Icons.Fire /></div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cognitive Load Heatmap</h3>
                        <p className="text-[10px] text-slate-400">Visualizing neural friction patterns</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-slate-500">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50"></div> Flow</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/50"></div> Focus</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50"></div> Struggle</div>
                    <button onClick={onClose} className="ml-4 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors">Close</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-6">
                <div className="relative">
                    {lines.map((line, i) => {
                        const lineStat = stats[i + 1] || { dwell: 0, edits: 0 };
                        const score = (lineStat.edits * 2) + lineStat.dwell;
                        const intensity = Math.min(score / maxScore, 1);
                        
                        // Color interpolation: Green -> Yellow -> Red
                        let bgColor = 'transparent';
                        if (intensity > 0.05) {
                            if (intensity < 0.5) {
                                // Green to Yellow
                                const r = Math.floor(255 * (intensity * 2));
                                const g = 255;
                                bgColor = `rgba(${r}, ${g}, 0, 0.2)`;
                            } else {
                                // Yellow to Red
                                const r = 255;
                                const g = Math.floor(255 * (2 - intensity * 2));
                                bgColor = `rgba(${r}, ${g}, 0, 0.3)`;
                            }
                        }

                        return (
                            <div key={i} className="relative flex">
                                <div className="w-12 text-right pr-4 text-slate-600 select-none opacity-50">{i + 1}</div>
                                <div className="flex-1 pl-4 relative">
                                    <div 
                                        className="absolute inset-0 pointer-events-none transition-colors duration-500 rounded-sm"
                                        style={{ backgroundColor: bgColor }}
                                    ></div>
                                    <span className="relative z-10 text-slate-300 whitespace-pre">{line}</span>
                                    {lineStat.edits > 0 && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-40">
                                            {Array.from({ length: Math.min(lineStat.edits, 5) }).map((_, idx) => (
                                                <div key={idx} className="w-1 h-1 rounded-full bg-red-500"></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- SOCRATIC BATTLE LOCK SCREEN ---
const SocraticLockOverlay = ({ question, onUnlock, locked }) => {
    const [answer, setAnswer] = useState("");
    const [shake, setShake] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        onUnlock(answer, (success, msg) => {
            if (!success) {
                setShake(true);
                setErrorMsg(msg || "Incorrect. Logic mismatch.");
                setTimeout(() => setShake(false), 500);
            }
        });
    };

    if (!locked) return null;

    return (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
                // MERGED ANIMATE PROP TO FIX DUPLICATE KEY ERROR
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    x: shake ? [-10, 10, -10, 10, 0] : 0 
                }}
                className="w-full max-w-md bg-[#0a0f1e] border border-red-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse"></div>
                <div className="mb-6">
                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-4">
                        <Icons.Lock />
                    </div>
                    <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2">SYSTEM LOCKED</h2>
                    <p className="text-xs text-red-300/80 font-mono">Socratic verification required to proceed.</p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6 text-sm text-slate-200 font-mono leading-relaxed">
                    {question || "Initialize sequence..."}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Enter logical key..."
                        className="w-full bg-black/50 border border-red-500/30 rounded-lg py-3 px-4 text-center text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                        autoFocus
                    />
                    {errorMsg && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide">{errorMsg}</p>}
                    
                    <button 
                        type="submit" 
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs rounded-lg transition-all shadow-lg shadow-red-900/40"
                    >
                        Override Lock
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

const Dashboard = ({ user, initialCode, missionId, missionDesc, onBack, onUpgrade }) => {
  // --- VFS & EDITOR STATE ---
  const [files, setFiles] = useState({ 
      'main.py': initialCode || `def solve():\n    # Write your solution here\n    pass` 
  });
  const [activeFile, setActiveFile] = useState('main.py');
  const code = files[activeFile];
  
  // --- HEATMAP STATE ---
  const [cognitiveStats, setCognitiveStats] = useState({}); // { lineNo: { dwell: 0, edits: 0 } }
  const [showHeatmap, setShowHeatmap] = useState(false);
  const trackingRef = useRef({ lastLine: 1, lastTime: Date.now() });

  // --- CORE STATE ---
  const [visualData, setVisualData] = useState(null);
  const [opponentVisualData, setOpponentVisualData] = useState(null); 
  const [executionTrace, setExecutionTrace] = useState([]); 
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal"); 
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [chatMessages, setChatMessages] = useState([]);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [glitch, setGlitch] = useState(false);
  const [systemOverload, setSystemOverload] = useState(false); 
  
  // --- MULTIPLAYER & BATTLE STATE ---
  const [gameMode, setGameMode] = useState('solo'); 
  const [crewRole, setCrewRole] = useState(null); 
  const [sessionKey, setSessionKey] = useState('');
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  
  // New Duel States
  const [isDuelLocked, setIsDuelLocked] = useState(false);
  const [duelQuestion, setDuelQuestion] = useState("");
  const [pendingUnlockCallback, setPendingUnlockCallback] = useState(null);

  const [ghostRecording, setGhostRecording] = useState(null); 
  const [showGhostButton, setShowGhostButton] = useState(false);
  
  const [pyodide, setPyodide] = useState(null);
  const [missionData, setMissionData] = useState(null);
  const [ws, setWs] = useState(null);

  const isPremium = user?.is_premium || false;
  
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const messagesEndRef = useRef(null); 

  // --- VOICE FUNCTIONS ---
  const speak = (text) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const techVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha')) || voices[0];
        utterance.voice = techVoice;
        utterance.pitch = 0.9;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.start();
        return recognition;
    }
    return null;
  };

  // --- COGNITIVE TRACKING LOGIC ---
  const updateDwellTime = (currentLine) => {
      const now = Date.now();
      const duration = (now - trackingRef.current.lastTime) / 1000;
      const prevLine = trackingRef.current.lastLine;

      if (duration > 0.5) { // Filter micro-movements
          setCognitiveStats(prev => {
              const lineStats = prev[prevLine] || { dwell: 0, edits: 0 };
              return {
                  ...prev,
                  [prevLine]: { ...lineStats, dwell: lineStats.dwell + duration }
              };
          });
      }
      trackingRef.current = { lastLine: currentLine, lastTime: now };
  };

  const trackInputActivity = (e) => {
      const { selectionStart, value } = e.target;
      const currentLine = value.substr(0, selectionStart).split("\n").length;
      
      if (currentLine !== trackingRef.current.lastLine) {
          updateDwellTime(currentLine);
      }
  };

  // --- HELPER FUNCTIONS FOR MULTIPLAYER UI ---
  const generateSessionKey = () => {
      const key = Math.random().toString(36).substring(2, 8).toUpperCase();
      setSessionKey(key);
  };

  const copyToClipboard = () => {
      if (sessionKey) {
          navigator.clipboard.writeText(sessionKey);
          // Optional toast could go here
      }
  };

  // --- INITIALIZE PYODIDE, WS, AND LOAD GHOST ---
  useEffect(() => {
    const loadPyodideEngine = async () => {
      try {
        if (window.loadPyodide) {
          const py = await window.loadPyodide();
          setPyodide(py);
          await py.loadPackage("micropip");
          console.log(">> Pyodide Engine Ready for VFS/DB.");
        }
      } catch (err) {
        setOutput(">> Error loading local Python engine: " + err.message);
      }
    };
    loadPyodideEngine();

    const initMission = async () => {
        if(missionId) {
            try {
                const res = await axios.get('http://127.0.0.1:8000/missions?is_premium=true');
                const found = res.data.find(m => m.id === missionId);
                setMissionData(found);

                const starterCode = found?.starter_code;
                let initialFiles = {};
                const mainFile = found?.meta?.main_file || 'main.py';

                if (typeof starterCode === 'object' && starterCode !== null) {
                    initialFiles = starterCode;
                    setFiles(initialFiles);
                    setActiveFile(mainFile);
                } else {
                    initialFiles = {[mainFile]: starterCode || `def solve():\n    # Write your solution here\n    pass`};
                    setFiles(initialFiles);
                    setActiveFile(mainFile);
                }
                
                if (user?.id) {
                    const progressRes = await axios.get(`http://127.0.0.1:8000/get-progress?user_id=${user.id}&mission_id=${missionId}`);
                    if (progressRes.data && progressRes.data.code) {
                        setFiles(prev => ({ ...prev, [mainFile]: progressRes.data.code }));
                        setOutput(">> Saved progress loaded successfully.\n");
                    }
                    const ghost = localStorage.getItem(`ghost_${user.id}_${missionId}`);
                    if (ghost) {
                        setGhostRecording(JSON.parse(ghost));
                        setShowGhostButton(true);
                        setOutput(prev => prev + ">> Ghost trace data loaded.\n");
                    }
                }
            } catch (e) {
                console.error("Failed to load mission data", e);
            }
        }
    };
    initMission();

    const socket = new WebSocket('ws://127.0.0.1:8000/ws/chat');
    socket.onopen = () => console.log(">> Neural Link Established (WebSocket)");
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // --- MULTIPLAYER HANDLERS ---
        if (data.type === "code_update") {
            if (crewRole === 'navigator') {
                setFiles(prev => ({ ...prev, [activeFile]: data.code })); 
            }
        } else if (data.type === "terminal_update") {
            if (crewRole === 'navigator') {
                setOutput(prev => prev + data.output);
            }
        } else if (data.type === "duel_start") {
            setGameMode('duel');
            setIsMatchmaking(false);
            setSessionKey(data.duel_id);
            setOutput("\n>> DUEL PROTOCOL INITIATED. OPPONENT FOUND.\n");
        } else if (data.type === "opponent_visual") {
            setOpponentVisualData(data.data);
        } else if (data.type === "duel_end") {
            if (data.result === 'lose') {
                setSystemOverload(true);
                setOutput("\n>> SYSTEM OVERLOAD: OPPONENT VICTORY DETECTED.\n");
                setTimeout(() => setSystemOverload(false), 3000);
            } else if (data.result === 'win') {
                setOutput("\n>> VICTORY: OPPONENT SYSTEM COMPROMISED.\n");
            }
        } else if (data.type === "duel_challenge") {
            // SOCRATIC BATTLE: LOCK SCREEN
            setIsDuelLocked(true);
            setDuelQuestion(data.question);
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        } else if (data.type === "duel_unlock") {
            setIsDuelLocked(false);
            // Notify pending callback if exists
            if (pendingUnlockCallback) pendingUnlockCallback(true);
            setPendingUnlockCallback(null);
        } else if (data.type === "duel_lock_fail") {
            if (pendingUnlockCallback) pendingUnlockCallback(false, data.msg);
        } else if (data.role) {
            setLoading(false);
            setChatMessages(prev => [...prev, { role: data.role, text: data.text }]);
            if (data.role === 'ai') speak(data.text); 
        }
    };
    socket.onclose = () => console.log(">> Neural Link Disconnected");
    setWs(socket);

    return () => socket.close();
  }, [missionId, crewRole, activeFile, user?.id]);

  // Handler for Socratic Challenge Answer
  const handleUnlockAttempt = (answer, callback) => {
      setPendingUnlockCallback(() => callback); // Store ref to callback
      if(ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
              type: "duel_unlock_attempt",
              answer: answer,
              expected: missionData?.solution_keywords?.[0] || "secret" // Passing partial validation key logic
          }));
      }
  };

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleSave = async (isCompleted = false) => {
      if (!user || !missionId) return;
      try {
          const mainFile = missionData?.meta?.main_file || 'main.py';
          await axios.post('http://localhost:8000/save-progress', {
              user_id: user.id,
              mission_id: missionId,
              code: files[mainFile], 
              is_completed: isCompleted 
          });
          
          if (!isCompleted) {
              setOutput(prev => prev + "\n>> System: Draft saved. You can resume later. 沈");
          } else {
              const newGhost = executionTrace.map(lineNo => ({ timestamp: Date.now(), line: lineNo }));
              localStorage.setItem(`ghost_${user.id}_${missionId}`, JSON.stringify(newGhost));
              setGhostRecording(newGhost);
              setShowGhostButton(true);
              
              setOutput(prev => prev + "\n>> System: Mission Completed & Status Updated! 醇");
              
              // --- TRIGGER HEATMAP ON SUCCESS ---
              updateDwellTime(trackingRef.current.lastLine); // Flush last timer
              setTimeout(() => setShowHeatmap(true), 1500);

              await axios.post('http://localhost:8000/submit-score', {
                  user_id: user.id,
                  mission_id: missionId,
                  execution_time: 0.05, 
                  memory_usage: 12.5
              });
          }
      } catch (error) {
          console.error(error);
          setOutput(prev => prev + "\n>> Error: Save Failed.");
      }
  };

  const handleRuntimeError = async (errorMsg) => {
      setGlitch(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      setTimeout(() => setGlitch(false), 800);

      if ('AudioContext' in window) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(50, audioContext.currentTime); 
          const gainNode = audioContext.createGain();
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
      }

      try {
          const res = await axios.post('http://localhost:8000/explain-error', {
              code: code,
              error_trace: errorMsg
          });
          const { line, explanation } = res.data;
          
          if (line > 0) setHighlightedLine(line);
          setChatMessages(prev => [...prev, { role: 'ai', text: explanation }]);
          speak(explanation); 
      } catch (e) {
          console.error("Error analysis failed", e);
      }
  };

  // --- MODIFIED handleRun to support VFS, DB, and Multiplayer Modes ---
  const handleRun = async () => {
      if (isDuelLocked) return; // Prevent run if locked
      if (!pyodide) {
          setOutput(">> Engine initializing... please wait.");
          return;
      }
      setLoading(true);
      if (crewRole !== 'pilot') setOutput(">> Executing locally in browser environment...\n");
      setTestResults(null);
      setExecutionTrace([]);
      setHighlightedLine(null); 
      setActiveTab("terminal");

      try {
          // 1. VFS Write
          await pyodide.runPythonAsync("import os\nfor f in os.listdir('.'):\n  if f.endswith('.py') or f.endswith('.json'):\n    try: os.remove(f)\n    except: pass\n"); 
          for (const fileName of Object.keys(files)) {
             pyodide.FS.writeFile(fileName, files[fileName], { encoding: 'utf8' });
          }
          
          // 2. DB Setup
          let dbTeardownCode = "";
          if (missionData?.meta?.needs_db) {
              const dbSetupCode = `
import sqlite3
db = sqlite3.connect(':memory:')
cursor = db.cursor()
cursor.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)")
cursor.execute("INSERT INTO users VALUES (1, 'neo'), (2, 'trinity')")
db.commit()
              `;
              await pyodide.runPythonAsync(dbSetupCode);
              dbTeardownCode = "\ndb.close()\n"; 
          }

          pyodide.runPython(`
            import sys
            import io
            sys.stdout = io.StringIO()
          `);

          const mainFile = missionData?.meta?.main_file || 'main.py';
          const codeToExecute = files[mainFile];
          
          const wrappedCode = `
import sys
__trace_data__ = []

def __trace_func__(frame, event, arg):
    if event == 'line' and frame.f_code.co_filename == '${mainFile}':
        __trace_data__.append(frame.f_lineno)
    return __trace_func__

sys.settrace(__trace_func__)

try:
    exec(compile(open('${mainFile}', 'r').read(), '${mainFile}', 'exec'), globals())
except Exception:
    raise
finally:
    sys.settrace(None)
    ${dbTeardownCode} 
`;
          await pyodide.loadPackagesFromImports(codeToExecute);
          await pyodide.runPythonAsync(wrappedCode);
          
          const traceProxy = pyodide.globals.get('__trace_data__');
          const traceList = traceProxy.toJs();
          traceProxy.destroy();
          setExecutionTrace(traceList); 

          const stdout = pyodide.runPython("sys.stdout.getvalue()");
          
          // --- BRIDGE CREW LOGIC ---
          if (gameMode === 'bridge' && crewRole === 'pilot') {
              // Pilot sends output blindly
              ws.send(JSON.stringify({
                  type: "bridge_output",
                  session_id: sessionKey,
                  output: stdout + "\n>> Execution Complete by Pilot."
              }));
              setOutput(">> Commands transmitted to Navigator. Awaiting instructions.");
          } else {
              setOutput(prev => prev + stdout + "\n>> Execution Complete.");
          }

          if (missionData && missionData.test_cases) {
              const results = [];
              const functionName = extractFunctionName(codeToExecute);
              
              for (let i = 0; i < missionData.test_cases.length; i++) {
                  const tc = missionData.test_cases[i];
                  let testCode = `
import json
passed = False
output = "Test failed"
`;
                  let argsStr = `*json.loads('${JSON.stringify(tc.input)}')`;

                  if (missionData.meta?.needs_db) {
                      const testDbSetupCode = `
import sqlite3
db_conn = sqlite3.connect(':memory:')
cursor = db_conn.cursor()
cursor.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)")
cursor.execute("INSERT INTO users VALUES (1, 'neo'), (2, 'trinity')")
db_conn.commit()
db_conn
`;
                        const dbConn = await pyodide.runPythonAsync(testDbSetupCode);
                        pyodide.globals.set('test_db_conn', dbConn);
                        testCode = `
import json
result = ${functionName}(test_db_conn)
expected = json.loads('${JSON.stringify(tc.expected)}')
passed = result == expected
output = str(result)
test_db_conn.close()
`;
                        dbConn.close(); 
                  }
                  
                  try {
                    await pyodide.runPythonAsync(testCode); 
                    const passed = pyodide.globals.get('passed');
                    const actual = pyodide.globals.get('output');
                    results.push({
                        id: i + 1,
                        input: missionData.meta?.needs_db ? 'In-Memory DB' : JSON.stringify(tc.input),
                        expected: JSON.stringify(tc.expected),
                        actual: actual,
                        passed: passed
                    });
                  } catch (err) {
                      results.push({ id: i + 1, passed: false, actual: `Runtime Error: ${err.message}` });
                  }
              }
              setTestResults(results);
              if(results.length > 0) setActiveTab("tests");

              const allPassed = results.length > 0 && results.every(r => r.passed);
              if (allPassed) {
                  // --- DUEL WIN LOGIC ---
                  if (gameMode === 'duel') {
                      ws.send(JSON.stringify({ type: "duel_win", session_id: sessionKey }));
                      setOutput(prev => prev + "\n>> VICTORY: OPPONENT SYSTEM OVERLOADED.\n");
                  }
                  
                  if ('AudioContext' in window) {
                      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                      const oscillator = audioContext.createOscillator();
                      oscillator.type = 'triangle';
                      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                      const gainNode = audioContext.createGain();
                      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                      oscillator.connect(gainNode);
                      gainNode.connect(audioContext.destination);
                      oscillator.start();
                      oscillator.stop(audioContext.currentTime + 0.2);
                  }
                  
                  setOutput(prev => prev + "\n\n>> 笨ｨ ALL SYSTEMS NOMINAL 笨ｨ\n>> Mission Completed. Auto-saving status...");
                  await handleSave(true);
              } else {
                  setGlitch(true);
                  if (navigator.vibrate) navigator.vibrate(200); 
                  setTimeout(() => setGlitch(false), 500);
                  await handleRuntimeError("Test cases failed.");
              }
          }

      } catch (error) {
          const errMsg = error.message;
          setOutput(prev => prev + `>> Runtime Error:\n${errMsg}`);
          await handleRuntimeError(errMsg);
      }
      setLoading(false);
  };

  const extractFunctionName = (codeStr) => {
      const match = codeStr.match(/def\s+(\w+)\s*\(/);
      return match ? match[1] : 'solve';
  };

  const handleAnalyze = async () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        setOutput(">> Error: Neural Link not active.");
        return;
    }
    setLoading(true);
    setVisualData(null);
    setChatMessages(prev => [...prev, { role: 'user', text: "Start Socratic Analysis Protocol..." }]);
    
    try {
        const response = await axios.post('http://127.0.0.1:8000/analyze', {
            code: code, is_premium: isPremium 
        });
        setVisualData(response.data.visual_data);
        
        // --- DUEL: SEND VISUALS TO OPPONENT ---
        if (gameMode === 'duel') {
            ws.send(JSON.stringify({
                type: "duel_visual_update",
                session_id: sessionKey,
                data: response.data.visual_data
            }));
        }
        
        if (response.data.vibration_pattern && navigator.vibrate) {
            navigator.vibrate(response.data.vibration_pattern);
        }

    } catch (e) {
        console.error("Visuals failed");
    }

    ws.send(JSON.stringify({
        message: `MISSION OBJECTIVE: ${missionDesc}\n\nAnalyze this logic`,
        code: code,
        session_id: user.username,
        type: "chat"
    }));
  };

  const handleChatSend = (text) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
          setChatMessages(prev => [...prev, { role: 'user', text }]);
          setLoading(true);
          ws.send(JSON.stringify({
              message: text,
              code: code, 
              session_id: user.username,
              type: "chat"
          }));
      }
  };

  const startMatchmaking = () => {
      setIsMatchmaking(true);
      if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "find_match" }));
      }
  };

  const handleJoinCrew = (role) => {
      if (!sessionKey) return;
      // setCrewMode(true); // Removed as it was undefined in original
      setGameMode('bridge');
      setCrewRole(role);
      if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
              type: "join",
              session_id: sessionKey
          }));
      }
  };

  const handleCodeChange = (newCode) => {
      if (crewRole === 'navigator') return;
      if (isDuelLocked) return; // Prevent edits if locked
      
      setFiles(prev => ({ ...prev, [activeFile]: newCode }));
      
      if (gameMode === 'bridge' && crewRole === 'pilot' && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
              type: "code_sync",
              session_id: sessionKey,
              code: newCode
          }));
      }
  };

  const startResizing = (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;
      const onMove = (e) => setSidebarWidth(Math.max(250, Math.min(800, startWidth - (e.clientX - startX))));
      const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
  };

  const handleKeyDown = (e) => {
    if (crewRole === 'navigator') return;
    if (isDuelLocked) { e.preventDefault(); return; } // Key lock

    const { selectionStart, selectionEnd, value } = e.target;
    
    // --- COGNITIVE TRACKING: BACKSPACES ---
    if (e.key === 'Backspace') {
        const currentLine = value.substr(0, selectionStart).split("\n").length;
        setCognitiveStats(prev => {
            const lineStats = prev[currentLine] || { dwell: 0, edits: 0 };
            return { ...prev, [currentLine]: { ...lineStats, edits: lineStats.edits + 1 } };
        });
    }

    const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    const closingChars = Object.values(pairs);

    if (e.key === 'Tab') {
      e.preventDefault();
      const newText = value.substring(0, selectionStart) + "    " + value.substring(selectionEnd);
      handleCodeChange(newText);
      setTimeout(() => { if(e.target) e.target.selectionStart = e.target.selectionEnd = selectionStart + 4; }, 0);
      return;
    }

    if (selectionStart === selectionEnd && closingChars.includes(e.key) && value[selectionStart] === e.key) {
        e.preventDefault();
        setTimeout(() => { if(e.target) e.target.selectionStart = e.target.selectionEnd = selectionStart + 1; }, 0);
        return;
    }

    if (pairs[e.key]) {
      e.preventDefault();
      const closing = pairs[e.key];
      const selectedText = value.substring(selectionStart, selectionEnd);
      const newText = value.substring(0, selectionStart) + e.key + selectedText + closing + value.substring(selectionEnd);
      handleCodeChange(newText);
      setTimeout(() => {
        if(e.target) {
            if (selectionStart !== selectionEnd) {
                e.target.selectionStart = selectionStart + 1;
                e.target.selectionEnd = selectionEnd + 1;
            } else {
                e.target.selectionStart = e.target.selectionEnd = selectionStart + 1;
            }
        }
      }, 0);
      return;
    }

    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
        const charBefore = value[selectionStart - 1];
        const charAfter = value[selectionStart];
        if (pairs[charBefore] === charAfter) {
            e.preventDefault();
            const newText = value.substring(0, selectionStart - 1) + value.substring(selectionEnd + 1);
            handleCodeChange(newText);
            setTimeout(() => { if(e.target) e.target.selectionStart = e.target.selectionEnd = selectionStart - 1; }, 0);
            return;
        }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const textBeforeCursor = value.substring(0, selectionStart);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      const match = currentLine.match(/^(\s*)/);
      let indent = match ? match[1] : '';
      if (currentLine.trimEnd().endsWith(':') || currentLine.trimEnd().endsWith('{') || currentLine.trimEnd().endsWith('[')) {
        indent += "    ";
      }
      const newText = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
      handleCodeChange(newText);
      setTimeout(() => { if(e.target) e.target.selectionStart = e.target.selectionEnd = selectionStart + 1 + indent.length; }, 0);
      return;
    }
  };

  return (
    <div className={`flex h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden ${systemOverload ? 'animate-pulse bg-red-900/20' : ''}`}>
      
      {/* SOCRATIC BATTLE OVERLAY */}
      <SocraticLockOverlay 
          locked={isDuelLocked} 
          question={duelQuestion} 
          onUnlock={handleUnlockAttempt} 
      />

      {/* SYSTEM OVERLOAD OVERLAY */}
      <AnimatePresence>
        {systemOverload && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-red-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            >
                <div className="text-center">
                    <h1 className="text-6xl font-black text-red-500 tracking-tighter drop-shadow-lg mb-2">SYSTEM OVERLOAD</h1>
                    <p className="text-xl font-mono text-red-300">OPPONENT BREACH SUCCESSFUL</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT: EDITOR & TERMINAL */}
      <div className="flex flex-1 flex-col min-w-0 bg-[#0a0f1e]/40 backdrop-blur-sm relative border-r border-white/5">
            {/* HEATMAP OVERLAY */}
            {showHeatmap && (
                <HeatmapOverlay 
                    code={code} 
                    stats={cognitiveStats} 
                    onClose={() => setShowHeatmap(false)} 
                />
            )}

            <div className="relative z-50 min-h-[4.5rem] px-6 py-4 border-b border-white/5 flex justify-between items-start shrink-0 bg-[#0a0f1e]/90 shadow-xl">
                <div className="flex flex-col gap-2 min-w-0">
                    <button 
                        onClick={onBack} 
                        className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest group w-fit hover:bg-white/5 px-2 py-1 rounded-lg"
                    >
                        <div className="p-1.5 rounded bg-white/5 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                            <Icons.Back />
                        </div>
                        <span>Abort Mission</span>
                    </button>
                    <div className="bg-slate-900/50 border border-white/5 rounded-lg p-3 mt-1 max-h-24 overflow-y-auto custom-scrollbar">
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">{missionDesc}</p>
                    </div>
                </div>
                
                {/* IMPROVED MULTIPLAYER CONTROL PANEL */}
                <div className="flex flex-col items-end gap-2">
                    {gameMode === 'solo' ? (
                        <div className="flex items-center gap-3 bg-[#0f172a]/80 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-xl">
                            {/* DUEL MODE BUTTON */}
                            <button 
                                onClick={startMatchmaking} 
                                className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20 ${isMatchmaking ? 'animate-pulse' : ''}`}
                            >
                                <Icons.Sword /> {isMatchmaking ? 'Scanning...' : 'Code Duel'}
                            </button>
                            
                            {/* DIVIDER */}
                            <div className="h-5 w-[1px] bg-white/10"></div>

                            {/* CO-OP BRIDGE CONTROLS */}
                            <div className="flex items-center gap-2 group">
                                <div className="relative flex items-center">
                                    <input 
                                        type="text" 
                                        placeholder="Crew Key" 
                                        value={sessionKey} 
                                        onChange={(e) => setSessionKey(e.target.value)}
                                        className="bg-black/30 border border-white/10 rounded-lg text-xs text-white w-28 py-1.5 pl-2 pr-8 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono tracking-wide transition-all"
                                    />
                                    {/* Generate Key Button inside Input */}
                                    <button 
                                        onClick={generateSessionKey}
                                        className="absolute right-1 p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                                        title="Generate Unique Key"
                                    >
                                        <Icons.Refresh />
                                    </button>
                                </div>

                                {/* Copy Button (Visible if key exists) */}
                                {sessionKey && (
                                    <button 
                                        onClick={copyToClipboard}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5"
                                        title="Copy to Clipboard"
                                    >
                                        <Icons.Copy />
                                    </button>
                                )}

                                {/* Join Roles */}
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => handleJoinCrew('pilot')} 
                                        className="text-[10px] font-bold uppercase px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-600 hover:text-white transition-all tracking-wider"
                                        title="Join as Pilot (Write Code)"
                                    >
                                        Pilot
                                    </button>
                                    <button 
                                        onClick={() => handleJoinCrew('navigator')} 
                                        className="text-[10px] font-bold uppercase px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-600 hover:text-white transition-all tracking-wider"
                                        title="Join as Navigator (Read Output)"
                                    >
                                        Nav
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 px-4 py-2 bg-cyan-950/30 border border-cyan-500/30 rounded-xl shadow-lg shadow-cyan-900/10 backdrop-blur-md">
                            <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute opacity-75"></div>
                                <div className="w-2 h-2 rounded-full bg-cyan-500 relative"></div>
                            </div>
                            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-[0.15em] glow-text">
                                {gameMode === 'duel' ? 'DUEL IN PROGRESS' : `BRIDGE LINK: ${crewRole?.toUpperCase()}`}
                            </span>
                        </div>
                    )}

                    {/* MAIN ACTIONS ROW */}
                    <div className="flex items-center gap-3 mt-1">
                        {showGhostButton && (
                            <button onClick={() => setGhostRecording(null)} className="px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50">
                                <Icons.Ghost />
                                <span>Replay Ghost</span>
                            </button>
                        )}
                        
                        <button onClick={() => handleSave(false)} disabled={loading} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50">
                            <Icons.Save />
                            <span>Save</span>
                        </button>

                        <button onClick={handleRun} disabled={loading || crewRole === 'navigator'} className={`px-5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] ${crewRole === 'navigator' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {loading ? <span className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-400 border-t-transparent"></span> : <Icons.Run />}
                            <span>Execute</span>
                        </button>
                        <button onClick={handleAnalyze} disabled={loading} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                            <Icons.Analyze />
                            <span>Analyze</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex-grow relative flex flex-col group z-0">
                {/* File Tabs */}
                {Object.keys(files).length > 1 && (
                    <div className="flex border-b border-white/5 bg-[#0a0f1e]">
                        {Object.keys(files).map(file => (
                            <button 
                                key={file}
                                onClick={() => setActiveFile(file)}
                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeFile === file ? "text-cyan-400 bg-white/5" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                {file}
                                {activeFile === file && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="flex-1 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#050914] border-r border-white/5 text-slate-600 text-xs font-mono text-right pr-3 pt-6 select-none leading-6 z-10 hidden md:block">
                        {code.split('\n').map((_, i) => (
                            <div key={i} className={`opacity-50 ${highlightedLine === i + 1 ? 'text-red-500 font-bold bg-red-500/10' : ''}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    <pre ref={highlightRef} className="absolute inset-0 w-full h-full p-6 md:pl-16 font-mono text-sm leading-6 pointer-events-none whitespace-pre-wrap overflow-hidden z-0" dangerouslySetInnerHTML={{ __html: highlightCode(code) + '<br/>' }} />
                    <textarea 
                        ref={textareaRef} 
                        onScroll={handleScroll}
                        onSelect={trackInputActivity}
                        onClick={trackInputActivity}
                        onKeyUp={trackInputActivity} 
                        className={`absolute inset-0 w-full h-full bg-transparent p-6 md:pl-16 font-mono text-sm leading-6 resize-none focus:outline-none text-transparent caret-cyan-400 selection:bg-blue-500/30 z-10 ${crewRole === 'navigator' ? 'cursor-not-allowed' : ''}`}
                        style={{ color: 'transparent' }} 
                        value={code} 
                        onChange={(e) => handleCodeChange(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        spellCheck="false" 
                        readOnly={crewRole === 'navigator'} 
                    />
                </div>
            </div>
          
            {/* TERMINAL PANEL */}
            {!(gameMode === 'bridge' && crewRole === 'pilot') && (
                <div className="h-64 bg-[#050914] border-t border-white/5 flex flex-col shrink-0 relative z-20">
                    <div className="flex border-b border-white/5 bg-[#020617]">
                        {['terminal', 'tests'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)} 
                                className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === tab ? "text-cyan-400 bg-white/5" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                {tab === 'terminal' ? <Icons.Terminal /> : <Icons.Check />}
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                        {activeTab === "terminal" ? (
                            <div className="text-slate-400 whitespace-pre-wrap leading-relaxed">{output || <span className="text-slate-700 italic opacity-50">// System awaiting input...</span>}</div>
                        ) : (
                            <div className="space-y-2">
                                {testResults ? testResults.map((t, i) => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={i} className={`flex justify-between items-center p-3 rounded bg-white/5 border-l-2 ${t.passed ? 'border-emerald-500' : 'border-red-500'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1 rounded-full ${t.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{t.passed ? <Icons.Check /> : <Icons.Cross />}</div>
                                            <div className="flex flex-col"><span className={`font-bold ${t.passed ? "text-emerald-400" : "text-red-400"}`}>{t.passed ? "PASSED" : "FAILED"}</span><span className="text-slate-500 mt-0.5">Input: <code className="bg-black/30 px-1.5 py-0.5 rounded text-slate-300">{t.input}</code></span></div>
                                        </div>
                                        {!t.passed && <div className="text-right text-[10px] opacity-70">Exp: {t.expected} / Act: {t.actual}</div>}
                                    </motion.div>
                                )) : <p className="text-slate-700 italic text-center py-4">// Execute code to run assertions.</p>}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}
            {gameMode === 'bridge' && crewRole === 'pilot' && (
                <div className="h-64 bg-[#050914] border-t border-white/5 flex flex-col justify-center items-center text-center p-4">
                    <p className="text-red-500 font-bold uppercase tracking-widest text-xs mb-2">⚠ TERMINAL FEED OFFLINE</p>
                    <p className="text-slate-500 text-xs">Data stream rerouted to Navigator. Await verbal confirmation.</p>
                </div>
            )}
      </div>

      <div className="w-1 bg-white/5 hover:bg-cyan-500 cursor-ew-resize transition-colors z-40" onMouseDown={startResizing} />

      {/* RIGHT: VISUALS & CHAT */}
      <div style={{ width: sidebarWidth }} className="flex flex-col bg-[#050914] relative z-10 shrink-0 border-l border-white/5">
          {/* TOP PANEL: VISUALIZER (Split for Duel) */}
          <div className="h-[60%] relative border-b border-white/5 overflow-hidden flex flex-col">
            {!isPremium && (
                <div className="absolute inset-0 z-20 bg-[#020617]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 mb-4 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><div className="text-amber-500"><Icons.Lock /></div></div>
                    <h3 className="text-sm font-bold text-white mb-2 tracking-wide uppercase">Holographic Core Locked</h3>
                    <p className="text-slate-500 mb-6 text-xs leading-relaxed">Upgrade to Commander tier to visualize AST logic structures in real-time 3D space.</p>
                    <button onClick={onUpgrade} className="px-6 py-2 rounded bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all">Initialize Upgrade</button>
                </div>
            )}
            
            {/* Pilot in Bridge Mode can't see Visualizer */}
            {gameMode === 'bridge' && crewRole === 'pilot' ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-black">
                    <div className="w-16 h-16 rounded-full border-2 border-red-900 border-t-red-500 animate-spin"></div>
                    <p className="mt-4 text-red-500 font-mono text-xs uppercase tracking-widest">VISUAL UPLINK SEVERED</p>
                </div>
            ) : gameMode === 'duel' ? (
                // DUEL MODE: SPLIT SCREEN
                <>
                    <div className="flex-1 relative border-b border-white/10">
                        <div className="absolute top-2 left-2 z-10 bg-blue-600/20 text-blue-300 text-[10px] font-bold px-2 py-1 rounded">SELF</div>
                        {visualData && <CodeVisualizer data={visualData} trace={executionTrace} glitchActive={glitch} ghostTrace={ghostRecording} />}
                    </div>
                    <div className="flex-1 relative bg-red-900/5">
                        <div className="absolute top-2 left-2 z-10 bg-red-600/20 text-red-300 text-[10px] font-bold px-2 py-1 rounded">OPPONENT (HOLOGRAM)</div>
                        {opponentVisualData ? 
                            <CodeVisualizer data={opponentVisualData} trace={[]} glitchActive={false} /> :
                            <div className="flex items-center justify-center h-full text-slate-600 text-xs font-mono">NO SIGNAL</div>
                        }
                    </div>
                </>
            ) : (
                // STANDARD MODE
                visualData ? <CodeVisualizer data={visualData} trace={executionTrace} glitchActive={glitch} ghostTrace={ghostRecording} /> : (
                    <div className="absolute inset-0 flex items-center justify-center flex-col opacity-30">
                        <div className="w-24 h-24 border border-dashed border-slate-600 rounded-full animate-spin-slow flex items-center justify-center">
                            <div className="w-20 h-20 border border-slate-700 rounded-full"></div>
                        </div>
                        <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-slate-500">Awaiting Neural Analysis</p>
                    </div>
                )
            )}
          </div>
          
          <div className="flex-1 min-h-0">
              <ChatInterface messages={chatMessages} onSend={handleChatSend} loading={loading} onMicClick={startListening} />
          </div>
      </div>
    </div>
  );
};

export default Dashboard;