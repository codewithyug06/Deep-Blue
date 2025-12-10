// frontend/src/components/TheConstruct.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';

// --- Visual Components ---

// 1. The Stack Node (Variable Name)
const StackVar = ({ name, position, targetPos }) => {
  return (
    <group position={position}>
      {/* Variable Label */}
      <Text
        position={[-1.5, 0, 0]}
        fontSize={0.4}
        color="#00ff88"
        anchorX="right"
      >
        {name}
      </Text>
      
      {/* Anchor Point */}
      <Sphere args={[0.1, 16, 16]}>
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
      </Sphere>

      {/* The Laser Beam (Reference) */}
      {targetPos && (
        <Line
          points={[[0, 0, 0], targetPos]} // Draw line from Variable to Heap Object
          color="#00ffff"
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      )}
    </group>
  );
};

// 2. The Heap Object (Container/Value)
const HeapObject = ({ id, data, position }) => {
  const isContainer = data.children && data.children.length > 0;
  
  return (
    <group position={position}>
      {/* The Container Body */}
      {isContainer ? (
        <Box args={[1.5, 1.5, 1.5]}>
          <meshPhysicalMaterial 
            color="#2a2a2a" 
            transparent 
            opacity={0.8} 
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
          />
        </Box>
      ) : (
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#ff0088" roughness={0.4} />
        </Sphere>
      )}

      {/* Floating ID/Type Label */}
      <Text position={[0, 1.2, 0]} fontSize={0.25} color="white">
        {data.type} (id: {id.slice(-4)})
      </Text>
      
      {/* The Value Inside */}
      <Text position={[0, 0, 0.6]} fontSize={0.3} color="white">
         {isContainer ? "..." : data.value}
      </Text>
    </group>
  );
};

// --- Main Scene Logic ---

const MemoryScene = ({ currentFrame }) => {
  if (!currentFrame) return null;

  const { stack, heap } = currentFrame;

  // Layout Logic: Map IDs to 3D positions
  // In a real app, use a force-graph library here. 
  // For this demo, we calculate simple rows/columns.
  
  const heapPositions = useMemo(() => {
    const posMap = {};
    const ids = Object.keys(heap);
    ids.forEach((id, index) => {
      // Position Heap objects in a semi-circle or grid on the right
      posMap[id] = [
        4 + (index % 3) * 2.5,  // X (Spread to right)
        (Math.floor(index / 3) * -2.5) + 2, // Y (Spread down)
        0 // Z
      ];
    });
    return posMap;
  }, [heap]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Render Stack (Variables) on the Left */}
      {Object.entries(stack).map(([varName, refId], idx) => {
        // Stack grows downwards
        const stackPos = [-4, 3 - (idx * 1.5), 0]; 
        // Find where the laser needs to point
        const targetPos = heapPositions[refId] ? 
          [heapPositions[refId][0] - stackPos[0], heapPositions[refId][1] - stackPos[1], 0] 
          : null;

        return (
          <StackVar 
            key={varName} 
            name={varName} 
            position={stackPos} 
            targetPos={targetPos} 
          />
        );
      })}

      {/* Render Heap (Objects) on the Right */}
      {Object.entries(heap).map(([objId, objData]) => (
        <HeapObject 
          key={objId} 
          id={objId} 
          data={objData} 
          position={heapPositions[objId] || [0,0,0]} 
        />
      ))}
    </>
  );
};

// --- Exported Component ---

export default function TheConstruct({ traceData }) {
  // traceData comes from the Python backend
  const [step, setStep] = useState(0);

  // Auto-play effect (Optional)
  useEffect(() => {
    if(!traceData) return;
    const interval = setInterval(() => {
        setStep((prev) => (prev + 1) % traceData.length);
    }, 1500); // Change step every 1.5s
    return () => clearInterval(interval);
  }, [traceData]);

  if (!traceData || traceData.length === 0) return <div>Loading Construct...</div>;

  return (
    <div style={{ width: '100%', height: '500px', background: '#111' }}>
      <div style={{position: 'absolute', color: 'white', zIndex: 10, padding: '10px'}}>
        <h3>The Construct: Step {step + 1}/{traceData.length}</h3>
        <p>Line: {traceData[step].line}</p>
      </div>
      
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        <OrbitControls />
        <gridHelper args={[20, 20, 0x222222, 0x111111]} rotation={[Math.PI/2, 0, 0]} />
        
        <MemoryScene currentFrame={traceData[step]} />
      </Canvas>
    </div>
  );
}