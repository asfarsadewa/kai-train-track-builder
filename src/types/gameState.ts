// Overall game state type definitions

import type { GameGrid, GridPosition, TerrainType } from './grid';
import type { TrackPiece, TrackType } from './tracks';
import type { TrainState } from './train';

export type ToolType =
  | 'select'
  | 'place_track'
  | 'remove'
  | 'terrain_raise'
  | 'terrain_lower'
  | 'terrain_flatten'
  | 'terrain_paint';

export interface CameraState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export interface GameState {
  grid: GameGrid;
  tracks: Map<string, TrackPiece>;
  train: TrainState | null;
  selectedTool: ToolType;
  selectedTrackType: TrackType | null;
  selectedTerrainType: TerrainType | null;
  isPlaying: boolean;
  camera: CameraState;
  hoveredCell: GridPosition | null;
}

// For save/load persistence
export interface SavedLayout {
  version: string;
  name: string;
  timestamp: number;
  grid: {
    width: number;
    height: number;
    cells: Array<Array<{ elevation: number; terrainType: string }>>;
  };
  tracks: Array<{
    id: string;
    type: string;
    position: GridPosition;
    rotation: number;
    elevation: number;
    switchState?: string;
    signalState?: string;
  }>;
  trainStartPosition?: {
    trackId: string;
    direction: 'forward' | 'backward';
  };
}

export function createDefaultCamera(): CameraState {
  return {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  };
}
