import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import CodeVisualizer from '../three-scene/CodeVisualizer.jsx';
import { motion, AnimatePresence } from 'framer-motion';

// --- ICONS ---
const Icons = {
  Run: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
  Analyze: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  Back: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Terminal: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Brain: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Send: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
};

const highlightCode = (code) => {
  if (!code) return "";
  const escape = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const tokenRegex = /(#.*)|(["'](?:(?=(\\?))\3.)*?\2)|(\b\d+\b)|(\b(?:def|class|return|if|else|elif|while|for|in|pass|import|from|try|except|break|continue|and|or|not|is|None|True|False)\b)|(\b(?:print|len|range|sum|max|min|list|dict|str|int|float|bool|abs|round)\b)|([\s\S])/g;
  return code.replace(tokenRegex, (match, comment, string, number, keyword, builtin, other) => {
      if (comment) return `<span style="color: #94a3b8; font-style: italic;">${escape(comment)}</span>`;
      if (string) return `<span style="color: #34d399;">${escape(string)}</span>`;
      if (number) return `<span style="color: #fbbf24;">${number}</span>`;
      if (keyword) return `<span style="color: #e879f9; font-weight: bold;">${escape(keyword)}</span>`;
      if (builtin) return `<span style="color: #60a5fa;">${escape(builtin)}</span>`;
      return escape(match);
  });
};

// --- CHAT INTERFACE COMPONENT ---
const ChatInterface = ({ messages, onSend, loading }) => {
    const [input, setInput] = useState("");
    const scrollRef = useRef(null);

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if(!input.trim() || loading) return;
        onSend(input);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-[#050b1a]">
            {/* Chat Header */}
            <div className="p-3 border-b border-slate-800 bg-[#0B1121] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-500/10 text-blue-400"><Icons.Brain /></div>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Socratic Core & Help</span>
                </div>
                <div className="flex gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`}></div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>
                {messages.length === 0 && (
                    <div className="text-center mt-10 opacity-40">
                        <div className="text-3xl mb-2">👾</div>
                        <p className="text-[10px] uppercase tracking-widest">System Online</p>
                        <p className="text-xs">"Analyze" for review, or type below for doubts.</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-5 ${
                            msg.role === 'user' 
                            ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-br-sm' 
                            : 'bg-slate-800/80 border border-slate-700 text-slate-300 rounded-bl-sm shadow-sm'
                        }`}>
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className="mb-1 last:mb-0">{line}</p>
                            ))}
                        </div>
                    </motion.div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-[#0B1121] flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a doubt..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
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

const Dashboard = ({ user, initialCode, missionId, missionDesc, onBack, onUpgrade }) => {
  const [code, setCode] = useState(initialCode || `def solve():\n    # Write your solution here\n    pass`);
  const [visualData, setVisualData] = useState(null);
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal"); 
  const [upgrading, setUpgrading] = useState(false); 
  
  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(300); // Start wider for visualizer
  const sidebarRef = useRef(null);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([]);

  const isPremium = user?.is_premium || false;
  const userId = user?.id;
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const messagesEndRef = useRef(null); 

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [output, testResults, activeTab]);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // --- RESIZE LOGIC ---
  const startResizing = (mouseDownEvent) => {
      mouseDownEvent.preventDefault();
      const startX = mouseDownEvent.clientX;
      const startWidth = sidebarWidth;

      const onMouseMove = (mouseMoveEvent) => {
          // Calculate new width (Right column resizing)
          const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
          if (newWidth > 250 && newWidth < 800) {
              setSidebarWidth(newWidth);
          }
      };

      const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          document.body.style.cursor = "default";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "ew-resize";
  };

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
    setVisualData(null);
    setChatMessages(prev => [...prev, { role: 'user', text: "Start Socratic Analysis..." }]);
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze', {
        code: code, 
        user_input: `MISSION OBJECTIVE: ${missionDesc}\n\nAnalyze this logic`, 
        is_premium: isPremium 
      });
      setVisualData(response.data.visual_data);
      
      // Add AI Response to Chat
      setChatMessages(prev => [...prev, { role: 'ai', text: response.data.ai_feedback }]);
      
      if (response.data.vibration_pattern && navigator.vibrate) navigator.vibrate(response.data.vibration_pattern);
    } catch (error) {
        setChatMessages(prev => [...prev, { role: 'ai', text: ">> CONNECTION LOST: Neural Link Severed." }]);
    }
    setLoading(false);
  };

  const handleDoubtChat = async (text) => {
      setLoading(true);
      setChatMessages(prev => [...prev, { role: 'user', text: text }]);
      try {
          // Re-using the analyze endpoint but with just user input usually works if backend is set up, 
          // or we can add a specific chat endpoint. Assuming 'analyze' handles it via the new rag_agent logic.
          const response = await axios.post('http://127.0.0.1:8000/analyze', {
              code: code, // Send code as context
              user_input: text,
              is_premium: isPremium,
              mode: 'doubt' // Backend will use this to skip Socratic prompts
          });
          setChatMessages(prev => [...prev, { role: 'ai', text: response.data.ai_feedback }]);
      } catch (error) {
          setChatMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI." }]);
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

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* 1. MAIN CONTENT (LEFT) */}
      <div className="flex flex-1 flex-col min-w-0 bg-[#0B1121] relative">
            {/* Header */}
            <div className="min-h-[4rem] px-6 py-4 border-b border-slate-800 bg-[#0B1121]/95 backdrop-blur-sm flex justify-between items-start shrink-0 gap-6">
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    {onBack && (
                        <button onClick={onBack} className="text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider group w-fit">
                            <div className="p-1 rounded bg-slate-800 group-hover:bg-slate-700 transition-colors"><Icons.Back /></div>
                            <span>Return to Base</span>
                        </button>
                    )}
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
            
            {/* Editor */}
            <div className="flex-grow relative bg-[#0B1121] flex flex-col overflow-hidden group">
                <div className="flex-1 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#0B1121] border-r border-slate-800/50 text-slate-600 text-xs font-mono text-right pr-3 pt-6 select-none leading-6 z-10 hidden md:block">
                        {code.split('\n').map((_, i) => <div key={i} className="opacity-50">{i + 1}</div>)}
                    </div>
                    <pre ref={highlightRef} className="absolute inset-0 w-full h-full p-6 md:pl-16 font-mono text-sm leading-6 pointer-events-none whitespace-pre-wrap overflow-hidden z-0" dangerouslySetInnerHTML={{ __html: highlightCode(code) + '<br/>' }} />
                    <textarea ref={textareaRef} onScroll={handleScroll} className="absolute inset-0 w-full h-full bg-transparent p-6 md:pl-16 font-mono text-sm leading-6 resize-none focus:outline-none text-transparent caret-white selection:bg-blue-500/30 z-10" style={{ color: 'transparent' }} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={handleKeyDown} spellCheck="false" autoCapitalize="off" autoComplete="off" />
                </div>
            </div>
          
            {/* Terminal */}
            <div className="h-64 bg-[#020617] border-t border-slate-800 flex flex-col shrink-0 relative z-20">
                <div className="flex border-b border-slate-800 bg-[#050b1a]">
                    <button onClick={() => setActiveTab("terminal")} className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 ${activeTab === "terminal" ? "text-blue-400 border-blue-400 bg-blue-900/10" : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900"}`}><Icons.Terminal /> Console</button>
                    <button onClick={() => setActiveTab("tests")} className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 ${activeTab === "tests" ? "text-emerald-400 border-emerald-400 bg-emerald-900/10" : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900"}`}><Icons.Check /> Vectors {testResults && `(${testResults.filter(t=>t.passed).length}/${testResults.length})`}</button>
                </div>
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar bg-[#020617] relative">
                    {activeTab === "terminal" ? (
                        <div className="text-slate-400 whitespace-pre-wrap leading-relaxed">{output || <span className="text-slate-700 italic opacity-50">// System awaiting input...</span>}</div>
                    ) : (
                        <div className="space-y-2">
                            {!testResults && <p className="text-slate-700 italic text-center py-4">// Run code to generate test vectors.</p>}
                            {testResults && testResults.map((t, i) => (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={i} className={`flex justify-between items-center p-3 rounded border-l-2 bg-slate-900/50 ${t.passed ? 'border-emerald-500' : 'border-red-500'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1 rounded-full ${t.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{t.passed ? <Icons.Check /> : <Icons.Cross />}</div>
                                        <div className="flex flex-col"><span className={`font-bold ${t.passed ? "text-emerald-400" : "text-red-400"}`}>{t.passed ? "PASSED" : "FAILED"}</span><span className="text-slate-500 mt-0.5">Input: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">{t.input}</code></span></div>
                                    </div>
                                    {!t.passed && <div className="text-right text-[10px]"><div className="text-slate-500">Expected: <span className="text-emerald-400/80">{t.expected}</span></div><div className="text-slate-500">Actual: <span className="text-red-400/80">{t.actual}</span></div></div>}
                                </motion.div>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
      </div>

      {/* 2. RESIZER HANDLE */}
      <div 
        className="w-1 bg-slate-800 hover:bg-blue-500 cursor-ew-resize transition-colors z-40"
        onMouseDown={startResizing}
      />

      {/* 3. RIGHT COLUMN: Visuals & Chat (Resizable) */}
      <div 
        style={{ width: sidebarWidth }} 
        className="flex flex-col border-l border-slate-800 bg-[#050b1a] relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.3)] shrink-0"
      >
          {/* 3D Visualizer */}
          <div className="h-[60%] relative border-b border-slate-800 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#020617]">
            {!isPremium && (
                <div className="absolute inset-0 z-20 bg-[#020617]/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]"><div className="text-amber-500"><Icons.Lock /></div></div>
                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Holographic Core Locked</h3>
                    <p className="text-slate-400 mb-8 text-xs leading-relaxed max-w-[260px]">Upgrade to Commander tier to visualize AST logic structures in real-time 3D space.</p>
                    <button onClick={handleUpgradeClick} disabled={upgrading} className="group relative font-bold py-3 px-8 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all overflow-hidden"><span className="relative z-10">{upgrading ? "Processing..." : "Initialize Upgrade"}</span><div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div></button>
                </div>
            )}
            
            {visualData ? <CodeVisualizer data={visualData} /> : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 flex-col">
                    <div className="text-5xl mb-4 opacity-20 animate-pulse grayscale">🧊</div>
                    <p className="opacity-40 text-[10px] uppercase tracking-[0.2em]">Awaiting Neural Analysis</p>
                </div>
            )}
          </div>
          
          {/* Chat / Socratic Core */}
          <div className="flex-1 min-h-0">
              <ChatInterface 
                messages={chatMessages} 
                onSend={handleDoubtChat} 
                loading={loading}
              />
          </div>
      </div>
    </div>
  );
};

export default Dashboard;