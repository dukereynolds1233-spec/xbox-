import * as THREE from 'three';

// Generates high-res (1024x1024) PBR texture sets for Xbox Series X Military Horror rendering

/**
 * 1. Cracked, soot-stained concrete & pooling mud floor textures
 */
export function createConcreteFloorPBRTextures() {
  const size = 1024;

  // --- Diffuse Canvas ---
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const dCtx = diffCanvas.getContext('2d')!;

  // Base gritty concrete
  dCtx.fillStyle = '#1c2128';
  dCtx.fillRect(0, 0, size, size);

  // Concrete noise grain & ash specks
  const dData = dCtx.getImageData(0, 0, size, size);
  for (let i = 0; i < dData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    dData.data[i] = Math.max(0, Math.min(255, dData.data[i] + noise));
    dData.data[i + 1] = Math.max(0, Math.min(255, dData.data[i + 1] + noise));
    dData.data[i + 2] = Math.max(0, Math.min(255, dData.data[i + 2] + noise));
  }
  dCtx.putImageData(dData, 0, 0);

  // Soot stains & explosion burns
  for (let s = 0; s < 12; s++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const sr = 60 + Math.random() * 120;
    const grad = dCtx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    grad.addColorStop(0, 'rgba(10, 10, 12, 0.85)');
    grad.addColorStop(0.6, 'rgba(20, 22, 28, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dCtx.fillStyle = grad;
    dCtx.beginPath();
    dCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    dCtx.fill();
  }

  // Pooling mud & grime patches
  for (let m = 0; m < 8; m++) {
    const mx = Math.random() * size;
    const my = Math.random() * size;
    const mr = 80 + Math.random() * 140;
    const grad = dCtx.createRadialGradient(mx, my, 0, mx, my, mr);
    grad.addColorStop(0, 'rgba(28, 20, 14, 0.9)');
    grad.addColorStop(0.5, 'rgba(20, 14, 10, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dCtx.fillStyle = grad;
    dCtx.beginPath();
    dCtx.arc(mx, my, mr, 0, Math.PI * 2);
    dCtx.fill();
  }

  // Deep jagged cracks
  dCtx.strokeStyle = '#05070a';
  dCtx.lineWidth = 3;
  for (let c = 0; c < 15; c++) {
    let cx = Math.random() * size;
    let cy = Math.random() * size;
    dCtx.beginPath();
    dCtx.moveTo(cx, cy);
    for (let step = 0; step < 8; step++) {
      cx += (Math.random() - 0.5) * 70;
      cy += (Math.random() - 0.5) * 70;
      dCtx.lineTo(cx, cy);
    }
    dCtx.stroke();
  }

  // Dried blood spatters on floor
  for (let b = 0; b < 10; b++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    const br = 15 + Math.random() * 35;
    dCtx.fillStyle = 'rgba(50, 6, 6, 0.85)';
    dCtx.beginPath();
    dCtx.arc(bx, by, br, 0, Math.PI * 2);
    dCtx.fill();
  }

  // --- Normal Map Canvas ---
  const normCanvas = document.createElement('canvas');
  normCanvas.width = size;
  normCanvas.height = size;
  const nCtx = normCanvas.getContext('2d')!;

  // Default flat normal [128, 128, 255]
  nCtx.fillStyle = '#8080ff';
  nCtx.fillRect(0, 0, size, size);

  // Normal bump grain
  const nData = nCtx.getImageData(0, 0, size, size);
  for (let i = 0; i < nData.data.length; i += 4) {
    const nx = 128 + (Math.random() - 0.5) * 35;
    const ny = 128 + (Math.random() - 0.5) * 35;
    nData.data[i] = Math.max(0, Math.min(255, nx));
    nData.data[i + 1] = Math.max(0, Math.min(255, ny));
    nData.data[i + 2] = 255;
  }
  nCtx.putImageData(nData, 0, 0);

  // Deep crack normals (bevel edges)
  nCtx.strokeStyle = '#4040ff';
  nCtx.lineWidth = 4;
  for (let c = 0; c < 15; c++) {
    let cx = Math.random() * size;
    let cy = Math.random() * size;
    nCtx.beginPath();
    nCtx.moveTo(cx, cy);
    for (let step = 0; step < 8; step++) {
      cx += (Math.random() - 0.5) * 70;
      cy += (Math.random() - 0.5) * 70;
      nCtx.lineTo(cx, cy);
    }
    nCtx.stroke();
  }

  // --- Roughness Map Canvas ---
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  // Base rough concrete ~0.7 (180/255)
  rCtx.fillStyle = 'rgb(180, 180, 180)';
  rCtx.fillRect(0, 0, size, size);

  // Mud & pooling wet spots (shiny = 0.15 roughness)
  for (let m = 0; m < 8; m++) {
    const mx = Math.random() * size;
    const my = Math.random() * size;
    const mr = 80 + Math.random() * 140;
    const grad = rCtx.createRadialGradient(mx, my, 0, mx, my, mr);
    grad.addColorStop(0, 'rgb(35, 35, 35)'); // Very glossy wet mud
    grad.addColorStop(0.7, 'rgb(120, 120, 120)');
    grad.addColorStop(1, 'rgb(180, 180, 180)');
    rCtx.fillStyle = grad;
    rCtx.beginPath();
    rCtx.arc(mx, my, mr, 0, Math.PI * 2);
    rCtx.fill();
  }

  const diffTex = new THREE.CanvasTexture(diffCanvas);
  diffTex.wrapS = THREE.RepeatWrapping;
  diffTex.wrapT = THREE.RepeatWrapping;
  diffTex.repeat.set(8, 8);

  const normTex = new THREE.CanvasTexture(normCanvas);
  normTex.wrapS = THREE.RepeatWrapping;
  normTex.wrapT = THREE.RepeatWrapping;
  normTex.repeat.set(8, 8);

  const roughTex = new THREE.CanvasTexture(roughCanvas);
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(8, 8);

  return { diffTex, normTex, roughTex };
}

/**
 * 2. Bullet-pocked stone, rusted rebar & peeling paint wall textures
 */
export function createWallPBRTextures() {
  const size = 1024;

  // --- Diffuse Canvas ---
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const dCtx = diffCanvas.getContext('2d')!;

  // Dark slate-gray peeling concrete base
  dCtx.fillStyle = '#1e2631';
  dCtx.fillRect(0, 0, size, size);

  // Peeling military green paint patches
  for (let p = 0; p < 6; p++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const pw = 150 + Math.random() * 250;
    const ph = 150 + Math.random() * 250;
    dCtx.fillStyle = '#2d382e';
    dCtx.fillRect(px, py, pw, ph);
  }

  // Rusted rebar stains (streaks down the wall)
  for (let r = 0; r < 12; r++) {
    const rx = Math.random() * size;
    const ry = Math.random() * (size * 0.4);
    const rw = 10 + Math.random() * 25;
    const rh = 150 + Math.random() * 350;
    const grad = dCtx.createLinearGradient(rx, ry, rx, ry + rh);
    grad.addColorStop(0, 'rgba(154, 52, 18, 0.85)'); // Heavy rust orange
    grad.addColorStop(0.7, 'rgba(124, 45, 18, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dCtx.fillStyle = grad;
    dCtx.fillRect(rx, ry, rw, rh);
  }

  // Bullet impact pocks (dark crater holes with white lead dust ring)
  for (let b = 0; b < 28; b++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    // Lead halo
    dCtx.fillStyle = 'rgba(100, 116, 139, 0.6)';
    dCtx.beginPath();
    dCtx.arc(bx, by, 14 + Math.random() * 8, 0, Math.PI * 2);
    dCtx.fill();
    // Crater hole
    dCtx.fillStyle = '#0a0d12';
    dCtx.beginPath();
    dCtx.arc(bx, by, 6 + Math.random() * 4, 0, Math.PI * 2);
    dCtx.fill();
  }

  // --- Normal Map Canvas ---
  const normCanvas = document.createElement('canvas');
  normCanvas.width = size;
  normCanvas.height = size;
  const nCtx = normCanvas.getContext('2d')!;

  nCtx.fillStyle = '#8080ff';
  nCtx.fillRect(0, 0, size, size);

  // Bullet impact crater normals
  for (let b = 0; b < 28; b++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    const br = 12 + Math.random() * 8;
    const grad = nCtx.createRadialGradient(bx, by, 0, bx, by, br);
    grad.addColorStop(0, '#3030ff'); // Deep indentation
    grad.addColorStop(0.5, '#c080ff');
    grad.addColorStop(1, '#8080ff');
    nCtx.fillStyle = grad;
    nCtx.beginPath();
    nCtx.arc(bx, by, br, 0, Math.PI * 2);
    nCtx.fill();
  }

  // --- Roughness Map Canvas ---
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  rCtx.fillStyle = 'rgb(200, 200, 200)'; // Rough stone
  rCtx.fillRect(0, 0, size, size);

  const diffTex = new THREE.CanvasTexture(diffCanvas);
  diffTex.wrapS = THREE.RepeatWrapping;
  diffTex.wrapT = THREE.RepeatWrapping;
  diffTex.repeat.set(6, 2);

  const normTex = new THREE.CanvasTexture(normCanvas);
  normTex.wrapS = THREE.RepeatWrapping;
  normTex.wrapT = THREE.RepeatWrapping;
  normTex.repeat.set(6, 2);

  const roughTex = new THREE.CanvasTexture(roughCanvas);
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(6, 2);

  return { diffTex, normTex, roughTex };
}

/**
 * 3. Scratched Carbon-Steel Gunmetal PBR textures for weapon models
 */
export function createWeaponSteelTextures() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark brushed steel base
  ctx.fillStyle = '#1e232a';
  ctx.fillRect(0, 0, size, size);

  // Scratches & metallic edge wear
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  for (let i = 0; i < 120; i++) {
    const x1 = Math.random() * size;
    const y1 = Math.random() * size;
    const len = 10 + Math.random() * 40;
    const ang = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);

  return texture;
}

/**
 * 4. Torn military fatigue camouflage textures for Zombie models
 */
export function createMilitaryFatigueTextures() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base Woodland Olive Camo
  ctx.fillStyle = '#273121';
  ctx.fillRect(0, 0, size, size);

  // Dark brown blotches
  ctx.fillStyle = '#1c1511';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 25 + Math.random() * 45;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Black soot & dirt spots
  ctx.fillStyle = '#0b0d0e';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 15 + Math.random() * 30;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blood splatters & decay spots
  ctx.fillStyle = 'rgba(70, 8, 8, 0.85)';
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 10 + Math.random() * 25;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}
