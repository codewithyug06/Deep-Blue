// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import MainMenu from './components/MainMenu'; 
import LoginModal from './components/LoginModal';

function App() {
  const [user, setUser] = useState(null); 
  const [currentScreen, setCurrentScreen] = useState('menu'); 
  const [activeMission, setActiveMission] = useState(null);

  // Check LocalStorage on load
  useEffect(() => {
    const savedUser = localStorage.getItem('deepblue_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

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
  };

  const handleBackToMenu = () => {
    setActiveMission(null);
    setCurrentScreen('menu');
  };

  const handleUserUpgrade = () => {
      const updatedUser = { ...user, is_premium: true };
      setUser(updatedUser);
      localStorage.setItem('deepblue_user', JSON.stringify(updatedUser));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white selection:bg-blue-500/30">
      
      {/* --- GLOBAL BACKGROUND (PERSISTENT) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-black opacity-80"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
         {/* Subtle moving glow for atmosphere */}
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* --- APP CONTENT --- */}
      <div className="relative z-10 h-full">
        {!user ? (
          <LoginModal onLogin={handleLogin} />
        ) : (
          <>
            {currentScreen === 'menu' && (
              <MainMenu 
                user={user} 
                onSelectMission={handleStartMission} 
                onLogout={handleLogout}
              />
            )}
            
            {currentScreen === 'dashboard' && (
              <Dashboard 
                user={user} 
                initialCode={activeMission?.starter_code} 
                missionId={activeMission?.id}
                missionDesc={activeMission?.description}
                onBack={handleBackToMenu}
                onUpgrade={handleUserUpgrade}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;