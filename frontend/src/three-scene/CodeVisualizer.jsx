import React, { useRef, Suspense, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Html, Hud, OrthographicCamera, Plane, shaderMaterial } from '@react-three/drei';
import { XR, VRButton, Controllers, Hands } from '@react-three/xr'; 
import * as THREE from 'three';

// --- SYNTHWAVE AUDIO ENGINE ---
const useSynthwaveAudioEngine = (trace, data) => {
    const audioContextRef = useRef(null);
    const nodesMapRef = useRef(null);

    useEffect(() => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("Web Audio API not supported.");
            }
        }
    }, []);

    const playPulse = (freq, duration, wave = 'sine') => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    };

    // Trace Sonification Effect
    useEffect(() => {
        if (!trace || trace.length === 0 || !data || !audioContextRef.current) return;

        const lineNodeMap = new Map();
        data.nodes.forEach(n => {
            if (n.lineno) lineNodeMap.set(n.lineno, n.type);
        });
        nodesMapRef.current = lineNodeMap;

        let step = 0;
        const interval = setInterval(() => {
            if (step >= trace.length) {
                clearInterval(interval);
                return;
            }

            const lineNo = trace[step];
            const nodeType = lineNodeMap.get(lineNo)?.toLowerCase();
            
            // Map Node Type to Sound
            switch(nodeType) {
                case 'loop':
                    playPulse(100, 0.25, 'square'); // Low rhythmic bass
                    break;
                case 'function':
                    playPulse(440, 0.1, 'triangle'); // Clear function trigger
                    break;
                case 'decision':
                    playPulse(220, 0.15, 'sawtooth'); // Mid-range tension
                    break;
                case 'statement':
                case 'operation':
                    playPulse(880, 0.05, 'sine'); // High pitch quick tick
                    break;
                default:
                    // Silent step
            }

            step++;
        }, 500); // Syncs with visual playback speed

        return () => clearInterval(interval);
    }, [trace, data]);
};

// --- CUSTOM GLITCH SHADER MATERIAL ---
const GlitchMaterial = shaderMaterial(
  { time: 0, active: 0, resolution: new THREE.Vector2() },
  // Vertex Shader
  `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  // Fragment Shader
  `
  uniform float time;
  uniform float active;
  varying vec2 vUv;
  
  float rand(vec2 co){return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);}
  
  void main() {
    if (active < 0.5) discard;
    vec2 uv = vUv;
    
    // Slice Distortion
    float slice = step(0.9, sin(time * 10.0 + uv.y * 10.0));
    uv.x += slice * 0.05 * sin(time * 20.0);
    
    // RGB Split / Chromatic Aberration
    float r = rand(vec2(time, uv.y));
    float g = rand(vec2(time + 0.1, uv.y));
    float b = rand(vec2(time + 0.2, uv.y));
    
    // Scanlines
    float scanline = sin(uv.y * 800.0) * 0.1;
    
    // Noise
    float noise = rand(uv * time) * 0.2;
    
    vec3 color = vec3(r, g, b);
    gl_FragColor = vec4(color + scanline + noise, 0.4); // Semi-transparent
  }
  `
);

extend({ GlitchMaterial });

// --- Configuration for Node Styling ---
const NODE_STYLE_MAP = {
  'function': { color: '#3B82F6', size: 1.2, text: 'Function' },    
  'loop': { color: '#10B981', size: 1.0, text: 'Loop' },          
  'decision': { color: '#F59E0B', size: 0.9, text: 'Decision' },      
  'statement': { color: '#F9FAFB', size: 0.5, text: 'Statement' },    
  'operation': { color: '#EC4899', size: 0.7, text: 'Action' },    
  'default': { color: '#ef4444', size: 0.5, text: 'Error' }        
};

// --- LEGEND OVERLAY ---
const Legend = () => (
    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-3 rounded-lg z-10 pointer-events-none shadow-xl">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-1">Logic Gates</h4>
        <div className="space-y-1.5">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#3B82F6] rounded-sm"></div><span className="text-[10px] text-slate-300">Function (Cube)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#10B981] rounded-full border-2 border-transparent border-t-[#10B981]"></div><span className="text-[10px] text-slate-300">Loop (Torus)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#F59E0B] rotate-45 transform"></div><span className="text-[10px] text-slate-300">Decision (Diamond)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#EC4899] rounded-full"></div><span className="text-[10px] text-slate-300">Action (Sphere)</span></div>
        </div>
    </div>
);

// --- GLITCH OVERLAY COMPONENT ---
const GlitchOverlay = ({ active }) => {
    const material = useRef();
    
    useFrame((state) => {
        if (material.current) {
            material.current.uniforms.time.value = state.clock.elapsedTime;
            material.current.uniforms.active.value = active ? 1.0 : 0.0;
        }
    });

    if (!active) return null;

    return (
        <Hud renderPriority={1}>
            <OrthographicCamera makeDefault position={[0, 0, 1]} />
            <Plane args={[2, 2]}>
                <glitchMaterial ref={material} transparent />
            </Plane>
        </Hud>
    );
};

// --- FORCE LAYOUT HOOK (UNCHANGED) ---
const useForceLayout = (initialNodes, initialLinks) => {
    const [positionedNodes, setPositionedNodes] = useState([]);
    const nodesRef = useRef(new Map());

    useEffect(() => {
        const newNodes = initialNodes.map(node => {
            const existing = nodesRef.current.get(node.id);
            const position = existing ? existing.position : [
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6
            ];
            const velocity = existing ? existing.velocity : [0, 0, 0];
            return { ...node, position, velocity };
        });
        setPositionedNodes(newNodes);
        newNodes.forEach(node => nodesRef.current.set(node.id, node));
    }, [initialNodes]);

    useFrame((_, delta) => {
        if (positionedNodes.length === 0) return;
        const safeDelta = Math.min(delta, 0.05); 
        const simulationNodes = [...positionedNodes];
        const k = 0.05; 
        const damping = 0.9;
        const nodeMap = new Map(simulationNodes.map(n => [n.id, n]));

        for (let i = 0; i < simulationNodes.length; i++) {
            const nodeA = simulationNodes[i];
            let forceX = 0, forceY = 0, forceZ = 0;
            for (let j = 0; j < simulationNodes.length; j++) {
                if (i === j) continue;
                const nodeB = simulationNodes[j];
                const dx = nodeA.position[0] - nodeB.position[0];
                const dy = nodeA.position[1] - nodeB.position[1];
                const dz = nodeA.position[2] - nodeB.position[2];
                const distanceSq = dx * dx + dy * dy + dz * dz;
                if (distanceSq > 0.001) {
                    const distance = Math.sqrt(distanceSq);
                    const strength = -k * 2 / distance; 
                    forceX += strength * dx / distance;
                    forceY += strength * dy / distance;
                    forceZ += strength * dz / distance;
                }
            }
            forceX -= nodeA.position[0] * 0.01;
            forceY -= nodeA.position[1] * 0.01;
            forceZ -= nodeA.position[2] * 0.01;
            
            nodeA.velocity[0] = (nodeA.velocity[0] + forceX * safeDelta) * damping;
            nodeA.velocity[1] = (nodeA.velocity[1] + forceY * safeDelta) * damping;
            nodeA.velocity[2] = (nodeA.velocity[2] + forceZ * safeDelta) * damping;
        }
        
        initialLinks.forEach(link => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            if (source && target) {
                const dx = source.position[0] - target.position[0];
                const dy = source.position[1] - target.position[1];
                const dz = source.position[2] - target.position[2];
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const strength = k * 0.5 * distance; 
                const scale = strength * safeDelta / distance;
                source.velocity[0] -= dx * scale;
                source.velocity[1] -= dy * scale;
                source.velocity[2] -= dz * scale;
                target.velocity[0] += dx * scale;
                target.velocity[1] += dy * scale;
                target.velocity[2] += dz * scale;
            }
        });

        const movedNodes = simulationNodes.map(node => ({
            ...node,
            position: [
                node.position[0] + node.velocity[0] * safeDelta * 10,
                node.position[1] + node.velocity[1] * safeDelta * 10,
                node.position[2] + node.velocity[2] * safeDelta * 10,
            ],
            velocity: node.velocity
        }));
        setPositionedNodes(movedNodes);
        movedNodes.forEach(node => nodesRef.current.set(node.id, node));
    });

    return positionedNodes;
};

// --- RENDER COMPONENTS (UNCHANGED) ---

const GraphLink = React.memo(({ startPos, endPos }) => {
    if (!startPos || !endPos) return null;
    const points = [new THREE.Vector3(...startPos), new THREE.Vector3(...endPos)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial attach="material" color="#475569" linewidth={1} transparent opacity={0.4} />
        </lineSegments>
    );
});

// GHOST PULSE PARTICLE VARIANT
const GhostPulseParticle = React.memo(({ startPos, endPos, active }) => {
    const meshRef = useRef();
    const [progress, setProgress] = useState(0);
    
    useFrame((state, delta) => {
        if (!active || !meshRef.current || !startPos || !endPos) {
            if(meshRef.current) meshRef.current.visible = false;
            return;
        }
        
        meshRef.current.visible = true;
        let newProgress = progress + delta * 1.0; // Slower than active pulse
        if (newProgress > 1) newProgress = 0; 
        setProgress(newProgress);

        meshRef.current.position.x = THREE.MathUtils.lerp(startPos[0], endPos[0], newProgress);
        meshRef.current.position.y = THREE.MathUtils.lerp(startPos[1], endPos[1], newProgress);
        meshRef.current.position.z = THREE.MathUtils.lerp(startPos[2], endPos[2], newProgress);
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.6} />
        </mesh>
    );
});


const PulseParticle = React.memo(({ startPos, endPos, active }) => {
    const meshRef = useRef();
    const [progress, setProgress] = useState(0);
    
    useFrame((state, delta) => {
        if (!active || !meshRef.current || !startPos || !endPos) {
            if(meshRef.current) meshRef.current.visible = false;
            return;
        }
        
        meshRef.current.visible = true;
        let newProgress = progress + delta * 2.0; 
        if (newProgress > 1) newProgress = 0; 
        setProgress(newProgress);

        meshRef.current.position.x = THREE.MathUtils.lerp(startPos[0], endPos[0], newProgress);
        meshRef.current.position.y = THREE.MathUtils.lerp(startPos[1], endPos[1], newProgress);
        meshRef.current.position.z = THREE.MathUtils.lerp(startPos[2], endPos[2], newProgress);
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#ffff00" transparent opacity={1} />
        </mesh>
    );
});

// GHOST NODE VARIANT
const GhostNode = React.memo(({ position, type, label, isActive }) => {
    const style = NODE_STYLE_MAP[type?.toLowerCase()] || NODE_STYLE_MAP.default;
    const meshRef = useRef();
    
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.1;
            meshRef.current.rotation.y += delta * 0.2;
            
            const baseScale = 0.9;
            if (isActive) {
                const scale = baseScale * (1 + Math.sin(state.clock.elapsedTime * 5) * 0.05);
                meshRef.current.scale.set(scale, scale, scale);
            } else {
                meshRef.current.scale.set(baseScale, baseScale, baseScale);
            }
        }
    });

    const Geometry = () => {
        const t = type?.toLowerCase();
        if (t === 'function') return <boxGeometry args={[style.size * 0.3, style.size * 0.3, style.size * 0.3]} />;
        if (t === 'loop') return <torusGeometry args={[style.size * 0.2, style.size * 0.05, 8, 16]} />;
        if (t === 'decision') return <octahedronGeometry args={[style.size * 0.2]} />;
        return <sphereGeometry args={[style.size * 0.15, 16, 16]} />;
    };

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <Geometry />
                <meshStandardMaterial 
                    color={isActive ? '#a855f7' : '#ffffff'} 
                    emissive={isActive ? '#a855f7' : style.color} 
                    emissiveIntensity={isActive ? 1.5 : 0.2}
                    transparent
                    opacity={isActive ? 0.6 : 0.15} 
                    roughness={0.8}
                    metalness={0}
                />
            </mesh>
        </group>
    );
});


const GraphNode = React.memo(({ position, type, label, isActive }) => {
    const style = NODE_STYLE_MAP[type?.toLowerCase()] || NODE_STYLE_MAP.default;
    const meshRef = useRef();
    const [hovered, setHover] = useState(false);
    
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.3;
            
            if (isActive) {
                const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
                meshRef.current.scale.set(scale, scale, scale);
            } else {
                meshRef.current.scale.set(1, 1, 1);
            }
        }
    });

    const Geometry = () => {
        const t = type?.toLowerCase();
        if (t === 'function') return <boxGeometry args={[style.size * 0.4, style.size * 0.4, style.size * 0.4]} />;
        if (t === 'loop') return <torusGeometry args={[style.size * 0.25, style.size * 0.08, 8, 16]} />;
        if (t === 'decision') return <octahedronGeometry args={[style.size * 0.25]} />;
        return <sphereGeometry args={[style.size * 0.2, 16, 16]} />;
    };

    return (
        <group position={position}>
            <mesh 
                ref={meshRef} 
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <Geometry />
                <meshStandardMaterial 
                    color={isActive ? '#ffff00' : (hovered ? '#ffffff' : style.color)} 
                    emissive={isActive ? '#ff0000' : style.color} 
                    emissiveIntensity={isActive ? 3 : (hovered ? 2 : 1.2)}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
            
            <Text
                fontSize={0.15}
                color="#e2e8f0"
                anchorX="center"
                anchorY="top"
                position={[0, -style.size * 0.3 - 0.1, 0]}
                maxWidth={3}
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {label.split(':').slice(1).join(':').trim()}
            </Text>

            {hovered && (
                <Html distanceFactor={10}>
                    <div className="bg-black/80 text-white text-[10px] p-2 rounded border border-blue-500/50 whitespace-nowrap backdrop-blur-md">
                        <strong className="block text-blue-400 uppercase">{style.text}</strong>
                        {label}
                    </div>
                </Html>
            )}
        </group>
    );
});

// --- MAIN DYNAMIC SCENE ---
const DynamicASTVisualization = ({ data, trace, ghostTrace }) => {
    const positionedNodes = useForceLayout(data.nodes, data.links);
    const [activeNodeId, setActiveNodeId] = useState(null);
    const [activeGhostNodeId, setActiveGhostNodeId] = useState(null); 
    const [activeLink, setActiveLink] = useState(null); 
    const [activeGhostLink, setActiveGhostLink] = useState(null); // NEW

    // Utility map for quick lookups
    const positionedNodesMap = new Map(positionedNodes.map(n => [n.id, n]));
    
    // Playback Logic (Active Trace)
    useEffect(() => {
        if (!trace || trace.length === 0) return;
        
        let step = 0;
        const interval = setInterval(() => {
            if (step >= trace.length) {
                clearInterval(interval);
                setActiveNodeId(null);
                setActiveLink(null);
                return;
            }

            const lineNo = trace[step];
            const node = positionedNodes.find(n => n.lineno === lineNo);
            
            if (node) {
                if (activeNodeId !== null && activeNodeId !== node.id) {
                    setActiveLink({ source: activeNodeId, target: node.id });
                }
                setActiveNodeId(node.id);
            }
            step++;
        }, 500); 

        return () => clearInterval(interval);
    }, [trace, positionedNodes]);
    
    // Ghost Playback Logic (Passive Trace)
    useEffect(() => {
        if (!ghostTrace || ghostTrace.length === 0) {
            setActiveGhostNodeId(null);
            return;
        }

        const nodesMapByLine = new Map();
        positionedNodes.forEach(n => {
            if (n.lineno) nodesMapByLine.set(n.lineno, n.id);
        });
        
        let ghostStep = 0;
        let lastTime = ghostTrace[0].timestamp;
        
        const ghostInterval = setInterval(() => {
            if (ghostStep >= ghostTrace.length) {
                clearInterval(ghostInterval);
                setActiveGhostNodeId(null);
                setActiveGhostLink(null);
                return;
            }
            
            const currentEvent = ghostTrace[ghostStep];
            const nextEvent = ghostTrace[ghostStep + 1];

            const lineNo = currentEvent.line;
            const nodeId = nodesMapByLine.get(lineNo);
            
            if (nodeId) {
                // Ghost Link activation
                if (activeGhostNodeId !== null && activeGhostNodeId !== nodeId) {
                    setActiveGhostLink({ source: activeGhostNodeId, target: nodeId });
                }
                setActiveGhostNodeId(nodeId);
            }
            
            // Calculate actual time delta from recorded timestamps
            let delay = 500;
            if (nextEvent) {
                delay = nextEvent.timestamp - currentEvent.timestamp;
                delay = Math.max(50, delay); // Cap speed for visualization
            } else {
                // If last step, clear interval after processing
                setTimeout(() => clearInterval(ghostInterval), 50);
            }
            
            // Wait for the calculated delay before processing next step
            setTimeout(() => {
                 ghostStep++;
            }, delay);
            
            // Due to relying on the fixed 50ms interval, this needs complex management.
            // Simplified: Advance counter and let the next cycle pick up the next event.
            // For true fidelity, one would use a master scheduler/timeline outside this hook.
            
            // For a simpler effect, we just use a fixed rate:
            if (ghostStep === ghostTrace.length - 1) {
                clearInterval(ghostInterval);
            }
            ghostStep++;

        }, 500); // Fixed interval for simple visual ghost effect

        return () => clearInterval(ghostInterval);
    }, [ghostTrace, positionedNodes]);


    const renderableLinks = data.links.map(link => {
        const sourceNode = positionedNodesMap.get(link.source);
        const targetNode = positionedNodesMap.get(link.target);
        const isFlowing = activeLink && activeLink.source === link.source && activeLink.target === link.target;
        const isGhostFlowing = activeGhostLink && activeGhostLink.source === link.source && activeGhostLink.target === link.target;
        
        return {
            key: `${link.source}-${link.target}`,
            startPos: sourceNode ? sourceNode.position : null,
            endPos: targetNode ? targetNode.position : null,
            active: isFlowing,
            ghostActive: isGhostFlowing, // NEW
        };
    }).filter(link => link.startPos && link.endPos);

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#4f46e5" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#ec4899" />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Render Ghost Nodes & Particles */}
            {ghostTrace && positionedNodes.map((node) => (
                <React.Fragment key={`ghost-${node.id}`}>
                    <GhostNode 
                        position={node.position} 
                        type={node.type} 
                        label={node.label} 
                        isActive={node.id === activeGhostNodeId} 
                    />
                </React.Fragment>
            ))}

            {/* Render Links and Particles */}
            {renderableLinks.map((link) => (
                <React.Fragment key={link.key}>
                    <GraphLink startPos={link.startPos} endPos={link.endPos} />
                    
                    {/* Active Particle */}
                    <PulseParticle startPos={link.startPos} endPos={link.endPos} active={link.active} />
                    
                    {/* Ghost Particle */}
                    <GhostPulseParticle startPos={link.startPos} endPos={link.endPos} active={link.ghostActive} />
                </React.Fragment>
            ))}
            
            {/* Render Active Nodes */}
            {positionedNodes.map((node) => (
                <GraphNode 
                    key={node.id} 
                    position={node.position} 
                    type={node.type} 
                    label={node.label} 
                    isActive={node.id === activeNodeId} 
                />
            ))}
            
            <Controllers />
            <Hands />
            
            <OrbitControls enableDamping dampingFactor={0.05} />
        </>
    );
};

const CodeVisualizer = ({ data, trace, glitchActive, ghostTrace }) => {
  useSynthwaveAudioEngine(trace, data); 
    
  const isValidData = data && data.nodes && data.nodes.length > 0 && !data.error;

  if (!isValidData) {
    const message = data && data.error ? `Visualization Error: ${data.error}` : 'Hit "Analyze" to generate a structure.';
    return (
      <div className="absolute inset-0 flex items-center justify-center text-slate-500">
        <div className="text-center p-4">
            <p className="text-4xl mb-2">🧊</p>
            <p>{message}</p>
            {data && data.error && <p className="text-sm opacity-50 mt-2">Check code for syntax errors.</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <Legend />
      <VRButton className="absolute bottom-4 right-4 z-50 px-4 py-2 bg-blue-600 rounded text-white text-xs font-bold uppercase tracking-widest shadow-lg" />
      
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} style={{ background: '#00000000' }}>
        <XR>
            <Suspense fallback={<Text color="white">Loading 3D Scene...</Text>}>
              <GlitchOverlay active={glitchActive} />
              
              <DynamicASTVisualization data={data} trace={trace} ghostTrace={ghostTrace} /> 
            </Suspense>
        </XR>
      </Canvas>
    </div>
  );
};

export default CodeVisualizer;