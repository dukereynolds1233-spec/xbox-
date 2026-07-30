import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PerkMachineData, WindowBarricade } from '../../types';
import { PERK_MACHINES } from '../../data/weapons';
import { createPerkTexture } from '../../utils/perkTextures';

export const CASSETTE_LOCATIONS = [
  { id: 'cassette_1', position: [-48, 0.4, -48] as [number, number, number], name: 'Cassette 1' },
  { id: 'cassette_2', position: [48, 0.4, -48] as [number, number, number], name: 'Cassette 2' },
  { id: 'cassette_3', position: [48, 0.4, 48] as [number, number, number], name: 'Cassette 3' },
];

interface MapInteractiveObjectsProps {
  barricades: WindowBarricade[];
  activeMysteryBox: {
    position: [number, number, number];
    isOpen: boolean;
    spinningWeaponName?: string;
  };
  uncollectedCassettes?: string[];
  nearInteractableText?: string;
}

const PerkMachineItem: React.FC<{ perk: PerkMachineData }> = ({ perk }) => {
  const texture = useMemo(() => createPerkTexture(perk.id), [perk.id]);

  return (
    <group position={perk.position} rotation={[0, perk.rotation, 0]}>
      {/* Main Machine Body */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 3, 1.2]} />
        <meshStandardMaterial color={perk.color} roughness={0.25} metalness={0.6} />
      </mesh>

      {/* Front Face Logo Decal Plate */}
      <mesh position={[0, 2.1, 0.61]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* Glowing Top Sign */}
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[1.3, 0.5, 1.3]} />
        <meshStandardMaterial
          color={perk.glowColor}
          emissive={perk.glowColor}
          emissiveIntensity={3.5}
        />
      </mesh>

      {/* Dispenser Slot */}
      <mesh position={[0, 0.6, 0.61]}>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Intense Neon Light Wash onto Stone Floor & Nearby Pillars */}
      <pointLight position={[0, 2.2, 0.9]} color={perk.glowColor} intensity={28} distance={14} />
    </group>
  );
};

export const MapInteractiveObjects: React.FC<MapInteractiveObjectsProps> = ({
  barricades,
  activeMysteryBox,
  uncollectedCassettes = ['cassette_1', 'cassette_2', 'cassette_3'],
}) => {
  const boxLidRef = useRef<THREE.Group>(null);
  const papGlowRef = useRef<THREE.PointLight>(null);
  const cassettesGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    // Animate Pack-a-Punch energy pulse
    if (papGlowRef.current) {
      papGlowRef.current.intensity = 15 + Math.sin(state.clock.elapsedTime * 4) * 8;
    }
    // Animate mystery box lid if open
    if (boxLidRef.current) {
      const targetRot = activeMysteryBox.isOpen ? -Math.PI / 2.2 : 0;
      boxLidRef.current.rotation.x = THREE.MathUtils.lerp(
        boxLidRef.current.rotation.x,
        targetRot,
        0.1
      );
    }
    // Animate Cassettes gentle hover & spin
    if (cassettesGroupRef.current) {
      cassettesGroupRef.current.children.forEach((child, i) => {
        child.rotation.y = state.clock.elapsedTime * 1.5;
        child.position.y = 0.4 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.1;
      });
    }
  });

  return (
    <group>
      {/* --- 1. WALL BUYS --- */}
      {/* Kuda SMG Wall Buy (Back Wall) */}
      <group position={[0, 2.2, -74.4]}>
        <mesh>
          <planeGeometry args={[2.5, 1.2]} />
          <meshBasicMaterial color="#ffffff" opacity={0.15} transparent />
        </mesh>
        {/* Chalk Outline Box */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[2.2, 0.8, 0.02]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} wireframe />
        </mesh>
      </group>

      {/* KRM-262 Shotgun Wall Buy (Left Wall) */}
      <group position={[-74.4, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[2.4, 0.8, 0.02]} />
          <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.8} wireframe />
        </mesh>
      </group>

      {/* --- 2. PERK MACHINES --- */}
      {PERK_MACHINES.map((perk: PerkMachineData) => (
        <PerkMachineItem key={perk.id} perk={perk} />
      ))}

      {/* --- 3. MYSTERY BOX --- */}
      <group position={activeMysteryBox.position}>
        {/* Base Chest */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.8, 1.2]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>

        {/* Metal Corner Straps */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[2.25, 0.82, 1.25]} />
          <meshStandardMaterial color="#f59e0b" wireframe />
        </mesh>

        {/* Hinged Lid */}
        <group ref={boxLidRef} position={[0, 0.8, -0.6]}>
          <mesh position={[0, 0.2, 0.6]}>
            <boxGeometry args={[2.2, 0.4, 1.2]} />
            <meshStandardMaterial color="#92400e" roughness={0.9} />
          </mesh>
        </group>

        {/* Ethereal Mystery Box Light Beam into the sky */}
        <mesh position={[0, 15, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 30, 16]} />
          <meshBasicMaterial
            color="#38bdf8"
            opacity={0.35}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <pointLight position={[0, 1.5, 0]} color="#38bdf8" intensity={38} distance={18} />

        {/* Weapon Spinning inside when open */}
        {activeMysteryBox.isOpen && (
          <group position={[0, 1.2, 0]}>
            <mesh>
              <boxGeometry args={[1.2, 0.3, 0.2]} />
              <meshStandardMaterial
                color="#f43f5e"
                emissive="#f43f5e"
                emissiveIntensity={2}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* --- 4. PACK-A-PUNCH MACHINE --- */}
      <group position={[0, 0, -45]}>
        {/* Machine Base */}
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 3.6, 2]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Glowing Overhead Sign */}
        <mesh position={[0, 4.2, 0]}>
          <boxGeometry args={[2.5, 0.6, 0.4]} />
          <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={2.5} />
        </mesh>

        {/* Glowing Dark Matter Core */}
        <mesh position={[0, 1.8, 0.6]}>
          <torusGeometry args={[0.8, 0.2, 16, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={2.5}
            wireframe
          />
        </mesh>

        <pointLight ref={papGlowRef} position={[0, 1.8, 1.2]} color="#00f0ff" intensity={20} distance={12} />
      </group>

      {/* --- 5. AMMO REFILL CRATE --- */}
      <group position={[25, 0, -35]}>
        {/* Military Crate Body */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.0, 1.2]} />
          <meshStandardMaterial color="#14532d" roughness={0.6} metalness={0.4} />
        </mesh>

        {/* Metal Straps */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.85, 1.02, 1.25]} />
          <meshStandardMaterial color="#22c55e" wireframe />
        </mesh>

        {/* Glowing Green Overhead Sign */}
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[1.6, 0.4, 0.3]} />
          <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={2} />
        </mesh>

        {/* Glowing Green Ammo Icon / Stencil */}
        <mesh position={[0, 0.51, 0.61]}>
          <planeGeometry args={[1.0, 0.5]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#15803d"
            emissiveIntensity={2}
          />
        </mesh>

        {/* Light Glow */}
        <pointLight position={[0, 1.2, 0]} color="#22c55e" intensity={15} distance={10} />
      </group>

      {/* --- 6. WINDOW BARRICADES --- */}
      {barricades.map((barricade) => (
        <group key={barricade.id} position={barricade.position} rotation={[0, barricade.rotation, 0]}>
          {/* Window Frame cutout */}
          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[3, 4, 0.2]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {/* Wooden Planks (0 to 5 planks) */}
          {Array.from({ length: barricade.planks }).map((_, idx) => (
            <mesh
              key={`plank-${idx}`}
              position={[0, 1 + idx * 0.7, 0.15]}
              rotation={[0, 0, (idx % 2 === 0 ? 1 : -1) * 0.08]}
              castShadow
            >
              <boxGeometry args={[3.2, 0.35, 0.1]} />
              <meshStandardMaterial color="#b45309" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* --- 7. HIDDEN GLOWING RED CASSETTES (THRASH EASTER EGG) --- */}
      <group ref={cassettesGroupRef}>
        {CASSETTE_LOCATIONS.filter((c) => uncollectedCassettes.includes(c.id)).map((c) => (
          <group key={c.id} position={c.position}>
            {/* Cassette Plastic Body */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.7, 0.45, 0.12]} />
              <meshStandardMaterial
                color="#881337"
                emissive="#dc2626"
                emissiveIntensity={1.8}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
            {/* Cassette Label Sticker */}
            <mesh position={[0, 0, 0.065]}>
              <planeGeometry args={[0.5, 0.28]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            {/* Cassette Tape Spools */}
            <mesh position={[-0.14, 0, 0.068]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            <mesh position={[0.14, 0, 0.068]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            {/* Intense Glowing Red Point Light */}
            <pointLight color="#ff0033" intensity={22} distance={12} />
          </group>
        ))}
      </group>
    </group>
  );
};
