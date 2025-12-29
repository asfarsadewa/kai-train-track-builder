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

// Draw wooden sleepers along a path with wood grain effect
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

    const x1 = centerX + iso1.dx;
    const y1 = centerY + iso1.dy + elevOffset;
    const x2 = centerX + iso2.dx;
    const y2 = centerY + iso2.dy + elevOffset;

    // Draw shadow underneath sleeper
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 2);
    ctx.lineTo(x2, y2 + 2);
    ctx.stroke();

    // Create wood grain gradient along the sleeper
    const sleeperGradient = ctx.createLinearGradient(x1, y1, x2, y2);
    sleeperGradient.addColorStop(0, '#9C8068');    // Light edge
    sleeperGradient.addColorStop(0.15, '#8D6E63'); // Main wood
    sleeperGradient.addColorStop(0.3, '#7D5F53');  // Grain line
    sleeperGradient.addColorStop(0.35, '#8D6E63'); // Main wood
    sleeperGradient.addColorStop(0.5, '#9C8068');  // Center highlight
    sleeperGradient.addColorStop(0.65, '#8D6E63'); // Main wood
    sleeperGradient.addColorStop(0.7, '#7D5F53');  // Grain line
    sleeperGradient.addColorStop(0.85, '#8D6E63'); // Main wood
    sleeperGradient.addColorStop(1, '#6D4C41');    // Dark edge

    // Main sleeper body
    ctx.strokeStyle = sleeperGradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Top highlight for 3D effect
    ctx.strokeStyle = 'rgba(255, 248, 240, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 1);
    ctx.lineTo(x2, y2 - 1);
    ctx.stroke();

    // Subtle wood grain lines (parallel to sleeper)
    ctx.strokeStyle = 'rgba(93, 64, 55, 0.3)';
    ctx.lineWidth = 1;
    for (const grainOffset of [-2, 2]) {
      ctx.beginPath();
      ctx.moveTo(x1, y1 + grainOffset);
      ctx.lineTo(x2, y2 + grainOffset);
      ctx.stroke();
    }
  }
}

// Draw rails along a path with metallic sheen effect
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

  // Collect rail points for gradient calculations
  const segments = 20;

  // Draw two rails
  for (const offset of [-railOffset, railOffset]) {
    const railPoints: { x: number; y: number }[] = [];

    // First pass: collect all points
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

      railPoints.push({
        x: centerX + iso.dx,
        y: centerY + iso.dy + elevOffset,
      });
    }

    // Draw shadow underneath rail first
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    railPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y + 2);
      else ctx.lineTo(p.x, p.y + 2);
    });
    ctx.stroke();

    // Draw main rail body with metallic gradient
    // Create a vertical gradient for the "rounded rail" effect
    const minY = Math.min(...railPoints.map(p => p.y));
    const maxY = Math.max(...railPoints.map(p => p.y));
    const railGradient = ctx.createLinearGradient(0, minY - 3, 0, maxY + 3);
    railGradient.addColorStop(0, '#8B7355');     // Bright top (light hitting)
    railGradient.addColorStop(0.3, '#6D5843');   // Main body
    railGradient.addColorStop(0.7, '#5D4037');   // Dark side
    railGradient.addColorStop(1, '#3E2723');     // Bottom shadow

    ctx.strokeStyle = railGradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    railPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw specular highlight (shiny top edge)
    ctx.strokeStyle = 'rgba(255, 248, 230, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    railPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y - 1);
      else ctx.lineTo(p.x, p.y - 1);
    });
    ctx.stroke();

    // Add subtle inner highlight for depth
    ctx.strokeStyle = 'rgba(180, 160, 140, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    railPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
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

// Draw station platform with 3D effect
function drawStationPlatform(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation
) {
  // Platform on one side of the track
  const platformPoints = [
    { x: 0.2, y: 0.1 },
    { x: 0.4, y: 0.1 },
    { x: 0.4, y: 0.9 },
    { x: 0.2, y: 0.9 },
  ];

  // Get screen coordinates for gradient
  const isoPoints = platformPoints.map(p => {
    const rotated = rotateLocal(p.x, p.y, rotation);
    return localToIso(rotated.x, rotated.y);
  });

  // Platform shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  isoPoints.forEach((iso, i) => {
    if (i === 0) ctx.moveTo(centerX + iso.dx + 2, centerY + iso.dy + 3);
    else ctx.lineTo(centerX + iso.dx + 2, centerY + iso.dy + 3);
  });
  ctx.closePath();
  ctx.fill();

  // Platform base with wood gradient
  const minX = Math.min(...isoPoints.map(p => p.dx));
  const maxX = Math.max(...isoPoints.map(p => p.dx));
  const platformGradient = ctx.createLinearGradient(centerX + minX, 0, centerX + maxX, 0);
  platformGradient.addColorStop(0, '#A1887F');
  platformGradient.addColorStop(0.5, '#8D6E63');
  platformGradient.addColorStop(1, '#6D4C41');
  ctx.fillStyle = platformGradient;

  ctx.beginPath();
  isoPoints.forEach((iso, i) => {
    if (i === 0) ctx.moveTo(centerX + iso.dx, centerY + iso.dy);
    else ctx.lineTo(centerX + iso.dx, centerY + iso.dy);
  });
  ctx.closePath();
  ctx.fill();

  // Platform edge highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX + isoPoints[0].dx, centerY + isoPoints[0].dy);
  ctx.lineTo(centerX + isoPoints[1].dx, centerY + isoPoints[1].dy);
  ctx.stroke();

  // Support pillars
  const pillarPositions = [0.2, 0.5, 0.8];
  for (const t of pillarPositions) {
    const pillarX = 0.3;
    const pillarY = 0.1 + t * 0.8;
    const rotated = rotateLocal(pillarX, pillarY, rotation);
    const iso = localToIso(rotated.x, rotated.y);

    // Pillar with gradient
    const pillarGradient = ctx.createLinearGradient(
      centerX + iso.dx - 2, 0, centerX + iso.dx + 2, 0
    );
    pillarGradient.addColorStop(0, '#A1887F');
    pillarGradient.addColorStop(0.5, '#6D4C41');
    pillarGradient.addColorStop(1, '#4E342E');
    ctx.fillStyle = pillarGradient;
    ctx.fillRect(centerX + iso.dx - 1.5, centerY + iso.dy - 8, 3, 8);
  }

  // Platform roof with gradient
  const roofY = -10;
  const roofGradient = ctx.createLinearGradient(0, centerY + roofY - 2, 0, centerY + roofY + 2);
  roofGradient.addColorStop(0, '#EF5350');
  roofGradient.addColorStop(1, '#B71C1C');
  ctx.fillStyle = roofGradient;

  ctx.beginPath();
  isoPoints.forEach((iso, i) => {
    if (i === 0) ctx.moveTo(centerX + iso.dx, centerY + iso.dy + roofY);
    else ctx.lineTo(centerX + iso.dx, centerY + iso.dy + roofY);
  });
  ctx.closePath();
  ctx.fill();

  // Roof highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX + isoPoints[0].dx, centerY + isoPoints[0].dy + roofY);
  ctx.lineTo(centerX + isoPoints[1].dx, centerY + isoPoints[1].dy + roofY);
  ctx.stroke();
}

// Draw signal light with 3D effect
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
  const px = centerX + iso.dx;
  const py = centerY + iso.dy;

  // Post shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(px, py - 19, 4, 20);

  // Post with metallic gradient
  const postGradient = ctx.createLinearGradient(px - 2, 0, px + 2, 0);
  postGradient.addColorStop(0, '#616161');
  postGradient.addColorStop(0.3, '#424242');
  postGradient.addColorStop(0.7, '#212121');
  postGradient.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = postGradient;
  ctx.fillRect(px - 2, py - 20, 4, 20);

  // Signal housing (black box)
  const housingGradient = ctx.createLinearGradient(px - 4, 0, px + 4, 0);
  housingGradient.addColorStop(0, '#424242');
  housingGradient.addColorStop(0.5, '#212121');
  housingGradient.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = housingGradient;
  ctx.fillRect(px - 4, py - 30, 8, 12);

  // Signal housing highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px - 4, py - 30, 8, 12);

  // Light glow (outer)
  const glowColor = state === 'green' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)';
  const glowGradient = ctx.createRadialGradient(px, py - 24, 0, px, py - 24, 12);
  glowGradient.addColorStop(0, glowColor);
  glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(px, py - 24, 12, 0, Math.PI * 2);
  ctx.fill();

  // Signal light with gradient for 3D lens effect
  const lightGradient = ctx.createRadialGradient(px - 1, py - 25, 0, px, py - 24, 5);
  if (state === 'green') {
    lightGradient.addColorStop(0, '#A5D6A7');
    lightGradient.addColorStop(0.4, '#66BB6A');
    lightGradient.addColorStop(1, '#2E7D32');
  } else {
    lightGradient.addColorStop(0, '#EF9A9A');
    lightGradient.addColorStop(0.4, '#EF5350');
    lightGradient.addColorStop(1, '#C62828');
  }
  ctx.fillStyle = lightGradient;
  ctx.beginPath();
  ctx.arc(px, py - 24, 5, 0, Math.PI * 2);
  ctx.fill();

  // Light specular highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(px - 1.5, py - 26, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// Draw bridge railings with 3D wood effect
function drawBridgeRailings(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation
) {
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

  // Draw posts and rails for each side
  for (const posts of [leftPosts, rightPosts]) {
    // Get iso coordinates
    const isoPoints = posts.map(post => {
      const rotated = rotateLocal(post.x, post.y, rotation);
      return localToIso(rotated.x, rotated.y);
    });

    // Draw vertical posts with gradient
    for (const iso of isoPoints) {
      const px = centerX + iso.dx;
      const py = centerY + iso.dy;

      // Post shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(px + 1, py - 11, 3, 12);

      // Post with wood gradient
      const postGradient = ctx.createLinearGradient(px - 2, 0, px + 2, 0);
      postGradient.addColorStop(0, '#A1887F');
      postGradient.addColorStop(0.5, '#8D6E63');
      postGradient.addColorStop(1, '#5D4037');
      ctx.fillStyle = postGradient;
      ctx.fillRect(px - 1.5, py - 12, 3, 12);

      // Post cap
      ctx.fillStyle = '#6D4C41';
      ctx.beginPath();
      ctx.arc(px, py - 12, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw horizontal rail with gradient
    const railGradient = ctx.createLinearGradient(
      centerX + isoPoints[0].dx, centerY + isoPoints[0].dy - 10,
      centerX + isoPoints[2].dx, centerY + isoPoints[2].dy - 10
    );
    railGradient.addColorStop(0, '#A1887F');
    railGradient.addColorStop(0.5, '#8D6E63');
    railGradient.addColorStop(1, '#6D4C41');

    // Rail shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < isoPoints.length; i++) {
      const iso = isoPoints[i];
      if (i === 0) ctx.moveTo(centerX + iso.dx + 1, centerY + iso.dy - 9);
      else ctx.lineTo(centerX + iso.dx + 1, centerY + iso.dy - 9);
    }
    ctx.stroke();

    // Main rail
    ctx.strokeStyle = railGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < isoPoints.length; i++) {
      const iso = isoPoints[i];
      if (i === 0) ctx.moveTo(centerX + iso.dx, centerY + iso.dy - 10);
      else ctx.lineTo(centerX + iso.dx, centerY + iso.dy - 10);
    }
    ctx.stroke();

    // Rail highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < isoPoints.length; i++) {
      const iso = isoPoints[i];
      if (i === 0) ctx.moveTo(centerX + iso.dx, centerY + iso.dy - 11);
      else ctx.lineTo(centerX + iso.dx, centerY + iso.dy - 11);
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

// Draw a single tunnel portal archway with 3D stone effect
function drawSinglePortal(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: Rotation,
  position: number  // 0 = start (N), 1 = end (S)
) {
  // Portal position along the track
  const portalY = position;

  // Archway dimensions
  const archWidth = 0.35;
  const archHeight = 22;

  // Left pillar
  const leftBase = rotateLocal(0.5 - archWidth, portalY, rotation);
  const leftIso = localToIso(leftBase.x, leftBase.y);

  // Right pillar
  const rightBase = rotateLocal(0.5 + archWidth, portalY, rotation);
  const rightIso = localToIso(rightBase.x, rightBase.y);

  const lx = centerX + leftIso.dx;
  const ly = centerY + leftIso.dy;
  const rx = centerX + rightIso.dx;
  const ry = centerY + rightIso.dy;

  // Draw darkness inside the tunnel (behind the arch) with gradient
  const tunnelGradient = ctx.createRadialGradient(
    (lx + rx) / 2, (ly + ry) / 2 - archHeight / 2, 0,
    (lx + rx) / 2, (ly + ry) / 2 - archHeight / 2, archHeight
  );
  tunnelGradient.addColorStop(0, '#0a0a0a');
  tunnelGradient.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = tunnelGradient;
  ctx.beginPath();
  ctx.moveTo(lx + 4, ly);
  ctx.lineTo(rx - 4, ry);
  ctx.lineTo(rx - 4, ry - archHeight + 6);
  ctx.lineTo(lx + 4, ly - archHeight + 6);
  ctx.closePath();
  ctx.fill();

  // Draw left pillar with stone gradient
  const leftPillarGradient = ctx.createLinearGradient(lx - 4, 0, lx + 4, 0);
  leftPillarGradient.addColorStop(0, '#8A8272');
  leftPillarGradient.addColorStop(0.5, '#6D6552');
  leftPillarGradient.addColorStop(1, '#4A4539');
  ctx.fillStyle = leftPillarGradient;
  ctx.fillRect(lx - 4, ly - archHeight, 8, archHeight);

  // Draw right pillar with stone gradient
  const rightPillarGradient = ctx.createLinearGradient(rx - 4, 0, rx + 4, 0);
  rightPillarGradient.addColorStop(0, '#8A8272');
  rightPillarGradient.addColorStop(0.5, '#6D6552');
  rightPillarGradient.addColorStop(1, '#4A4539');
  ctx.fillStyle = rightPillarGradient;
  ctx.fillRect(rx - 4, ry - archHeight, 8, archHeight);

  // Draw arch top (semi-circular keystone area)
  const archCenterX = (leftIso.dx + rightIso.dx) / 2;
  const archCenterY = (leftIso.dy + rightIso.dy) / 2 - archHeight;
  const archSpan = Math.abs(rightIso.dx - leftIso.dx) / 2;
  const acx = centerX + archCenterX;
  const acy = centerY + archCenterY;

  // Outer arch stones with gradient
  const outerArchGradient = ctx.createRadialGradient(acx, acy - 5, 0, acx, acy + 5, archSpan + 5);
  outerArchGradient.addColorStop(0, '#5A5445');
  outerArchGradient.addColorStop(1, '#3A3530');
  ctx.fillStyle = outerArchGradient;
  ctx.beginPath();
  ctx.arc(acx, acy + 5, archSpan + 4, Math.PI, 0, false);
  ctx.lineTo(acx + archSpan + 4, acy + 12);
  ctx.lineTo(acx - archSpan - 4, acy + 12);
  ctx.closePath();
  ctx.fill();

  // Inner arch with gradient
  const innerArchGradient = ctx.createLinearGradient(acx - archSpan, acy, acx + archSpan, acy);
  innerArchGradient.addColorStop(0, '#9A9282');
  innerArchGradient.addColorStop(0.5, '#7A7262');
  innerArchGradient.addColorStop(1, '#6A6252');
  ctx.fillStyle = innerArchGradient;
  ctx.beginPath();
  ctx.arc(acx, acy + 5, archSpan, Math.PI, 0, false);
  ctx.lineTo(acx + archSpan, acy + 9);
  ctx.lineTo(acx - archSpan, acy + 9);
  ctx.closePath();
  ctx.fill();

  // Keystone at top of arch with 3D effect
  const keystoneGradient = ctx.createLinearGradient(acx - 5, acy - archSpan, acx + 5, acy - archSpan);
  keystoneGradient.addColorStop(0, '#7A7262');
  keystoneGradient.addColorStop(0.5, '#5A5445');
  keystoneGradient.addColorStop(1, '#4A4539');
  ctx.fillStyle = keystoneGradient;
  ctx.beginPath();
  ctx.moveTo(acx - 5, acy - archSpan + 1);
  ctx.lineTo(acx + 5, acy - archSpan + 1);
  ctx.lineTo(acx + 4, acy - archSpan + 12);
  ctx.lineTo(acx - 4, acy - archSpan + 12);
  ctx.closePath();
  ctx.fill();

  // Keystone highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(acx - 4, acy - archSpan + 2);
  ctx.lineTo(acx, acy - archSpan + 1);
  ctx.lineTo(acx, acy - archSpan + 10);
  ctx.lineTo(acx - 3, acy - archSpan + 11);
  ctx.closePath();
  ctx.fill();

  // Add stone block lines on pillars
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const yOffset = archHeight * i / 5;

    // Left pillar blocks
    ctx.beginPath();
    ctx.moveTo(lx - 4, ly - yOffset);
    ctx.lineTo(lx + 4, ly - yOffset);
    ctx.stroke();

    // Right pillar blocks
    ctx.beginPath();
    ctx.moveTo(rx - 4, ry - yOffset);
    ctx.lineTo(rx + 4, ry - yOffset);
    ctx.stroke();
  }

  // Pillar edge highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(lx - 4, ly);
  ctx.lineTo(lx - 4, ly - archHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rx - 4, ry);
  ctx.lineTo(rx - 4, ry - archHeight);
  ctx.stroke();
}

/**
 * Get the track at a neighbor position, if any
 */
function getNeighborTrack(
  tracks: Map<string, TrackPiece>,
  x: number,
  y: number,
  direction: CardinalDirection
): TrackPiece | undefined {
  const offset = DIRECTION_OFFSETS[direction];
  const nx = x + offset.x;
  const ny = y + offset.y;

  for (const track of tracks.values()) {
    if (track.position.x === nx && track.position.y === ny) {
      return track;
    }
  }
  return undefined;
}

/**
 * Calculate connection elevations for a track based on neighbor tracks.
 * Only slopes toward neighbors that have tracks - dead ends stay flat.
 * At each edge with a neighbor track, we use the MIDPOINT between track elevations.
 */
function calculateConnectionElevations(
  track: TrackPiece,
  _grid: GameGrid,
  tracks: Map<string, TrackPiece>
): ConnectionElevations {
  const elevations: ConnectionElevations = {};
  const directions: CardinalDirection[] = ['N', 'E', 'S', 'W'];
  const trackElev = track.elevation;

  for (const dir of directions) {
    // Get the neighbor track if any
    const neighborTrack = getNeighborTrack(tracks, track.position.x, track.position.y, dir);

    if (neighborTrack) {
      // Use the TRACK elevation of the neighbor for correct bridge/tunnel handling
      elevations[dir] = (trackElev + neighborTrack.elevation) / 2;
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
