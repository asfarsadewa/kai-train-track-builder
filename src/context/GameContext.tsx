// Game state context and reducer with undo/redo support

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  GameState,
  GameGrid,
  TrackPiece,
  TrainState,
  ToolType,
  TrackType,
  CameraState,
  GridPosition,
} from '../types';
import { createDefaultGrid, createDefaultCamera } from '../types';
import { DEFAULT_GRID_WIDTH, DEFAULT_GRID_HEIGHT } from '../constants';

// Action types
export type GameAction =
  | { type: 'PLACE_TRACK'; track: TrackPiece }
  | { type: 'REMOVE_TRACK'; trackId: string }
  | { type: 'SET_TERRAIN_ELEVATION'; x: number; y: number; elevation: number }
  | { type: 'SET_TOOL'; tool: ToolType }
  | { type: 'SET_SELECTED_TRACK_TYPE'; trackType: TrackType | null }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'UPDATE_TRAIN'; train: TrainState }
  | { type: 'SPAWN_TRAIN'; trackId: string }
  | { type: 'REMOVE_TRAIN' }
  | { type: 'SET_CAMERA'; camera: Partial<CameraState> }
  | { type: 'SET_HOVERED_CELL'; cell: GridPosition | null }
  | { type: 'LOAD_LAYOUT'; grid: GameGrid; tracks: TrackPiece[] }
  | { type: 'CLEAR_LAYOUT' }
  | { type: 'RESTORE_SNAPSHOT'; snapshot: HistorySnapshot };

// Snapshot of undoable state (only tracks and terrain)
interface HistorySnapshot {
  grid: GameGrid;
  tracks: Map<string, TrackPiece>;
}

// Actions that should be recorded in history
const UNDOABLE_ACTIONS = ['PLACE_TRACK', 'REMOVE_TRACK', 'SET_TERRAIN_ELEVATION', 'LOAD_LAYOUT', 'CLEAR_LAYOUT'];

// Initial state
function createInitialState(): GameState {
  return {
    grid: createDefaultGrid(DEFAULT_GRID_WIDTH, DEFAULT_GRID_HEIGHT),
    tracks: new Map(),
    train: null,
    selectedTool: 'select',
    selectedTrackType: null,
    isPlaying: false,
    camera: createDefaultCamera(),
    hoveredCell: null,
  };
}

// Create a snapshot of undoable state
function createSnapshot(state: GameState): HistorySnapshot {
  return {
    grid: {
      ...state.grid,
      cells: state.grid.cells.map(row => row.map(cell => ({ ...cell }))),
    },
    tracks: new Map(state.tracks),
  };
}

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_TRACK': {
      const newTracks = new Map(state.tracks);
      newTracks.set(action.track.id, action.track);
      return { ...state, tracks: newTracks };
    }

    case 'REMOVE_TRACK': {
      const newTracks = new Map(state.tracks);
      newTracks.delete(action.trackId);
      return { ...state, tracks: newTracks };
    }

    case 'SET_TERRAIN_ELEVATION': {
      const newElevation = Math.max(0, action.elevation);
      const newCells = state.grid.cells.map((row, y) =>
        row.map((cell, x) =>
          x === action.x && y === action.y
            ? { ...cell, elevation: newElevation }
            : cell
        )
      );

      // Also update any track at this position to match the new terrain elevation
      // Exception: bridges and tunnels maintain their own elevation (don't sync with terrain)
      const newTracks = new Map(state.tracks);
      for (const [id, track] of newTracks) {
        if (track.position.x === action.x && track.position.y === action.y) {
          // Skip bridges and tunnels - they maintain independent elevation
          if (track.type === 'bridge' || track.type === 'tunnel_entrance') {
            continue;
          }
          newTracks.set(id, { ...track, elevation: newElevation });
        }
      }

      return {
        ...state,
        grid: { ...state.grid, cells: newCells },
        tracks: newTracks,
      };
    }

    case 'SET_TOOL':
      return { ...state, selectedTool: action.tool };

    case 'SET_SELECTED_TRACK_TYPE':
      return { ...state, selectedTrackType: action.trackType };

    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };

    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying };

    case 'UPDATE_TRAIN':
      return { ...state, train: action.train };

    case 'SPAWN_TRAIN': {
      const newTrain: TrainState = {
        position: {
          trackId: action.trackId,
          progress: 0,
          subPath: 0,
        },
        direction: 'forward',
        speed: 1,
        isMoving: false,
        carriages: [
          {
            type: 'engine',
            trackId: action.trackId,
            progress: 0,
            subPath: 0,
          },
        ],
      };
      return { ...state, train: newTrain };
    }

    case 'REMOVE_TRAIN':
      return { ...state, train: null, isPlaying: false };

    case 'SET_CAMERA':
      return { ...state, camera: { ...state.camera, ...action.camera } };

    case 'SET_HOVERED_CELL':
      return { ...state, hoveredCell: action.cell };

    case 'LOAD_LAYOUT': {
      const newTracks = new Map<string, TrackPiece>();
      for (const track of action.tracks) {
        newTracks.set(track.id, track);
      }
      return {
        ...state,
        grid: action.grid,
        tracks: newTracks,
        train: null,
        isPlaying: false,
      };
    }

    case 'CLEAR_LAYOUT':
      return {
        ...state,
        grid: createDefaultGrid(state.grid.width, state.grid.height),
        tracks: new Map(),
        train: null,
        isPlaying: false,
      };

    case 'RESTORE_SNAPSHOT':
      return {
        ...state,
        grid: action.snapshot.grid,
        tracks: action.snapshot.tracks,
        train: null,
        isPlaying: false,
      };

    default:
      return state;
  }
}

// Context
interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

// Provider component
interface GameProviderProps {
  children: ReactNode;
}

const MAX_HISTORY = 50;

export function GameProvider({ children }: GameProviderProps) {
  const [state, baseDispatch] = useReducer(gameReducer, null, createInitialState);

  // History stacks
  const undoStackRef = useRef<HistorySnapshot[]>([]);
  const redoStackRef = useRef<HistorySnapshot[]>([]);

  // Wrapped dispatch that tracks history
  const dispatch = useCallback((action: GameAction) => {
    // Save snapshot before undoable actions
    if (UNDOABLE_ACTIONS.includes(action.type)) {
      undoStackRef.current.push(createSnapshot(state));
      if (undoStackRef.current.length > MAX_HISTORY) {
        undoStackRef.current.shift();
      }
      // Clear redo stack on new action
      redoStackRef.current = [];
    }
    baseDispatch(action);
  }, [state]);

  // Undo function
  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;

    // Save current state to redo stack
    redoStackRef.current.push(createSnapshot(state));

    // Restore previous state
    const snapshot = undoStackRef.current.pop()!;
    baseDispatch({ type: 'RESTORE_SNAPSHOT', snapshot });
  }, [state]);

  // Redo function
  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;

    // Save current state to undo stack
    undoStackRef.current.push(createSnapshot(state));

    // Restore next state
    const snapshot = redoStackRef.current.pop()!;
    baseDispatch({ type: 'RESTORE_SNAPSHOT', snapshot });
  }, [state]);

  return (
    <GameContext.Provider value={{
      state,
      dispatch,
      undo,
      redo,
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
    }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook to use game context
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Convenience hooks for common operations
export function useGameState() {
  const { state } = useGame();
  return state;
}

export function useGameDispatch() {
  const { dispatch } = useGame();
  return dispatch;
}
