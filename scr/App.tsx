import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/3d/GameCanvas';
import { HUD } from './components/ui/HUD';
import { StartOverlay, PauseMenu, GameOverScreen } from './components/ui/Menus';
import { Weapon, Zombie, Projectile, ParticleEffect, WindowBarricade, PerkId, GameStats } from './types';
import { INITIAL_WEAPONS, PERK_MACHINES } from './data/weapons';
import { CASSETTE_LOCATIONS } from './components/3d/MapInteractiveObjects';
import { soundManager } from './audio/soundEffects';

export default function App() {
  // Game Flow States
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.2);
  const [isMuted, setIsMuted] = useState(false);

  // Player Stats & Status
  const [stats, setStats] = useState<GameStats>({
    score: 500,
    round: 1,
    kills: 0,
    headshots: 0,
    downs: 0,
    rebuilds: 0,
    totalPointsEarned: 500,
  });

  const [playerHealth, setPlayerHealth] = useState(100);
  const maxHealth = useRef(100);
  const [perks, setPerks] = useState<PerkId[]>([]);
  const [widowCharges, setWidowCharges] = useState(4);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 1.7, 8]);
  const [playerYaw, setPlayerYaw] = useState(0);

  // Weapons & Inventory
  const [currentWeapon, setCurrentWeapon] = useState<Weapon>(INITIAL_WEAPONS.m1911);
  const [inventory, setInventory] = useState<Weapon[]>([INITIAL_WEAPONS.m1911]);
  const [isShooting, setIsShooting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [recoilAmount, setRecoilAmount] = useState(0);
  const [reloadProgress, setReloadProgress] = useState(0);

  // Movement Status
  const [isMoving, setIsMoving] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

  // Entities State
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [barricades, setBarricades] = useState<WindowBarricade[]>([
    { id: 'b1', position: [-73.8, 0, -35], rotation: Math.PI / 2, planks: 5 },
    { id: 'b2', position: [73.8, 0, -35], rotation: Math.PI / 2, planks: 5 },
    { id: 'b3', position: [-73.8, 0, 35], rotation: Math.PI / 2, planks: 5 },
    { id: 'b4', position: [73.8, 0, 35], rotation: Math.PI / 2, planks: 5 },
    { id: 'b5', position: [-35, 0, -73.8], rotation: 0, planks: 5 },
    { id: 'b6', position: [35, 0, -73.8], rotation: 0, planks: 5 },
    { id: 'b7', position: [-35, 0, 73.8], rotation: 0, planks: 5 },
    { id: 'b8', position: [35, 0, 73.8], rotation: 0, planks: 5 },
  ]);

  const [activeMysteryBox, setActiveMysteryBox] = useState({
    position: [0, 0, 30] as [number, number, number],
    isOpen: false,
  });

  // Hidden Red Cassettes & Thrash Metal Wave Easter Egg State
  const [uncollectedCassettes, setUncollectedCassettes] = useState<string[]>([
    'cassette_1',
    'cassette_2',
    'cassette_3',
  ]);
  const [thrashMode, setThrashMode] = useState(false);
  const [thrashBannerMessage, setThrashBannerMessage] = useState<string | null>(null);

  const thrashModeRef = useRef(false);
  useEffect(() => {
    thrashModeRef.current = thrashMode;
  }, [thrashMode]);

  // UI Feedback Overlays
  const [hitmarker, setHitmarker] = useState<{ active: boolean; isHeadshot: boolean } | null>(null);
  const [scorePopups, setScorePopups] = useState<Array<{ id: string; text: string; x: number; y: number }>>([]);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [roundMessage, setRoundMessage] = useState<string | null>('ROUND 1');

  // Timers & Refs
  const lastDamageTime = useRef(0);
  const waveZombiesRemaining = useRef(6);
  const zombiesSpawnedInWave = useRef(0);
  const isSpawningWave = useRef(false);

  // Mute toggle listener
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Round Banner timer
  useEffect(() => {
    if (roundMessage) {
      const timer = setTimeout(() => setRoundMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [roundMessage]);

  // Keep gameState in ref for event handlers
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Handle pointer lock change & auto-pause when lock is lost during gameplay
  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = !!document.pointerLockElement;
      setIsPointerLocked(locked);
      if (!locked && gameStateRef.current === 'playing') {
        setGameState('paused');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;
      if (e.code === 'Digit1' && inventory[0]) {
        setCurrentWeapon(inventory[0]);
      } else if (e.code === 'Digit2' && inventory[1]) {
        setCurrentWeapon(inventory[1]);
      } else if (e.code === 'Digit3' && inventory[2]) {
        setCurrentWeapon(inventory[2]);
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inventory]);

  const requestPointerLock = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        canvas.requestPointerLock();
      } catch (e) {
        console.warn('Pointer lock error:', e);
      }
    }
  };

  // Start Game Handler
  const handleStartGame = () => {
    setGameState('playing');
    requestPointerLock();
    soundManager.playRoundStart();
  };

  const handleResumeGame = () => {
    setGameState('playing');
    requestPointerLock();
  };

  const handleRestartGame = () => {
    setStats({
      score: 500,
      round: 1,
      kills: 0,
      headshots: 0,
      downs: 0,
      rebuilds: 0,
      totalPointsEarned: 500,
    });
    setPlayerHealth(100);
    maxHealth.current = 100;
    setPerks([]);
    setCurrentWeapon(INITIAL_WEAPONS.m1911);
    setInventory([INITIAL_WEAPONS.m1911]);
    setZombies([]);
    setProjectiles([]);
    setParticles([]);
    setPlayerPosition([0, 1.7, 8]);
    waveZombiesRemaining.current = 6;
    zombiesSpawnedInWave.current = 0;
    setRoundMessage('ROUND 1');
    setGameState('playing');
    requestPointerLock();
    soundManager.playRoundStart();
  };

  // Add Score helper
  const addScore = useCallback((pts: number, text: string) => {
    setStats((prev) => ({
      ...prev,
      score: prev.score + pts,
      totalPointsEarned: prev.totalPointsEarned + pts,
    }));

    // Spawn floating score popup
    const popupId = Math.random().toString();
    const x = 48 + (Math.random() * 8 - 4);
    const y = 45 + (Math.random() * 6 - 3);

    setScorePopups((prev) => [...prev, { id: popupId, text: `+${pts} ${text}`, x, y }]);
    setTimeout(() => {
      setScorePopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 800);
  }, []);

  // Shoot Bullet Handler
  const handleShoot = useCallback(
    (origin: [number, number, number], direction: [number, number, number]) => {
      if (isReloading || currentWeapon.currentClip <= 0) return;

      // Deduct ammo
      setCurrentWeapon((prev) => ({
        ...prev,
        currentClip: prev.currentClip - 1,
      }));

      // Play weapon sound
      soundManager.playGunshot(
        currentWeapon.id.includes('raygun')
          ? 'raygun'
          : currentWeapon.id.includes('krm')
          ? 'krm262'
          : currentWeapon.id.includes('kuda')
          ? 'kuda'
          : 'm1911'
      );

      // Trigger visual recoil & muzzle flash
      setIsShooting(true);
      setRecoilAmount(1);
      setTimeout(() => setIsShooting(false), 80);

      // Double Tap Perk damage bonus
      const hasDoubleTap = perks.includes('doubletap');
      const finalDamage = hasDoubleTap ? currentWeapon.damage * 1.5 : currentWeapon.damage;

      // Spawn projectile sphere
      const projectileId = Math.random().toString();
      const speed = currentWeapon.projectileSpeed;

      const newProjectile: Projectile = {
        id: projectileId,
        position: origin,
        velocity: [direction[0] * speed, direction[1] * speed, direction[2] * speed],
        damage: finalDamage,
        color: currentWeapon.projectileColor,
        size: currentWeapon.projectileSize,
        createdAt: performance.now(),
        lifeTime: 1.5,
        weaponId: currentWeapon.id,
      };

      setProjectiles((prev) => [...prev, newProjectile]);
    },
    [currentWeapon, isReloading, perks]
  );

  // Reload Weapon Handler
  const handleReload = useCallback(() => {
    if (
      isReloading ||
      currentWeapon.currentClip === currentWeapon.clipSize ||
      currentWeapon.currentReserve <= 0
    )
      return;

    setIsReloading(true);
    soundManager.playReload();

    // Speed Cola perk cuts reload time in half!
    const reloadDuration = perks.includes('speedcola')
      ? currentWeapon.reloadTime * 0.5
      : currentWeapon.reloadTime;

    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(1, elapsed / reloadDuration);
      setReloadProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);
        setIsReloading(false);
        setReloadProgress(0);

        setCurrentWeapon((prev) => {
          const needed = prev.clipSize - prev.currentClip;
          const transfer = Math.min(needed, prev.currentReserve);
          return {
            ...prev,
            currentClip: prev.currentClip + transfer,
            currentReserve: prev.currentReserve - transfer,
          };
        });
      }
    }, 30);
  }, [currentWeapon, isReloading, perks]);

  // Helper to equip a newly acquired weapon respecting Mule Kick 3rd weapon slot
  const equipNewWeapon = useCallback(
    (newWeapon: Weapon) => {
      const maxSlots = perks.includes('mulekick') ? 3 : 2;
      setInventory((prev) => {
        const existingIdx = prev.findIndex((w) => w.id === newWeapon.id);
        if (existingIdx !== -1) {
          const nextInv = [...prev];
          nextInv[existingIdx] = newWeapon;
          return nextInv;
        }
        if (prev.length < maxSlots) {
          return [...prev, newWeapon];
        } else {
          return prev.map((w) => (w.id === currentWeapon.id ? newWeapon : w));
        }
      });
      setCurrentWeapon(newWeapon);
    },
    [perks, currentWeapon]
  );

  // Interact [E] Key Handler
  const handleInteract = useCallback(() => {
    // 1. Check Wall Buys
    // Kuda SMG (Back Wall [0, -74])
    const distToKuda = Math.hypot(playerPosition[0] - 0, playerPosition[2] - (-74));
    if (distToKuda < 3.5) {
      if (stats.score >= 1250) {
        setStats((prev) => ({ ...prev, score: prev.score - 1250 }));
        equipNewWeapon(INITIAL_WEAPONS.kuda);
        soundManager.playBuySound();
        addScore(0, 'BUY KUDA');
      }
      return;
    }

    // KRM Shotgun (Left Wall [-74, 0])
    const distToKrm = Math.hypot(playerPosition[0] - (-74), playerPosition[2] - 0);
    if (distToKrm < 3.5) {
      if (stats.score >= 1500) {
        setStats((prev) => ({ ...prev, score: prev.score - 1500 }));
        equipNewWeapon(INITIAL_WEAPONS.krm262);
        soundManager.playBuySound();
        addScore(0, 'BUY KRM-262');
      }
      return;
    }

    // 2. Check Ammo Refill Crate [25, 0, -35] for 500 PTS
    const distToAmmoCrate = Math.hypot(playerPosition[0] - 25, playerPosition[2] - (-35));
    if (distToAmmoCrate < 3.5) {
      if (
        currentWeapon.currentClip === currentWeapon.clipSize &&
        currentWeapon.currentReserve === currentWeapon.maxAmmo
      ) {
        return;
      }
      if (stats.score >= 500) {
        setStats((prev) => ({ ...prev, score: prev.score - 500 }));
        const refilled = {
          ...currentWeapon,
          currentClip: currentWeapon.clipSize,
          currentReserve: currentWeapon.maxAmmo,
        };
        setCurrentWeapon(refilled);
        setInventory((prev) => prev.map((w) => (w.id === refilled.id ? refilled : w)));
        soundManager.playBuySound();
        addScore(0, 'MAX AMMO');
      }
      return;
    }

    // 3. Check Perk Machines
    PERK_MACHINES.forEach((perk) => {
      const dist = Math.hypot(playerPosition[0] - perk.position[0], playerPosition[2] - perk.position[2]);
      if (dist < 3.5 && !perks.includes(perk.id)) {
        if (stats.score >= perk.cost) {
          setStats((prev) => ({ ...prev, score: prev.score - perk.cost }));
          setPerks((prev) => [...prev, perk.id]);
          soundManager.playPerkDrink();

          if (perk.id === 'juggernog') {
            maxHealth.current = 250;
            setPlayerHealth(250);
          } else if (perk.id === 'widowswine') {
            setWidowCharges(4);
          }
        }
      }
    });

    // 4. Check Mystery Box
    const distToBox = Math.hypot(playerPosition[0] - activeMysteryBox.position[0], playerPosition[2] - activeMysteryBox.position[2]);
    if (distToBox < 3.5 && !activeMysteryBox.isOpen) {
      if (stats.score >= 950) {
        setStats((prev) => ({ ...prev, score: prev.score - 950 }));
        setActiveMysteryBox({ position: activeMysteryBox.position, isOpen: true });
        soundManager.playMysteryBox();

        setTimeout(() => {
          const boxWeapons = [INITIAL_WEAPONS.raygun, INITIAL_WEAPONS.kuda, INITIAL_WEAPONS.krm262];
          const won = boxWeapons[Math.floor(Math.random() * boxWeapons.length)];
          equipNewWeapon(won);
          setActiveMysteryBox({ position: activeMysteryBox.position, isOpen: false });
        }, 3000);
      }
      return;
    }

    // 5. Check Pack-a-Punch [0, -45]
    const distToPap = Math.hypot(playerPosition[0] - 0, playerPosition[2] - (-45));
    if (distToPap < 3.5 && !currentWeapon.isPackAPunched) {
      if (stats.score >= 5000) {
        setStats((prev) => ({ ...prev, score: prev.score - 5000 }));
        const papKey = `pap_${currentWeapon.id}` as keyof typeof INITIAL_WEAPONS;
        if (INITIAL_WEAPONS[papKey]) {
          const papWeapon = INITIAL_WEAPONS[papKey];
          setCurrentWeapon(papWeapon);
          setInventory((prev) => prev.map((w) => (w.id === currentWeapon.id ? papWeapon : w)));
          soundManager.playBuySound();
        }
      }
      return;
    }

    // 6. Check Barricades (Rebuild Planks)
    barricades.forEach((b) => {
      const dist = Math.hypot(playerPosition[0] - b.position[0], playerPosition[2] - b.position[2]);
      if (dist < 4.0 && b.planks < 5) {
        setBarricades((prev) =>
          prev.map((item) => (item.id === b.id ? { ...item, planks: item.planks + 1 } : item))
        );
        addScore(10, 'REBUILD');
        soundManager.playBuySound();
      }
    });

    // 7. Check Red Cassettes Collection (Thrash Easter Egg)
    for (const cassette of CASSETTE_LOCATIONS) {
      if (uncollectedCassettes.includes(cassette.id)) {
        const dist = Math.hypot(playerPosition[0] - cassette.position[0], playerPosition[2] - cassette.position[2]);
        if (dist < 3.5) {
          soundManager.playCassettePickup();
          const nextUncollected = uncollectedCassettes.filter((id) => id !== cassette.id);
          setUncollectedCassettes(nextUncollected);

          const collectedCount = 3 - nextUncollected.length;
          addScore(100, `RED CASSETTE [${collectedCount}/3]`);

          if (nextUncollected.length === 0) {
            // 3rd Cassette collected! Trigger Thrash Metal Wave!
            setThrashMode(true);
            setThrashBannerMessage('PLEASURE TO KILL ENABLED!');
            soundManager.startThrashMetalTrack();

            // Speed up all active zombies by 30%
            setZombies((prevZombies) =>
              prevZombies.map((z) => ({
                ...z,
                speed: z.speed * 1.3,
              }))
            );

            setTimeout(() => {
              setThrashBannerMessage(null);
            }, 5000);
          }
          return;
        }
      }
    }
  }, [playerPosition, stats.score, perks, activeMysteryBox, currentWeapon, barricades, uncollectedCassettes, addScore, equipNewWeapon]);

  // Proximity interact text check
  useEffect(() => {
    let text: string | null = null;

    // Kuda
    if (Math.hypot(playerPosition[0] - 0, playerPosition[2] - (-74)) < 3.5) {
      text = 'PRESS [E] TO BUY KUDA SMG [1250 PTS]';
    } else if (Math.hypot(playerPosition[0] - (-74), playerPosition[2] - 0) < 3.5) {
      text = 'PRESS [E] TO BUY KRM-262 SHOTGUN [1500 PTS]';
    } else if (Math.hypot(playerPosition[0] - 25, playerPosition[2] - (-35)) < 3.5) {
      text =
        currentWeapon.currentClip === currentWeapon.clipSize &&
        currentWeapon.currentReserve === currentWeapon.maxAmmo
          ? 'AMMO ALREADY FULL'
          : 'PRESS [E] TO REFILL AMMO [500 PTS]';
    } else if (Math.hypot(playerPosition[0] - 0, playerPosition[2] - (-45)) < 3.5) {
      text = currentWeapon.isPackAPunched
        ? 'WEAPON ALREADY PACK-A-PUNCHED'
        : 'PRESS [E] TO PACK-A-PUNCH WEAPON [5000 PTS]';
    } else if (Math.hypot(playerPosition[0] - activeMysteryBox.position[0], playerPosition[2] - activeMysteryBox.position[2]) < 3.5) {
      text = activeMysteryBox.isOpen ? 'OPENING MYSTERY BOX...' : 'PRESS [E] TO OPEN MYSTERY BOX [950 PTS]';
    } else {
      PERK_MACHINES.forEach((p) => {
        if (Math.hypot(playerPosition[0] - p.position[0], playerPosition[2] - p.position[2]) < 3.5) {
          text = perks.includes(p.id)
            ? `${p.name.toUpperCase()} ACQUIRED`
            : `PRESS [E] TO BUY ${p.name.toUpperCase()} [${p.cost} PTS]`;
        }
      });

      barricades.forEach((b) => {
        if (Math.hypot(playerPosition[0] - b.position[0], playerPosition[2] - b.position[2]) < 4.0) {
          if (b.planks < 5) text = 'PRESS [E] TO REBUILD BARRICADE [+10 PTS]';
        }
      });

      CASSETTE_LOCATIONS.forEach((c) => {
        if (uncollectedCassettes.includes(c.id)) {
          if (Math.hypot(playerPosition[0] - c.position[0], playerPosition[2] - c.position[2]) < 3.5) {
            const collectedCount = 3 - uncollectedCassettes.length;
            text = `PRESS [E] TO COLLECT RED CASSETTE TAPE [${collectedCount + 1}/3]`;
          }
        }
      });
    }

    setInteractPrompt(text);
  }, [playerPosition, currentWeapon, perks, activeMysteryBox, barricades, uncollectedCassettes]);

  const playerPositionRef = useRef(playerPosition);
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  const zombiesRef = useRef(zombies);
  useEffect(() => {
    zombiesRef.current = zombies;
  }, [zombies]);

  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const playerHealthRef = useRef(playerHealth);
  useEffect(() => {
    playerHealthRef.current = playerHealth;
  }, [playerHealth]);

  const perksRef = useRef(perks);
  useEffect(() => {
    perksRef.current = perks;
  }, [perks]);

  const widowChargesRef = useRef(widowCharges);
  useEffect(() => {
    widowChargesRef.current = widowCharges;
  }, [widowCharges]);

  const playerYawRef = useRef(playerYaw);
  useEffect(() => {
    playerYawRef.current = playerYaw;
  }, [playerYaw]);

  const lastAmbientGroanTime = useRef(0);

  // MAIN GAME TICK ENGINE (Projectiles, Zombies AI, Wave Spawning, Collisions)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      const now = performance.now();

      // Decay Recoil
      setRecoilAmount((prev) => Math.max(0, prev - 0.15));

      // Periodic Spatial Zombie Groans from active living zombies
      if (now - lastAmbientGroanTime.current > 1800) {
        lastAmbientGroanTime.current = now + Math.random() * 1200;
        const livingZombies = zombiesRef.current.filter((z) => z.state !== 'dying');
        if (livingZombies.length > 0) {
          const randomZombie = livingZombies[Math.floor(Math.random() * livingZombies.length)];
          soundManager.playZombieGroan(
            randomZombie.position,
            playerPositionRef.current,
            playerYawRef.current,
            0.9
          );
        }
      }

      // 1. Move Projectiles
      setProjectiles((prevProjectiles) => {
        const nextProjectiles: Projectile[] = [];

        prevProjectiles.forEach((p) => {
          const deltaSec = 0.03;
          const nextPos: [number, number, number] = [
            p.position[0] + p.velocity[0] * deltaSec,
            p.position[1] + p.velocity[1] * deltaSec,
            p.position[2] + p.velocity[2] * deltaSec,
          ];

          // Check hit against arena outer bounds
          if (
            Math.abs(nextPos[0]) > 74.5 ||
            Math.abs(nextPos[2]) > 74.5 ||
            nextPos[1] < 0 ||
            nextPos[1] > 10
          ) {
            // Spark impact particle
            setParticles((parts) => [
              ...parts,
              {
                id: Math.random().toString(),
                position: nextPos,
                velocity: [0, 0, 0],
                color: '#fef08a',
                size: 0.2,
                life: 0,
                maxLife: 0.3,
                type: 'spark',
              },
            ]);
            return;
          }

          let hitZombie = false;

          // Check Collision with Zombies
          setZombies((prevZombies) =>
            prevZombies.map((z) => {
              if (hitZombie || z.state === 'dying') return z;

              const distSq =
                Math.pow(nextPos[0] - z.position[0], 2) +
                Math.pow(nextPos[2] - z.position[2], 2);

              if (distSq < 0.8 && nextPos[1] >= 0.2 && nextPos[1] <= 2.2) {
                hitZombie = true;
                const isHeadshot = nextPos[1] >= z.position[1] + 1.5;
                const damage = isHeadshot ? p.damage * 2 : p.damage;

                soundManager.playHitmarker(isHeadshot);
                setHitmarker({ active: true, isHeadshot });
                setTimeout(() => setHitmarker(null), 150);

                const nextHealth = z.health - damage;

                // Blood particle burst
                setParticles((parts) => [
                  ...parts,
                  {
                    id: Math.random().toString(),
                    position: nextPos,
                    velocity: [(Math.random() - 0.5) * 2, 1, (Math.random() - 0.5) * 2],
                    color: '#dc2626',
                    size: 0.3,
                    life: 0,
                    maxLife: 0.4,
                    type: 'blood',
                  },
                ]);

                if (nextHealth <= 0) {
                  // Zombie killed - Spawn spiritual embers dissolve burst!
                  soundManager.playZombieGroan(z.position, playerPositionRef.current, playerYawRef.current, 1.4);
                  const killPoints = isHeadshot ? 150 : 100;
                  addScore(killPoints, isHeadshot ? 'HEADSHOT' : 'KILL');

                  const emberColors = ['#38bdf8', '#c084fc', '#facc15', '#f43f5e', '#34d399'];
                  const soulEmbers = Array.from({ length: 12 }).map(() => ({
                    id: Math.random().toString(),
                    position: [
                      z.position[0] + (Math.random() - 0.5) * 1.2,
                      z.position[1] + 0.5 + Math.random() * 1.0,
                      z.position[2] + (Math.random() - 0.5) * 1.2,
                    ] as [number, number, number],
                    velocity: [
                      (Math.random() - 0.5) * 0.8,
                      1.2 + Math.random() * 1.5,
                      (Math.random() - 0.5) * 0.8,
                    ] as [number, number, number],
                    color: emberColors[Math.floor(Math.random() * emberColors.length)],
                    size: 0.22 + Math.random() * 0.15,
                    life: 0,
                    maxLife: 1.0 + Math.random() * 0.8,
                    type: 'ember' as const,
                  }));

                  setParticles((parts) => [...parts, ...soulEmbers]);

                  setStats((prev) => ({
                    ...prev,
                    kills: prev.kills + 1,
                    headshots: isHeadshot ? prev.headshots + 1 : prev.headshots,
                  }));

                  return { ...z, health: 0, state: 'dying' };
                } else {
                  addScore(10, 'HIT');
                  return { ...z, health: nextHealth };
                }
              }
              return z;
            })
          );

          if (!hitZombie) {
            nextProjectiles.push({ ...p, position: nextPos });
          }
        });

        return nextProjectiles;
      });

      // 2. Wave Zombie Spawner
      const activeZombiesCount = zombiesRef.current.filter((z) => z.state !== 'dying').length;
      if (
        zombiesSpawnedInWave.current < waveZombiesRemaining.current &&
        activeZombiesCount < 16
      ) {
        if (!isSpawningWave.current) {
          isSpawningWave.current = true;
          setTimeout(() => {
            const spawnWindows = [
              [-72, 0, -35],
              [72, 0, -35],
              [-72, 0, 35],
              [72, 0, 35],
              [-35, 0, -72],
              [35, 0, -72],
              [-35, 0, 72],
              [35, 0, 72],
            ] as const;
            const spawnPos = spawnWindows[Math.floor(Math.random() * spawnWindows.length)];

            const roundNum = statsRef.current.round;
            const newZombie: Zombie = {
              id: Math.random().toString(),
              position: [spawnPos[0], 0, spawnPos[2]],
              rotation: 0,
              health: 80 + roundNum * 35,
              maxHealth: 80 + roundNum * 35,
              speed: (0.8 + Math.min(2.5, roundNum * 0.15)) * (thrashModeRef.current ? 1.3 : 1.0),
              isCrawling: false,
              state: 'walking',
              attackCooldown: 0,
              animationPhase: Math.random() * Math.PI,
            };

            setZombies((prev) => [...prev, newZombie]);
            zombiesSpawnedInWave.current += 1;
            soundManager.playZombieGroan([spawnPos[0], 0, spawnPos[2]], playerPositionRef.current, playerYawRef.current, 1.2);
            isSpawningWave.current = false;
          }, 800);
        }
      }

      // 3. Move Zombies & Attack Player Logic
      const targetPos = playerPositionRef.current;
      setZombies((prevZombies) => {
        const remainingLiving = prevZombies.filter((z) => z.state !== 'dying');

        // Check Round Completion
        if (
          remainingLiving.length === 0 &&
          zombiesSpawnedInWave.current >= waveZombiesRemaining.current
        ) {
          // Increment Round
          setStats((prev) => {
            const nextRound = prev.round + 1;
            waveZombiesRemaining.current = 6 + nextRound * 4;
            zombiesSpawnedInWave.current = 0;
            setRoundMessage(`ROUND ${nextRound}`);
            soundManager.playRoundStart();
            return { ...prev, round: nextRound };
          });
        }

        return prevZombies
          .map((z) => {
            if (z.state === 'dying') return z;

            // Handle Web Stun Timer
            let isWebStunned = z.isWebStunned || false;
            let webStunTimer = (z.webStunTimer || 0) - 0.03;
            if (webStunTimer <= 0) {
              isWebStunned = false;
              webStunTimer = 0;
            }

            // Calculate Angle to Player
            const dx = targetPos[0] - z.position[0];
            const dz = targetPos[2] - z.position[2];
            const dist = Math.hypot(dx, dz);
            const targetAngle = Math.atan2(dx, dz);

            // Web Stun reduces speed by 85%, Thrash Metal increases speed by 30%
            const slowMult = isWebStunned ? 0.15 : 1.0;
            const thrashMult = thrashModeRef.current ? 1.3 : 1.0;
            const speed = z.speed * 0.03 * slowMult * thrashMult;
            const nextX = z.position[0] + Math.sin(targetAngle) * speed;
            const nextZ = z.position[2] + Math.cos(targetAngle) * speed;

            // Zombie Attack Player
            if (dist < 1.6) {
              if (now - lastDamageTime.current > 1200) {
                lastDamageTime.current = now;
                soundManager.playPlayerHit();

                // Widow's Wine Combat Trap Blast Check
                if (
                  perksRef.current.includes('widowswine') &&
                  widowChargesRef.current > 0
                ) {
                  // Consume 1 charge
                  setWidowCharges((prev) => Math.max(0, prev - 1));

                  // Trigger radial white web particle blast centered on player
                  setParticles((parts) => [
                    ...parts,
                    {
                      id: Math.random().toString(),
                      position: [targetPos[0], 0.2, targetPos[2]],
                      velocity: [0, 0, 0],
                      color: '#ffffff',
                      size: 5.0,
                      life: 0,
                      maxLife: 0.8,
                      type: 'web',
                    },
                  ]);

                  // Trap all zombies within 5 units radius in webs for 3 seconds!
                  setZombies((currentZombies) =>
                    currentZombies.map((otherZ) => {
                      const oDist = Math.hypot(
                        targetPos[0] - otherZ.position[0],
                        targetPos[2] - otherZ.position[2]
                      );
                      if (oDist <= 5.0 && otherZ.state !== 'dying') {
                        return {
                          ...otherZ,
                          isWebStunned: true,
                          webStunTimer: 3.0,
                        };
                      }
                      return otherZ;
                    })
                  );
                }

                setPlayerHealth((prevHP) => {
                  const newHP = prevHP - 25;
                  if (newHP <= 0) {
                    setGameState('gameover');
                  }
                  return Math.max(0, newHP);
                });
              }
            }

            return {
              ...z,
              position: [nextX, 0, nextZ] as [number, number, number],
              rotation: targetAngle,
              isWebStunned,
              webStunTimer,
            };
          })
          .filter((z) => z.state !== 'dying' || Math.random() > 0.05);
      });

      // 4. Health Auto-Regeneration
      if (now - lastDamageTime.current > 4000 && playerHealthRef.current < maxHealth.current) {
        setPlayerHealth((prev) => Math.min(maxHealth.current, prev + 1.5));
      }

      // 5. Particle Lifetimes & Velocity Movement
      setParticles((prevParts) =>
        prevParts
          .map((p) => ({
            ...p,
            position: [
              p.position[0] + (p.velocity ? p.velocity[0] * 0.03 : 0),
              p.position[1] + (p.velocity ? p.velocity[1] * 0.03 : 0.04),
              p.position[2] + (p.velocity ? p.velocity[2] * 0.03 : 0),
            ] as [number, number, number],
            life: p.life + 0.03,
          }))
          .filter((p) => p.life < p.maxLife)
      );
    }, 30);

    return () => clearInterval(gameLoop);
  }, [gameState, addScore]);

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none font-sans">
      {/* Start Overlay */}
      {gameState === 'start' && <StartOverlay onStart={handleStartGame} />}

      {/* Pause Menu */}
      {gameState === 'paused' && (
        <PauseMenu
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          sensitivity={sensitivity}
          setSensitivity={setSensitivity}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          stats={stats}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <GameOverScreen stats={stats} onRestart={handleRestartGame} />
      )}

      {/* 3D WebGL Canvas */}
      <GameCanvas
        playerPosition={playerPosition}
        setPlayerPosition={setPlayerPosition}
        setPlayerYaw={setPlayerYaw}
        playerHealth={playerHealth}
        maxHealth={maxHealth.current}
        perks={perks}
        currentWeapon={currentWeapon}
        setCurrentWeapon={setCurrentWeapon}
        zombies={zombies}
        projectiles={projectiles}
        particles={particles}
        barricades={barricades}
        activeMysteryBox={activeMysteryBox}
        thrashMode={thrashMode}
        uncollectedCassettes={uncollectedCassettes}
        onShoot={handleShoot}
        onReload={handleReload}
        onInteract={handleInteract}
        isPointerLocked={isPointerLocked}
        setIsPointerLocked={setIsPointerLocked}
        sensitivity={sensitivity}
        isShooting={isShooting}
        isReloading={isReloading}
        isMoving={isMoving}
        isSprinting={isSprinting}
        recoilAmount={recoilAmount}
        reloadProgress={reloadProgress}
        setIsMoving={setIsMoving}
        setIsSprinting={setIsSprinting}
        nearInteractableText={interactPrompt}
      />

      {/* 2D HUD Overlay */}
      <HUD
        stats={stats}
        currentWeapon={currentWeapon}
        health={playerHealth}
        maxHealth={maxHealth.current}
        perks={perks}
        widowCharges={widowCharges}
        inventory={inventory}
        thrashMode={thrashMode}
        collectedCassettesCount={3 - uncollectedCassettes.length}
        thrashBannerMessage={thrashBannerMessage}
        hitmarker={hitmarker}
        scorePopups={scorePopups}
        interactPrompt={interactPrompt}
        isReloading={isReloading}
        roundMessage={roundMessage}
        playerPosition={playerPosition}
        playerYaw={playerYaw}
        zombies={zombies}
        activeMysteryBox={activeMysteryBox}
        barricades={barricades}
      />
    </div>
  );
}
