// frontend/src/components/Dashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import CodeVisualizer from '../three-scene/CodeVisualizer.jsx';

// --- SIDEBAR COMPONENT ---
const Sidebar = ({ isPremium }) => (
  <div className="w-20 flex flex-col items-center py-6 space-y-8 bg-slate-900/80 backdrop-blur-md border-r border-slate-700/50 z-20">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-black shadow-lg shadow-blue-500/20">DB</div>
    
    <div className="flex-1 w-full flex flex-col items-center space-y-6">
      <div className="group relative w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-blue-600/20 hover:text-blue-400 text-slate-500 flex items-center justify-center transition-all cursor-pointer">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700">Code Editor</span>
      </div>
      <div className="group relative w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-500 flex items-center justify-center transition-all cursor-pointer">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
      </div>
    </div>
    
    {/* Status Indicator */}
    <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-[8px] font-bold border-2 transition-all ${isPremium ? 'border-amber-500/50 text-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 text-slate-500 bg-slate-800/50'}`} title={isPremium ? "Premium User" : "Free User"}>
        <span>{isPremium ? "PRO" : "FREE"}</span>
    </div>
  </div>
);

const Dashboard = ({ user, initialCode, missionId, missionDesc, onBack, onUpgrade }) => {
  // 1. STATE MANAGEMENT
  const [code, setCode] = useState(initialCode || `def solve():\n    pass`);
  const [visualData, setVisualData] = useState(null);
  const [aiFeedback, setAiFeedback] = useState("System Ready. Awaiting input...");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal"); 
  const [upgrading, setUpgrading] = useState(false); 

  const isPremium = user?.is_premium || false;
  const userId = user?.id;
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null); 

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output, testResults, activeTab]);

  // 2. AUTO-INDENTATION LOGIC
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

  // 3. RUN & TEST ENGINE
  const handleRun = async () => {
      setLoading(true);
      setOutput("Initializing runtime environment...\nExecuting script...");
      setTestResults(null);
      try {
          const response = await axios.post('http://127.0.0.1:8000/execute', { 
              code, 
              mission_id: missionId 
          });
          setOutput(response.data.output || "Execution completed. No output returned.");
          
          if (response.data.test_results) {
              setTestResults(response.data.test_results);
              setActiveTab("tests");

              const allPassed = response.data.test_results.every(t => t.passed);
              if (allPassed && userId && missionId) {
                  await axios.post(`http://127.0.0.1:8000/save-progress?user_id=${userId}&mission_id=${missionId}&code=${encodeURIComponent(code)}`);
                  setOutput(prev => prev + "\n\n>> MISSION STATUS: ACCOMPLISHED. \n>> PROGRESS SAVED TO DATABASE.");
              }
              
              const failed = response.data.test_results.find(t => !t.passed);
              if(failed) {
                 handleAnalyze(`My code failed on input ${failed.input}. Expected ${failed.expected} but got ${failed.actual}. Help me fix it.`);
              }
          }
      } catch (error) {
          setOutput(">> RUNTIME ERROR: Execution failed due to system instability.");
      }
      setLoading(false);
  };

  // 4. ANALYZE ENGINE
  const handleAnalyze = async (customPrompt = "") => {
    setLoading(true);
    if (!customPrompt) setAiFeedback("Deep Blue is analyzing neural pathways...");
    setVisualData(null);
    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze', {
        code: code,
        user_input: customPrompt || "Analyze this logic",
        is_premium: isPremium 
      });
      setVisualData(response.data.visual_data);
      setAiFeedback(response.data.ai_feedback);
      if (response.data.haptic_feedback && navigator.vibrate) navigator.vibrate(200);
    } catch (error) {
      setAiFeedback(">> CONNECTION LOST: Neural Link Severed.");
    }
    setLoading(false);
  };

  // 5. HANDLE UPGRADE
  const handleUpgradeClick = async () => {
      if (!userId) return;
      setUpgrading(true);
      try {
          const response = await axios.post(`http://127.0.0.1:8000/upgrade-premium?user_id=${userId}`);
          if (response.status === 200) {
              if (onUpgrade) onUpgrade(); 
          }
      } catch (err) {
          alert("Upgrade failed. Neural credits insufficient.");
      }
      setUpgrading(false);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-white font-sans overflow-hidden">
      <Sidebar isPremium={isPremium} />

      <div className="flex flex-1 flex-col md:flex-row">
        {/* LEFT COLUMN: Editor & Output */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800/50 relative z-10">
            
            {/* Header / Toolbar */}
            <div className="bg-slate-900/50 backdrop-blur-sm p-4 border-b border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-4 overflow-hidden">
                    {onBack && (
                        <button onClick={onBack} className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-wider flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Back
                        </button>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Current Mission</span>
                        <span className="text-sm font-medium text-slate-200 truncate">{missionDesc || "Sandbox Mode"}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleRun} className="glass-button bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        Run
                    </button>
                    <button onClick={() => handleAnalyze()} className="glass-button bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Analyze
                    </button>
                </div>
            </div>
            
            {/* Code Editor */}
            <div className="flex-grow relative bg-[#0b1120]">
                <textarea
                    ref={textareaRef}
                    className="absolute inset-0 w-full h-full bg-transparent p-6 font-mono text-sm leading-6 resize-none focus:outline-none text-slate-300 placeholder-slate-600 selection:bg-blue-500/30"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    spellCheck="false"
                    placeholder="# Initialize sequence..."
                />
            </div>
          
            {/* Terminal / Output */}
            <div className="h-1/3 bg-[#020617] border-t border-slate-700/50 flex flex-col">
                <div className="flex border-b border-slate-800">
                    <button onClick={() => setActiveTab("terminal")} className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "terminal" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-900" : "text-slate-600 hover:text-slate-400"}`}>Terminal</button>
                    <button onClick={() => setActiveTab("tests")} className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "tests" ? "text-emerald-400 border-b-2 border-emerald-400 bg-slate-900" : "text-slate-600 hover:text-slate-400"}`}>Test Results</button>
                </div>
              
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                    {activeTab === "terminal" ? (
                        <pre className="text-slate-400 whitespace-pre-wrap">{output || <span className="text-slate-700 italic">// System ready.</span>}</pre>
                    ) : (
                        <div className="space-y-2">
                            {!testResults && <p className="text-slate-700 italic">// Run code to generate test vectors.</p>}
                            {testResults && testResults.map((t, i) => (
                                <div key={i} className={`flex justify-between items-center p-3 rounded border ${t.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${t.passed ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                        <span className={`font-bold ${t.passed ? "text-emerald-400" : "text-red-400"}`}>{t.passed ? "PASS" : "FAIL"}</span>
                                        <span className="text-slate-500">Input: <code className="bg-black/30 px-1 rounded">{t.input}</code></span>
                                    </div>
                                    <div className="text-right">
                                        {!t.passed && <div className="text-red-400/80 mb-1">Got: {t.actual}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Visuals & AI */}
        <div className="w-full md:w-[450px] flex flex-col border-l border-slate-800/50 bg-[#020617] relative z-10">
          
          {/* 3D Visualizer Area */}
          <div className="h-2/3 relative border-b border-slate-800/50 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#020617]">
            {!isPremium && (
                <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 mb-4 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Holographic View Locked</h3>
                    <p className="text-slate-400 mb-6 text-sm">Upgrade to Premium to visualize code structures in 3D space.</p>
                    <button 
                        onClick={handleUpgradeClick}
                        disabled={upgrading}
                        className={`font-bold py-2 px-8 rounded-full border transition-all text-sm uppercase tracking-widest ${upgrading ? "bg-amber-900/50 text-amber-500 border-amber-500/20" : "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] border-transparent"}`}
                    >
                        {upgrading ? "Processing..." : "Unlock Pro Access"}
                    </button>
                </div>
            )}
            
            {visualData ? <CodeVisualizer data={visualData} /> : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 flex-col">
                    <div className="text-6xl mb-4 opacity-20 animate-pulse">🧊</div>
                    <p className="opacity-50 text-xs uppercase tracking-widest">Awaiting Analysis Data</p>
                </div>
            )}
          </div>
          
          {/* AI Tutor Panel */}
          <div className="flex-1 bg-[#050b1a] flex flex-col">
            <div className="p-3 border-b border-slate-800/50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Socratic AI Core</h3>
            </div>
            <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 relative">
                    {/* Chat Bubble Tail */}
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-slate-800/30 border-t border-l border-slate-700/50 transform rotate-45"></div>
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm font-medium">{aiFeedback}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;