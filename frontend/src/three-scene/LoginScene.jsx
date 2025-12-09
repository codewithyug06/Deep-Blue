import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { 
    Stars, Float, MeshDistortMaterial, shaderMaterial, Sparkles 
} from '@react-three/drei';
import * as THREE from 'three';

// --- 1. CUSTOM SHADERS ---

const HorizonMaterial = shaderMaterial(
  { 
    time: 0, 
    colorStart: new THREE.Color('#1e40af'), 
    colorEnd: new THREE.Color('#06b6d4')    
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform float time;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      
      float pulse = sin(time * 1.5 + position.y * 2.0) * 0.08;
      vec3 newPos = position + normal * pulse;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform float time;
    uniform vec3 colorStart;
    uniform vec3 colorEnd;

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);
      
      float noise = sin(vUv.x * 20.0 + time * 2.0) * sin(vUv.y * 20.0 - time);
      float band = step(0.9, sin(vUv.y * 50.0 + time * 5.0)); 
      
      vec3 baseColor = mix(colorStart, colorEnd, vUv.y + noise * 0.1);
      vec3 finalColor = baseColor + fresnel * vec3(0.8, 0.9, 1.0) + band * 0.1;
      
      gl_FragColor = vec4(finalColor, 0.9 + fresnel * 0.5);
    }
  `
);

extend({ HorizonMaterial });

// --- 2. SCENE ELEMENTS ---

const DebrisField = ({ count = 200 }) => {
    const mesh = useRef();
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 50;
            const x = (Math.random() - 0.5) * 50;
            const y = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            temp.push({ t, factor, speed, x, y, z });
        }
        return temp;
    }, [count]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        particles.forEach((particle, i) => {
            let { t, factor, speed, x, y, z } = particle;
            particle.t += speed;
            
            dummy.position.set(
                x + Math.cos((particle.t / 10) * factor) + (Math.sin(particle.t * 1) * factor) / 10,
                y + Math.sin((particle.t / 10) * factor) + (Math.cos(particle.t * 2) * factor) / 10,
                z + Math.cos((particle.t / 10) * factor) + (Math.sin(particle.t * 3) * factor) / 10
            );
            
            dummy.rotation.x = particle.t;
            dummy.rotation.y = particle.t;
            
            const s = Math.max(0.2, Math.cos(particle.t) * 0.5 + 0.5);
            dummy.scale.set(s, s, s);
            
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
        </instancedMesh>
    );
};

const HoloRings = () => {
    const group = useRef();
    
    useFrame((state) => {
        if(group.current) {
            group.current.rotation.z += 0.005;
            group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
        }
    });

    return (
        <group ref={group}>
            <mesh rotation={[1.5, 0, 0]}>
                <torusGeometry args={[5.5, 0.02, 16, 100]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
            </mesh>
            <mesh rotation={[2, 0.5, 0]}>
                <torusGeometry args={[6.5, 0.02, 16, 100]} />
                <meshBasicMaterial color="#818cf8" transparent opacity={0.3} />
            </mesh>
            <mesh rotation={[2.5, -0.5, 0]}>
                <torusGeometry args={[7.5, 0.01, 16, 100]} />
                <meshBasicMaterial color="#c084fc" transparent opacity={0.2} />
            </mesh>
        </group>
    );
}

const CoreSystem = () => {
    const shaderRef = useRef();
    
    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.time.value = state.clock.elapsedTime;
        }
    });

    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh>
                    <sphereGeometry args={[2.5, 64, 64]} />
                    <horizonMaterial ref={shaderRef} transparent />
                </mesh>
                
                <mesh>
                    <icosahedronGeometry args={[3.2, 2]} />
                    <MeshDistortMaterial 
                        color="#ffffff"
                        envMapIntensity={1} 
                        clearcoat={1} 
                        clearcoatRoughness={0} 
                        metalness={0.1}
                        transmission={0.5} 
                        opacity={0.3}
                        roughness={0}
                        distort={0.2}
                        speed={2}
                        transparent
                    />
                </mesh>
            </Float>
            <HoloRings />
        </group>
    );
};

// --- 3. MAIN SCENE ---

const LoginScene = () => {
  return (
    <div className="absolute inset-0 z-0 bg-[#020617]">
        <Canvas 
            camera={{ position: [0, 0, 16], fov: 45 }}
            gl={{ 
                antialias: true, 
                toneMapping: THREE.ReinhardToneMapping, 
                toneMappingExposure: 2, 
                alpha: false 
            }}
        >
            <color attach="background" args={['#020617']} />
            <fog attach="fog" args={['#020617', 10, 40]} />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={4} color="#3b82f6" />
            <pointLight position={[-10, -10, -5]} intensity={2} color="#a855f7" />
            <spotLight position={[0, 15, 0]} intensity={2} color="#06b6d4" penumbra={1} angle={0.5} />

            <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1.5} />
            <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#38bdf8" />
            
            {/* Grid Removed Here */}
            <CoreSystem />
            <DebrisField count={150} />

        </Canvas>
    </div>
  );
};

export default LoginScene;