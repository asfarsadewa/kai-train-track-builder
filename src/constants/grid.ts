// Grid and rendering constants

// Isometric tile dimensions (2:1 ratio)
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Elevation rendering
export const ELEVATION_HEIGHT = 16; // Pixels per elevation level

// Default grid size
export const DEFAULT_GRID_WIDTH = 16;
export const DEFAULT_GRID_HEIGHT = 16;

// Canvas settings
export const CANVAS_PADDING = 100; // Extra space around the grid

// Calculate canvas dimensions based on grid size
export function calculateCanvasSize(gridWidth: number, gridHeight: number) {
  // In isometric view, the grid forms a diamond shape
  // The bottom-most tile is at (gridWidth-1, gridHeight-1)
  // Its screen Y = (gridWidth-1 + gridHeight-1) * (TILE_HEIGHT / 2) + TILE_HEIGHT/2 for tile bottom
  const maxElevation = 5; // Assume max 5 elevation levels

  const width = (gridWidth + gridHeight) * (TILE_WIDTH / 2) + CANVAS_PADDING * 2;

  // Height needs to account for:
  // - Top padding
  // - Space above origin (gridHeight tiles worth of vertical space for the "back" of the diamond)
  // - The full diamond height from origin to bottom tile
  // - Tile height at the bottom
  // - Bottom padding
  const diamondHeight = (gridWidth + gridHeight - 2) * (TILE_HEIGHT / 2) + TILE_HEIGHT;
  const topOffset = gridHeight * (TILE_HEIGHT / 2);
  const height = CANVAS_PADDING + topOffset + diamondHeight + maxElevation * ELEVATION_HEIGHT + CANVAS_PADDING;

  return { width, height };
}

// Grid origin offset (center the grid in the canvas)
export function calculateGridOrigin(
  canvasWidth: number,
  _gridWidth: number,
  gridHeight: number
) {
  // The grid's top corner (0,0) should be at the center-top of the diamond
  const originX = canvasWidth / 2;
  const originY = CANVAS_PADDING + gridHeight * (TILE_HEIGHT / 2);

  return { originX, originY };
}
