import React from 'react';
import * as THREE from 'three';
import { Projectile, ParticleEffect } from '../../types';

interface ProjectilesAndParticlesProps {
  projectiles: Projectile[];
  particles: ParticleEffect[];
}

export const ProjectilesAndParticles: React.FC<ProjectilesAndParticlesProps> = ({
  projectiles,
  particles,
}) => {
  return (
    <group>
      {/* 3D Sphere Projectiles */}
      {projectiles.map((p) => (
        <group key={p.id} position={p.position}>
          <mesh>
            <sphereGeometry args={[p.size, 12, 12]} />
            <meshBasicMaterial color={p.color} />
          </mesh>
          <pointLight color={p.color} intensity={12} distance={6} />
        </group>
      ))}

      {/* Particles (Blood splatters, sparks, spiritual embers, and Widow's Wine web blasts) */}
      {particles.map((part) => {
        const fade = 1 - part.life / part.maxLife;
        const isEmber = part.type === 'ember';
        const isWeb = part.type === 'web';

        if (isWeb) {
          const webRadius = part.size * (part.life / part.maxLife);
          return (
            <group key={part.id} position={part.position}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[Math.max(0.1, webRadius - 0.4), webRadius, 24]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={fade * 0.85} side={THREE.DoubleSide} />
              </mesh>
              <pointLight color="#ffffff" intensity={15 * fade} distance={8} />
            </group>
          );
        }

        return (
          <group key={part.id} position={part.position}>
            <mesh>
              <sphereGeometry args={[part.size * (isEmber ? fade : fade), 10, 10]} />
              <meshBasicMaterial
                color={part.color}
                opacity={fade}
                transparent
                blending={isEmber ? THREE.AdditiveBlending : THREE.NormalBlending}
              />
            </mesh>
            {isEmber && fade > 0.3 && (
              <pointLight color={part.color} intensity={8 * fade} distance={4} />
            )}
          </group>
        );
      })}
    </group>
  );
};
