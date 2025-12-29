// Train movement engine - handles smooth movement along tracks

import type { TrackPiece, CardinalDirection } from '../types';
import type { TrainPath } from './pathfinding';
import { gridToScreen } from '../rendering/isometric';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants';

// Position along the path
export interface TrainPosition {
  segmentIndex: number;
  progress: number; // 0 to 1 within segment
  worldX: number;
  worldY: number;
  rotation: number; // Radians - direction of travel in screen space
  direction: 1 | -1; // 1 = forward, -1 = backward (reversed)
}

// Bezier control points for track curves
interface BezierPath {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
}

/**
 * Get the local coordinates for a direction (in tile-local 0-1 space)
 */
function getDirectionPoint(direction: CardinalDirection): { x: number; y: number } {
  switch (direction) {
    case 'N': return { x: 0.5, y: 0 };
    case 'E': return { x: 1, y: 0.5 };
    case 'S': return { x: 0.5, y: 1 };
    case 'W': return { x: 0, y: 0.5 };
  }
}

/**
 * Create a bezier path for a track segment
 */
function createBezierPath(
  entryDirection: CardinalDirection,
  exitDirection: CardinalDirection
): BezierPath {
  const entry = getDirectionPoint(entryDirection);
  const exit = getDirectionPoint(exitDirection);

  // For straight tracks, use simple linear interpolation
  if (
    (entryDirection === 'N' && exitDirection === 'S') ||
    (entryDirection === 'S' && exitDirection === 'N') ||
    (entryDirection === 'E' && exitDirection === 'W') ||
    (entryDirection === 'W' && exitDirection === 'E')
  ) {
    return {
      p0: entry,
      p1: { x: (entry.x + exit.x) / 2, y: (entry.y + exit.y) / 2 },
      p2: { x: (entry.x + exit.x) / 2, y: (entry.y + exit.y) / 2 },
      p3: exit,
    };
  }

  // For curves, create a smooth bezier
  const center = { x: 0.5, y: 0.5 };
  return {
    p0: entry,
    p1: { x: (entry.x + center.x) / 2, y: (entry.y + center.y) / 2 },
    p2: { x: (exit.x + center.x) / 2, y: (exit.y + center.y) / 2 },
    p3: exit,
  };
}

/**
 * Evaluate cubic bezier at parameter t
 */
function bezierPoint(
  path: BezierPath,
  t: number
): { x: number; y: number } {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * path.p0.x + 3 * uu * t * path.p1.x + 3 * u * tt * path.p2.x + ttt * path.p3.x,
    y: uuu * path.p0.y + 3 * uu * t * path.p1.y + 3 * u * tt * path.p2.y + ttt * path.p3.y,
  };
}

/**
 * Get bezier tangent at parameter t
 */
function bezierTangent(
  path: BezierPath,
  t: number
): { x: number; y: number } {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;

  return {
    x: 3 * uu * (path.p1.x - path.p0.x) + 6 * u * t * (path.p2.x - path.p1.x) + 3 * tt * (path.p3.x - path.p2.x),
    y: 3 * uu * (path.p1.y - path.p0.y) + 6 * u * t * (path.p2.y - path.p1.y) + 3 * tt * (path.p3.y - path.p2.y),
  };
}

/**
 * Convert local tile coordinates to world screen coordinates
 * Now includes elevation interpolation for smooth slope following
 */
function localToWorld(
  localX: number,
  localY: number,
  track: TrackPiece,
  originX: number,
  originY: number,
  entryElevation: number,
  exitElevation: number,
  progress: number
): { x: number; y: number } {
  // Convert local (0-1) to isometric offset
  const isoOffsetX = (localX - localY) * (TILE_WIDTH / 2);
  const isoOffsetY = (localX + localY) * (TILE_HEIGHT / 2) - TILE_HEIGHT / 2;

  // Interpolate elevation based on progress through the segment
  // At progress 0 (entry): use midpoint of track elevation and entry neighbor
  // At progress 1 (exit): use midpoint of track elevation and exit neighbor
  const entryMidpoint = (track.elevation + entryElevation) / 2;
  const exitMidpoint = (track.elevation + exitElevation) / 2;
  const interpolatedElevation = entryMidpoint + (exitMidpoint - entryMidpoint) * progress;

  // Get track's screen position using interpolated elevation
  const screenPos = gridToScreen(track.position.x, track.position.y, interpolatedElevation);

  return {
    x: screenPos.px + originX + isoOffsetX,
    y: screenPos.py + originY + isoOffsetY,
  };
}

/**
 * Calculate train position along the path
 */
export function calculateTrainPosition(
  path: TrainPath,
  segmentIndex: number,
  progress: number,
  originX: number,
  originY: number,
  direction: 1 | -1 = 1
): TrainPosition {
  if (path.segments.length === 0) {
    return {
      segmentIndex: 0,
      progress: 0,
      worldX: originX,
      worldY: originY,
      rotation: 0,
      direction: 1,
    };
  }

  // Clamp segment index
  const safeIndex = Math.max(0, Math.min(segmentIndex, path.segments.length - 1));
  const segment = path.segments[safeIndex];

  // Create bezier path for this segment
  // When going backward, swap entry and exit so the train faces the right direction
  const bezierPath = direction === 1
    ? createBezierPath(segment.entryDirection, segment.exitDirection)
    : createBezierPath(segment.exitDirection, segment.entryDirection);

  // Progress always goes 0 to 1 within each segment
  // (when reversed, we traverse segments in reverse order, but progress is still 0->1)
  const localPos = bezierPoint(bezierPath, progress);

  // Determine entry and exit elevations from neighboring segments
  // This allows the train to smoothly follow elevation changes
  let entryElevation = segment.track.elevation;
  let exitElevation = segment.track.elevation;

  if (direction === 1) {
    // Moving forward: entry is from previous segment, exit is to next segment
    const prevIndex = safeIndex - 1;
    const nextIndex = safeIndex + 1;

    if (prevIndex >= 0) {
      entryElevation = path.segments[prevIndex].track.elevation;
    } else if (path.isLoop && path.segments.length > 1) {
      entryElevation = path.segments[path.segments.length - 1].track.elevation;
    }

    if (nextIndex < path.segments.length) {
      exitElevation = path.segments[nextIndex].track.elevation;
    } else if (path.isLoop && path.segments.length > 1) {
      exitElevation = path.segments[0].track.elevation;
    }
  } else {
    // Moving backward: entry is from next segment, exit is to previous segment
    const prevIndex = safeIndex + 1;
    const nextIndex = safeIndex - 1;

    if (prevIndex < path.segments.length) {
      entryElevation = path.segments[prevIndex].track.elevation;
    } else if (path.isLoop && path.segments.length > 1) {
      entryElevation = path.segments[0].track.elevation;
    }

    if (nextIndex >= 0) {
      exitElevation = path.segments[nextIndex].track.elevation;
    } else if (path.isLoop && path.segments.length > 1) {
      exitElevation = path.segments[path.segments.length - 1].track.elevation;
    }
  }

  // Convert to world coordinates with elevation interpolation
  const worldPos = localToWorld(
    localPos.x,
    localPos.y,
    segment.track,
    originX,
    originY,
    entryElevation,
    exitElevation,
    progress
  );

  // Calculate rotation from tangent
  const tangent = bezierTangent(bezierPath, progress);

  // Convert tangent to isometric space for rotation
  // The isometric projection transforms (x, y) tile coords to screen coords:
  // screenX = (x - y) * (tileWidth/2)
  // screenY = (x + y) * (tileHeight/2)
  // So tangent transforms the same way
  const isoTangentX = tangent.x - tangent.y;
  const isoTangentY = (tangent.x + tangent.y) * 0.5;

  // Calculate base rotation from tangent direction
  const rotation = Math.atan2(isoTangentY, isoTangentX);

  // When going backward, the tangent already points in the reverse direction
  // due to the swapped bezier path, so rotation is correct

  return {
    segmentIndex: safeIndex,
    progress,
    worldX: worldPos.x,
    worldY: worldPos.y,
    rotation,
    direction,
  };
}

/**
 * Advance train position by delta time
 */
export function advanceTrainPosition(
  path: TrainPath,
  currentSegment: number,
  currentProgress: number,
  speed: number,
  deltaTime: number,
  direction: 1 | -1 = 1
): { segmentIndex: number; progress: number; direction: 1 | -1; stopped: boolean } {
  if (path.segments.length === 0) {
    return { segmentIndex: 0, progress: 0, direction: 1, stopped: true };
  }

  let newProgress = currentProgress + speed * deltaTime;
  let newSegment = currentSegment;
  let newDirection = direction;
  let stopped = false;

  if (direction === 1) {
    // Moving forward through segments
    while (newProgress >= 1) {
      newProgress -= 1;
      newSegment++;

      // Check if we've reached the end
      if (newSegment >= path.segments.length) {
        if (path.isLoop) {
          // Loop back to start
          newSegment = 0;
        } else {
          // Reverse direction at end of track
          // Stay on last segment, start from progress 0 (which is the exit point when reversed)
          newSegment = path.segments.length - 1;
          // newProgress already has the excess from -= 1, keep it as-is
          newDirection = -1;
          break;
        }
      }

      // Check for signals
      const segment = path.segments[newSegment];
      if (segment.track.type === 'signal' && segment.track.signalState === 'red') {
        // Stop at red signal
        newProgress = 0;
        stopped = true;
        break;
      }
    }
  } else {
    // Moving backward through segments
    while (newProgress >= 1) {
      newProgress -= 1;
      newSegment--;

      // Check if we've reached the beginning
      if (newSegment < 0) {
        if (path.isLoop) {
          // Loop back to end
          newSegment = path.segments.length - 1;
        } else {
          // Reverse direction at start of track
          // Stay on first segment, start from progress 0 (which is the entry point when forward)
          newSegment = 0;
          // newProgress already has the excess from -= 1, keep it as-is
          newDirection = 1;
          break;
        }
      }

      // Check for signals (when going backward, check at entry)
      const segment = path.segments[newSegment];
      if (segment.track.type === 'signal' && segment.track.signalState === 'red') {
        // Stop at red signal
        newProgress = 0;
        stopped = true;
        break;
      }
    }
  }

  return {
    segmentIndex: newSegment,
    progress: Math.max(0, Math.min(1, newProgress)),
    direction: newDirection,
    stopped,
  };
}

/**
 * Train movement state machine
 */
export class TrainEngine {
  private path: TrainPath;
  private segmentIndex: number = 0;
  private progress: number = 0;
  private direction: 1 | -1 = 1;
  private speed: number = 1; // Segments per second
  private originX: number;
  private originY: number;

  constructor(path: TrainPath, originX: number, originY: number, speed: number = 1) {
    this.path = path;
    this.originX = originX;
    this.originY = originY;
    this.speed = speed;
  }

  update(deltaTime: number): TrainPosition {
    const result = advanceTrainPosition(
      this.path,
      this.segmentIndex,
      this.progress,
      this.speed,
      deltaTime,
      this.direction
    );

    this.segmentIndex = result.segmentIndex;
    this.progress = result.progress;
    this.direction = result.direction;

    return this.getPosition();
  }

  getPosition(): TrainPosition {
    return calculateTrainPosition(
      this.path,
      this.segmentIndex,
      this.progress,
      this.originX,
      this.originY,
      this.direction
    );
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  reset() {
    this.segmentIndex = 0;
    this.progress = 0;
    this.direction = 1;
  }
}
