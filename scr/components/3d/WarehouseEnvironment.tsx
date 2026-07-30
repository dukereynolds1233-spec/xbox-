import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createConcreteFloorPBRTextures, createWallPBRTextures } from '../../utils/proceduralTextures';

export const WarehouseEnvironment: React.FC = () => {
  const particlesRef = useRef<THREE.Group>(null);

  // Generate PBR texture sets for concrete/mud floor and bullet-pocked stone walls
  const floorTextures = useMemo(() => createConcreteFloorPBRTextures(), []);
  const wallTextures = useMemo(() => createWallPBRTextures(), []);

  // Generate atmospheric soot specks, ash, and smoke particles across expanded arena
  const dustParticles = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 140,
      y: 0.5 + Math.random() * 8,
      z: (Math.random() - 0.5) * 140,
      speedY: 0.15 + Math.random() * 0.35,
      speedX: (Math.random() - 0.5) * 0.15,
      scale: 0.03 + Math.random() * 0.06,
      color: i % 3 === 0 ? '#475569' : i % 3 === 1 ? '#e2e8f0' : '#1e293b',
    }));
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    particlesRef.current.children.forEach((child, idx) => {
      const p = dustParticles[idx];
      if (p) {
        child.position.y += p.speedY * delta;
        child.position.x += p.speedX * delta;
        if (child.position.y > 9) {
          child.position.y = 0.5;
          child.position.x = (Math.random() - 0.5) * 140;
        }
      }
    });
  });

  return (
    <group>
      {/* 1. Cracked, Soot-Stained Concrete & Pooling Mud Floor (150x150) */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 150, 64, 64]} />
        <meshStandardMaterial
          map={floorTextures.diffTex}
          normalMap={floorTextures.normTex}
          roughnessMap={floorTextures.roughTex}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>

      {/* Industrial Grid markings */}
      <gridHelper args={[150, 150, '#1e293b', '#0f172a']} position={[0, 0.01, 0]} />

      {/* Water & Pooling Mud Puddles Reflecting Room Lights */}
      {[
        { x: -16, z: -14, r: 5.5 },
        { x: 18, z: 16, r: 6.2 },
        { x: -32, z: 28, r: 5.8 },
        { x: 30, z: -28, r: 5.2 },
        { x: 0, z: -35, r: 6.5 },
        { x: -45, z: -45, r: 7.0 },
        { x: 45, z: 45, r: 6.8 },
        { x: -45, z: 45, r: 6.0 },
        { x: 45, z: -45, r: 6.4 },
      ].map((p, i) => (
        <mesh key={`puddle-${i}`} position={[p.x, 0.015, p.z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[p.r, 24]} />
          <meshStandardMaterial
            color="#090d16"
            roughness={0.03}
            metalness={0.9}
            transparent
            opacity={0.88}
          />
        </mesh>
      ))}

      {/* Yellow/Black Industrial Hazard Border around Central Support Structure */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3.2, 4]} />
        <meshStandardMaterial color="#d97706" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Pack-a-Punch Pedestal Area */}
      <mesh position={[0, 0.02, -45]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.5, 8]} />
        <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={2.5} />
      </mesh>

      {/* Ammo Refill Crate Pedestal Area */}
      <mesh position={[25, 0.02, -35]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 2.2, 6]} />
        <meshStandardMaterial color="#16a34a" emissive="#15803d" emissiveIntensity={2.5} />
      </mesh>

      {/* Heavy Dried Blood Splatters across Floor */}
      {[
        { x: -15, z: 12, scale: 2.8 },
        { x: 17, z: -20, scale: 3.2 },
        { x: -34, z: -28, scale: 3.5 },
        { x: 32, z: 20, scale: 2.9 },
        { x: 0, z: 28, scale: 3.0 },
        { x: -50, z: 10, scale: 3.5 },
        { x: 50, z: -10, scale: 3.2 },
      ].map((b, i) => (
        <mesh key={`blood-${i}`} position={[b.x, 0.025, b.z]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
          <circleGeometry args={[b.scale, 12]} />
          <meshStandardMaterial color="#3f0707" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}

      {/* VOLUMETRIC COLD MOONLIGHT LIGHT SHAFTS */}
      {[
        { pos: [-30, 8, -30] as [number, number, number], rot: [0.35, 0.2, -0.2] as [number, number, number] },
        { pos: [32, 8, 28] as [number, number, number], rot: [0.35, -0.3, 0.15] as [number, number, number] },
        { pos: [0, 9, 32] as [number, number, number], rot: [-0.3, 0.1, 0.1] as [number, number, number] },
        { pos: [-40, 8, 30] as [number, number, number], rot: [0.2, 0.1, -0.1] as [number, number, number] },
        { pos: [40, 8, -30] as [number, number, number], rot: [0.2, -0.1, 0.1] as [number, number, number] },
      ].map((ray, i) => (
        <group key={`godray-${i}`} position={ray.pos} rotation={ray.rot}>
          <mesh>
            <cylinderGeometry args={[0.8, 6.0, 18, 16, 1, true]} />
            <meshBasicMaterial
              color="#94a3b8"
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <spotLight
            color="#cbd5e1"
            intensity={35}
            distance={35}
            angle={0.6}
            penumbra={0.9}
          />
        </group>
      ))}

      {/* Arena Outer Walls (150x150, Bounds at -75 and +75) */}
      {/* Back Wall */}
      <mesh position={[0, 6, -75]} receiveShadow castShadow>
        <boxGeometry args={[150, 12, 1.5]} />
        <meshStandardMaterial
          map={wallTextures.diffTex}
          normalMap={wallTextures.normTex}
          roughnessMap={wallTextures.roughTex}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      {/* Front Wall */}
      <mesh position={[0, 6, 75]} receiveShadow castShadow>
        <boxGeometry args={[150, 12, 1.5]} />
        <meshStandardMaterial
          map={wallTextures.diffTex}
          normalMap={wallTextures.normTex}
          roughnessMap={wallTextures.roughTex}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-75, 6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[150, 12, 1.5]} />
        <meshStandardMaterial
          map={wallTextures.diffTex}
          normalMap={wallTextures.normTex}
          roughnessMap={wallTextures.roughTex}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      {/* Right Wall */}
      <mesh position={[75, 6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[150, 12, 1.5]} />
        <meshStandardMaterial
          map={wallTextures.diffTex}
          normalMap={wallTextures.normTex}
          roughnessMap={wallTextures.roughTex}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* INTERNAL ROOM PARTITIONS & ARCHWAYS (Designated Combat Zones & Corridors) */}
      {/* North-West Quadrant Room Partition */}
      <mesh position={[-30, 4, -40]} receiveShadow castShadow>
        <boxGeometry args={[20, 8, 1]} />
        <meshStandardMaterial map={wallTextures.diffTex} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[-40, 4, -30]} receiveShadow castShadow>
        <boxGeometry args={[1, 8, 20]} />
        <meshStandardMaterial map={wallTextures.diffTex} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* North-East Quadrant Room Partition */}
      <mesh position={[30, 4, -40]} receiveShadow castShadow>
        <boxGeometry args={[20, 8, 1]} />
        <meshStandardMaterial map={wallTextures.diffTex} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[40, 4, -30]} receiveShadow castShadow>
        <boxGeometry args={[1, 8, 20]} />
        <meshStandardMaterial map={wallTextures.diffTex} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* South-West Quadrant Room Partition */}
      <mesh position={[-30, 4, 40]} receiveShadow castShadow>
        <boxGeometry args={[20, 8, 1]} />
        <meshStandardMaterial map={wallTextures.diffTex} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[-40, 4, 30]} receiveShadow castShadow>
        <boxGeometry args={[1, 8, 20]} />
        <meshStandardMaterial map={wallTextures.diffTex} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* South-East Quadrant Room Partition */}
      <mesh position={[30, 4, 40]} receiveShadow castShadow>
        <boxGeometry args={[20, 8, 1]} />
        <meshStandardMaterial map={wallTextures.diffTex} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[40, 4, 30]} receiveShadow castShadow>
        <boxGeometry args={[1, 8, 20]} />
        <meshStandardMaterial map={wallTextures.diffTex} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Ceiling Beams */}
      {[-50, -30, -10, 10, 30, 50].map((z, i) => (
        <group key={`beam-${i}`}>
          <mesh position={[0, 11.5, z]}>
            <boxGeometry args={[150, 1.0, 0.8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
          </mesh>
          <pointLight
            position={[0, 10.5, z]}
            intensity={25}
            distance={35}
            color="#64748b"
          />
        </group>
      ))}

      {/* Central Pillar support */}
      <mesh position={[0, 5.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 11, 4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Heavy Tactical Cover Crates & Sandbags in Quadrants */}
      <group position={[-15, 1, -15]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[3.0, 2, 3.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      <group position={[15, 1, -15]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[3.0, 2, 3.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      <group position={[-16, 1, 15]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 2, 3.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      <group position={[16, 1, 15]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[3.0, 2, 2.5]} />
          <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      {/* Floating Smoke & Ash Particles */}
      <group ref={particlesRef}>
        {dustParticles.map((dp) => (
          <mesh key={`dp-${dp.id}`} position={[dp.x, dp.y, dp.z]}>
            <sphereGeometry args={[dp.scale, 8, 8]} />
            <meshBasicMaterial color={dp.color} transparent opacity={0.65} />
          </mesh>
        ))}
      </group>

      {/* Corner & Quadrant Military Floodlights */}
      <pointLight position={[-50, 8, -50]} intensity={35} color="#cbd5e1" distance={45} />
      <pointLight position={[50, 8, -50]} intensity={35} color="#cbd5e1" distance={45} />
      <pointLight position={[-50, 8, 50]} intensity={35} color="#cbd5e1" distance={45} />
      <pointLight position={[50, 8, 50]} intensity={35} color="#cbd5e1" distance={45} />
    </group>
  );
};


