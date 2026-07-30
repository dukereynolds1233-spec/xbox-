import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Weapon, PerkId } from '../../types';
import { soundManager } from '../../audio/soundEffects';

interface PlayerControllerProps {
  playerPosition: [number, number, number];
  setPlayerPosition: React.Dispatch<React.SetStateAction<[number, number, number]>>;
  setPlayerYaw?: (yaw: number) => void;
  playerHealth: number;
  maxHealth: number;
  perks?: PerkId[];
  currentWeapon: Weapon;
  setCurrentWeapon: React.Dispatch<React.SetStateAction<Weapon>>;
  onShoot: (origin: [number, number, number], direction: [number, number, number]) => void;
  onReload: () => void;
  onInteract: () => void;
  isPointerLocked: boolean;
  setIsPointerLocked: (locked: boolean) => void;
  sensitivity: number;
  setIsMoving: (moving: boolean) => void;
  setIsSprinting: (sprinting: boolean) => void;
  nearInteractableText: string | null;
  activeMysteryBox?: {
    position: [number, number, number];
  };
}

export const PlayerController: React.FC<PlayerControllerProps> = ({
  playerPosition,
  setPlayerPosition,
  setPlayerYaw,
  perks = [],
  currentWeapon,
  onShoot,
  onReload,
  onInteract,
  isPointerLocked,
  setIsPointerLocked,
  sensitivity,
  setIsMoving,
  setIsSprinting,
  activeMysteryBox,
}) => {
  const { camera, gl } = useThree();

  // Input states
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const lastShotTime = useRef(0);

  // Click to lock pointer
  useEffect(() => {
    const handleCanvasClick = () => {
      if (!isPointerLocked) {
        gl.domElement.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === gl.domElement;
      setIsPointerLocked(locked);
    };

    const canvas = gl.domElement;
    canvas.addEventListener('click', handleCanvasClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [gl, isPointerLocked, setIsPointerLocked]);

  // Mouse Movement Listener for Pointer Lock
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return;

      const sens = sensitivity * 0.002;
      yaw.current -= e.movementX * sens;
      pitch.current -= e.movementY * sens;

      // Clamp pitch to avoid full camera flip
      pitch.current = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, pitch.current));
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isPointerLocked, sensitivity]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      if (e.code === 'KeyR') {
        onReload();
      }
      if (e.code === 'KeyE') {
        onInteract();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onReload, onInteract]);

  const weaponRef = useRef(currentWeapon);
  useEffect(() => {
    weaponRef.current = currentWeapon;
  }, [currentWeapon]);

  // Mouse Shooting Listener
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && isPointerLocked) {
        attemptShoot();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [isPointerLocked]);

  const attemptShoot = () => {
    const w = weaponRef.current;
    const now = performance.now() / 1000;
    if (now - lastShotTime.current < w.fireRate) return;
    if (w.currentClip <= 0) {
      onReload();
      return;
    }

    lastShotTime.current = now;

    // Calculate bullet trajectory direction from camera center view
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    // Camera origin point
    const origin: [number, number, number] = [
      camera.position.x,
      camera.position.y - 0.1,
      camera.position.z,
    ];

    onShoot(origin, [dir.x, dir.y, dir.z]);
  };

  // Internal position ref to avoid React state update lag during 60 FPS loop
  const posRef = useRef<[number, number, number]>(playerPosition);
  useEffect(() => {
    posRef.current = playerPosition;
  }, [playerPosition]);

  // Prev button state for gamepad edge triggers
  const prevGamepadButtons = useRef<Record<number, boolean>>({});

  // Main Physics & Movement Loop
  useFrame((_, delta) => {
    // Check Gamepad
    const gamepads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    let padMoveX = 0;
    let padMoveZ = 0;
    let padSprinting = false;

    if (gp && gp.connected) {
      const deadzone = 0.15;

      // Gamepad Look (Right Stick: Axes 2 & 3)
      const rx = Math.abs(gp.axes[2]) > deadzone ? gp.axes[2] : 0;
      const ry = Math.abs(gp.axes[3]) > deadzone ? gp.axes[3] : 0;

      if (rx !== 0 || ry !== 0) {
        const padLookSens = sensitivity * 2.5 * delta;
        yaw.current -= rx * padLookSens;
        pitch.current -= ry * padLookSens;
        pitch.current = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, pitch.current));
      }

      // Gamepad Move (Left Stick: Axes 0 & 1)
      const lx = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
      const ly = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
      if (lx !== 0 || ly !== 0) {
        padMoveX = lx;
        padMoveZ = ly;
      }

      // Triggers & Buttons
      const rtPressed = gp.buttons[7]?.pressed || (gp.buttons[7]?.value ?? 0) > 0.25;
      const ltPressed = gp.buttons[6]?.pressed || (gp.buttons[6]?.value ?? 0) > 0.25;
      const btnA = !!gp.buttons[0]?.pressed; // Jump
      const btnX = !!gp.buttons[2]?.pressed; // Reload
      const btnY = !!gp.buttons[3]?.pressed; // Interact
      const btnL3 = !!gp.buttons[10]?.pressed || !!gp.buttons[4]?.pressed || ltPressed; // Sprint

      padSprinting = btnL3;

      // Button Edge Triggers (Reload & Interact)
      if (btnX && !prevGamepadButtons.current[2]) {
        onReload();
      }
      if (btnY && !prevGamepadButtons.current[3]) {
        onInteract();
      }
      if (btnA && isGrounded.current && !prevGamepadButtons.current[0]) {
        velocityY.current = 6.5;
        isGrounded.current = false;
      }

      // Shooting via RT (Right Trigger)
      if (rtPressed) {
        attemptShoot();
      }

      // Store button states for edge detection
      prevGamepadButtons.current[0] = btnA;
      prevGamepadButtons.current[2] = btnX;
      prevGamepadButtons.current[3] = btnY;
      prevGamepadButtons.current[7] = rtPressed;
    }

    // 1. Automatic weapon firing check for Keyboard/Mouse
    if (keys.current['LeftClick'] || (keys.current['Mouse0'] && weaponRef.current.isAutomatic)) {
      if (isPointerLocked) attemptShoot();
    }

    // 2. Camera Orientation
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch.current);
    camera.quaternion.copy(qYaw).multiply(qPitch);
    if (setPlayerYaw) setPlayerYaw(yaw.current);

    // 3. Movement direction calculation
    const moveVector = new THREE.Vector3();
    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveVector.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveVector.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveVector.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveVector.x += 1;

    // Merge Gamepad stick movement
    if (padMoveX !== 0 || padMoveZ !== 0) {
      moveVector.x += padMoveX;
      moveVector.z += padMoveZ;
    }

    const moving = moveVector.lengthSq() > 0;
    const sprinting = padSprinting || !!keys.current['ShiftLeft'] || !!keys.current['ShiftRight'];

    setIsMoving(moving);
    setIsSprinting(sprinting && moving);

    let [currX, currY, currZ] = posRef.current;
    let posChanged = false;

    if (moving) {
      moveVector.normalize();

      // Align movement with yaw rotation
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(qYaw);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(qYaw);

      // Apply Stamin-Up Speed Boost (40% faster movement)
      const hasStaminUp = perks.includes('staminup');
      const staminMult = hasStaminUp ? 1.4 : 1.0;

      const moveSpeed = (sprinting ? 11.5 : 7.2) * staminMult * delta;
      const moveOffset = forward
        .multiplyScalar(-moveVector.z * moveSpeed)
        .add(right.multiplyScalar(moveVector.x * moveSpeed));

      let newX = currX + moveOffset.x;
      let newZ = currZ + moveOffset.z;

      // Arena Wall Boundary Collision (Floor 150x150, bounds -73.2 to 73.2)
      const bound = 73.2;
      const playerRadius = 0.35;

      const boxPos = activeMysteryBox?.position || [0, 0, 30];

      // Obstacles collision checks
      const obstacleBoxes = [
        { minX: -2.2, maxX: 2.2, minZ: -2.2, maxZ: 2.2 }, // Central Support Structure

        // Quadrant Cover Crates
        { minX: -16.8, maxX: -13.2, minZ: -16.8, maxZ: -13.2 },
        { minX: 13.2, maxX: 16.8, minZ: -16.8, maxZ: -13.2 },
        { minX: -17.8, maxX: -14.2, minZ: 13.2, maxZ: 16.8 },
        { minX: 14.2, maxX: 17.8, minZ: 13.2, maxZ: 16.8 },

        // Interior Room Partition Walls
        { minX: -40.5, maxX: -19.5, minZ: -40.8, maxZ: -39.2 }, // NW Wall A
        { minX: -40.8, maxX: -39.2, minZ: -40.5, maxZ: -19.5 }, // NW Wall B
        { minX: 19.5, maxX: 40.5, minZ: -40.8, maxZ: -39.2 }, // NE Wall A
        { minX: 39.2, maxX: 40.8, minZ: -40.5, maxZ: -19.5 }, // NE Wall B
        { minX: -40.5, maxX: -19.5, minZ: 39.2, maxZ: 40.8 }, // SW Wall A
        { minX: -40.8, maxX: -39.2, minZ: 19.5, maxZ: 40.5 }, // SW Wall B
        { minX: 19.5, maxX: 40.5, minZ: 39.2, maxZ: 40.8 }, // SE Wall A
        { minX: 39.2, maxX: 40.8, minZ: 19.5, maxZ: 40.5 }, // SE Wall B

        // Perk Machines
        { minX: -32.8, maxX: -31.2, minZ: -32.8, maxZ: -31.2 }, // Juggernog
        { minX: 31.2, maxX: 32.8, minZ: -32.8, maxZ: -31.2 }, // Speed Cola
        { minX: -32.8, maxX: -31.2, minZ: 31.2, maxZ: 32.8 }, // Double Tap
        { minX: 31.2, maxX: 32.8, minZ: 31.2, maxZ: 32.8 }, // Quick Revive
        { minX: -58.8, maxX: -57.2, minZ: -0.8, maxZ: 0.8 }, // Stamin-Up
        { minX: -0.8, maxX: 0.8, minZ: -58.8, maxZ: -57.2 }, // Widow's Wine
        { minX: 57.2, maxX: 58.8, minZ: -0.8, maxZ: 0.8 }, // Mule Kick
        { minX: -0.8, maxX: 0.8, minZ: 57.2, maxZ: 58.8 }, // Electric Cherry
        { minX: -58.8, maxX: -57.2, minZ: -58.8, maxZ: -57.2 }, // Deadshot

        // Mystery Box
        { minX: boxPos[0] - 1.3, maxX: boxPos[0] + 1.3, minZ: boxPos[2] - 0.8, maxZ: boxPos[2] + 0.8 },

        // Ammo Refill Crate [25, -35]
        { minX: 23.8, maxX: 26.2, minZ: -35.8, maxZ: -34.2 },

        // Pack-A-Punch Machine [0, -45]
        { minX: -1.7, maxX: 1.7, minZ: -46.2, maxZ: -43.8 },
      ];

      // Smooth axis-separated movement and sliding collision logic
      let testX = currX + moveOffset.x;
      testX = Math.max(-bound, Math.min(bound, testX));

      let collideX = false;
      for (const box of obstacleBoxes) {
        if (
          testX + playerRadius > box.minX &&
          testX - playerRadius < box.maxX &&
          currZ + playerRadius > box.minZ &&
          currZ - playerRadius < box.maxZ
        ) {
          collideX = true;
          break;
        }
      }
      if (!collideX) currX = testX;

      let testZ = currZ + moveOffset.z;
      testZ = Math.max(-bound, Math.min(bound, testZ));

      let collideZ = false;
      for (const box of obstacleBoxes) {
        if (
          currX + playerRadius > box.minX &&
          currX - playerRadius < box.maxX &&
          testZ + playerRadius > box.minZ &&
          testZ - playerRadius < box.maxZ
        ) {
          collideZ = true;
          break;
        }
      }
      if (!collideZ) currZ = testZ;

      posChanged = true;
    }

    // 4. Jump & Gravity
    if (keys.current['Space'] && isGrounded.current) {
      velocityY.current = 6.5;
      isGrounded.current = false;
    }

    if (!isGrounded.current) {
      velocityY.current -= 18 * delta; // Gravity
      currY += velocityY.current * delta;

      const eyeLevel = 1.7;
      if (currY <= eyeLevel) {
        currY = eyeLevel;
        velocityY.current = 0;
        isGrounded.current = true;
      }
      posChanged = true;
    } else {
      currY = 1.7;
    }

    posRef.current = [currX, currY, currZ];
    camera.position.set(currX, currY, currZ);

    if (posChanged) {
      setPlayerPosition([currX, currY, currZ]);
    }
  });

  return null;
};
