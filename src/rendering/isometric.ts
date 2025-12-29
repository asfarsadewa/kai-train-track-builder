// Isometric coordinate transformation utilities

import type { GridPosition, ScreenPoint, GameGrid } from '../types';
import { TILE_WIDTH, TILE_HEIGHT, ELEVATION_HEIGHT } from '../constants';

/**
 * Convert grid coordinates to screen (pixel) coordinates
 * Uses standard 2:1 isometric projection
 */
export function gridToScreen(
  x: number,
  y: number,
  elevation: number = 0
): ScreenPoint {
  return {
    px: (x - y) * (TILE_WIDTH / 2),
    py: (x + y) * (TILE_HEIGHT / 2) - elevation * ELEVATION_HEIGHT,
  };
}

/**
 * Convert screen coordinates back to grid coordinates
 * Note: This assumes elevation 0; for elevated tiles, adjust py first
 */
export function screenToGrid(
  px: number,
  py: number,
  elevation: number = 0
): GridPosition {
  // Adjust for elevation
  const adjustedPy = py + elevation * ELEVATION_HEIGHT;

  // Inverse of the isometric transformation
  const x = (px / (TILE_WIDTH / 2) + adjustedPy / (TILE_HEIGHT / 2)) / 2;
  const y = (adjustedPy / (TILE_HEIGHT / 2) - px / (TILE_WIDTH / 2)) / 2;

  return {
    x: Math.floor(x),
    y: Math.floor(y),
  };
}

/**
 * Get the corners of an isometric tile for rendering
 * Returns points in order: top, right, bottom, left
 */
export function getTileCorners(screenX: number, screenY: number): ScreenPoint[] {
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;

  return [
    { px: screenX, py: screenY - halfHeight }, // Top
    { px: screenX + halfWidth, py: screenY }, // Right
    { px: screenX, py: screenY + halfHeight }, // Bottom
    { px: screenX - halfWidth, py: screenY }, // Left
  ];
}

/**
 * Calculate depth value for sorting (painter's algorithm)
 * Higher values should be rendered later (on top)
 */
export function calculateDepth(
  x: number,
  y: number,
  elevation: number
): number {
  return (x + y) * 1000 + elevation;
}

/**
 * Check if a screen point is inside an isometric tile
 */
export function isPointInTile(
  pointX: number,
  pointY: number,
  tileScreenX: number,
  tileScreenY: number
): boolean {
  // Transform to tile-local coordinates
  const localX = pointX - tileScreenX;
  const localY = pointY - tileScreenY;

  // Check if point is within the diamond shape
  // The diamond is defined by |x|/(w/2) + |y|/(h/2) <= 1
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;

  return (
    Math.abs(localX) / halfWidth + Math.abs(localY) / halfHeight <= 1
  );
}

/**
 * Find which grid cell contains a screen point
 * Iterates through possible cells and checks containment
 * Now accounts for terrain elevation when detecting clicks
 */
export function findGridCellAtScreenPoint(
  screenX: number,
  screenY: number,
  gridWidth: number,
  gridHeight: number,
  originX: number,
  originY: number,
  grid?: GameGrid
): GridPosition | null {
  // Get approximate grid position
  const relativeX = screenX - originX;
  const relativeY = screenY - originY;

  // Convert to approximate grid coords (at elevation 0 initially)
  const approx = screenToGrid(relativeX, relativeY, 0);

  // Check the approximate cell and its neighbors
  // (needed because isometric tiles overlap)
  // Increased range to handle elevated tiles that may appear offset
  const checkRange = 4;

  // Track best match - prefer higher elevation tiles (they're rendered on top)
  let bestMatch: GridPosition | null = null;
  let bestElevation = -1;

  for (let dy = -checkRange; dy <= checkRange; dy++) {
    for (let dx = -checkRange; dx <= checkRange; dx++) {
      const testX = approx.x + dx;
      const testY = approx.y + dy;

      // Skip out of bounds
      if (testX < 0 || testX >= gridWidth || testY < 0 || testY >= gridHeight) {
        continue;
      }

      // Get the terrain elevation for this cell
      const elevation = grid ? grid.cells[testY][testX].elevation : 0;

      // Get screen position of this cell at its actual elevation
      const cellScreen = gridToScreen(testX, testY, elevation);
      const cellScreenX = cellScreen.px + originX;
      const cellScreenY = cellScreen.py + originY;

      // Check if point is in this tile
      if (isPointInTile(screenX, screenY, cellScreenX, cellScreenY)) {
        // Prefer higher elevation tiles (they're visually on top)
        if (elevation > bestElevation) {
          bestMatch = { x: testX, y: testY };
          bestElevation = elevation;
        }
      }
    }
  }

  return bestMatch;
}
