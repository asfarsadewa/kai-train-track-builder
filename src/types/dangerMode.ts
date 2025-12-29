// Danger Mode types - collision state and particle systems

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0-1, decreasing over time
}

export interface DebrisParticle extends Particle {
  rotation: number;
  rotationSpeed: number;
  type: 'wheel' | 'plank' | 'metal';
}

export interface StarParticle {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

export interface FireParticle {
  x: number;
  y: number;
  size: number;
  life: number;
  color: string;
}

export interface CollisionState {
  worldX: number;
  worldY: number;
  timestamp: number;
  particles: Particle[];
  debris: DebrisParticle[];
  stars: StarParticle[];
  fireParticles: FireParticle[];
}
