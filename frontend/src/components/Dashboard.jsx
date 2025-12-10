import React, { useState, useRef, useEffect } from 'react';
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
  Ghost: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 18A8 8 0 0012 2a8 8 0 00-8 8v8a8 8 0 0016 0h-4zm-4-4v-4a4 4 0 00-8 0v4h8z" /></svg>
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
                        <div className="text-3xl mb-2 grayscale">👾</div>
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
                            : 'bg-[#1e293b]/80 border border-white/10 text-slate-300 rounded-bl-sm'
                        }`}>
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

const Dashboard = ({ user, initialCode, missionId, missionDesc, onBack, onUpgrade }) => {
  const [code, setCode] = useState(initialCode || `def solve():\n    # Write your solution here\n    pass`);
  const [visualData, setVisualData] = useState(null);
  const [executionTrace, setExecutionTrace] = useState([]); 
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal"); 
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [chatMessages, setChatMessages] = useState([]);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [glitch, setGlitch] = useState(false);
  
  // --- GHOST / MULTIPLAYER STATE ---
  const [crewMode, setCrewMode] = useState(false);
  const [crewRole, setCrewRole] = useState('pilot');
  const [sessionKey, setSessionKey] = useState('');
  const [ghostRecording, setGhostRecording] = useState(null); // Stores last successful trace
  const [showGhostButton, setShowGhostButton] = useState(false); // Show Replay button
  
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

  // --- INITIALIZE PYODIDE, WS, AND LOAD GHOST ---
  useEffect(() => {
    const loadPyodideEngine = async () => {
      try {
        if (window.loadPyodide) {
          const py = await window.loadPyodide();
          setPyodide(py);
          console.log(">> Pyodide Engine Ready");
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

                if (user?.id) {
                    const progressRes = await axios.get(`http://127.0.0.1:8000/get-progress?user_id=${user.id}&mission_id=${missionId}`);
                    if (progressRes.data && progressRes.data.code) {
                        setCode(progressRes.data.code);
                        setOutput(">> Saved progress loaded successfully.\n");
                    }
                    
                    // NEW: Load Ghost Recording from LocalStorage
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
        if (data.type === "code_update") {
            if (crewRole === 'navigator') {
                setCode(data.code);
            }
        } else if (data.role) {
            setLoading(false);
            setChatMessages(prev => [...prev, { role: data.role, text: data.text }]);
            if (data.role === 'ai') speak(data.text); 
        }
    };
    socket.onclose = () => console.log(">> Neural Link Disconnected");
    setWs(socket);

    return () => socket.close();
  }, [missionId, crewRole]);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleSave = async (isCompleted = false) => {
      if (!user || !missionId) return;
      try {
          await axios.post('http://localhost:8000/save-progress', {
              user_id: user.id,
              mission_id: missionId,
              code: code,
              is_completed: isCompleted 
          });
          
          if (!isCompleted) {
              setOutput(prev => prev + "\n>> System: Draft saved. You can resume later. 💾");
          } else {
              // Only record GHOST on successful completion
              // The trace list should ideally contain line numbers AND time delta from start of execution.
              // We'll approximate this by just recording line numbers with a timestamp.
              const newGhost = executionTrace.map(lineNo => ({ timestamp: Date.now(), line: lineNo }));
              localStorage.setItem(`ghost_${user.id}_${missionId}`, JSON.stringify(newGhost));
              setGhostRecording(newGhost);
              setShowGhostButton(true);
              
              setOutput(prev => prev + "\n>> System: Mission Completed & Status Updated! 🏆");
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

      // CODE SONIFICATION: Error Sound
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

  const handleRun = async () => {
      if (!pyodide) {
          setOutput(">> Engine initializing... please wait.");
          return;
      }
      setLoading(true);
      setOutput(">> Executing locally in browser environment...\n");
      setTestResults(null);
      setExecutionTrace([]);
      setHighlightedLine(null); 
      setActiveTab("terminal");

      try {
          pyodide.runPython(`
            import sys
            import io
            sys.stdout = io.StringIO()
          `);

          const wrappedCode = `
import sys
__trace_data__ = []

def __trace_func__(frame, event, arg):
    if event == 'line':
        __trace_data__.append(frame.f_lineno)
    return __trace_func__

sys.settrace(__trace_func__)

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception:
    raise
finally:
    sys.settrace(None)
`;
          await pyodide.loadPackagesFromImports(code);
          await pyodide.runPythonAsync(wrappedCode);
          
          const traceProxy = pyodide.globals.get('__trace_data__');
          const traceList = traceProxy.toJs();
          traceProxy.destroy();
          setExecutionTrace(traceList); 

          const stdout = pyodide.runPython("sys.stdout.getvalue()");
          setOutput(prev => prev + stdout + "\n>> Execution Complete.");

          if (missionData && missionData.test_cases) {
              const results = [];
              for (let i = 0; i < missionData.test_cases.length; i++) {
                  const tc = missionData.test_cases[i];
                  const testCode = `
try:
    result = ${extractFunctionName(code)}(*${JSON.stringify(tc.input)})
    passed = result == ${JSON.stringify(tc.expected)}
    output = str(result)
except Exception as e:
    passed = False
    output = str(e)
[passed, output]
                  `;
                  try {
                    const [passed, actual] = pyodide.runPython(testCode).toJs();
                    results.push({
                        id: i + 1,
                        input: JSON.stringify(tc.input),
                        expected: JSON.stringify(tc.expected),
                        actual: actual,
                        passed: passed
                    });
                  } catch (err) {
                      results.push({ id: i + 1, passed: false, actual: "Runtime Error" });
                  }
              }
              setTestResults(results);
              if(results.length > 0) setActiveTab("tests");

              const allPassed = results.length > 0 && results.every(r => r.passed);
              if (allPassed) {
                  // CODE SONIFICATION: Success Sound
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
                  
                  setOutput(prev => prev + "\n\n>> ✨ ALL SYSTEMS NOMINAL ✨\n>> Mission Completed. Auto-saving status...");
                  await handleSave(true);
              } else {
                  // FAIL STATE: Trigger Glitch & Vibrate
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

  const handleJoinCrew = () => {
      if (!sessionKey) return;
      setCrewMode(true);
      if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
              type: "join",
              session_id: sessionKey
          }));
      }
  };

  const handleCodeChange = (newCode) => {
      if (crewRole === 'navigator') return;
      setCode(newCode);
      if (crewMode && crewRole === 'pilot' && ws && ws.readyState === WebSocket.OPEN) {
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
    const { selectionStart, selectionEnd, value } = e.target;
    const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    const closingChars = Object.values(pairs);

    if (e.key === 'Tab') {
      e.preventDefault();
      const newText = value.substring(0, selectionStart) + "    " + value.substring(selectionEnd);
      setCode(newText);
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
      setCode(newText);
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
            setCode(newText);
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
      setCode(newText);
      setTimeout(() => { if(e.target) e.target.selectionStart = e.target.selectionEnd = selectionStart + 1 + indent.length; }, 0);
      return;
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden">
      {/* LEFT: EDITOR & TERMINAL */}
      <div className="flex flex-1 flex-col min-w-0 bg-[#0a0f1e]/40 backdrop-blur-sm relative border-r border-white/5">
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
                
                <div className="flex flex-col items-end gap-2">
                    {!crewMode ? (
                        <div className="flex items-center bg-white/5 rounded-lg p-1">
                            <input 
                                type="text" 
                                placeholder="Session ID" 
                                value={sessionKey} 
                                onChange={(e) => setSessionKey(e.target.value)}
                                className="bg-transparent border-none text-xs text-white w-20 px-2 focus:outline-none placeholder-slate-600"
                            />
                            <select value={crewRole} onChange={(e) => setCrewRole(e.target.value)} className="bg-black/40 text-[10px] text-slate-300 border-none rounded p-1 mr-1">
                                <option value="pilot">Pilot</option>
                                <option value="navigator">Nav</option>
                            </select>
                            <button onClick={handleJoinCrew} className="text-cyan-400 hover:text-white p-1"><Icons.Users /></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">BRIDGE: {sessionKey} ({crewRole})</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        
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
      </div>

      <div className="w-1 bg-white/5 hover:bg-cyan-500 cursor-ew-resize transition-colors z-40" onMouseDown={startResizing} />

      {/* RIGHT: VISUALS & CHAT */}
      <div style={{ width: sidebarWidth }} className="flex flex-col bg-[#050914] relative z-10 shrink-0 border-l border-white/5">
          <div className="h-[60%] relative border-b border-white/5 overflow-hidden">
            {!isPremium && (
                <div className="absolute inset-0 z-20 bg-[#020617]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 mb-4 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><div className="text-amber-500"><Icons.Lock /></div></div>
                    <h3 className="text-sm font-bold text-white mb-2 tracking-wide uppercase">Holographic Core Locked</h3>
                    <p className="text-slate-500 mb-6 text-xs leading-relaxed">Upgrade to Commander tier to visualize AST logic structures in real-time 3D space.</p>
                    <button onClick={onUpgrade} className="px-6 py-2 rounded bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all">Initialize Upgrade</button>
                </div>
            )}
            
            {visualData ? <CodeVisualizer data={visualData} trace={executionTrace} glitchActive={glitch} ghostTrace={ghostRecording} /> : (
                <div className="absolute inset-0 flex items-center justify-center flex-col opacity-30">
                    <div className="w-24 h-24 border border-dashed border-slate-600 rounded-full animate-spin-slow flex items-center justify-center">
                        <div className="w-20 h-20 border border-slate-700 rounded-full"></div>
                    </div>
                    <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-slate-500">Awaiting Neural Analysis</p>
                </div>
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