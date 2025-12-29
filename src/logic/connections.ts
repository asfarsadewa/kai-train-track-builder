// Track connection and neighbor detection logic

import type {
  TrackPiece,
  TrackType,
  GridPosition,
  CardinalDirection,
  Rotation,
} from '../types';
import {
  DIRECTION_OFFSETS,
  OPPOSITE_DIRECTION,
  DIRECTIONS,
  rotateDirection,
} from '../types';
import { TRACK_DEFINITIONS } from '../constants';

/**
 * Get the elevation at a specific connection point of a track.
 * Since tracks auto-adapt to terrain, connection elevation = track elevation = terrain elevation.
 * The visual rendering will handle slopes between different terrain elevations.
 */
export function getElevationAtConnection(
  track: TrackPiece,
  _direction: CardinalDirection
): number {
  // All connection points are at the track's base elevation (= terrain elevation)
  // Visual slope rendering handles elevation differences to neighbors
  return track.elevation;
}

/**
 * Get the neighbor position in a given direction
 */
export function getNeighborPosition(
  pos: GridPosition,
  direction: CardinalDirection
): GridPosition {
  const offset = DIRECTION_OFFSETS[direction];
  return {
    x: pos.x + offset.x,
    y: pos.y + offset.y,
  };
}

/**
 * Find a track at a specific grid position
 */
export function findTrackAtPosition(
  tracks: Map<string, TrackPiece>,
  position: GridPosition
): TrackPiece | null {
  for (const track of tracks.values()) {
    if (track.position.x === position.x && track.position.y === position.y) {
      return track;
    }
  }
  return null;
}

/**
 * Get the connection directions for a track piece (accounting for rotation)
 */
export function getTrackConnections(track: TrackPiece): CardinalDirection[] {
  const def = TRACK_DEFINITIONS[track.type];
  if (!def) return [];

  const connections = new Set<CardinalDirection>();

  for (const path of def.baseConnections) {
    for (const dir of path) {
      connections.add(rotateDirection(dir as CardinalDirection, track.rotation));
    }
  }

  return Array.from(connections);
}

/**
 * Check if a track has a connection point in a specific direction
 */
export function hasConnectionInDirection(
  track: TrackPiece,
  direction: CardinalDirection
): boolean {
  const connections = getTrackConnections(track);
  return connections.includes(direction);
}

/**
 * Find all neighboring tracks that could connect (direction-only, no elevation check)
 * Used for auto-rotation calculation where elevation isn't known yet
 */
export function findConnectableNeighbors(
  position: GridPosition,
  tracks: Map<string, TrackPiece>
): { direction: CardinalDirection; track: TrackPiece }[] {
  const neighbors: { direction: CardinalDirection; track: TrackPiece }[] = [];

  for (const direction of DIRECTIONS) {
    const neighborPos = getNeighborPosition(position, direction);
    const neighborTrack = findTrackAtPosition(tracks, neighborPos);

    if (neighborTrack) {
      // Check if the neighbor has a connection facing us
      const oppositeDir = OPPOSITE_DIRECTION[direction];
      if (hasConnectionInDirection(neighborTrack, oppositeDir)) {
        neighbors.push({ direction, track: neighborTrack });
      }
    }
  }

  return neighbors;
}

/**
 * Calculate the best rotation for a track type to connect to neighbors.
 * Track elevation is always set to terrain elevation (tracks auto-adapt visually).
 */
export function calculateBestRotation(
  trackType: TrackType,
  position: GridPosition,
  tracks: Map<string, TrackPiece>,
  terrainElevation: number = 0
): { rotation: Rotation; connectionCount: number; elevation: number } {
  const def = TRACK_DEFINITIONS[trackType];
  if (!def) return { rotation: 0, connectionCount: 0, elevation: terrainElevation };

  const neighbors = findConnectableNeighbors(position, tracks);
  const rotations: Rotation[] = [0, 90, 180, 270];

  let bestRotation: Rotation = 0;
  let bestScore = -1;

  for (const rotation of rotations) {
    let score = 0;

    // Get connections for this rotation
    const connections = new Set<CardinalDirection>();
    for (const path of def.baseConnections) {
      for (const dir of path) {
        connections.add(rotateDirection(dir as CardinalDirection, rotation));
      }
    }

    // Count how many neighbors we'd connect to
    for (const neighbor of neighbors) {
      if (connections.has(neighbor.direction)) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRotation = rotation;
    }
  }

  // Track elevation is always terrain elevation - visual rendering handles slopes
  return { rotation: bestRotation, connectionCount: bestScore, elevation: terrainElevation };
}

/**
 * Validate if a track can be placed at a position
 */
export function canPlaceTrack(
  position: GridPosition,
  tracks: Map<string, TrackPiece>,
  gridWidth: number,
  gridHeight: number
): { canPlace: boolean; reason?: string } {
  // Check bounds
  if (
    position.x < 0 ||
    position.x >= gridWidth ||
    position.y < 0 ||
    position.y >= gridHeight
  ) {
    return { canPlace: false, reason: 'Out of bounds' };
  }

  // Check if position is already occupied
  const existing = findTrackAtPosition(tracks, position);
  if (existing) {
    return { canPlace: false, reason: 'Position occupied' };
  }

  return { canPlace: true };
}

/**
 * Get connected tracks (for pathfinding)
 * Tracks connect if they have facing connection directions.
 * Elevation differences are handled visually by the renderer.
 */
export function getConnectedTracks(
  track: TrackPiece,
  tracks: Map<string, TrackPiece>
): { direction: CardinalDirection; track: TrackPiece }[] {
  const connected: { direction: CardinalDirection; track: TrackPiece }[] = [];
  const myConnections = getTrackConnections(track);

  for (const direction of myConnections) {
    const neighborPos = getNeighborPosition(track.position, direction);
    const neighborTrack = findTrackAtPosition(tracks, neighborPos);

    if (neighborTrack) {
      const oppositeDir = OPPOSITE_DIRECTION[direction];
      if (hasConnectionInDirection(neighborTrack, oppositeDir)) {
        connected.push({ direction, track: neighborTrack });
      }
    }
  }

  return connected;
}

/**
 * Check if the track network forms a complete loop from a starting track
 */
export function hasCompleteLoop(
  startTrack: TrackPiece,
  tracks: Map<string, TrackPiece>
): boolean {
  const visited = new Set<string>();
  const stack: { track: TrackPiece; fromDirection: CardinalDirection | null }[] = [
    { track: startTrack, fromDirection: null },
  ];

  while (stack.length > 0) {
    const { track, fromDirection } = stack.pop()!;

    if (visited.has(track.id)) {
      // We've found a loop!
      return true;
    }

    visited.add(track.id);

    const connections = getConnectedTracks(track, tracks);
    for (const { direction, track: connectedTrack } of connections) {
      // Don't go back the way we came
      if (fromDirection && direction === fromDirection) continue;

      stack.push({
        track: connectedTrack,
        fromDirection: OPPOSITE_DIRECTION[direction],
      });
    }
  }

  return false;
}
