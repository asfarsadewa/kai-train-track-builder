// Track rendering utilities - wooden toy train aesthetic

import type { TrackPiece, Rotation, CardinalDirection, GameGrid } from '../types';
import { gridToScreen } from './isometric';
import { TILE_WIDTH, TILE_HEIGHT, COLORS, ELEVATION_HEIGHT } from '../constants';
import { rotateDirection, DIRECTION_OFFSETS } from '../types';

/**
 * Information about elevation at each connection point of a track.
 * Used for rendering slopes between different terrain elevations.
 */
export interface ConnectionElevations {
  N?: number;
  E?: number;
  S?: number;
  W?: number;
}

// Track path definitions for drawing
// Each path is defined as bezier control points in tile-local coordinates (0-1 range)
interface TrackPath {
  start: { x: number; y: number };
  cp1?: { x: number; y: number }; // Control point 1 (for curves)
  cp2?: { x: number; y: number }; // Control point 2 (for curves)
  end: { x: number; y: number };
}

// Define paths for each track type (before rotation)
// Coordinates are in tile-local space: (0,0) = top, (1,0) = right, (0,1) = left, (1,1) = bottom
const TRACK_PATHS: Record<string, TrackPath[]> = {
  straight: [
    { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // N to S
  ],
  curve_90: [
    {
      start: { x: 0.5, y: 0 },
      cp1: { x: 0.5, y: 0.5 },
      cp2: { x: 0.75, y: 0.5 },
      end: { x: 1, y: 0.5 },
    }, // N to E curve
  ],
  switch_left: [
    { start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } }, // S to N (main)
    {
      start: { x: 0.5, y: 1 },
      cp1: { x: 0.5, y: 0.6 },
      cp2: { x: 0.25, y: 0.5 },
      end: { x: 0, y: 0.5 },
    }, // S to W (divert)
  ],
  switch_right: [
    { start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } }, // S to N (main)
    {
      start: { x: 0.5, y: 1 },
      cp1: { x: 0.5, y: 0.6 },
      cp2: { x: 0.75, y: 0.5 },
      end: { x: 1, y: 0.5 },
    }, // S to E (divert)
  ],
  crossing: [
    { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // N to S
    { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } }, // W to E
  ],
  bridge: [
    { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // N to S
  ],
  station: [
    { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // N to S
  ],
  signal: [
    { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // N to S
  ],
  slope_up: [
    { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // N to S
  ],
  slope_down: [
    { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // N to S
  ],
  tunnel_entrance: [
    { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // N to S
  ],
};

// Convert tile-local coordinates to isometric screen offset
function localToIso(localX: number, localY: number): { dx: number; dy: number } {
  // Map (0,0)=top, (1,0)=right, (0,1)=left, (1,1)=bottom to isometric
  // In isometric: moving +x goes right-down, moving +y goes left-down
  const isoX = (localX - localY) * (TILE_WIDTH / 2);
  const isoY = (localX + localY) * (TILE_HEIGHT / 2) - TILE_HEIGHT / 2;
  return { dx: isoX, dy: isoY };
}

/**
 * Get the direction a local coordinate is closest to.
 * Used to determine which connection point's elevation to use.
 */
function getDirectionFromLocal(localX: number, localY: number): CardinalDirection {
  // Corners: N=(0.5,0), E=(1,0.5), S=(0.5,1), W=(0,0.5)
  const dN = Math.abs(localX - 0.5) + Math.abs(localY - 0);
  const dE = Math.abs(localX - 1) + Math.abs(localY - 0.5);
  const dS = Math.abs(localX - 0.5) + Math.abs(localY - 1);
  const dW = Math.abs(localX - 0) + Math.abs(localY - 0.5);

  const min = Math.min(dN, dE, dS, dW);
  if (min === dN) return 'N';
  if (min === dE) return 'E';
  if (min === dS) return 'S';
  return 'W';
}

/**
 * Calculate the elevation offset at a point along a path.
 * Returns the Y offset in pixels to add for elevation interpolation.
 */
function getElevationOffsetAtPoint(
  localX: number,
  localY: number,
  path: TrackPath,
  rotation: Rotation,
  trackElevation: number,
  connectionElevations: ConnectionElevations
): number {
  // Determine which directions this path connects (in base orientation)
  const startDir = getDirectionFromLocal(path.start.x, path.start.y);
  const endDir = getDirectionFromLocal(path.end.x, path.end.y);

  // Apply rotation to get actual directions
  const actualStartDir = rotateDirection(startDir, rotation);
  const actualEndDir = rotateDirection(endDir, rotation);

  // Get elevations at each end
  const startElevation = connectionElevations[actualStartDir] ?? trackElevation;
  const endElevation = connectionElevations[actualEndDir] ?? trackElevation;

  // If no elevation difference, no offset needed
  if (startElevation === endElevation && startElevation === trackElevation) {
    return 0;
  }

  // Calculate how far along the path this point is (0 = start, 1 = end)
  // Use distance from start vs distance from end
  const dStart = Math.sqrt(
    Math.pow(localX - path.start.x, 2) + Math.pow(localY - path.start.y, 2)
  );
  const dEnd = Math.sqrt(
    Math.pow(localX - path.end.x, 2) + Math.pow(localY - path.end.y, 2)
  );
  const t = dStart / (dStart + dEnd + 0.001); // 0 at start, 1 at end

  // Interpolate elevation
  const elevationAtPoint = startElevation + (endElevation - startElevation) * t;

  // Return the Y offset (negative because higher elevation = lower Y in screen space)
  return -(elevationAtPoint - trackElevation) * ELEVATION_HEIGHT;
}

// Rotate a local coordinate by rotation degrees
function rotateLocal(
  x: number,
  y: number,
  rotation: Rotation
): { x: number; y: number } {
  // Center of rotation is (0.5, 0.5)
  const cx = 0.5;
  const cy = 0.5;
  const rx = x - cx;
  const ry = y - cy;

  const steps = rotation / 90;
  let newX = rx;
  let newY = ry;

  for (let i = 0; i < steps; i++) {
    const temp = newX;
    newX = -newY;
    newY = temp;
  }

  return { x: newX + cx, y: newY + cy };
}

// Draw wooden sleepers along a path
function drawSleepers(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  path: TrackPath,
  rotation: Rotation,
  trackElevation: number,
  connectionElevations: ConnectionElevations,
  numSleepers: number = 5
) {
  ctx.strokeStyle = COLORS.track.sleeper;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';

  for (let i = 0; i < numSleepers; i++) {
    const t = (i + 0.5) / numSleepers;

    // Get point along path
    let point: { x: number; y: number };
    let tangent: { x: number; y: number };

    if (path.cp1 && path.cp2) {
      // Bezier curve
      point = bezierPoint(path.start, path.cp1, path.cp2, path.end, t);
      tangent = bezierTangent(path.start, path.cp1, path.cp2, path.end, t);
    } else {
      // Straight line
      point = {
        x: path.start.x + (path.end.x - path.start.x) * t,
        y: path.start.y + (path.end.y - path.start.y) * t,
      };
      tangent = {
        x: path.end.x - path.start.x,
        y: path.end.y - path.start.y,
      };
    }

    // Calculate elevation offset at this point
    const elevOffset = getElevationOffsetAtPoint(
      point.x,
      point.y,
      path,
      rotation,
      trackElevation,
      connectionElevations
    );

    // Calculate perpendicular for sleeper orientation
    const len = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
    const perpX = -tangent.y / len;
    const perpY = tangent.x / len;

    // Sleeper endpoints in local coords
    const sleeperLen = 0.15;
    const s1 = rotateLocal(
      point.x + perpX * sleeperLen,
      point.y + perpY * sleeperLen,
      rotation
    );
    const s2 = rotateLocal(
      point.x - perpX * sleeperLen,
      point.y - perpY * sleeperLen,
      rotation
    );

    // Convert to isometric
    const iso1 = localToIso(s1.x, s1.y);
    const iso2 = localToIso(s2.x, s2.y);

    ctx.beginPath();
    ctx.moveTo(centerX + iso1.dx, centerY + iso1.dy + elevOffset);
    ctx.lineTo(centerX + iso2.dx, centerY + iso2.dy + elevOffset);
    ctx.stroke();
  }
}

// Draw rails along a path
function drawRails(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  path: TrackPath,
  rotation: Rotation,
  trackElevation: number,
  connectionElevations: ConnectionElevations
) {
  const railOffset = 0.06; // Distance from center to each rail

  // Draw two rails
  for (const offset of [-railOffset, railOffset]) {
    ctx.strokeStyle = COLORS.track.rail;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      let point: { x: number; y: number };
      let tangent: { x: number; y: number };

      if (path.cp1 && path.cp2) {
        point = bezierPoint(path.start, path.cp1, path.cp2, path.end, t);
        tangent = bezierTangent(path.start, path.cp1, path.cp2, path.end, t);
      } else {
        point = {
          x: path.start.x + (path.end.x - path.start.x) * t,
          y: path.start.y + (path.end.y - path.start.y) * t,
        };
        tangent = {
          x: path.end.x - path.start.x,
          y: path.end.y - path.start.y,
        };
      }

      // Calculate elevation offset at this point
      const elevOffset = getElevationOffsetAtPoint(
        point.x,
        point.y,
        path,
        rotation,
        trackElevation,
        connectionElevations
      );

      // Calculate perpendicular offset
      const len = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
      const perpX = -tangent.y / len;
      const perpY = tangent.x / len;

      // Offset point
      const offsetPoint = {
        x: point.x + perpX * offset,
        y: point.y + perpY * offset,
      };

      // Rotate
      const rotated = rotateLocal(offsetPoint.x, offsetPoint.y, rotation);

      // Convert to isometric
      const iso = localToIso(rotated.x, rotated.y);

      if (i === 0) {
        ctx.moveTo(centerX + iso.dx, centerY + iso.dy + elevOffset);
      } else {
        ctx.lineTo(centerX + iso.dx, centerY + iso.dy + elevOffset);
      }
    }

    ctx.stroke();

    // Draw rail highlight
    ctx.strokeStyle = COLORS.track.railHighlight;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Bezier curve helpers
function bezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

function bezierTangent(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;

  return {
    x: 3 * uu * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * tt * (p3.x - p2.x),
    y: 3 * uu * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * tt * (p3.y - p2.y),
  };
}

// Draw a single track piece
export function drawTrack(
  ctx: CanvasRenderingContext2D,
  track: TrackPiece,
  originX: number,
  originY: number,
  connectionElevations: ConnectionElevations = {},
  terrainElevation: number = 0
) {
  const paths = TRACK_PATHS[track.type];
  if (!paths) return;

  const screenPos = gridToScreen(track.position.x, track.position.y, track.elevation);
  const centerX = screenPos.px + originX;
  const centerY = screenPos.py + originY;

  // For bridges, draw support pillars first (underneath everything)
  if (track.type === 'bridge') {
    const elevationDiff = track.elevation - terrainElevation;
    if (elevationDiff > 0) {
      drawBridgeSupports(ctx, centerX, centerY, track.rotation, elevationDiff);
    }
  }

  // Draw each path
  for (const path of paths) {
    // Draw sleepers first (underneath)
    drawSleepers(ctx, centerX, centerY, path, track.rotation, track.elevation, connectionElevations);
    // Draw rails on top
    drawRails(ctx, centerX, centerY, path, track.rotation, track.elevation, connectionElevations);
  }

  // Draw special decorations for certain track types
  if (track.type === 'station') {
    drawStationPlatform(ctx, centerX, centerY, track.rotation);
  } else if (track.type === 'signal') {
    drawSignal(ctx, centerX, centerY, track.rotation, track.signalState || 'green');
  } else if (track.type === 'bridge') {
    drawBridgeRailings(ctx, centerX, centerY, track.rotation);
  } else if (track.type === 'tunnel_entrance') {
    drawTunnelPortal(ctx, centerX, centerY, track.rotation);
  }
}

// Draw station platform
function drawStationPlatform(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation
) {
  ctx.fillStyle = '#8D6E63';

  // Platform on one side of the track
  const platformPoints = [
    { x: 0.2, y: 0.1 },
    { x: 0.4, y: 0.1 },
    { x: 0.4, y: 0.9 },
    { x: 0.2, y: 0.9 },
  ];

  ctx.beginPath();
  platformPoints.forEach((p, i) => {
    const rotated = rotateLocal(p.x, p.y, rotation);
    const iso = localToIso(rotated.x, rotated.y);
    if (i === 0) {
      ctx.moveTo(centerX + iso.dx, centerY + iso.dy);
    } else {
      ctx.lineTo(centerX + iso.dx, centerY + iso.dy);
    }
  });
  ctx.closePath();
  ctx.fill();

  // Platform roof
  ctx.fillStyle = '#D32F2F';
  const roofY = -8;
  ctx.beginPath();
  platformPoints.forEach((p, i) => {
    const rotated = rotateLocal(p.x, p.y, rotation);
    const iso = localToIso(rotated.x, rotated.y);
    if (i === 0) {
      ctx.moveTo(centerX + iso.dx, centerY + iso.dy + roofY);
    } else {
      ctx.lineTo(centerX + iso.dx, centerY + iso.dy + roofY);
    }
  });
  ctx.closePath();
  ctx.fill();
}

// Draw signal light
function drawSignal(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation,
  state: 'green' | 'red'
) {
  // Signal post position
  const postPos = rotateLocal(0.8, 0.5, rotation);
  const iso = localToIso(postPos.x, postPos.y);

  // Post
  ctx.fillStyle = '#424242';
  ctx.fillRect(centerX + iso.dx - 2, centerY + iso.dy - 20, 4, 20);

  // Signal light
  ctx.fillStyle = state === 'green' ? '#4CAF50' : '#F44336';
  ctx.beginPath();
  ctx.arc(centerX + iso.dx, centerY + iso.dy - 24, 5, 0, Math.PI * 2);
  ctx.fill();

  // Light glow
  ctx.fillStyle = state === 'green' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX + iso.dx, centerY + iso.dy - 24, 8, 0, Math.PI * 2);
  ctx.fill();
}

// Draw bridge railings
function drawBridgeRailings(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation
) {
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // Left railing posts
  const leftPosts = [
    { x: 0.3, y: 0.15 },
    { x: 0.3, y: 0.5 },
    { x: 0.3, y: 0.85 },
  ];

  // Right railing posts
  const rightPosts = [
    { x: 0.7, y: 0.15 },
    { x: 0.7, y: 0.5 },
    { x: 0.7, y: 0.85 },
  ];

  // Draw posts and rails
  for (const posts of [leftPosts, rightPosts]) {
    // Draw vertical posts
    for (const post of posts) {
      const rotated = rotateLocal(post.x, post.y, rotation);
      const iso = localToIso(rotated.x, rotated.y);
      ctx.beginPath();
      ctx.moveTo(centerX + iso.dx, centerY + iso.dy);
      ctx.lineTo(centerX + iso.dx, centerY + iso.dy - 12);
      ctx.stroke();
    }

    // Draw horizontal rail
    ctx.beginPath();
    for (let i = 0; i < posts.length; i++) {
      const rotated = rotateLocal(posts[i].x, posts[i].y, rotation);
      const iso = localToIso(rotated.x, rotated.y);
      if (i === 0) {
        ctx.moveTo(centerX + iso.dx, centerY + iso.dy - 10);
      } else {
        ctx.lineTo(centerX + iso.dx, centerY + iso.dy - 10);
      }
    }
    ctx.stroke();
  }
}

// Draw bridge support pillars
function drawBridgeSupports(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation,
  elevationDiff: number
) {
  const pillarHeight = elevationDiff * ELEVATION_HEIGHT;
  const woodColor = '#6D4C41';
  const woodDark = '#4E342E';

  // Support positions along the track
  const supportPositions = [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ];

  // Draw X-bracing between pillars (behind pillars)
  ctx.strokeStyle = woodDark;
  ctx.lineWidth = 2;

  // Left side X-brace
  const leftTop = rotateLocal(0.25, 0.25, rotation);
  const leftBottom = rotateLocal(0.25, 0.75, rotation);
  const leftTopIso = localToIso(leftTop.x, leftTop.y);
  const leftBottomIso = localToIso(leftBottom.x, leftBottom.y);

  ctx.beginPath();
  ctx.moveTo(centerX + leftTopIso.dx, centerY + leftTopIso.dy);
  ctx.lineTo(centerX + leftBottomIso.dx, centerY + leftBottomIso.dy + pillarHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + leftBottomIso.dx, centerY + leftBottomIso.dy);
  ctx.lineTo(centerX + leftTopIso.dx, centerY + leftTopIso.dy + pillarHeight);
  ctx.stroke();

  // Right side X-brace
  const rightTop = rotateLocal(0.75, 0.25, rotation);
  const rightBottom = rotateLocal(0.75, 0.75, rotation);
  const rightTopIso = localToIso(rightTop.x, rightTop.y);
  const rightBottomIso = localToIso(rightBottom.x, rightBottom.y);

  ctx.beginPath();
  ctx.moveTo(centerX + rightTopIso.dx, centerY + rightTopIso.dy);
  ctx.lineTo(centerX + rightBottomIso.dx, centerY + rightBottomIso.dy + pillarHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + rightBottomIso.dx, centerY + rightBottomIso.dy);
  ctx.lineTo(centerX + rightTopIso.dx, centerY + rightTopIso.dy + pillarHeight);
  ctx.stroke();

  // Draw vertical pillars
  for (const pos of supportPositions) {
    const rotated = rotateLocal(pos.x, pos.y, rotation);
    const iso = localToIso(rotated.x, rotated.y);

    // Pillar shadow/back
    ctx.fillStyle = woodDark;
    ctx.fillRect(
      centerX + iso.dx - 4,
      centerY + iso.dy,
      8,
      pillarHeight + 2
    );

    // Pillar front
    ctx.fillStyle = woodColor;
    ctx.fillRect(
      centerX + iso.dx - 3,
      centerY + iso.dy,
      6,
      pillarHeight
    );

    // Pillar cap
    ctx.fillStyle = woodDark;
    ctx.fillRect(
      centerX + iso.dx - 4,
      centerY + iso.dy - 2,
      8,
      4
    );
  }

  // Draw horizontal beam at base (ground level)
  ctx.strokeStyle = woodColor;
  ctx.lineWidth = 4;

  // Front beam
  const frontLeft = rotateLocal(0.2, 0.75, rotation);
  const frontRight = rotateLocal(0.8, 0.75, rotation);
  const frontLeftIso = localToIso(frontLeft.x, frontLeft.y);
  const frontRightIso = localToIso(frontRight.x, frontRight.y);

  ctx.beginPath();
  ctx.moveTo(centerX + frontLeftIso.dx, centerY + frontLeftIso.dy + pillarHeight);
  ctx.lineTo(centerX + frontRightIso.dx, centerY + frontRightIso.dy + pillarHeight);
  ctx.stroke();

  // Back beam
  const backLeft = rotateLocal(0.2, 0.25, rotation);
  const backRight = rotateLocal(0.8, 0.25, rotation);
  const backLeftIso = localToIso(backLeft.x, backLeft.y);
  const backRightIso = localToIso(backRight.x, backRight.y);

  ctx.beginPath();
  ctx.moveTo(centerX + backLeftIso.dx, centerY + backLeftIso.dy + pillarHeight);
  ctx.lineTo(centerX + backRightIso.dx, centerY + backRightIso.dy + pillarHeight);
  ctx.stroke();
}

// Draw tunnel portal (stone archway)
function drawTunnelPortal(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation
) {
  // Draw portals at both ends of the tunnel
  drawSinglePortal(ctx, centerX, centerY, rotation, 0.0);   // Entry (N side for rotation 0)
  drawSinglePortal(ctx, centerX, centerY, rotation, 1.0);   // Exit (S side for rotation 0)
}

// Draw a single tunnel portal archway
function drawSinglePortal(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation,
  position: number  // 0 = start (N), 1 = end (S)
) {
  // Portal position along the track
  const portalY = position;

  // Stone color for the archway
  const stoneColor = '#6D6552';
  const stoneDark = '#4A4539';
  const stoneLight = '#8A8272';

  // Archway dimensions
  const archWidth = 0.35;
  const archHeight = 20;

  // Left pillar
  const leftBase = rotateLocal(0.5 - archWidth, portalY, rotation);
  const leftIso = localToIso(leftBase.x, leftBase.y);

  // Right pillar
  const rightBase = rotateLocal(0.5 + archWidth, portalY, rotation);
  const rightIso = localToIso(rightBase.x, rightBase.y);

  // Draw darkness inside the tunnel (behind the arch)
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(centerX + leftIso.dx + 3, centerY + leftIso.dy);
  ctx.lineTo(centerX + rightIso.dx - 3, centerY + rightIso.dy);
  ctx.lineTo(centerX + rightIso.dx - 3, centerY + rightIso.dy - archHeight + 5);
  ctx.lineTo(centerX + leftIso.dx + 3, centerY + leftIso.dy - archHeight + 5);
  ctx.closePath();
  ctx.fill();

  // Draw left pillar
  ctx.fillStyle = stoneColor;
  ctx.fillRect(centerX + leftIso.dx - 3, centerY + leftIso.dy - archHeight, 6, archHeight);

  // Draw right pillar
  ctx.fillRect(centerX + rightIso.dx - 3, centerY + rightIso.dy - archHeight, 6, archHeight);

  // Draw arch top (semi-circular keystone area)
  const archCenterX = (leftIso.dx + rightIso.dx) / 2;
  const archCenterY = (leftIso.dy + rightIso.dy) / 2 - archHeight;
  const archSpan = Math.abs(rightIso.dx - leftIso.dx) / 2;

  // Arch stones
  ctx.fillStyle = stoneDark;
  ctx.beginPath();
  ctx.arc(centerX + archCenterX, centerY + archCenterY + 5, archSpan + 3, Math.PI, 0, false);
  ctx.lineTo(centerX + archCenterX + archSpan + 3, centerY + archCenterY + 10);
  ctx.lineTo(centerX + archCenterX - archSpan - 3, centerY + archCenterY + 10);
  ctx.closePath();
  ctx.fill();

  // Inner arch
  ctx.fillStyle = stoneLight;
  ctx.beginPath();
  ctx.arc(centerX + archCenterX, centerY + archCenterY + 5, archSpan, Math.PI, 0, false);
  ctx.lineTo(centerX + archCenterX + archSpan, centerY + archCenterY + 8);
  ctx.lineTo(centerX + archCenterX - archSpan, centerY + archCenterY + 8);
  ctx.closePath();
  ctx.fill();

  // Keystone at top of arch
  ctx.fillStyle = stoneDark;
  ctx.beginPath();
  ctx.moveTo(centerX + archCenterX - 4, centerY + archCenterY - archSpan + 2);
  ctx.lineTo(centerX + archCenterX + 4, centerY + archCenterY - archSpan + 2);
  ctx.lineTo(centerX + archCenterX + 3, centerY + archCenterY - archSpan + 10);
  ctx.lineTo(centerX + archCenterX - 3, centerY + archCenterY - archSpan + 10);
  ctx.closePath();
  ctx.fill();

  // Add some stone texture lines on pillars
  ctx.strokeStyle = stoneDark;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = centerY + leftIso.dy - (archHeight * i / 4);
    ctx.beginPath();
    ctx.moveTo(centerX + leftIso.dx - 3, y);
    ctx.lineTo(centerX + leftIso.dx + 3, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + rightIso.dx - 3, y);
    ctx.lineTo(centerX + rightIso.dx + 3, y);
    ctx.stroke();
  }
}

/**
 * Get the terrain elevation at a neighbor position.
 * Returns undefined if the position is out of bounds.
 */
function getNeighborTerrainElevation(
  grid: GameGrid,
  x: number,
  y: number,
  direction: CardinalDirection
): number | undefined {
  const offset = DIRECTION_OFFSETS[direction];
  const nx = x + offset.x;
  const ny = y + offset.y;

  // Check bounds
  if (nx < 0 || nx >= grid.width || ny < 0 || ny >= grid.height) {
    return undefined;
  }

  return grid.cells[ny][nx].elevation;
}

/**
 * Check if there's a track at a neighbor position
 */
function hasNeighborTrack(
  tracks: Map<string, TrackPiece>,
  x: number,
  y: number,
  direction: CardinalDirection
): boolean {
  const offset = DIRECTION_OFFSETS[direction];
  const nx = x + offset.x;
  const ny = y + offset.y;

  for (const track of tracks.values()) {
    if (track.position.x === nx && track.position.y === ny) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate connection elevations for a track based on neighbor terrain.
 * Only slopes toward neighbors that have tracks - dead ends stay flat.
 * At each edge with a neighbor track, we use the MIDPOINT between elevations.
 */
function calculateConnectionElevations(
  track: TrackPiece,
  grid: GameGrid,
  tracks: Map<string, TrackPiece>
): ConnectionElevations {
  const elevations: ConnectionElevations = {};
  const directions: CardinalDirection[] = ['N', 'E', 'S', 'W'];
  const trackElev = track.elevation;

  for (const dir of directions) {
    // Check if there's a track at the neighbor position
    const hasTrack = hasNeighborTrack(tracks, track.position.x, track.position.y, dir);

    if (hasTrack) {
      // There's a neighbor track - use midpoint for smooth connection
      const neighborElev = getNeighborTerrainElevation(
        grid,
        track.position.x,
        track.position.y,
        dir
      );

      if (neighborElev !== undefined) {
        elevations[dir] = (trackElev + neighborElev) / 2;
      } else {
        elevations[dir] = trackElev;
      }
    } else {
      // No neighbor track (dead end) - stay at track's own elevation
      elevations[dir] = trackElev;
    }
  }

  return elevations;
}

// Render all tracks
export function renderTracks(
  ctx: CanvasRenderingContext2D,
  tracks: Map<string, TrackPiece>,
  originX: number,
  originY: number,
  grid: GameGrid
) {
  // Sort tracks by depth for correct rendering order
  const sortedTracks = Array.from(tracks.values()).sort((a, b) => {
    const depthA = (a.position.x + a.position.y) * 1000 + a.elevation;
    const depthB = (b.position.x + b.position.y) * 1000 + b.elevation;
    return depthA - depthB;
  });

  for (const track of sortedTracks) {
    // Calculate what elevation the track should slope to at each edge
    // Only slopes toward neighbors that have tracks (dead ends stay flat)
    const connectionElevations = calculateConnectionElevations(track, grid, tracks);
    // Get terrain elevation at this position (for bridge support pillars)
    const terrainElevation = grid.cells[track.position.y][track.position.x].elevation;
    drawTrack(ctx, track, originX, originY, connectionElevations, terrainElevation);
  }
}
