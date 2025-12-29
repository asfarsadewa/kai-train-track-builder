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
 * Draw terrain decorations based on type
 */
function drawTerrainDecorations(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  terrainType: TerrainType
) {
  const halfWidth = TILE_WIDTH / 2;

  switch (terrainType) {
    case 'forest': {
      // Draw small triangular trees
      const treePositions = [
        { x: -8, y: -4 },
        { x: 8, y: -2 },
        { x: -4, y: 4 },
        { x: 6, y: 6 },
      ];
      for (const pos of treePositions) {
        const tx = centerX + pos.x;
        const ty = centerY + pos.y;
        // Tree trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(tx - 1, ty, 2, 4);
        // Tree foliage (triangle)
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(tx, ty - 8);
        ctx.lineTo(tx - 5, ty + 2);
        ctx.lineTo(tx + 5, ty + 2);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'farm': {
      // Draw wheat/crop rows
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        const offset = i * 6;
        ctx.beginPath();
        ctx.moveTo(centerX - halfWidth * 0.5 + offset, centerY - 2);
        ctx.lineTo(centerX + halfWidth * 0.5 + offset, centerY + 2);
        ctx.stroke();
        // Wheat heads
        ctx.fillStyle = '#F9A825';
        ctx.beginPath();
        ctx.ellipse(
          centerX + offset,
          centerY - 4,
          2,
          3,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      break;
    }

    case 'village': {
      // Draw a small house
      ctx.fillStyle = '#D32F2F'; // Red roof
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX - 8, centerY - 2);
      ctx.lineTo(centerX + 8, centerY - 2);
      ctx.closePath();
      ctx.fill();

      // House body
      ctx.fillStyle = '#FFECB3';
      ctx.fillRect(centerX - 6, centerY - 2, 12, 8);

      // Door
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(centerX - 2, centerY + 1, 4, 5);

      // Window
      ctx.fillStyle = '#64B5F6';
      ctx.fillRect(centerX + 2, centerY - 1, 3, 3);
      break;
    }

    case 'flowers': {
      // Draw colorful flower dots
      const flowerColors = ['#E91E63', '#FF9800', '#9C27B0', '#FFEB3B', '#FF5722'];
      const flowerPositions = [
        { x: -10, y: -3 },
        { x: 5, y: -5 },
        { x: -5, y: 3 },
        { x: 10, y: 0 },
        { x: 0, y: 5 },
        { x: -8, y: 6 },
        { x: 12, y: 4 },
      ];
      for (let i = 0; i < flowerPositions.length; i++) {
        const pos = flowerPositions[i];
        ctx.fillStyle = flowerColors[i % flowerColors.length];
        ctx.beginPath();
        ctx.arc(centerX + pos.x, centerY + pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'water': {
      // Draw wave lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) {
        const offset = i * 8;
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY + offset);
        ctx.quadraticCurveTo(
          centerX - 4,
          centerY + offset - 2,
          centerX,
          centerY + offset
        );
        ctx.quadraticCurveTo(
          centerX + 4,
          centerY + offset + 2,
          centerX + 12,
          centerY + offset
        );
        ctx.stroke();
      }
      break;
    }

    case 'rock': {
      // Draw small rock shapes
      ctx.fillStyle = '#757575';
      const rockPositions = [
        { x: -6, y: -2, r: 3 },
        { x: 4, y: 2, r: 4 },
        { x: -2, y: 5, r: 2 },
      ];
      for (const rock of rockPositions) {
        ctx.beginPath();
        ctx.ellipse(
          centerX + rock.x,
          centerY + rock.y,
          rock.r,
          rock.r * 0.6,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      break;
    }

    // grass and sand have no extra decorations
    default:
      break;
  }
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

  // Draw terrain decorations
  drawTerrainDecorations(ctx, centerX, centerY, terrainType);
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
