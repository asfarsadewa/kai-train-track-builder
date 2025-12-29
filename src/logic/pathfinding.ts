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
 * Build a full path from a station, exploring both directions.
 * The station becomes a spawn point in the middle of the path, not a terminus.
 */
function buildFullPathFromStation(
  station: TrackPiece,
  tracks: Map<string, TrackPiece>
): TrainPath | null {
  const connections = getTrackConnections(station);
  if (connections.length === 0) return null;

  // For a station with 2 connections (typical straight-through station),
  // build path in both directions and combine them
  if (connections.length >= 2) {
    const dir1 = connections[0];
    const dir2 = connections[1];

    // Build path going direction 1 (excluding the station itself initially)
    const nextPos1 = getNeighborPosition(station.position, dir1);
    const nextTrack1 = findTrackAtPosition(tracks, nextPos1);

    const nextPos2 = getNeighborPosition(station.position, dir2);
    const nextTrack2 = findTrackAtPosition(tracks, nextPos2);

    // Build paths from neighbors outward
    let path1Segments: PathSegment[] = [];
    let path2Segments: PathSegment[] = [];

    if (nextTrack1 && hasConnectionInDirection(nextTrack1, OPPOSITE_DIRECTION[dir1])) {
      const path1 = buildPath(nextTrack1, OPPOSITE_DIRECTION[dir1], tracks);
      path1Segments = path1.segments;
    }

    if (nextTrack2 && hasConnectionInDirection(nextTrack2, OPPOSITE_DIRECTION[dir2])) {
      const path2 = buildPath(nextTrack2, OPPOSITE_DIRECTION[dir2], tracks);
      path2Segments = path2.segments;
    }

    // Create station segment
    const stationSegment: PathSegment = {
      trackId: station.id,
      track: station,
      entryDirection: dir1,
      exitDirection: dir2,
      pathIndex: 0,
    };

    // Combine: reverse path1 + station + path2
    // path1 was built going away from station, so reverse it to lead TO station
    const reversedPath1 = path1Segments.slice().reverse().map(seg => ({
      ...seg,
      entryDirection: seg.exitDirection,
      exitDirection: seg.entryDirection,
    }));

    const fullSegments = [...reversedPath1, stationSegment, ...path2Segments];

    // Check if it's a loop (first and last segments connect)
    let isLoop = false;
    if (fullSegments.length > 2) {
      const first = fullSegments[0];
      const last = fullSegments[fullSegments.length - 1];
      const lastExitPos = getNeighborPosition(last.track.position, last.exitDirection);
      if (lastExitPos.x === first.track.position.x && lastExitPos.y === first.track.position.y) {
        isLoop = true;
      }
    }

    return {
      segments: fullSegments,
      isLoop,
      totalLength: fullSegments.length,
    };
  }

  // For station with only 1 connection, just build path from that direction
  const path = buildPath(station, connections[0], tracks);
  return path;
}

/**
 * Find the longest path/loop in the track network, starting from a station
 */
export function findBestPath(tracks: Map<string, TrackPiece>): TrainPath | null {
  let bestPath: TrainPath | null = null;

  // First, try to find paths starting from stations (required spawn points)
  const stations = Array.from(tracks.values()).filter(t => t.type === 'station');

  for (const station of stations) {
    const path = buildFullPathFromStation(station, tracks);

    if (path && (!bestPath || path.segments.length > bestPath.segments.length)) {
      bestPath = path;
    }

    // Prefer loops
    if (path && path.isLoop && (!bestPath?.isLoop || path.segments.length > bestPath.segments.length)) {
      bestPath = path;
    }
  }

  // If no station paths found, fall back to any track (for backwards compatibility)
  if (!bestPath) {
    for (const track of tracks.values()) {
      const connections = getTrackConnections(track);

      for (const direction of connections) {
        const path = buildPath(track, direction, tracks);

        if (!bestPath || path.segments.length > bestPath.segments.length) {
          bestPath = path;
        }
      }
    }
  }

  return bestPath;
}
