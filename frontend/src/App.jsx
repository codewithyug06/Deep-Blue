import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import MainMenu from './components/MainMenu'; 
import LoginModal from './components/LoginModal';
import HomeScene from './three-scene/HomeScene'; 
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [user, setUser] = useState(null); 
  const [currentScreen, setCurrentScreen] = useState('menu'); 
  const [activeMission, setActiveMission] = useState(null);
  const [menuViewMode, setMenuViewMode] = useState('missions'); // Lifted state for persistence

  // --- PERSISTENCE & HISTORY HANDLING ---
  useEffect(() => {
    // 1. Load User
    const savedUser = localStorage.getItem('deepblue_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // 2. Handle Browser Back Button (Popstate)
    const handlePopState = (event) => {
      // If user presses browser back button while in dashboard, go to menu
      if (currentScreen === 'dashboard') {
        // We just update state, we don't need to push/pop history again to avoid loops
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
    setMenuViewMode('missions'); // Reset view on logout
  };

  const handleStartMission = (mission) => {
    setActiveMission(mission);
    setCurrentScreen('dashboard');
    // Push state so browser "Back" button works
    window.history.pushState({ screen: 'dashboard' }, '', '#mission');
  };

  // Optimized for speed: Pure state update for UI, replace history to keep clean
  const handleBackToMenu = () => {
    setActiveMission(null);
    setCurrentScreen('menu');
    // Replace current history entry to reflect menu state without reloading
    window.history.replaceState({ screen: 'menu' }, '', '#menu');
  };

  const handleUserUpgrade = () => {
      const updatedUser = { ...user, is_premium: true };
      setUser(updatedUser);
      localStorage.setItem('deepblue_user', JSON.stringify(updatedUser));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white selection:bg-blue-500/30 font-sans">
      
      {/* 3D BACKGROUND LAYER */}
      <AnimatePresence>
        {user && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 1.5 }}
            className="fixed inset-0 z-0"
          >
            <HomeScene />
          </motion.div>
        )}
      </AnimatePresence>

      {/* APP CONTENT */}
      <div className="relative z-10 h-full">
        {!user ? (
          <LoginModal onLogin={handleLogin} />
        ) : (
          <AnimatePresence mode='wait'>
            {currentScreen === 'menu' && (
              <motion.div 
                key="menu"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }} // Faster transition
                className="h-full"
              >
                <MainMenu 
                  user={user} 
                  onSelectMission={handleStartMission} 
                  onLogout={handleLogout}
                  viewMode={menuViewMode}
                  setViewMode={setMenuViewMode}
                />
              </motion.div>
            )}
            
            {currentScreen === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }} // Faster transition
                className="h-full"
              >
                <Dashboard 
                  user={user} 
                  initialCode={activeMission?.starter_code} 
                  missionId={activeMission?.id}
                  missionDesc={activeMission?.description}
                  onBack={handleBackToMenu}
                  onUpgrade={handleUserUpgrade}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default App;