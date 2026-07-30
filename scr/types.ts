export type WeaponId = 'm1911' | 'kuda' | 'krm262' | 'raygun' | 'pap_m1911' | 'pap_kuda' | 'pap_krm262' | 'pap_raygun';

export type PerkId =
  | 'juggernog'
  | 'speedcola'
  | 'doubletap'
  | 'quickrevive'
  | 'staminup'
  | 'widowswine'
  | 'mulekick'
  | 'electriccherry'
  | 'deadshot';

export interface Weapon {
  id: WeaponId;
  name: string;
  damage: number;
  fireRate: number; // Delay between shots in seconds
  clipSize: number;
  maxAmmo: number;
  currentClip: number;
  currentReserve: number;
  reloadTime: number; // Seconds
  price: number;
  projectileColor: string;
  projectileSpeed: number;
  projectileSize: number;
  isAutomatic: boolean;
  isPackAPunched?: boolean;
}

export interface Zombie {
  id: string;
  position: [number, number, number];
  rotation: number; // Yaw angle in radians
  health: number;
  maxHealth: number;
  speed: number;
  isCrawling: boolean;
  state: 'spawning' | 'walking' | 'attacking' | 'dying';
  spawnWindowId?: string;
  attackCooldown: number;
  animationPhase: number;
  isWebStunned?: boolean;
  webStunTimer?: number;
}

export interface Projectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  damage: number;
  color: string;
  size: number;
  createdAt: number;
  lifeTime: number; // Seconds
  weaponId: WeaponId;
}

export interface ParticleEffect {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  size: number;
  life: number; // 0 to 1
  maxLife: number;
  type: 'spark' | 'blood' | 'flash' | 'scoreText' | 'ember' | 'web';
  text?: string;
}

export interface WindowBarricade {
  id: string;
  position: [number, number, number];
  rotation: number; // 0 or Math.PI / 2
  planks: number; // Max 5 planks
}

export interface WallBuyItem {
  id: string;
  weaponId: WeaponId;
  position: [number, number, number];
  rotation: number;
  cost: number;
  name: string;
}

export interface PerkMachineData {
  id: PerkId;
  name: string;
  color: string;
  glowColor: string;
  cost: number;
  position: [number, number, number];
  rotation: number;
  description: string;
}

export interface GameStats {
  score: number;
  round: number;
  kills: number;
  headshots: number;
  downs: number;
  rebuilds: number;
  totalPointsEarned: number;
}
