import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WarehouseEnvironment } from './WarehouseEnvironment';
import { MapInteractiveObjects } from './MapInteractiveObjects';
import { ViewModel } from './ViewModel';
import { ZombiesManager } from './ZombiesManager';
import { ProjectilesAndParticles } from './ProjectilesAndParticles';
import { PlayerController } from './PlayerController';
import { Weapon, Zombie, Projectile, ParticleEffect, WindowBarricade, PerkId } from '../../types';

// High-Resolution Gun Barrel Tactical Flashlight with 4096x4096 Shadow Mapping
const TacticalFlashlight: React.FC = () => {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useFrame((state) => {
    if (!lightRef.current || !targetRef.current) return;
    const cam = state.camera;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);

    // Position light slightly in front of gun barrel
    lightRef.current.position.copy(cam.position).addScaledVector(dir, 0.4);
    targetRef.current.position.copy(cam.position).addScaledVector(dir, 15);
  });

  return (
    <>
      <object3D ref={targetRef} />
      <spotLight
        ref={lightRef}
        target={targetRef.current || undefined}
        color="#f8fafc"
        intensity={50}
        angle={Math.PI / 6.5}
        penumbra={0.35}
        distance={40}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0001}
      />
    </>
  );
};

interface GameCanvasProps {
  playerPosition: [number, number, number];
  setPlayerPosition: React.Dispatch<React.SetStateAction<[number, number, number]>>;
  setPlayerYaw?: (yaw: number) => void;
  playerHealth: number;
  maxHealth: number;
  perks?: PerkId[];
  thrashMode?: boolean;
  uncollectedCassettes?: string[];
  currentWeapon: Weapon;
  setCurrentWeapon: React.Dispatch<React.SetStateAction<Weapon>>;
  zombies: Zombie[];
  projectiles: Projectile[];
  particles: ParticleEffect[];
  barricades: WindowBarricade[];
  activeMysteryBox: {
    position: [number, number, number];
    isOpen: boolean;
    spinningWeaponName?: string;
  };
  onShoot: (origin: [number, number, number], direction: [number, number, number]) => void;
  onReload: () => void;
  onInteract: () => void;
  isPointerLocked: boolean;
  setIsPointerLocked: (locked: boolean) => void;
  sensitivity: number;
  isShooting: boolean;
  isReloading: boolean;
  isMoving: boolean;
  isSprinting: boolean;
  recoilAmount: number;
  reloadProgress: number;
  setIsMoving: (moving: boolean) => void;
  setIsSprinting: (sprinting: boolean) => void;
  nearInteractableText: string | null;
}

const ThrashStrobeLighting: React.FC = () => {
  const strobeRef = useRef<THREE.PointLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const isRedPhase = Math.sin(time * 18) > -0.2;
    if (strobeRef.current) {
      strobeRef.current.intensity = isRedPhase ? 95 : 5;
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = isRedPhase ? 0.7 : 0.05;
      ambientRef.current.color.set(isRedPhase ? '#ef4444' : '#000000');
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} color="#dc2626" />
      <pointLight ref={strobeRef} position={[0, 15, 0]} color="#ff0000" intensity={95} distance={150} />
      <pointLight position={[-45, 8, -45]} color="#991b1b" intensity={50} distance={90} />
      <pointLight position={[45, 8, -45]} color="#991b1b" intensity={50} distance={90} />
      <pointLight position={[-45, 8, 45]} color="#991b1b" intensity={50} distance={90} />
      <pointLight position={[45, 8, 45]} color="#991b1b" intensity={50} distance={90} />
    </>
  );
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerPosition,
  setPlayerPosition,
  setPlayerYaw,
  playerHealth,
  maxHealth,
  perks = [],
  thrashMode = false,
  uncollectedCassettes = ['cassette_1', 'cassette_2', 'cassette_3'],
  currentWeapon,
  setCurrentWeapon,
  zombies,
  projectiles,
  particles,
  barricades,
  activeMysteryBox,
  onShoot,
  onReload,
  onInteract,
  isPointerLocked,
  setIsPointerLocked,
  sensitivity,
  isShooting,
  isReloading,
  isMoving,
  isSprinting,
  recoilAmount,
  reloadProgress,
  setIsMoving,
  setIsSprinting,
  nearInteractableText,
}) => {
  return (
    <div className="relative h-full w-full bg-slate-950 select-none">
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 180, position: [0, 1.7, 0] }}
        shadows
        gl={{ antialias: true, toneMappingExposure: thrashMode ? 1.6 : 1.25 }}
      >
        {/* Fog: Pulsing Blood Red during Thrash Mode */}
        <fog attach="fog" args={[thrashMode ? '#1f0000' : '#020617', 10, 130]} />

        {/* Ambient & Directional Lighting based on Thrash Mode */}
        {thrashMode ? (
          <ThrashStrobeLighting />
        ) : (
          <>
            <ambientLight intensity={0.25} color="#334155" />
            <directionalLight
              position={[20, 35, 15]}
              intensity={1.2}
              color="#94a3b8"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0001}
            />
          </>
        )}

        {/* High-Resolution Tactical Gun Flashlight */}
        <TacticalFlashlight />

        {/* Warm Golden Muzzle Flash Light - Illuminates room on firing */}
        {isShooting && (
          <pointLight
            position={[playerPosition[0], playerPosition[1] + 1.4, playerPosition[2]]}
            color="#f59e0b"
            intensity={45}
            distance={22}
            decay={1}
          />
        )}

        {/* 1st Person Controls & Camera Movement */}
        <PlayerController
          playerPosition={playerPosition}
          setPlayerPosition={setPlayerPosition}
          setPlayerYaw={setPlayerYaw}
          playerHealth={playerHealth}
          maxHealth={maxHealth}
          perks={perks}
          currentWeapon={currentWeapon}
          setCurrentWeapon={setCurrentWeapon}
          onShoot={onShoot}
          onReload={onReload}
          onInteract={onInteract}
          isPointerLocked={isPointerLocked}
          setIsPointerLocked={setIsPointerLocked}
          sensitivity={sensitivity}
          setIsMoving={setIsMoving}
          setIsSprinting={setIsSprinting}
          nearInteractableText={nearInteractableText}
          activeMysteryBox={activeMysteryBox}
        />

        {/* 3D Warehouse Environment */}
        <WarehouseEnvironment />

        {/* Map Interactive Entities (Wall Buys, Perks, Mystery Box, Pack-A-Punch, Barricades, Cassettes) */}
        <MapInteractiveObjects
          barricades={barricades}
          activeMysteryBox={activeMysteryBox}
          uncollectedCassettes={uncollectedCassettes}
        />

        {/* Active Zombies */}
        <ZombiesManager zombies={zombies} playerPosition={playerPosition} />

        {/* Flying Bullets & Spark/Blood Particles */}
        <ProjectilesAndParticles projectiles={projectiles} particles={particles} />

        {/* 1st Person Player ViewModel (Gun) attached to view */}
        <ViewModel
          weapon={currentWeapon}
          isShooting={isShooting}
          isReloading={isReloading}
          isMoving={isMoving}
          isSprinting={isSprinting}
          recoilAmount={recoilAmount}
          reloadProgress={reloadProgress}
        />
      </Canvas>
    </div>
  );
};

