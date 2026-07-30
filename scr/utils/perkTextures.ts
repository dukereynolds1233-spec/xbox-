import * as THREE from 'three';

function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  color: string,
  font: string
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const step = 0.16; // Radians per character
  const totalAngle = (text.length - 1) * step;
  const initialAngle = startAngle - totalAngle / 2;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const angle = initialAngle + i * step;

    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

function drawShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy + h / 6);
  ctx.quadraticCurveTo(cx + w / 2, cy + h / 2, cx, cy + h / 2 + 12);
  ctx.quadraticCurveTo(cx - w / 2, cy + h / 2, cx - w / 2, cy + h / 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Generate high-resolution 512x512 CanvasTexture for each COD Zombies Perk logo
export function createPerkTexture(perkId: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const cx = 256;
  const cy = 256;

  // Clear background
  ctx.clearRect(0, 0, 512, 512);

  if (perkId === 'juggernog') {
    // Outer white ring
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Red inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, 222, 0, Math.PI * 2);
    ctx.fillStyle = '#be123c';
    ctx.fill();

    // White inner accent ring
    ctx.beginPath();
    ctx.arc(cx, cy, 182, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Top text: "Juggernog"
    drawCurvedText(
      ctx,
      'Juggernog',
      cx,
      cy,
      200,
      -Math.PI / 2,
      '#ffffff',
      "bold 38px 'Georgia', serif, sans-serif"
    );

    // Bottom text: "Soda"
    drawCurvedText(
      ctx,
      'Soda',
      cx,
      cy,
      200,
      Math.PI / 2,
      '#ffffff',
      "bold 36px 'Georgia', serif, sans-serif"
    );

    // Central Shield
    drawShield(ctx, cx, cy + 4, 116, 136, '#ffffff');

    // Red Cross inside shield
    ctx.fillStyle = '#be123c';
    ctx.fillRect(cx - 38, cy - 20, 76, 26);
    ctx.fillRect(cx - 13, cy - 45, 26, 76);

    // White Bullet across cross
    ctx.save();
    ctx.translate(cx, cy - 7);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-8, -36, 16, 72, 8);
    ctx.fill();

    // Inner Bullet line
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.roundRect(-3, -28, 6, 56, 3);
    ctx.fill();
    ctx.restore();
  } else if (perkId === 'doubletap') {
    // Outer white ring
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Yellow inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, 222, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();

    // White inner accent ring
    ctx.beginPath();
    ctx.arc(cx, cy, 182, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Top text: "Double Tap"
    drawCurvedText(
      ctx,
      'Double Tap',
      cx,
      cy,
      200,
      -Math.PI / 2,
      '#ffffff',
      "bold 36px 'Georgia', serif, sans-serif"
    );

    // Bottom text: "Root Beer"
    drawCurvedText(
      ctx,
      'Root Beer',
      cx,
      cy,
      200,
      Math.PI / 2,
      '#ffffff',
      "bold 32px 'Georgia', serif, sans-serif"
    );

    // Central Shield
    drawShield(ctx, cx, cy + 4, 116, 136, '#ffffff');

    // Double bullet streaks inside shield
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(cx - 36, cy - 24, 72, 14, 7);
    ctx.roundRect(cx - 26, cy + 4, 52, 14, 7);
    ctx.fill();
  } else if (perkId === 'quickrevive') {
    // Outer white ring
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Sky Blue inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, 222, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // White inner accent ring
    ctx.beginPath();
    ctx.arc(cx, cy, 182, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Top text: "REVIVE!"
    drawCurvedText(
      ctx,
      'REVIVE!',
      cx,
      cy,
      200,
      -Math.PI / 2,
      '#ffffff',
      'bold 40px sans-serif'
    );

    // Bottom text: "Soda"
    drawCurvedText(
      ctx,
      'Soda',
      cx,
      cy,
      200,
      Math.PI / 2,
      '#ffffff',
      "bold 36px 'Georgia', serif, sans-serif"
    );

    // Central Shield
    drawShield(ctx, cx, cy + 4, 116, 136, '#ffffff');

    // Tombstone & Reviving figure emblem inside shield
    ctx.fillStyle = '#0284c7';

    // Person head
    ctx.beginPath();
    ctx.arc(cx + 12, cy - 22, 12, 0, Math.PI * 2);
    ctx.fill();

    // Person body rising
    ctx.beginPath();
    ctx.roundRect(cx + 3, cy - 8, 18, 36, 8);
    ctx.fill();

    // Tombstone arch
    ctx.beginPath();
    ctx.arc(cx - 20, cy + 6, 18, Math.PI, 0);
    ctx.rect(cx - 38, cy + 6, 36, 22);
    ctx.fill();
  } else if (perkId === 'speedcola') {
    // Outer white ring
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Emerald Green inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, 222, 0, Math.PI * 2);
    ctx.fillStyle = '#15803d';
    ctx.fill();

    // White inner accent ring
    ctx.beginPath();
    ctx.arc(cx, cy, 182, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Top text: "Speed Cola"
    drawCurvedText(
      ctx,
      'Speed Cola',
      cx,
      cy,
      200,
      -Math.PI / 2,
      '#ffffff',
      "bold 36px 'Georgia', serif, sans-serif"
    );

    // Bottom text: "Soda"
    drawCurvedText(
      ctx,
      'Soda',
      cx,
      cy,
      200,
      Math.PI / 2,
      '#ffffff',
      "bold 36px 'Georgia', serif, sans-serif"
    );

    // Central Shield
    drawShield(ctx, cx, cy + 4, 116, 136, '#ffffff');

    // Sleight of hand / mag reload emblem inside shield
    ctx.fillStyle = '#15803d';
    ctx.save();
    ctx.translate(cx + 4, cy - 2);
    ctx.rotate(-Math.PI / 6);

    // Mag
    ctx.beginPath();
    ctx.roundRect(-16, -26, 32, 52, 6);
    ctx.fill();

    // Speed lines
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-34, -22, 12, 6);
    ctx.fillRect(-34, -8, 12, 6);
    ctx.fillRect(-34, 6, 12, 6);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
