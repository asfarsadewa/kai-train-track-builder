// Track piece type definitions

import type { GridPosition } from './grid';

export type TrackType =
  | 'straight'
  | 'curve_90'
  | 'switch_left'
  | 'switch_right'
  | 'crossing'
  | 'slope_up'
  | 'slope_down'
  | 'bridge'
  | 'tunnel_entrance'
  | 'station'
  | 'signal';

export type CardinalDirection = 'N' | 'E' | 'S' | 'W';

export type Rotation = 0 | 90 | 180 | 270;

export interface ConnectionPoint {
  side: CardinalDirection;
  elevated: boolean; // Is this an elevated connection?
}

export interface TrackPiece {
  id: string;
  type: TrackType;
  position: GridPosition;
  rotation: Rotation;
  elevation: number; // Base elevation level
  connections: ConnectionPoint[];
  switchState?: 'left' | 'right'; // For switch tracks
  signalState?: 'green' | 'red'; // For signals
}

// Track definition with connection templates
export interface TrackDefinition {
  type: TrackType;
  name: string;
  description: string;
  baseConnections: CardinalDirection[][]; // Connection paths before rotation
  canElevate: boolean;
  elevationChange?: number; // For slopes: +1 or -1
}

// Direction utilities
export const DIRECTION_OFFSETS: Record<CardinalDirection, GridPosition> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

export const OPPOSITE_DIRECTION: Record<CardinalDirection, CardinalDirection> = {
  N: 'S',
  E: 'W',
  S: 'N',
  W: 'E',
};

export const DIRECTIONS: CardinalDirection[] = ['N', 'E', 'S', 'W'];

// Rotate a direction by given rotation (clockwise)
export function rotateDirection(
  direction: CardinalDirection,
  rotation: Rotation
): CardinalDirection {
  const index = DIRECTIONS.indexOf(direction);
  const steps = rotation / 90;
  return DIRECTIONS[(index + steps) % 4];
}

// Rotate all connection paths
export function rotateConnections(
  baseConnections: CardinalDirection[][],
  rotation: Rotation
): CardinalDirection[][] {
  return baseConnections.map((path) =>
    path.map((dir) => rotateDirection(dir, rotation))
  );
}
