import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import MainMenu from './components/MainMenu'; 
import LoginModal from './components/LoginModal';
import HomeScene from './three-scene/HomeScene'; 
import TheConstruct from './components/TheConstruct'; 
import { AnimatePresence, motion } from 'framer-motion';

// --- [NEW] REFACTORING GYM COMPONENT ---
const RefactorGym = ({ onBack }) => {
  // We start with "Ugly" code: nested loops, bad naming, redundant checks
  const [code, setCode] = useState(`def process_data(data):
    # This function is working but UGLY. Refactor it!
    result = []
    if data:
        for i in range(len(data)):
            if data[i] > 0:
                if data[i] % 2 == 0:
                    if data[i] != 100:
                        temp = data[i] * 2
                        result.append(temp)
                    else:
                        result.append(0)
                else:
                    pass
            else:
                pass
    return result`);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkQuality = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/analyze-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Complexity Gauge Visual
  const Gauge = ({ score }) => {
    // Score 1-5 is good (Green), 6-10 (Yellow), 11+ (Red)
    const percentage = Math.min((score / 20) * 100, 100); 
    let color = '#00ff88'; // Green
    if(score > 5) color = '#ffaa00'; // Orange
    if(score > 10) color = '#ff0044'; // Red

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg border border-gray-700 w-full mb-4">
        <h4 className="text-gray-400 text-xs tracking-widest uppercase mb-2">Complexity Gauge</h4>
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 50 }}
            className="h-full"
            style={{ backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between w-full mt-2 text-sm font-bold">
          <span style={{ color }}>Score: {score}</span>
          <span className="text-gray-500">Target: &le; 5</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-[#0b0c15] text-white">
      {/* Sidebar: Stats & Info */}
      <div className="w-80 flex flex-col p-6 border-r border-gray-800 bg-gray-900/95 backdrop-blur z-20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-amber-400 tracking-wider">REFACTOR GYM</h2>
          <button onClick={onBack} className="text-xs text-gray-400 hover:text-white">EXIT</button>
        </div>
        
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Your code works, but is it <strong>clean</strong>? Rewrite the logic to reduce nesting and simplify flow.
        </p>

        {/* Live Gauge */}
        {stats ? (
          <div className="space-y-4">
            <Gauge score={stats.complexity_score} />
            
            <div className="p-4 bg-black/40 rounded border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">Hygiene Rank</div>
              <div className={`text-4xl font-bold mt-1 ${
                stats.rank === 'A' ? 'text-green-400' : 
                stats.rank === 'B' ? 'text-yellow-400' : 'text-red-500'
              }`}>
                {stats.rank}
              </div>
              <div className="text-xs text-gray-300 mt-2 italic">"{stats.feedback}"</div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-800/50 rounded text-center text-gray-500 text-sm">
            Press "Analyze" to see complexity score.
          </div>
        )}

        <button
          onClick={checkQuality}
          disabled={loading}
          className={`mt-auto w-full py-4 rounded font-bold tracking-widest text-sm transition-all ${
            loading ? 'bg-gray-700' : 'bg-amber-500 hover:bg-amber-400 text-black'
          }`}
        >
          {loading ? 'ANALYZING...' : 'ANALYZE QUALITY'}
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
        <div className="bg-gray-800 text-xs text-gray-400 px-4 py-2 flex justify-between">
          <span>main.py (Dirty)</span>
          <span>Python 3.10</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 bg-transparent text-gray-300 font-mono text-base p-8 outline-none resize-none leading-relaxed"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

// --- [NEW] Wrapper Component for The Construct Screen ---
const ConstructView = ({ onBack }) => {
  const [code, setCode] = useState(`a = [1, 2, 3]\nb = a\nb.append(4)`);
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      setTraceData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-white">
      <div className="w-1/3 flex flex-col p-6 border-r border-gray-800 z-20 bg-gray-900/90 backdrop-blur">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 tracking-widest">THE CONSTRUCT</h2>
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">EXIT</button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 bg-black/50 border border-gray-700 p-4 font-mono text-sm rounded mb-4 focus:border-cyan-500 outline-none resize-none text-gray-300"
          spellCheck="false"
        />
        <button
          onClick={handleRun}
          disabled={loading}
          className={`p-4 rounded font-bold tracking-widest transition-all ${
            loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'
          }`}
        >
          {loading ? 'TRACING HEAP...' : 'INITIALIZE VISUALIZATION'}
        </button>
      </div>
      <div className="w-2/3 relative">
        {traceData ? (
          <TheConstruct traceData={traceData} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <h3 className="text-3xl font-light">AWAITING INPUT</h3>
            <p className="mt-2">Enter Python code to visualize memory allocation</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [user, setUser] = useState(null); 
  const [currentScreen, setCurrentScreen] = useState('menu'); 
  const [activeMission, setActiveMission] = useState(null);
  const [menuViewMode, setMenuViewMode] = useState('missions');

  useEffect(() => {
    const savedUser = localStorage.getItem('deepblue_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const handlePopState = () => {
      if (currentScreen !== 'menu') {
        setActiveMission(null);
        setCurrentScreen('menu');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentScreen]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('deepblue_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('deepblue_user');
    setCurrentScreen('menu');
  };

  const handleStartMission = (mission) => {
    setActiveMission(mission);
    setCurrentScreen('dashboard');
    window.history.pushState({ screen: 'dashboard' }, '', '#mission');
  };

  const handleOpenConstruct = () => {
    setCurrentScreen('construct');
    window.history.pushState({ screen: 'construct' }, '', '#construct');
  };

  // [NEW] Handler for Gym
  const handleOpenGym = () => {
    setCurrentScreen('gym');
    window.history.pushState({ screen: 'gym' }, '', '#gym');
  };

  const handleBackToMenu = () => {
    setActiveMission(null);
    setCurrentScreen('menu');
    window.history.replaceState({ screen: 'menu' }, '', '#menu');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white font-sans">
      
      {/* 3D BACKGROUND LAYER */}
      <AnimatePresence>
        {user && currentScreen === 'menu' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-0"
          >
            <HomeScene />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 h-full">
        {!user ? (
          <LoginModal onLogin={handleLogin} />
        ) : (
          <AnimatePresence mode='wait'>
            {currentScreen === 'menu' && (
              <motion.div 
                key="menu"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full"
              >
                <MainMenu 
                  user={user} 
                  onSelectMission={handleStartMission} 
                  onLogout={handleLogout}
                  viewMode={menuViewMode}
                  setViewMode={setMenuViewMode}
                  onOpenConstruct={handleOpenConstruct} 
                />
                
                {/* TOOLBAR FOR EXTRA TOOLS */}
                <div className="fixed bottom-4 left-4 z-50 flex gap-4">
                  <button 
                    onClick={handleOpenConstruct}
                    className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-300 rounded hover:bg-purple-600 hover:text-white transition-all text-xs tracking-widest"
                  >
                    THE CONSTRUCT
                  </button>
                  <button 
                    onClick={handleOpenGym}
                    className="px-4 py-2 bg-amber-600/20 border border-amber-500/50 text-amber-300 rounded hover:bg-amber-600 hover:text-white transition-all text-xs tracking-widest"
                  >
                    REFACTOR GYM
                  </button>
                </div>
              </motion.div>
            )}
            
            {currentScreen === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <Dashboard 
                  user={user} 
                  initialCode={activeMission?.starter_code} 
                  missionId={activeMission?.id}
                  missionDesc={activeMission?.description}
                  onBack={handleBackToMenu}
                  onUpgrade={() => {
                     const u = { ...user, is_premium: true };
                     setUser(u);
                     localStorage.setItem('deepblue_user', JSON.stringify(u));
                  }}
                />
              </motion.div>
            )}

            {currentScreen === 'construct' && (
               <motion.div
                 key="construct"
                 initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                 className="h-full relative z-50"
               >
                 <ConstructView onBack={handleBackToMenu} />
               </motion.div>
            )}

            {/* [NEW] Refactor Gym Screen */}
            {currentScreen === 'gym' && (
               <motion.div
                 key="gym"
                 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                 className="h-full relative z-50"
               >
                 <RefactorGym onBack={handleBackToMenu} />
               </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default App;