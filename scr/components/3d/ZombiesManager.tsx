import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Zombie } from '../../types';
import { createMilitaryFatigueTextures } from '../../utils/proceduralTextures';

interface ZombiesManagerProps {
  zombies: Zombie[];
  playerPosition: [number, number, number];
}

export const ZombiesManager: React.FC<ZombiesManagerProps> = ({ zombies }) => {
  const camoTexture = useMemo(() => createMilitaryFatigueTextures(), []);

  return (
    <group>
      {zombies.map((zombie) => (
        <ZombieMesh key={zombie.id} zombie={zombie} camoTexture={camoTexture} />
      ))}
    </group>
  );
};

const ZombieMesh: React.FC<{ zombie: Zombie; camoTexture: THREE.CanvasTexture }> = ({
  zombie,
  camoTexture,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Position and direction
    groupRef.current.position.set(...zombie.position);
    groupRef.current.rotation.y = zombie.rotation;

    // Walking animation cycle
    const phase = state.clock.elapsedTime * zombie.speed * 4;

    if (leftArmRef.current && rightArmRef.current) {
      // Outstretched zombie arms with walking sway
      leftArmRef.current.rotation.x = -1.2 + Math.sin(phase) * 0.2;
      rightArmRef.current.rotation.x = -1.2 - Math.sin(phase) * 0.2;

      leftArmRef.current.rotation.z = 0.15;
      rightArmRef.current.rotation.z = -0.15;
    }

    if (headRef.current) {
      // Head tilt
      headRef.current.rotation.z = Math.sin(phase * 0.5) * 0.1;
      headRef.current.rotation.x = Math.cos(phase * 0.5) * 0.08;
    }
  });

  const isDying = zombie.state === 'dying';

  return (
    <group
      ref={groupRef}
      scale={isDying ? [1, 0.2, 1] : [1, 1, 1]} // Crumble scale if dying
    >
      {/* Spiderweb Stun Cage (Widow's Wine Trap) */}
      {zombie.isWebStunned && (
        <group position={[0, 1.1, 0]}>
          <mesh>
            <sphereGeometry args={[1.15, 12, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#f8fafc"
              emissiveIntensity={1.5}
              wireframe
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.9, 0.9, 2.0, 8]} />
            <meshBasicMaterial
              color="#e2e8f0"
              wireframe
              transparent
              opacity={0.6}
            />
          </mesh>
          <pointLight color="#ffffff" intensity={10} distance={5} />
        </group>
      )}

      {/* Soul Burst when defeated */}
      {isDying && (
        <group position={[0, 1.0, 0]}>
          <mesh>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
          </mesh>
          <pointLight color="#dc2626" intensity={25} distance={8} />
        </group>
      )}

      {/* Torso in Torn Military Fatigues */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial map={camoTexture} roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Tattered Tactical Vest */}
      <mesh position={[0, 1.2, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.72, 0.42]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Decaying Head */}
      <group ref={headRef} position={[0, 1.9, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.45, 0.42]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>

        {/* GLOWING AMBER/RED ZOMBIE EYES */}
        <mesh position={[-0.1, 0.05, 0.22]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.22]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <pointLight position={[0, 0.05, 0.3]} color="#dc2626" intensity={4} distance={3} />
      </group>

      {/* Left Arm with Tactical Gauntlet */}
      <group ref={leftArmRef} position={[-0.45, 1.5, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshStandardMaterial map={camoTexture} roughness={0.85} />
        </mesh>
        {/* Gauntlet */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.22, 0.25, 0.22]} />
          <meshStandardMaterial color="#020617" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>

      {/* Right Arm with Tactical Gauntlet */}
      <group ref={rightArmRef} position={[0.45, 1.5, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshStandardMaterial map={camoTexture} roughness={0.85} />
        </mesh>
        {/* Gauntlet */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.22, 0.25, 0.22]} />
          <meshStandardMaterial color="#020617" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>

      {/* Legs in Combat Trousers */}
      <mesh position={[-0.2, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial map={camoTexture} roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial map={camoTexture} roughness={0.9} />
      </mesh>
    </group>
  );
};
