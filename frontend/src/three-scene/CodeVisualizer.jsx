import React, { useRef, Suspense, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Html } from '@react-three/drei';
import { XR, VRButton, Controllers, Hands } from '@react-three/xr'; // Fixed Import
import * as THREE from 'three';

// --- Configuration for Node Styling ---
const NODE_STYLE_MAP = {
  'function': { color: '#3B82F6', size: 1.2, text: 'Function' },    // Blue Cube
  'loop': { color: '#10B981', size: 1.0, text: 'Loop' },          // Emerald Torus
  'decision': { color: '#F59E0B', size: 0.9, text: 'Decision' },      // Amber Diamond
  'statement': { color: '#F9FAFB', size: 0.5, text: 'Statement' },    // Gray Sphere
  'operation': { color: '#EC4899', size: 0.7, text: 'Action' },    // Pink Sphere
  'default': { color: '#ef4444', size: 0.5, text: 'Error' }        // Red
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

// --- FORCE LAYOUT HOOK ---
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

        // Repulsion
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
            // Center Drag
            forceX -= nodeA.position[0] * 0.01;
            forceY -= nodeA.position[1] * 0.01;
            forceZ -= nodeA.position[2] * 0.01;
            
            nodeA.velocity[0] = (nodeA.velocity[0] + forceX * safeDelta) * damping;
            nodeA.velocity[1] = (nodeA.velocity[1] + forceY * safeDelta) * damping;
            nodeA.velocity[2] = (nodeA.velocity[2] + forceZ * safeDelta) * damping;
        }
        
        // Attraction
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

// --- RENDER COMPONENTS ---

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

// "Data Flow" Particle
const PulseParticle = React.memo(({ startPos, endPos, active }) => {
    const meshRef = useRef();
    const [progress, setProgress] = useState(0);
    
    useFrame((state, delta) => {
        if (!active || !meshRef.current || !startPos || !endPos) {
            if(meshRef.current) meshRef.current.visible = false;
            return;
        }
        
        meshRef.current.visible = true;
        let newProgress = progress + delta * 2.0; // Speed of data flow
        if (newProgress > 1) newProgress = 0; // Loop or reset
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

const GraphNode = React.memo(({ position, type, label, isActive }) => {
    const style = NODE_STYLE_MAP[type?.toLowerCase()] || NODE_STYLE_MAP.default;
    const meshRef = useRef();
    const [hovered, setHover] = useState(false);
    
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.3;
            
            // Pulse effect if active (execution visiting this node)
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
            
            {/* 3D Label */}
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

            {/* Hover Annotation */}
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

const DynamicASTVisualization = ({ data, trace }) => {
    const positionedNodes = useForceLayout(data.nodes, data.links);
    const [activeNodeId, setActiveNodeId] = useState(null);
    const [activeLink, setActiveLink] = useState(null); // For particle flow

    // Trace Playback Logic
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
            // Find node corresponding to this line number
            // Note: AST parsing logic in backend needs to ensure 'lineno' is sent.
            const node = positionedNodes.find(n => n.lineno === lineNo);
            
            if (node) {
                // If we jumped from one node to another, trigger particle
                if (activeNodeId !== null && activeNodeId !== node.id) {
                    setActiveLink({ source: activeNodeId, target: node.id });
                }
                setActiveNodeId(node.id);
            }
            step++;
        }, 500); // 0.5s per step

        return () => clearInterval(interval);
    }, [trace, positionedNodes]);

    const positionedNodesMap = new Map(positionedNodes.map(n => [n.id, n]));
    
    const renderableLinks = data.links.map(link => {
        const sourceNode = positionedNodesMap.get(link.source);
        const targetNode = positionedNodesMap.get(link.target);
        const isFlowing = activeLink && activeLink.source === link.source && activeLink.target === link.target;
        
        return {
            key: `${link.source}-${link.target}`,
            startPos: sourceNode ? sourceNode.position : null,
            endPos: targetNode ? targetNode.position : null,
            active: isFlowing
        };
    }).filter(link => link.startPos && link.endPos);

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#4f46e5" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#ec4899" />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {positionedNodes.map((node) => (
                <GraphNode 
                    key={node.id} 
                    position={node.position} 
                    type={node.type} 
                    label={node.label} 
                    isActive={node.id === activeNodeId} 
                />
            ))}

            {renderableLinks.map((link) => (
                <React.Fragment key={link.key}>
                    <GraphLink startPos={link.startPos} endPos={link.endPos} />
                    {/* "Data Flow" Particle triggered by execution trace */}
                    <PulseParticle startPos={link.startPos} endPos={link.endPos} active={link.active} />
                </React.Fragment>
            ))}
            
            {/* VR Controllers & Hands */}
            <Controllers />
            <Hands />
            
            <OrbitControls enableDamping dampingFactor={0.05} />
        </>
    );
};

const CodeVisualizer = ({ data, trace }) => {
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
      {/* VR/WebXR Button Overlay */}
      <VRButton className="absolute bottom-4 right-4 z-50 px-4 py-2 bg-blue-600 rounded text-white text-xs font-bold uppercase tracking-widest shadow-lg" />
      
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} style={{ background: '#00000000' }}>
        <XR>
            <Suspense fallback={<Text color="white">Loading 3D Scene...</Text>}>
              <DynamicASTVisualization data={data} trace={trace} /> 
            </Suspense>
        </XR>
      </Canvas>
    </div>
  );
};

export default CodeVisualizer;