import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Stars, Float, Text, Line } from '@react-three/drei';

// --- ICONS ---
const Icons = {
    Lock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    Badge: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
};

// --- DATA ---
const REGIONS = [
    { id: "Nexus Hub", x: 0, y: 0, z: 0, color: "#3b82f6", desc: "Central Network Node" },
    { id: "Algorithm Peaks", x: -4, y: 2, z: -2, color: "#10b981", desc: "Logic Gates & Sorting" },
    { id: "Data Mines", x: 4, y: -2, z: -3, color: "#f59e0b", desc: "Database Structures" },
    { id: "Neural Citadel", x: 0, y: 5, z: -5, color: "#8b5cf6", desc: "Advanced AI Core" }
];

const RegionNode = ({ region, unlocked, current, onClick }) => {
    return (
        <group position={[region.x, region.y, region.z]}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh onClick={() => unlocked && onClick(region.id)} scale={current ? 1.5 : 1}>
                    <icosahedronGeometry args={[0.5, 1]} />
                    <meshStandardMaterial 
                        color={unlocked ? region.color : "#334155"} 
                        emissive={unlocked ? region.color : "#000"}
                        emissiveIntensity={current ? 2 : 0.5}
                        wireframe={!unlocked}
                    />
                </mesh>
            </Float>
            <Text
                position={[0, -1, 0]}
                fontSize={0.3}
                color={unlocked ? "white" : "#64748b"}
                anchorX="center"
                anchorY="top"
            >
                {region.id} {current ? "(YOU)" : (!unlocked ? " [LOCKED]" : "")}
            </Text>
        </group>
    );
};

const ConnectionLine = ({ start, end }) => {
    return (
        <Line 
            points={[[start.x, start.y, start.z], [end.x, end.y, end.z]]} 
            color="#1e293b" 
            lineWidth={1} 
            transparent 
            opacity={0.3} 
        />
    );
};

// --- NEW COMPONENT: MINT NOTIFICATION TOAST ---
const MintNotification = ({ result, onClose }) => {
    if (!result) return null;
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl border backdrop-blur-md shadow-2xl flex flex-col gap-2 min-w-[300px] ${
                result.status === 'success' 
                ? 'bg-purple-900/80 border-purple-500/50 shadow-purple-500/20' 
                : 'bg-red-900/80 border-red-500/50 shadow-red-500/20'
            }`}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${result.status === 'success' ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>
                        {result.status === 'success' ? <Icons.Badge /> : <Icons.Lock />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold uppercase tracking-wider ${result.status === 'success' ? 'text-purple-300' : 'text-red-300'}`}>
                            {result.title}
                        </h4>
                        <p className="text-[10px] text-white/60">{result.message}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">&times;</button>
            </div>
            
            {result.hash && (
                <div className="mt-2 p-2 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-slate-400 break-all">
                    HASH: {result.hash}
                </div>
            )}
        </motion.div>
    );
};

const WorldMap = ({ user }) => {
    const [state, setState] = useState({ current_region: "Nexus Hub", unlocked_regions: ["Nexus Hub"] });
    const [wallet, setWallet] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Notification State
    const [notification, setNotification] = useState(null); // { status: 'success'|'error', title: str, message: str, hash?: str }

    useEffect(() => {
        if(user) {
            // Fetch RPG State
            axios.post('http://localhost:8000/rpg/state', { user_id: user.id })
                .then(res => setState(res.data))
                .catch(err => console.error(err));
            
            // Fetch SBT Wallet
            axios.get(`http://localhost:8000/economy/wallet/${user.id}`)
                .then(res => setWallet(res.data))
                .catch(err => console.error(err));
        }
    }, [user]);

    const handleTravel = (targetId) => {
        if (targetId === state.current_region) return;
        setLoading(true);
        axios.post('http://localhost:8000/rpg/travel', { user_id: user.id, target_region: targetId })
            .then(res => {
                setState(prev => ({ ...prev, current_region: res.data.current_region }));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleMint = (skillName) => {
        setLoading(true);
        axios.post('http://localhost:8000/economy/mint-sbt', { user_id: user.id, skill: skillName })
            .then(res => {
                // FIXED: Removed window.alert entirely.
                setNotification({
                    status: 'success',
                    title: 'Skill Verified',
                    message: `Soulbound Token minted for ${skillName}.`,
                    hash: res.data.token
                });
                // Refresh wallet
                axios.get(`http://localhost:8000/economy/wallet/${user.id}`).then(r => setWallet(r.data));
                setLoading(false);
                
                // Auto-dismiss after 5s
                setTimeout(() => setNotification(null), 5000);
            })
            .catch(err => {
                setNotification({
                    status: 'error',
                    title: 'Minting Failed',
                    message: 'Network congestion or insufficient XP.'
                });
                setLoading(false);
            });
    };

    return (
        <div className="flex h-full w-full relative bg-[#020617] overflow-hidden">
            
            <AnimatePresence>
                {notification && (
                    <MintNotification result={notification} onClose={() => setNotification(null)} />
                )}
            </AnimatePresence>

            {/* LEFT: INFO PANEL */}
            <div className="w-80 bg-[#0a0f1e]/90 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col z-10 relative">
                <h2 className="text-xl font-bold text-white mb-2 tracking-widest">NEURAL ATLAS</h2>
                <p className="text-xs text-slate-400 mb-6">Navigate the network. Unlock nodes by solving algorithms.</p>
                
                <div className="bg-black/30 rounded-xl p-4 border border-white/5 mb-6">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase mb-2">Current Location</h3>
                    <p className="text-lg text-white font-mono">{state.current_region}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                        {REGIONS.find(r => r.id === state.current_region)?.desc}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-xs font-bold text-purple-400 uppercase mb-3 flex items-center gap-2">
                        <Icons.Badge /> Skill Wallet (SBTs)
                    </h3>
                    <div className="space-y-3">
                        {wallet.length === 0 && <p className="text-[10px] text-slate-600 italic">No soulbound tokens found.</p>}
                        {wallet.map((token, i) => (
                            <div key={i} className="bg-purple-900/10 border border-purple-500/20 p-3 rounded-lg">
                                <div className="text-xs text-white font-bold">{token.skill}</div>
                                <div className="text-[9px] text-purple-300/50 font-mono mt-1 truncate" title={token.hash}>
                                    Hash: {token.hash}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Simulated Mint Action for Demo */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <button 
                            onClick={() => handleMint("Recursion Architect")} 
                            disabled={loading}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded text-xs font-bold text-white uppercase hover:brightness-110 transition-all"
                        >
                            {loading ? "Minting on Chain..." : "Mint Verify (Test)"}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: 3D MAP */}
            <div className="flex-1 relative">
                <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    
                    {REGIONS.map(r => (
                        <RegionNode 
                            key={r.id} 
                            region={r} 
                            unlocked={state.unlocked_regions.includes(r.id)}
                            current={state.current_region === r.id}
                            onClick={handleTravel}
                        />
                    ))}

                    {/* Simple connections to Hub */}
                    {REGIONS.slice(1).map(r => (
                        <ConnectionLine key={r.id} start={REGIONS[0]} end={r} />
                    ))}
                </Canvas>
                <div className="absolute bottom-4 right-4 text-[10px] text-slate-500 font-mono">
                    Use Mouse to Pan/Zoom • Click Nodes to Travel
                </div>
            </div>
        </div>
    );
};

export default WorldMap;