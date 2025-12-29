// Collision effects renderer - spectacular crash visuals!

import type {
  CollisionState,
  Particle,
  DebrisParticle,
  StarParticle,
  FireParticle,
} from '../types';

const CRASH_DURATION = 3000; // 3 seconds of effects

/**
 * Create initial collision state with all particles
 */
export function createCollisionState(worldX: number, worldY: number): CollisionState {
  const particles: Particle[] = [];
  const debris: DebrisParticle[] = [];
  const stars: StarParticle[] = [];
  const fireParticles: FireParticle[] = [];

  // Create explosion particles (outward burst)
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 300;
    particles.push({
      x: worldX,
      y: worldY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 100,
      color: ['#FF5722', '#FF9800', '#FFEB3B', '#F44336'][Math.floor(Math.random() * 4)],
      size: 3 + Math.random() * 5,
      life: 1,
    });
  }

  // Create debris (wheels, planks, metal)
  const debrisTypes: ('wheel' | 'plank' | 'metal')[] = ['wheel', 'plank', 'metal'];
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 150;
    debris.push({
      x: worldX,
      y: worldY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 150,
      color: ['#5D4037', '#37474F', '#795548'][Math.floor(Math.random() * 3)],
      size: 5 + Math.random() * 8,
      life: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 10,
      type: debrisTypes[Math.floor(Math.random() * debrisTypes.length)],
    });
  }

  // Create cartoon stars
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const distance = 40 + Math.random() * 30;
    stars.push({
      x: worldX + Math.cos(angle) * distance,
      y: worldY + Math.sin(angle) * distance - 20,
      size: 8 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 3,
      life: 1,
    });
  }

  // Initial fire
  for (let i = 0; i < 20; i++) {
    fireParticles.push(createFireParticle(worldX, worldY));
  }

  return {
    worldX,
    worldY,
    timestamp: Date.now(),
    particles,
    debris,
    stars,
    fireParticles,
  };
}

function createFireParticle(x: number, y: number): FireParticle {
  return {
    x: x + (Math.random() - 0.5) * 40,
    y: y + (Math.random() - 0.5) * 20,
    size: 8 + Math.random() * 12,
    life: 1,
    color: ['#FF5722', '#FF9800', '#FFEB3B', '#F44336'][Math.floor(Math.random() * 4)],
  };
}

/**
 * Update collision particles (called each frame)
 */
export function updateCollisionState(
  state: CollisionState,
  deltaTime: number
): CollisionState {
  const age = Date.now() - state.timestamp;
  const progress = age / CRASH_DURATION;

  if (progress >= 1) {
    return state; // Animation complete
  }

  // Update particles with physics
  const updatedParticles = state.particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * deltaTime,
      y: p.y + p.vy * deltaTime,
      vy: p.vy + 500 * deltaTime, // Gravity
      life: p.life - deltaTime * 0.5,
    }))
    .filter(p => p.life > 0);

  // Update debris with physics and rotation
  const updatedDebris = state.debris
    .map(d => ({
      ...d,
      x: d.x + d.vx * deltaTime,
      y: d.y + d.vy * deltaTime,
      vy: d.vy + 300 * deltaTime,
      rotation: d.rotation + d.rotationSpeed * deltaTime,
      life: d.life - deltaTime * 0.3,
    }))
    .filter(d => d.life > 0);

  // Update stars (float and spin)
  const updatedStars = state.stars
    .map(s => ({
      ...s,
      y: s.y - 20 * deltaTime, // Float up
      rotation: s.rotation + s.rotationSpeed * deltaTime,
      life: s.life - deltaTime * 0.4,
    }))
    .filter(s => s.life > 0);

  // Update fire (rise and fade)
  let updatedFire = state.fireParticles
    .map(f => ({
      ...f,
      y: f.y - 50 * deltaTime,
      size: f.size * (1 - deltaTime * 0.5),
      life: f.life - deltaTime * 0.8,
    }))
    .filter(f => f.life > 0);

  // Spawn new fire particles while effect is active
  if (progress < 0.7) {
    for (let i = 0; i < 3; i++) {
      updatedFire.push(createFireParticle(state.worldX, state.worldY));
    }
  }

  return {
    ...state,
    particles: updatedParticles,
    debris: updatedDebris,
    stars: updatedStars,
    fireParticles: updatedFire,
  };
}

/**
 * Calculate screen shake offset
 */
export function calculateScreenShake(
  collisionState: CollisionState | null
): { offsetX: number; offsetY: number } {
  if (!collisionState) return { offsetX: 0, offsetY: 0 };

  const age = Date.now() - collisionState.timestamp;
  const progress = age / CRASH_DURATION;

  if (progress >= 1) return { offsetX: 0, offsetY: 0 };

  // Shake intensity decreases over time
  const intensity = Math.max(0, 20 * (1 - progress));

  return {
    offsetX: (Math.random() - 0.5) * intensity,
    offsetY: (Math.random() - 0.5) * intensity,
  };
}

/**
 * Check if collision animation is complete
 */
export function isCollisionComplete(collisionState: CollisionState | null): boolean {
  if (!collisionState) return true;
  const age = Date.now() - collisionState.timestamp;
  return age >= CRASH_DURATION;
}

/**
 * Draw all collision effects
 */
export function drawCollisionEffects(
  ctx: CanvasRenderingContext2D,
  state: CollisionState
) {
  const age = Date.now() - state.timestamp;
  const progress = age / CRASH_DURATION;

  // 1. Draw fire/flames (behind other effects)
  drawFire(ctx, state.fireParticles);

  // 2. Draw explosion particles
  drawParticles(ctx, state.particles);

  // 3. Draw debris
  drawDebris(ctx, state.debris);

  // 4. Draw stars
  drawStars(ctx, state.stars);

  // 5. Draw smoke clouds
  drawSmokeClouds(ctx, state.worldX, state.worldY, progress);

  // 6. Draw "CRASH!" text (with comic book style)
  if (progress < 0.8) {
    drawCrashText(ctx, state.worldX, state.worldY - 50, progress);
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDebris(ctx: CanvasRenderingContext2D, debris: DebrisParticle[]) {
  for (const d of debris) {
    ctx.save();
    ctx.globalAlpha = d.life;
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rotation);

    ctx.fillStyle = d.color;
    if (d.type === 'wheel') {
      ctx.beginPath();
      ctx.arc(0, 0, d.size, 0, Math.PI * 2);
      ctx.fill();
      // Wheel spoke
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-d.size * 0.7, 0);
      ctx.lineTo(d.size * 0.7, 0);
      ctx.stroke();
    } else if (d.type === 'plank') {
      ctx.fillRect(-d.size, -d.size / 4, d.size * 2, d.size / 2);
    } else {
      // Metal piece - irregular shape
      ctx.beginPath();
      ctx.moveTo(-d.size, 0);
      ctx.lineTo(0, -d.size);
      ctx.lineTo(d.size, 0);
      ctx.lineTo(0, d.size / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawStars(ctx: CanvasRenderingContext2D, stars: StarParticle[]) {
  for (const s of stars) {
    ctx.save();
    ctx.globalAlpha = s.life;
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);

    // Draw 5-pointed star
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.strokeStyle = '#FFA000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * s.size;
      const y = Math.sin(angle) * s.size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawFire(ctx: CanvasRenderingContext2D, fire: FireParticle[]) {
  for (const f of fire) {
    ctx.globalAlpha = f.life * 0.8;

    // Create gradient for fire effect
    const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
    gradient.addColorStop(0, '#FFEB3B');
    gradient.addColorStop(0.5, f.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSmokeClouds(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number
) {
  const smokeAlpha = Math.max(0, 0.6 - progress);
  const smokeSize = 30 + progress * 50;

  ctx.globalAlpha = smokeAlpha;
  ctx.fillStyle = '#555555';

  for (let i = 0; i < 5; i++) {
    const offsetX = Math.sin(i * 1.2 + progress * 2) * 30;
    const offsetY = -progress * 60 - i * 15;
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, smokeSize - i * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawCrashText(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number
) {
  const scale = 1 + Math.sin(progress * 20) * 0.1; // Pulsing effect
  const alpha = Math.max(0, 1 - progress * 1.2);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Comic book style text
  ctx.font = 'bold 48px "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Black outline (thick)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.strokeText('CRASH!', 0, 0);

  // Yellow fill
  ctx.fillStyle = '#FFEB3B';
  ctx.fillText('CRASH!', 0, 0);

  // Red inner outline
  ctx.strokeStyle = '#FF5722';
  ctx.lineWidth = 2;
  ctx.strokeText('CRASH!', 0, 0);

  ctx.restore();
}
