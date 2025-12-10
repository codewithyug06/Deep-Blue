import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    Stars, Float, Sparkles, Icosahedron, Torus, Sphere
} from '@react-three/drei';
import * as THREE from 'three';

// --- Reusing the aesthetic from LoginScene but optimized for content ---

const FloatingGrid = () => {
  return (
    <group rotation={[1.6, 0, 0]} position={[0, -5, 0]}>
      <gridHelper args={[50, 50, 0x1e40af, 0x1e40af]} position={[0, 0, 0]} />
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

const DataStream = ({ count = 50 }) => {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            position: [
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            ],
            speed: 0.02 + Math.random() * 0.05,
            factor: Math.random() * 10
        }));
    }, [count]);

    useFrame(() => {
        particles.forEach((p, i) => {
            p.position[1] += p.speed;
            if (p.position[1] > 10) p.position[1] = -10;
            
            dummy.position.set(p.position[0], p.position[1], p.position[2]);
            dummy.scale.setScalar(0.05);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <boxGeometry args={[1, 5, 1]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} />
        </instancedMesh>
    );
};

const BackgroundObjects = () => (
    <group>
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <Torus position={[-8, 2, -10]} args={[4, 0.1, 16, 100]} rotation={[0.5, 0.5, 0]}>
                <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} wireframe />
            </Torus>
        </Float>
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Icosahedron position={[10, -5, -15]} args={[3, 0]}>
                <meshStandardMaterial color="#a855f7" transparent opacity={0.1} wireframe />
            </Icosahedron>
        </Float>
    </group>
);

const HomeScene = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
            <color attach="background" args={['#020617']} />
            <fog attach="fog" args={['#020617', 5, 30]} />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={2} color="#3b82f6" />
            <pointLight position={[-10, -5, -5]} intensity={2} color="#a855f7" />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={300} scale={20} size={1.5} speed={0.2} opacity={0.5} color="#38bdf8" />
            
            <FloatingGrid />
            <DataStream />
            <BackgroundObjects />
        </Canvas>
        
        {/* Cinematic Vignette & Grain Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-80"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
    </div>
  );
};

export default HomeScene;