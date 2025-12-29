// Main game renderer

import type { GameState } from '../types';
import { calculateCanvasSize, calculateGridOrigin, COLORS } from '../constants';
import { renderTerrain, renderHoverHighlight } from './terrainRenderer';
import { renderTracks } from './trackRenderer';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  originX: number;
  originY: number;
}

/**
 * Set up the canvas and calculate rendering parameters
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  gridWidth: number,
  gridHeight: number
): RenderContext | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Calculate and set canvas size
  const { width, height } = calculateCanvasSize(gridWidth, gridHeight);
  canvas.width = width;
  canvas.height = height;

  // Calculate grid origin
  const { originX, originY } = calculateGridOrigin(width, gridWidth, gridHeight);

  return { canvas, ctx, originX, originY };
}

/**
 * Clear the canvas with background color
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Main render function - renders the entire game state
 */
export function render(
  renderCtx: RenderContext,
  state: GameState,
  onDrawOverlay?: (ctx: CanvasRenderingContext2D) => void
) {
  const { ctx, canvas, originX, originY } = renderCtx;

  // Apply camera transform
  ctx.save();
  ctx.translate(state.camera.offsetX, state.camera.offsetY);
  ctx.scale(state.camera.zoom, state.camera.zoom);

  // Clear canvas
  clearCanvas(ctx, canvas);

  // Render terrain grid
  renderTerrain(ctx, state.grid, originX, originY);

  // Render tracks
  renderTracks(ctx, state.tracks, originX, originY);

  // Render custom overlay (train, etc.)
  if (onDrawOverlay) {
    onDrawOverlay(ctx);
  }

  // Render hover highlight
  renderHoverHighlight(ctx, state.hoveredCell, state.grid, originX, originY);

  ctx.restore();
}

/**
 * Create a render loop
 */
export function createRenderLoop(
  renderCtx: RenderContext,
  getState: () => GameState,
  onFrame?: (deltaTime: number) => void,
  onDrawOverlay?: (ctx: CanvasRenderingContext2D) => void
): { start: () => void; stop: () => void } {
  let animationId: number | null = null;
  let lastTime = 0;

  function loop(currentTime: number) {
    const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0;
    lastTime = currentTime;

    // Call frame callback (for train movement, etc.)
    if (onFrame) {
      onFrame(deltaTime);
    }

    // Render current state
    render(renderCtx, getState(), onDrawOverlay);

    // Continue loop
    animationId = requestAnimationFrame(loop);
  }

  return {
    start: () => {
      if (animationId === null) {
        lastTime = 0;
        animationId = requestAnimationFrame(loop);
      }
    },
    stop: () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
  };
}
