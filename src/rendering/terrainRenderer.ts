// Terrain rendering utilities

import type { GameGrid, TerrainType, GridPosition } from '../types';
import { gridToScreen } from './isometric';
import { TILE_WIDTH, TILE_HEIGHT, ELEVATION_HEIGHT, COLORS } from '../constants';

/**
 * Draw an isometric tile top face (diamond shape) with optional 3D gradient effect
 * For seamless terrain (grass, sand, water), we use a very subtle center highlight only
 * For structures/distinct tiles, we use full gradient shading
 */
export function drawTileTop(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  color: string,
  gradientStyle: 'none' | 'subtle' | 'full' = 'subtle'
) {
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - halfHeight); // Top
  ctx.lineTo(centerX + halfWidth, centerY); // Right
  ctx.lineTo(centerX, centerY + halfHeight); // Bottom
  ctx.lineTo(centerX - halfWidth, centerY); // Left
  ctx.closePath();

  if (gradientStyle === 'full') {
    // Full gradient with edge darkening - for distinct/elevated tiles
    const gradient = ctx.createRadialGradient(
      centerX - halfWidth * 0.3, centerY - halfHeight * 0.3, 0,
      centerX, centerY, halfWidth * 0.9
    );
    const lighterColor = lightenColor(color, 20);
    const darkerColor = darkenColor(color, 15);
    gradient.addColorStop(0, lighterColor);
    gradient.addColorStop(0.6, color);
    gradient.addColorStop(1, darkerColor);
    ctx.fillStyle = gradient;
  } else if (gradientStyle === 'subtle') {
    // Subtle center highlight only - no edge darkening for seamless tiling
    const gradient = ctx.createRadialGradient(
      centerX - halfWidth * 0.2, centerY - halfHeight * 0.2, 0,
      centerX, centerY, halfWidth * 0.8
    );
    const lighterColor = lightenColor(color, 8);
    gradient.addColorStop(0, lighterColor);   // Very subtle bright spot
    gradient.addColorStop(0.5, color);        // Blend to original
    gradient.addColorStop(1, color);          // No edge darkening!
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = color;
  }

  ctx.fill();

  // Only add edge highlights for 'full' gradient style (elevated/distinct tiles)
  if (gradientStyle === 'full') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - halfWidth + 2, centerY);
    ctx.lineTo(centerX, centerY - halfHeight + 1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(centerX + halfWidth - 2, centerY);
    ctx.lineTo(centerX, centerY + halfHeight - 1);
    ctx.stroke();
  }
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(2.55 * percent));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Draw the left face of an elevated tile with gradient shading
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

  // Create vertical gradient for 3D cliff face
  const gradient = ctx.createLinearGradient(
    centerX - halfWidth, centerY,
    centerX - halfWidth, centerY + height
  );
  const lighterColor = lightenColor(color, 10);
  const darkerColor = darkenColor(color, 20);

  gradient.addColorStop(0, lighterColor);   // Top of cliff (more light)
  gradient.addColorStop(0.3, color);        // Main color
  gradient.addColorStop(1, darkerColor);    // Bottom (darker, in shadow)

  ctx.fillStyle = gradient;
  ctx.fill();

  // Add subtle horizontal texture lines for rock/earth effect
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 0.5;
  const numLines = Math.floor(height / 8);
  for (let i = 1; i <= numLines; i++) {
    const lineY = centerY + (height * i) / (numLines + 1);
    ctx.beginPath();
    ctx.moveTo(centerX - halfWidth + 2, lineY);
    ctx.lineTo(centerX - 2, lineY + halfHeight * (i / (numLines + 1)));
    ctx.stroke();
  }
}

/**
 * Draw the right face of an elevated tile with gradient shading
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

  // Create vertical gradient - right face gets more light
  const gradient = ctx.createLinearGradient(
    centerX + halfWidth, centerY,
    centerX + halfWidth, centerY + height
  );
  const lighterColor = lightenColor(color, 15);
  const darkerColor = darkenColor(color, 15);

  gradient.addColorStop(0, lighterColor);   // Top of cliff
  gradient.addColorStop(0.4, color);        // Main color
  gradient.addColorStop(1, darkerColor);    // Bottom

  ctx.fillStyle = gradient;
  ctx.fill();

  // Add subtle texture lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 0.5;
  const numLines = Math.floor(height / 8);
  for (let i = 1; i <= numLines; i++) {
    const lineY = centerY + (height * i) / (numLines + 1);
    ctx.beginPath();
    ctx.moveTo(centerX + 2, lineY + halfHeight * (i / (numLines + 1)));
    ctx.lineTo(centerX + halfWidth - 2, lineY);
    ctx.stroke();
  }
}

/**
 * Get colors for a terrain type
 */
function getTerrainColors(terrainType: TerrainType) {
  return COLORS.terrain[terrainType] || COLORS.terrain.grass;
}

/**
 * Draw terrain decorations based on type - enhanced 3D versions
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
      // Draw 3D pine trees with shadows
      const treePositions = [
        { x: -8, y: -4, scale: 0.9 },
        { x: 8, y: -2, scale: 1.1 },
        { x: -4, y: 4, scale: 0.8 },
        { x: 6, y: 6, scale: 1.0 },
      ];
      for (const pos of treePositions) {
        const tx = centerX + pos.x;
        const ty = centerY + pos.y;
        const s = pos.scale;

        // Tree shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(tx + 2, ty + 3, 4 * s, 2 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tree trunk with gradient
        const trunkGradient = ctx.createLinearGradient(tx - 2, ty, tx + 2, ty);
        trunkGradient.addColorStop(0, '#8D6E63');
        trunkGradient.addColorStop(0.5, '#5D4037');
        trunkGradient.addColorStop(1, '#3E2723');
        ctx.fillStyle = trunkGradient;
        ctx.fillRect(tx - 1.5 * s, ty, 3 * s, 5 * s);

        // Tree foliage - layered triangles for 3D effect
        // Back layer (darker)
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(tx, ty - 10 * s);
        ctx.lineTo(tx - 6 * s, ty + 2 * s);
        ctx.lineTo(tx + 6 * s, ty + 2 * s);
        ctx.closePath();
        ctx.fill();

        // Front layer (lighter, offset)
        const foliageGradient = ctx.createLinearGradient(tx, ty - 10 * s, tx, ty + 2 * s);
        foliageGradient.addColorStop(0, '#4CAF50');
        foliageGradient.addColorStop(0.5, '#2E7D32');
        foliageGradient.addColorStop(1, '#1B5E20');
        ctx.fillStyle = foliageGradient;
        ctx.beginPath();
        ctx.moveTo(tx, ty - 9 * s);
        ctx.lineTo(tx - 5 * s, ty + 1 * s);
        ctx.lineTo(tx + 5 * s, ty + 1 * s);
        ctx.closePath();
        ctx.fill();

        // Highlight on tree
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(tx - 2 * s, ty - 6 * s);
        ctx.lineTo(tx, ty - 9 * s);
        ctx.lineTo(tx, ty - 2 * s);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'farm': {
      // Draw wheat/crop rows with 3D stalks
      for (let i = -2; i <= 2; i++) {
        const offset = i * 6;

        // Stalk shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - halfWidth * 0.5 + offset + 1, centerY - 1);
        ctx.lineTo(centerX + halfWidth * 0.5 + offset + 1, centerY + 3);
        ctx.stroke();

        // Wheat stalk with gradient
        const stalkGradient = ctx.createLinearGradient(
          centerX - halfWidth * 0.5 + offset, centerY - 2,
          centerX + halfWidth * 0.5 + offset, centerY + 2
        );
        stalkGradient.addColorStop(0, '#A1887F');
        stalkGradient.addColorStop(1, '#6D4C41');
        ctx.strokeStyle = stalkGradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - halfWidth * 0.5 + offset, centerY - 2);
        ctx.lineTo(centerX + halfWidth * 0.5 + offset, centerY + 2);
        ctx.stroke();

        // Wheat head with gradient for 3D look
        const wheatGradient = ctx.createRadialGradient(
          centerX + offset - 1, centerY - 5, 0,
          centerX + offset, centerY - 4, 4
        );
        wheatGradient.addColorStop(0, '#FFD54F');
        wheatGradient.addColorStop(0.6, '#F9A825');
        wheatGradient.addColorStop(1, '#F57F17');
        ctx.fillStyle = wheatGradient;
        ctx.beginPath();
        ctx.ellipse(centerX + offset, centerY - 4, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wheat highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX + offset - 0.5, centerY - 5, 1, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'village': {
      // Draw a 3D isometric house

      // House shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(centerX + 2, centerY + 7, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // House front wall (lighter - facing light)
      const frontGradient = ctx.createLinearGradient(centerX - 6, centerY, centerX + 6, centerY);
      frontGradient.addColorStop(0, '#FFF8E1');
      frontGradient.addColorStop(1, '#FFECB3');
      ctx.fillStyle = frontGradient;
      ctx.fillRect(centerX - 6, centerY - 2, 12, 8);

      // House side wall (darker - in shadow)
      ctx.fillStyle = '#E6D9A8';
      ctx.beginPath();
      ctx.moveTo(centerX + 6, centerY - 2);
      ctx.lineTo(centerX + 10, centerY - 4);
      ctx.lineTo(centerX + 10, centerY + 4);
      ctx.lineTo(centerX + 6, centerY + 6);
      ctx.closePath();
      ctx.fill();

      // Roof with gradient
      const roofGradient = ctx.createLinearGradient(centerX, centerY - 12, centerX, centerY - 2);
      roofGradient.addColorStop(0, '#EF5350');
      roofGradient.addColorStop(1, '#B71C1C');
      ctx.fillStyle = roofGradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 12);
      ctx.lineTo(centerX - 8, centerY - 2);
      ctx.lineTo(centerX + 8, centerY - 2);
      ctx.closePath();
      ctx.fill();

      // Roof side
      ctx.fillStyle = '#C62828';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 12);
      ctx.lineTo(centerX + 8, centerY - 2);
      ctx.lineTo(centerX + 12, centerY - 4);
      ctx.lineTo(centerX + 4, centerY - 12);
      ctx.closePath();
      ctx.fill();

      // Door with 3D frame
      ctx.fillStyle = '#3E2723';
      ctx.fillRect(centerX - 2.5, centerY + 0.5, 5, 5.5);
      const doorGradient = ctx.createLinearGradient(centerX - 2, centerY + 1, centerX + 2, centerY + 1);
      doorGradient.addColorStop(0, '#6D4C41');
      doorGradient.addColorStop(0.5, '#5D4037');
      doorGradient.addColorStop(1, '#4E342E');
      ctx.fillStyle = doorGradient;
      ctx.fillRect(centerX - 2, centerY + 1, 4, 5);

      // Door handle
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(centerX + 1, centerY + 3.5, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Window with glassy effect
      const windowGradient = ctx.createLinearGradient(centerX + 2, centerY - 1, centerX + 5, centerY + 2);
      windowGradient.addColorStop(0, '#B3E5FC');
      windowGradient.addColorStop(0.5, '#81D4FA');
      windowGradient.addColorStop(1, '#4FC3F7');
      ctx.fillStyle = windowGradient;
      ctx.fillRect(centerX + 2, centerY - 1, 3, 3);

      // Window frame
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(centerX + 2, centerY - 1, 3, 3);

      // Window glare
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(centerX + 2.2, centerY - 0.8, 1, 1.5);
      break;
    }

    case 'flowers': {
      // Draw 3D flowers with petals
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
        const fx = centerX + pos.x;
        const fy = centerY + pos.y;
        const color = flowerColors[i % flowerColors.length];

        // Stem
        ctx.strokeStyle = '#558B2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx, fy + 2);
        ctx.lineTo(fx, fy + 5);
        ctx.stroke();

        // Flower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(fx + 0.5, fy + 0.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Petals (multiple small circles around center)
        ctx.fillStyle = color;
        for (let p = 0; p < 5; p++) {
          const angle = (p / 5) * Math.PI * 2;
          const px = fx + Math.cos(angle) * 1.5;
          const py = fy + Math.sin(angle) * 1.5;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Flower center
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(fx, fy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'water': {
      // Draw animated-looking wave lines with depth
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        const offset = i * 8;
        const alpha = 0.3 + (i + 1) * 0.1; // Varying alpha for depth

        // Wave shadow
        ctx.strokeStyle = `rgba(0, 100, 150, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY + offset + 1);
        ctx.quadraticCurveTo(centerX - 4, centerY + offset - 1, centerX, centerY + offset + 1);
        ctx.quadraticCurveTo(centerX + 4, centerY + offset + 3, centerX + 12, centerY + offset + 1);
        ctx.stroke();

        // Wave highlight
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY + offset);
        ctx.quadraticCurveTo(centerX - 4, centerY + offset - 2, centerX, centerY + offset);
        ctx.quadraticCurveTo(centerX + 4, centerY + offset + 2, centerX + 12, centerY + offset);
        ctx.stroke();
      }

      // Add sparkle highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX - 5, centerY - 2, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 7, centerY + 3, 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'rock': {
      // Draw 3D rocks with shading
      const rockPositions = [
        { x: -6, y: -2, r: 3.5 },
        { x: 4, y: 2, r: 4.5 },
        { x: -2, y: 5, r: 2.5 },
      ];
      for (const rock of rockPositions) {
        const rx = centerX + rock.x;
        const ry = centerY + rock.y;

        // Rock shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(rx + 1, ry + 1.5, rock.r, rock.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rock body with gradient
        const rockGradient = ctx.createRadialGradient(
          rx - rock.r * 0.3, ry - rock.r * 0.3, 0,
          rx, ry, rock.r
        );
        rockGradient.addColorStop(0, '#9E9E9E');
        rockGradient.addColorStop(0.5, '#757575');
        rockGradient.addColorStop(1, '#424242');
        ctx.fillStyle = rockGradient;
        ctx.beginPath();
        ctx.ellipse(rx, ry, rock.r, rock.r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rock highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(rx - rock.r * 0.3, ry - rock.r * 0.2, rock.r * 0.4, rock.r * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'grass': {
      // Add subtle grass blades for texture
      ctx.strokeStyle = 'rgba(85, 139, 47, 0.4)';
      ctx.lineWidth = 1;
      const grassPositions = [
        { x: -8, y: 2 }, { x: -4, y: -3 }, { x: 3, y: 4 },
        { x: 8, y: -1 }, { x: -2, y: 6 }, { x: 6, y: 0 },
      ];
      for (const pos of grassPositions) {
        ctx.beginPath();
        ctx.moveTo(centerX + pos.x, centerY + pos.y + 3);
        ctx.quadraticCurveTo(
          centerX + pos.x + 1, centerY + pos.y,
          centerX + pos.x + 2, centerY + pos.y - 2
        );
        ctx.stroke();
      }
      break;
    }

    case 'sand': {
      // Add subtle sand texture dots
      ctx.fillStyle = 'rgba(255, 193, 7, 0.3)';
      const sandDots = [
        { x: -6, y: -2 }, { x: 4, y: 3 }, { x: -3, y: 5 },
        { x: 8, y: -1 }, { x: 0, y: 0 }, { x: -8, y: 4 },
      ];
      for (const dot of sandDots) {
        ctx.beginPath();
        ctx.arc(centerX + dot.x, centerY + dot.y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    default:
      break;
  }
}

/**
 * Determine the gradient style for a terrain type
 * Seamless terrain (grass, sand, water, flowers) should blend together
 * Distinct terrain (village, rock) or elevated tiles should have visible edges
 */
function getGradientStyle(terrainType: TerrainType, elevation: number): 'none' | 'subtle' | 'full' {
  // Elevated tiles should have visible 3D shading
  if (elevation > 0) {
    return 'full';
  }

  // Terrain types that should blend seamlessly
  const seamlessTypes: TerrainType[] = ['grass', 'sand', 'water', 'flowers', 'farm', 'forest'];
  if (seamlessTypes.includes(terrainType)) {
    return 'subtle';
  }

  // Distinct terrain types (village, rock) get full shading
  return 'full';
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

  // Draw top face with appropriate gradient style
  const gradientStyle = getGradientStyle(terrainType, elevation);
  drawTileTop(ctx, centerX, centerY, colors.top, gradientStyle);

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

  // Highlight uses no gradient - just flat color overlay
  drawTileTop(ctx, centerX, centerY, color, 'none');
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
