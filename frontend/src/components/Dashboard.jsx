// frontend/src/components/Dashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import CodeVisualizer from '../three-scene/CodeVisualizer.jsx';
import { motion } from 'framer-motion';

// --- ICONS ---
const Icons = {
  Run: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
  Analyze: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  Back: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Terminal: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Brain: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
};

// --- SAFE SYNTAX HIGHLIGHTER ---
const highlightCode = (code) => {
  if (!code) return "";
  const escape = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Single-pass regex to tokenize the code. 
  // It matches Comments, Strings, Keywords, Numbers, Built-ins, or fallback to everything else.
  // We use Hex colors to avoid conflicts with Tailwind class numbers (like '400').
  const tokenRegex = /(#.*)|(["'](?:(?=(\\?))\3.)*?\2)|(\b\d+\b)|(\b(?:def|class|return|if|else|elif|while|for|in|pass|import|from|try|except|break|continue|and|or|not|is|None|True|False)\b)|(\b(?:print|len|range|sum|max|min|list|dict|str|int|float|bool|abs|round)\b)|([\s\S])/g;

  return code.replace(tokenRegex, (match, comment, string, number, keyword, builtin, other) => {
      if (comment) return `<span style="color: #94a3b8; font-style: italic;">${escape(comment)}</span>`;
      if (string) return `<span style="color: #34d399;">${escape(string)}</span>`;
      if (number) return `<span style="color: #fbbf24;">${number}</span>`;
      if (keyword) return `<span style="color: #e879f9; font-weight: bold;">${escape(keyword)}</span>`;
      if (builtin) return `<span style="color: #60a5fa;">${escape(builtin)}</span>`;
      return escape(match); // Escape everything else (variables, brackets, etc.)
  });
};

// --- SIDEBAR ---
const Sidebar = ({ isPremium }) => (
  <div className="w-16 md:w-20 flex flex-col items-center py-6 space-y-8 bg-[#020617] border-r border-slate-800 z-30 shadow-2xl shrink-0">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-black shadow-lg shadow-blue-500/20 text-sm">DB</div>
    
    <div className="flex-1 w-full flex flex-col items-center space-y-4">
      <div className="group relative w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 transition-all cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.1)]">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
      </div>
      <div className="group relative w-10 h-10 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 flex items-center justify-center transition-all cursor-pointer">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
      </div>
    </div>
    
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-black tracking-tighter border-2 transition-all cursor-help ${isPremium ? 'border-amber-500/50 text-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-800 text-slate-600 bg-slate-900'}`} title={isPremium ? "Premium Active" : "Free Tier"}>
        {isPremium ? "PRO" : "FREE"}
    </div>
  </div>
);

const Dashboard = ({ user, initialCode, missionId, missionDesc, onBack, onUpgrade }) => {
  // 1. STATE MANAGEMENT
  const [code, setCode] = useState(initialCode || `def solve():\n    # Write your solution here\n    pass`);
  const [visualData, setVisualData] = useState(null);
  const [aiFeedback, setAiFeedback] = useState("Waiting for analysis request...");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal"); 
  const [upgrading, setUpgrading] = useState(false); 

  const isPremium = user?.is_premium || false;
  const userId = user?.id;
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const messagesEndRef = useRef(null); 

  // Auto-scroll output
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output, testResults, activeTab]);

  // Sync scroll between textarea and highlighter
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // 2. LOGIC HANDLERS
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      setCode(code.substring(0, start) + "    " + code.substring(end));
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 4; }, 0);
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        const currentLineStart = code.lastIndexOf('\n', start - 1) + 1;
        const currentLine = code.substring(currentLineStart, start);
        const currentIndent = currentLine.match(/^\s*/)[0];
        let extraIndent = currentLine.trim().endsWith(':') ? "    " : "";
        setCode(code.substring(0, start) + '\n' + currentIndent + extraIndent + code.substring(end));
        setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 1 + currentIndent.length + extraIndent.length; }, 0);
    }
  };

  const handleRun = async () => {
      setLoading(true);
      setOutput(">> Initializing runtime...\n>> Executing script...");
      setTestResults(null);
      setActiveTab("terminal");
      try {
          const response = await axios.post('http://127.0.0.1:8000/execute', { 
              code, mission_id: missionId 
          });
          setOutput(response.data.output || ">> Execution completed. No output.");
          
          if (response.data.test_results) {
              setTestResults(response.data.test_results);
              setActiveTab("tests");
              if (response.data.test_results.every(t => t.passed) && userId && missionId) {
                  axios.post(`http://127.0.0.1:8000/save-progress?user_id=${userId}&mission_id=${missionId}&code=${encodeURIComponent(code)}`);
              }
          }
      } catch (error) {
          setOutput(">> CRITICAL RUNTIME ERROR: Connection refused.");
      }
      setLoading(false);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAiFeedback("Deep Blue is processing logic patterns...");
    setVisualData(null);
    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze', {
        code: code, user_input: `MISSION OBJECTIVE: ${missionDesc}\n\nAnalyze this logic`, is_premium: isPremium 
      });
      setVisualData(response.data.visual_data);
      setAiFeedback(response.data.ai_feedback);
      if (response.data.vibration_pattern && navigator.vibrate) navigator.vibrate(response.data.vibration_pattern);
    } catch (error) {
      setAiFeedback(">> CONNECTION LOST: Neural Link Severed.");
    }
    setLoading(false);
  };

  const handleUpgradeClick = async () => {
      if (!userId) return;
      setUpgrading(true);
      try {
          const response = await axios.post(`http://127.0.0.1:8000/upgrade-premium?user_id=${userId}`);
          if (response.status === 200 && onUpgrade) onUpgrade(); 
      } catch (err) { alert("Upgrade failed."); }
      setUpgrading(false);
  };

  // 3. UI RENDER
  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden selection:bg-blue-500/30">
      <Sidebar isPremium={isPremium} />

      <div className="flex flex-1 flex-col md:flex-row min-w-0">
        
        {/* --- LEFT COLUMN: Editor & Output --- */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 relative z-10 bg-[#0B1121]">
            
            {/* Header / Mission Briefing */}
            <div className="min-h-[4rem] px-6 py-4 border-b border-slate-800 bg-[#0B1121]/95 backdrop-blur-sm flex justify-between items-start shrink-0 gap-6">
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    {onBack && (
                        <button onClick={onBack} className="text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider group w-fit">
                            <div className="p-1 rounded bg-slate-800 group-hover:bg-slate-700 transition-colors"><Icons.Back /></div>
                            <span>Return to Base</span>
                        </button>
                    )}
                    
                    {/* Mission Description Container - Fixed Height & Scrollable */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 mt-1 max-h-32 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 mb-1 sticky top-0 bg-[#0e1627] pb-1 z-10 w-fit px-1 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Active Protocol</span>
                        </div>
                        <p className="text-sm font-medium text-slate-200 leading-relaxed">
                            {missionDesc || "Sandbox Mode: Experiment freely with the neural engine."}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3 mt-8 shrink-0">
                    <button onClick={handleRun} disabled={loading} className="group relative px-5 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-900/20">
                        {loading ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-400"></span> : <Icons.Run />}
                        <span>Execute</span>
                    </button>
                    <button onClick={handleAnalyze} disabled={loading} className="group relative px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-transparent shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50">
                        <Icons.Analyze />
                        <span>Analyze</span>
                    </button>
                </div>
            </div>
            
            {/* Syntax Highlighted Code Editor */}
            <div className="flex-grow relative bg-[#0B1121] flex flex-col overflow-hidden group">
                <div className="flex-1 relative">
                    {/* Line Numbers */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#0B1121] border-r border-slate-800/50 text-slate-600 text-xs font-mono text-right pr-3 pt-6 select-none leading-6 z-10 hidden md:block">
                        {code.split('\n').map((_, i) => <div key={i} className="opacity-50">{i + 1}</div>)}
                    </div>
                    
                    {/* Syntax Highlight Layer (Behind) */}
                    <pre
                        ref={highlightRef}
                        className="absolute inset-0 w-full h-full p-6 md:pl-16 font-mono text-sm leading-6 pointer-events-none whitespace-pre-wrap overflow-hidden z-0"
                        dangerouslySetInnerHTML={{ __html: highlightCode(code) + '<br/>' }} 
                    />

                    {/* Input Layer (Front - Transparent Text) */}
                    <textarea
                        ref={textareaRef}
                        onScroll={handleScroll}
                        className="absolute inset-0 w-full h-full bg-transparent p-6 md:pl-16 font-mono text-sm leading-6 resize-none focus:outline-none text-transparent caret-white selection:bg-blue-500/30 z-10"
                        style={{ color: 'transparent' }}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        spellCheck="false"
                        autoCapitalize="off"
                        autoComplete="off"
                    />
                </div>
            </div>
          
            {/* Terminal Panel */}
            <div className="h-64 bg-[#020617] border-t border-slate-800 flex flex-col shrink-0 relative z-20">
                <div className="flex border-b border-slate-800 bg-[#050b1a]">
                    <button 
                        onClick={() => setActiveTab("terminal")} 
                        className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 ${activeTab === "terminal" ? "text-blue-400 border-blue-400 bg-blue-900/10" : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900"}`}
                    >
                        <Icons.Terminal /> Console
                    </button>
                    <button 
                        onClick={() => setActiveTab("tests")} 
                        className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 ${activeTab === "tests" ? "text-emerald-400 border-emerald-400 bg-emerald-900/10" : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900"}`}
                    >
                        <Icons.Check /> Vectors {testResults && `(${testResults.filter(t=>t.passed).length}/${testResults.length})`}
                    </button>
                </div>
              
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar bg-[#020617] relative">
                    <div className="scanline absolute inset-0 pointer-events-none opacity-5"></div>
                    {activeTab === "terminal" ? (
                        <div className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                            {output ? output : <span className="text-slate-700 italic opacity-50">// System awaiting input...</span>}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {!testResults && <p className="text-slate-700 italic text-center py-4">// Run code to generate test vectors.</p>}
                            {testResults && testResults.map((t, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    key={i} 
                                    className={`flex justify-between items-center p-3 rounded border-l-2 bg-slate-900/50 ${t.passed ? 'border-emerald-500' : 'border-red-500'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1 rounded-full ${t.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {t.passed ? <Icons.Check /> : <Icons.Cross />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${t.passed ? "text-emerald-400" : "text-red-400"}`}>{t.passed ? "PASSED" : "FAILED"}</span>
                                            <span className="text-slate-500 mt-0.5">Input: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">{t.input}</code></span>
                                        </div>
                                    </div>
                                    {!t.passed && (
                                        <div className="text-right text-[10px]">
                                            <div className="text-slate-500">Expected: <span className="text-emerald-400/80">{t.expected}</span></div>
                                            <div className="text-slate-500">Actual: <span className="text-red-400/80">{t.actual}</span></div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: Visuals & AI --- */}
        <div className="w-full md:w-[420px] flex flex-col border-l border-slate-800 bg-[#050b1a] relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]">
          
          {/* 3D Visualizer */}
          <div className="h-[55%] relative border-b border-slate-800 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#020617]">
            {!isPremium && (
                <div className="absolute inset-0 z-20 bg-[#020617]/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                        <div className="text-amber-500"><Icons.Lock /></div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Holographic Core Locked</h3>
                    <p className="text-slate-400 mb-8 text-xs leading-relaxed max-w-[260px]">Upgrade to Commander tier to visualize AST logic structures in real-time 3D space.</p>
                    <button 
                        onClick={handleUpgradeClick}
                        disabled={upgrading}
                        className="group relative font-bold py-3 px-8 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all overflow-hidden"
                    >
                        <span className="relative z-10">{upgrading ? "Processing..." : "Initialize Upgrade"}</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>
            )}
            
            {visualData ? (
                <CodeVisualizer data={visualData} /> 
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 flex-col">
                    <div className="text-5xl mb-4 opacity-20 animate-pulse grayscale">🧊</div>
                    <p className="opacity-40 text-[10px] uppercase tracking-[0.2em]">Awaiting Neural Analysis</p>
                </div>
            )}
            
            {/* Visualizer Overlay Info */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${visualData && !visualData.error ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-700'}`}></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logic Visualizer</span>
                </div>
            </div>
          </div>
          
          {/* AI Tutor Panel */}
          <div className="flex-1 flex flex-col bg-[#050b1a] relative">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1121]">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-blue-500/10 text-blue-400"><Icons.Brain /></div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Socratic Core</h3>
                </div>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse delay-75"></div>
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>
                
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shrink-0 flex items-center justify-center text-[10px] font-bold shadow-lg text-white border border-blue-400/30">AI</div>
                    <div className="flex-1">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-none p-5 shadow-sm relative">
                            <p className="text-slate-300 whitespace-pre-wrap leading-7 text-sm font-medium">{aiFeedback}</p>
                            
                            {/* Decorative Corner */}
                            <div className="absolute top-0 left-0 w-2 h-2 bg-[#050b1a]">
                                <div className="w-full h-full bg-slate-800/50 rounded-br-lg"></div>
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-600 mt-2 block pl-2">System Response • Now</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;