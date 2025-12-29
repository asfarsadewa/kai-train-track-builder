// Terrain rendering utilities

import type { GameGrid, TerrainType, GridPosition } from '../types';
import { gridToScreen } from './isometric';
import { TILE_WIDTH, TILE_HEIGHT, ELEVATION_HEIGHT, COLORS } from '../constants';

/**
 * Draw an isometric tile top face (diamond shape)
 */
export function drawTileTop(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  color: string
) {
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - halfHeight); // Top
  ctx.lineTo(centerX + halfWidth, centerY); // Right
  ctx.lineTo(centerX, centerY + halfHeight); // Bottom
  ctx.lineTo(centerX - halfWidth, centerY); // Left
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Subtle outline
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Draw the left face of an elevated tile
 */
export function drawTileLeftFace(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  height: number,
  color: string
) {
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;

  ctx.beginPath();
  ctx.moveTo(centerX - halfWidth, centerY); // Top-left
  ctx.lineTo(centerX, centerY + halfHeight); // Top-right (bottom of diamond)
  ctx.lineTo(centerX, centerY + halfHeight + height); // Bottom-right
  ctx.lineTo(centerX - halfWidth, centerY + height); // Bottom-left
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draw the right face of an elevated tile
 */
export function drawTileRightFace(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  height: number,
  color: string
) {
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY + halfHeight); // Top-left (bottom of diamond)
  ctx.lineTo(centerX + halfWidth, centerY); // Top-right
  ctx.lineTo(centerX + halfWidth, centerY + height); // Bottom-right
  ctx.lineTo(centerX, centerY + halfHeight + height); // Bottom-left
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Get colors for a terrain type
 */
function getTerrainColors(terrainType: TerrainType) {
  return COLORS.terrain[terrainType] || COLORS.terrain.grass;
}

/**
 * Draw a complete isometric tile with elevation
 */
export function drawIsometricTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  terrainType: TerrainType,
  elevation: number,
  originX: number,
  originY: number
) {
  const colors = getTerrainColors(terrainType);
  const screenPos = gridToScreen(x, y, elevation);
  const centerX = screenPos.px + originX;
  const centerY = screenPos.py + originY;

  // Draw elevation sides if elevated
  if (elevation > 0) {
    const sideHeight = elevation * ELEVATION_HEIGHT;

    // Draw cliff faces (brown color for "earth")
    drawTileLeftFace(
      ctx,
      centerX,
      centerY,
      sideHeight,
      COLORS.terrain.cliff.dark
    );
    drawTileRightFace(
      ctx,
      centerX,
      centerY,
      sideHeight,
      COLORS.terrain.cliff.light
    );
  }

  // Draw top face
  drawTileTop(ctx, centerX, centerY, colors.top);
}

/**
 * Draw hover highlight on a tile
 */
export function drawTileHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  elevation: number,
  originX: number,
  originY: number,
  color: string = COLORS.ui.hover
) {
  const screenPos = gridToScreen(x, y, elevation);
  const centerX = screenPos.px + originX;
  const centerY = screenPos.py + originY;

  drawTileTop(ctx, centerX, centerY, color);
}

/**
 * Render the entire terrain grid
 */
export function renderTerrain(
  ctx: CanvasRenderingContext2D,
  grid: GameGrid,
  originX: number,
  originY: number
) {
  // Render in correct order for depth (back to front)
  // In isometric, we render by (y + x) order
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.cells[y][x];
      drawIsometricTile(
        ctx,
        x,
        y,
        cell.terrainType,
        cell.elevation,
        originX,
        originY
      );
    }
  }
}

/**
 * Render hover highlight if a cell is hovered
 */
export function renderHoverHighlight(
  ctx: CanvasRenderingContext2D,
  hoveredCell: GridPosition | null,
  grid: GameGrid,
  originX: number,
  originY: number
) {
  if (!hoveredCell) return;

  const { x, y } = hoveredCell;
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return;

  const cell = grid.cells[y][x];
  drawTileHighlight(ctx, x, y, cell.elevation, originX, originY);
}
