import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Weapon } from '../../types';
import { createWeaponSteelTextures } from '../../utils/proceduralTextures';

interface ViewModelProps {
  weapon: Weapon;
  isShooting: boolean;
  isReloading: boolean;
  isMoving: boolean;
  isSprinting: boolean;
  recoilAmount: number; // 0 to 1
  reloadProgress: number; // 0 to 1
}

export const ViewModel: React.FC<ViewModelProps> = ({
  weapon,
  isShooting,
  isReloading,
  isMoving,
  isSprinting,
  recoilAmount,
  reloadProgress,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const bobbingTimer = useRef(0);

  // Scratched Carbon-Steel Gunmetal PBR texture map
  const steelTexture = useMemo(() => createWeaponSteelTextures(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // View bobbing calculation when walking or sprinting
    if (isMoving) {
      const speed = isSprinting ? 12 : 7;
      bobbingTimer.current += delta * speed;
    } else {
      bobbingTimer.current += delta * 1.5; // Idle breathing
    }

    const bobX = Math.sin(bobbingTimer.current) * (isMoving ? (isSprinting ? 0.03 : 0.015) : 0.003);
    const bobY = Math.abs(Math.cos(bobbingTimer.current * 2)) * (isMoving ? (isSprinting ? 0.025 : 0.012) : 0.003);

    // Default lower right position relative to camera
    const baseX = 0.38 + bobX;
    const baseY = -0.28 + bobY;
    const baseZ = -0.55;

    // Recoil offsets
    const recoilZ = recoilAmount * 0.12;
    const recoilRotX = recoilAmount * 0.25;

    // Reload animation offsets
    let reloadRotX = 0;
    let reloadRotY = 0;
    let reloadY = 0;

    if (isReloading) {
      // Lower weapon and rotate sideways
      const p = reloadProgress;
      reloadY = -Math.sin(p * Math.PI) * 0.25;
      reloadRotX = Math.sin(p * Math.PI) * 0.5;
      reloadRotY = Math.sin(p * Math.PI) * -0.4;
    }

    // Calculate position and orientation attached to camera view
    const localOffset = new THREE.Vector3(baseX, baseY + reloadY, baseZ + recoilZ);
    localOffset.applyQuaternion(state.camera.quaternion);
    groupRef.current.position.copy(state.camera.position).add(localOffset);

    const localEuler = new THREE.Euler(
      recoilRotX + reloadRotX,
      reloadRotY,
      (isMoving ? Math.sin(bobbingTimer.current) * 0.02 : 0) + (isSprinting ? -0.15 : 0)
    );
    const localQuat = new THREE.Quaternion().setFromEuler(localEuler);
    groupRef.current.quaternion.copy(state.camera.quaternion).multiply(localQuat);

    // Muzzle flash visibility
    if (flashRef.current) {
      flashRef.current.intensity = isShooting ? 15 : 0;
    }
  });

  const isRaygun = weapon.id.includes('raygun');
  const isPaP = weapon.isPackAPunched;

  return (
    <group ref={groupRef}>
      {/* Weapon Mesh Group */}
      <group scale={[0.85, 0.85, 0.85]}>
        {/* Main Receiver/Body with Advanced Scratched Carbon-Steel PBR Material */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.35]} />
          <meshStandardMaterial
            map={steelTexture}
            color={isPaP ? '#111827' : isRaygun ? '#15803d' : '#1e293b'}
            metalness={0.95}
            roughness={0.35}
            emissive={isPaP ? weapon.projectileColor : isRaygun ? '#22c55e' : '#000000'}
            emissiveIntensity={isPaP ? 0.4 : isRaygun ? 0.3 : 0}
          />
        </mesh>

        {/* Barrel */}
        <mesh position={[0, 0.02, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
          <meshStandardMaterial
            map={steelTexture}
            color={isPaP ? '#374151' : '#0f172a'}
            metalness={0.95}
            roughness={0.35}
          />
        </mesh>

        {/* Magazine / Clip */}
        <mesh position={[0, -0.12, -0.05]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.05, 0.18, 0.08]} />
          <meshStandardMaterial map={steelTexture} color="#020617" metalness={0.95} roughness={0.35} />
        </mesh>

        {/* Hand Grip */}
        <mesh position={[0, -0.12, 0.1]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.06, 0.16, 0.08]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.4} />
        </mesh>

        {/* Tactical Flashlight Mount on Gun Barrel */}
        <mesh position={[0.04, 0.01, -0.2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 10]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.2} />
        </mesh>

        {/* Sights */}
        <mesh position={[0, 0.08, -0.15]}>
          <boxGeometry args={[0.015, 0.03, 0.03]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
        </mesh>

        {/* Glowing Accents for PaP / Wonder Weapons */}
        {(isPaP || isRaygun) && (
          <mesh position={[0, 0.04, -0.1]}>
            <boxGeometry args={[0.085, 0.05, 0.2]} />
            <meshStandardMaterial
              color={weapon.projectileColor}
              emissive={weapon.projectileColor}
              emissiveIntensity={1.2}
            />
          </mesh>
        )}

        {/* Muzzle Flash Effect */}
        {isShooting && (
          <group position={[0, 0.02, -0.45]}>
            <mesh>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color={weapon.projectileColor} />
            </mesh>
            <pointLight
              ref={flashRef}
              color={weapon.projectileColor}
              intensity={15}
              distance={8}
            />
          </group>
        )}
      </group>
    </group>
  );
};
