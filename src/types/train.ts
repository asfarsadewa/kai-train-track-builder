// Train state type definitions

export interface TrainPosition {
  trackId: string; // Current track piece ID
  progress: number; // 0-1 along current track segment
  subPath: number; // For switches: which path (0 or 1)
}

// Carriage types available in the game
export type CarriageType = 'engine' | 'passenger' | 'cargo' | 'tanker' | 'coal' | 'caboose';

// User's configured train composition (persists across play/stop)
export interface CarriageConfig {
  type: Exclude<CarriageType, 'engine'>; // Engine is always present, can't be added
}

// Maximum number of carriages (excluding engine)
export const MAX_CARRIAGES = 5;

export interface TrainState {
  position: TrainPosition;
  direction: 'forward' | 'backward';
  speed: number; // Units per second
  isMoving: boolean;
  carriages: CarriageState[];
}

export interface CarriageState {
  type: CarriageType;
  trackId: string;
  progress: number;
  subPath: number;
}

export function createDefaultTrain(startTrackId: string): TrainState {
  return {
    position: {
      trackId: startTrackId,
      progress: 0,
      subPath: 0,
    },
    direction: 'forward',
    speed: 1,
    isMoving: false,
    carriages: [
      {
        type: 'engine',
        trackId: startTrackId,
        progress: 0,
        subPath: 0,
      },
    ],
  };
}
