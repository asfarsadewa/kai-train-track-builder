// Train pathfinding - builds a path from connected tracks

import type { TrackPiece, CardinalDirection } from '../types';
import { TRACK_DEFINITIONS } from '../constants';
import {
  getNeighborPosition,
  findTrackAtPosition,
  getTrackConnections,
  hasConnectionInDirection,
} from './connections';
import { OPPOSITE_DIRECTION, rotateDirection } from '../types';

// A segment of the train's path
export interface PathSegment {
  trackId: string;
  track: TrackPiece;
  entryDirection: CardinalDirection;
  exitDirection: CardinalDirection;
  pathIndex: number; // For switches: which path (0 = main, 1 = divert)
}

// Complete path for the train
export interface TrainPath {
  segments: PathSegment[];
  isLoop: boolean;
  totalLength: number;
}

/**
 * Find the exit direction from a track given an entry direction
 */
function findExitDirection(
  track: TrackPiece,
  entryDirection: CardinalDirection
): { exitDirection: CardinalDirection; pathIndex: number } | null {
  const def = TRACK_DEFINITIONS[track.type];
  if (!def) return null;

  // For each path in the track definition
  for (let pathIndex = 0; pathIndex < def.baseConnections.length; pathIndex++) {
    const basePath = def.baseConnections[pathIndex];

    // Rotate the path directions according to track rotation
    const rotatedPath = basePath.map((dir) =>
      rotateDirection(dir as CardinalDirection, track.rotation)
    );

    // Check if entry direction is in this path
    const entryIndex = rotatedPath.indexOf(entryDirection);
    if (entryIndex !== -1) {
      // Find the other direction in this path (the exit)
      const exitDirection = rotatedPath.find((dir) => dir !== entryDirection);
      if (exitDirection) {
        // For switches, check if this is the active path
        if (
          (track.type === 'switch_left' || track.type === 'switch_right') &&
          pathIndex === 1
        ) {
          // Path 1 is the divert path, only use if switch is set to divert
          const switchState = track.switchState || 'left';
          if (
            (track.type === 'switch_left' && switchState !== 'left') ||
            (track.type === 'switch_right' && switchState !== 'right')
          ) {
            continue; // Skip this path, use main path instead
          }
        }
        return { exitDirection, pathIndex };
      }
    }
  }

  return null;
}

/**
 * Build a path starting from a track
 */
export function buildPath(
  startTrack: TrackPiece,
  startDirection: CardinalDirection,
  tracks: Map<string, TrackPiece>
): TrainPath {
  const segments: PathSegment[] = [];
  const visitedKeys = new Set<string>();
  let isLoop = false;

  let currentTrack: TrackPiece | null = startTrack;
  let entryDirection = startDirection;

  while (currentTrack) {
    // Create a key for this track + entry direction combination
    const visitKey = `${currentTrack.id}-${entryDirection}`;

    if (visitedKeys.has(visitKey)) {
      // We've completed a loop!
      isLoop = true;
      break;
    }
    visitedKeys.add(visitKey);

    // Find exit direction
    const exitResult = findExitDirection(currentTrack, entryDirection);
    if (!exitResult) {
      // Dead end or invalid entry
      break;
    }

    const { exitDirection, pathIndex } = exitResult;

    // Add segment
    segments.push({
      trackId: currentTrack.id,
      track: currentTrack,
      entryDirection,
      exitDirection,
      pathIndex,
    });

    // Find next track
    const nextPos = getNeighborPosition(currentTrack.position, exitDirection);
    const nextTrack = findTrackAtPosition(tracks, nextPos);

    if (!nextTrack) {
      // End of track
      break;
    }

    // Check if next track can accept us from this direction
    const nextEntryDirection = OPPOSITE_DIRECTION[exitDirection];
    if (!hasConnectionInDirection(nextTrack, nextEntryDirection)) {
      // Next track doesn't connect
      break;
    }

    // Move to next track
    currentTrack = nextTrack;
    entryDirection = nextEntryDirection;
  }

  return {
    segments,
    isLoop,
    totalLength: segments.length,
  };
}

/**
 * Find a valid starting point for the train on any track
 */
export function findStartingTrack(
  tracks: Map<string, TrackPiece>
): { track: TrackPiece; direction: CardinalDirection } | null {
  // Prefer stations as starting points
  for (const track of tracks.values()) {
    if (track.type === 'station') {
      const connections = getTrackConnections(track);
      if (connections.length > 0) {
        return { track, direction: connections[0] };
      }
    }
  }

  // Otherwise, use any track
  for (const track of tracks.values()) {
    const connections = getTrackConnections(track);
    if (connections.length > 0) {
      return { track, direction: connections[0] };
    }
  }

  return null;
}

/**
 * Find the longest path/loop in the track network
 */
export function findBestPath(tracks: Map<string, TrackPiece>): TrainPath | null {
  let bestPath: TrainPath | null = null;

  for (const track of tracks.values()) {
    const connections = getTrackConnections(track);

    for (const direction of connections) {
      const path = buildPath(track, direction, tracks);

      if (!bestPath || path.segments.length > bestPath.segments.length) {
        bestPath = path;
      }

      // Prefer loops
      if (path.isLoop && (!bestPath.isLoop || path.segments.length > bestPath.segments.length)) {
        bestPath = path;
      }
    }
  }

  return bestPath;
}
