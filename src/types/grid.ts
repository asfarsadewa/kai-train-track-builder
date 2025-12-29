// Grid and terrain type definitions

export interface GridPosition {
  x: number; // Column (0 to GRID_WIDTH-1)
  y: number; // Row (0 to GRID_HEIGHT-1)
}

export interface Point {
  x: number;
  y: number;
}

export interface ScreenPoint {
  px: number;
  py: number;
}

export type TerrainType =
  | 'grass'
  | 'water'
  | 'sand'
  | 'rock'
  | 'forest'
  | 'farm'
  | 'village'
  | 'flowers';

export interface TerrainCell {
  elevation: number; // 0 = ground, 1+ = hill levels
  terrainType: TerrainType;
}

export interface GameGrid {
  width: number;
  height: number;
  cells: TerrainCell[][]; // [y][x] access pattern
}

// Create a default grid filled with grass at elevation 0
export function createDefaultGrid(width: number, height: number): GameGrid {
  const cells: TerrainCell[][] = [];

  for (let y = 0; y < height; y++) {
    const row: TerrainCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        elevation: 0,
        terrainType: 'grass',
      });
    }
    cells.push(row);
  }

  return { width, height, cells };
}
