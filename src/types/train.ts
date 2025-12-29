// Train state type definitions

export interface TrainPosition {
  trackId: string; // Current track piece ID
  progress: number; // 0-1 along current track segment
  subPath: number; // For switches: which path (0 or 1)
}

export interface TrainState {
  position: TrainPosition;
  direction: 'forward' | 'backward';
  speed: number; // Units per second
  isMoving: boolean;
  carriages: CarriageState[];
}

export interface CarriageState {
  type: 'engine' | 'passenger' | 'cargo';
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
