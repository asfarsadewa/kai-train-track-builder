// Train rendering - cute wooden toy train aesthetic for isometric view

import { COLORS } from '../constants';
import type { TrainPosition } from '../logic/trainMovement';
import type { CarriageType } from '../types';

/**
 * Draw the train engine at a position
 * The train is drawn in a 2.5D isometric style where:
 * - The train body is viewed from a 3/4 angle
 * - Wheels appear at the visual bottom (higher screen Y)
 * - The rotation only affects which direction the train faces along the track
 */
export function drawTrain(
  ctx: CanvasRenderingContext2D,
  position: TrainPosition
) {
  const { worldX, worldY, rotation } = position;

  ctx.save();
  ctx.translate(worldX, worldY);

  // Train dimensions (in pixels)
  const trainLength = 28;
  const bodyHeight = 10;
  const baseOffset = 4; // Vertical offset to position train on track

  // Calculate direction vector from rotation
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);

  // Perpendicular vector (for width)
  const perpX = -dirY;
  const perpY = dirX;

  // Draw shadow (ellipse under train)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, baseOffset + 2, trainLength / 2, 4, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Draw wheels first (behind body) - 4 wheels as circles
  ctx.fillStyle = COLORS.train.wheel;
  const wheelRadius = 4;
  const wheelSpacingLength = trainLength / 2 - 8;
  const wheelSpacingWidth = 5;

  // Draw wheels at the 4 corners of the train base
  for (const lengthMult of [-1, 1]) {
    for (const widthMult of [-1, 1]) {
      const wx = lengthMult * wheelSpacingLength * dirX + widthMult * wheelSpacingWidth * perpX;
      const wy = lengthMult * wheelSpacingLength * dirY + widthMult * wheelSpacingWidth * perpY + baseOffset;

      ctx.beginPath();
      ctx.arc(wx, wy, wheelRadius, 0, Math.PI * 2);
      ctx.fill();

      // Wheel highlight
      ctx.fillStyle = '#546E7A';
      ctx.beginPath();
      ctx.arc(wx, wy, wheelRadius - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.train.wheel;
    }
  }

  // Draw train body (red wooden engine) - as a rotated rectangle
  ctx.fillStyle = COLORS.train.engine;
  drawRotatedRect(ctx, 0, -bodyHeight / 2, trainLength, bodyHeight + 2, rotation);

  // Body highlight (top edge)
  ctx.fillStyle = COLORS.train.engineHighlight;
  drawRotatedRect(ctx, 0, -bodyHeight / 2 - 1, trainLength - 4, 4, rotation);

  // Cabin (back of train - opposite to direction of travel)
  const cabinOffsetX = (trainLength / 2 - 5) * dirX;
  const cabinOffsetY = (trainLength / 2 - 5) * dirY;
  ctx.fillStyle = COLORS.train.engineShadow;
  drawRotatedRect(ctx, cabinOffsetX, cabinOffsetY - bodyHeight / 2 - 3, 10, bodyHeight + 4, rotation);

  // Cabin window
  ctx.fillStyle = '#81D4FA';
  drawRotatedRect(ctx, cabinOffsetX, cabinOffsetY - bodyHeight / 2 - 1, 6, bodyHeight - 2, rotation);

  // Chimney (front of train - in direction of travel)
  const chimneyOffsetX = (-trainLength / 2 + 8) * dirX;
  const chimneyOffsetY = (-trainLength / 2 + 8) * dirY;
  ctx.fillStyle = COLORS.train.chimney;
  ctx.beginPath();
  ctx.arc(chimneyOffsetX, chimneyOffsetY - bodyHeight - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Chimney top
  ctx.fillStyle = '#424242';
  ctx.beginPath();
  ctx.arc(chimneyOffsetX, chimneyOffsetY - bodyHeight - 6, 5, 0, Math.PI * 2);
  ctx.fill();

  // Front bumper (cow catcher)
  const bumperOffsetX = (-trainLength / 2 - 2) * dirX;
  const bumperOffsetY = (-trainLength / 2 - 2) * dirY;
  ctx.fillStyle = '#5D4037';
  drawRotatedRect(ctx, bumperOffsetX, bumperOffsetY, 4, 8, rotation);

  ctx.restore();
}

/**
 * Draw a rectangle rotated around its center
 */
function drawRotatedRect(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  rotation: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.rect(-width / 2, -height / 2, width, height);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a carriage following the train
 * Uses the same isometric direction-vector approach as the locomotive
 */
export function drawCarriage(
  ctx: CanvasRenderingContext2D,
  position: TrainPosition,
  type: Exclude<CarriageType, 'engine'> = 'passenger'
) {
  const { worldX, worldY, rotation } = position;

  ctx.save();
  ctx.translate(worldX, worldY);

  const carriageLength = 24;
  const bodyHeight = 8;
  const baseOffset = 4;

  // Calculate direction vector from rotation (same as locomotive)
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);

  // Perpendicular vector (for width)
  const perpX = -dirY;
  const perpY = dirX;

  // Shadow (ellipse under carriage)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, baseOffset + 2, carriageLength / 2, 4, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Draw wheels first (behind body) - 4 wheels at corners
  ctx.fillStyle = COLORS.train.wheel;
  const wheelRadius = 3;
  const wheelSpacingLength = carriageLength / 2 - 6;
  const wheelSpacingWidth = 4;

  for (const lengthMult of [-1, 1]) {
    for (const widthMult of [-1, 1]) {
      const wx = lengthMult * wheelSpacingLength * dirX + widthMult * wheelSpacingWidth * perpX;
      const wy = lengthMult * wheelSpacingLength * dirY + widthMult * wheelSpacingWidth * perpY + baseOffset;

      ctx.beginPath();
      ctx.arc(wx, wy, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw type-specific carriage body
  switch (type) {
    case 'passenger':
      drawPassengerCarriage(ctx, carriageLength, bodyHeight, baseOffset, rotation, dirX, dirY);
      break;
    case 'cargo':
      drawCargoCarriage(ctx, carriageLength, bodyHeight, baseOffset, rotation, dirX, dirY);
      break;
    case 'tanker':
      drawTankerCarriage(ctx, carriageLength, bodyHeight, baseOffset, rotation, dirX, dirY);
      break;
    case 'coal':
      drawCoalCarriage(ctx, carriageLength, bodyHeight, baseOffset, rotation, dirX, dirY);
      break;
    case 'caboose':
      drawCabooseCarriage(ctx, carriageLength, bodyHeight, baseOffset, rotation, dirX, dirY);
      break;
  }

  ctx.restore();
}

/**
 * Passenger carriage - blue with windows (isometric)
 */
function drawPassengerCarriage(
  ctx: CanvasRenderingContext2D,
  length: number,
  height: number,
  _baseOffset: number,
  rotation: number,
  dirX: number,
  dirY: number
) {
  // Main body
  ctx.fillStyle = COLORS.train.passenger;
  drawRotatedRect(ctx, 0, -height / 2, length, height + 2, rotation);

  // Highlight (top)
  ctx.fillStyle = COLORS.train.passengerHighlight;
  drawRotatedRect(ctx, 0, -height / 2 - 1, length - 4, 3, rotation);

  // Windows along the length
  ctx.fillStyle = COLORS.train.window;
  for (let i = -1; i <= 1; i++) {
    const windowOffsetX = i * 6 * dirX;
    const windowOffsetY = i * 6 * dirY;
    drawRotatedRect(ctx, windowOffsetX, windowOffsetY - height / 2, 4, 4, rotation);
  }
}

/**
 * Cargo carriage - brown box car (isometric)
 */
function drawCargoCarriage(
  ctx: CanvasRenderingContext2D,
  length: number,
  height: number,
  _baseOffset: number,
  rotation: number,
  dirX: number,
  dirY: number
) {
  // Main body
  ctx.fillStyle = COLORS.train.cargo;
  drawRotatedRect(ctx, 0, -height / 2, length, height + 2, rotation);

  // Highlight strip
  ctx.fillStyle = COLORS.train.cargoHighlight;
  drawRotatedRect(ctx, 0, -height / 2 - 1, length - 4, 3, rotation);

  // Door lines (vertical stripes)
  ctx.fillStyle = COLORS.train.cargoDark;
  drawRotatedRect(ctx, -3 * dirX, -3 * dirY - height / 2 + 1, 1, height - 2, rotation);
  drawRotatedRect(ctx, 3 * dirX, 3 * dirY - height / 2 + 1, 1, height - 2, rotation);
}

/**
 * Tanker carriage - cylindrical silver tank (isometric)
 */
function drawTankerCarriage(
  ctx: CanvasRenderingContext2D,
  length: number,
  height: number,
  baseOffset: number,
  rotation: number,
  dirX: number,
  dirY: number
) {
  // Undercarriage
  ctx.fillStyle = COLORS.train.tankerDark;
  drawRotatedRect(ctx, 0, baseOffset - 2, length, 3, rotation);

  // Cylindrical tank body (using ellipse with rotation)
  ctx.fillStyle = COLORS.train.tanker;
  ctx.beginPath();
  ctx.ellipse(0, -height / 2, length / 2 - 2, height / 2, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Highlight (top)
  ctx.fillStyle = COLORS.train.tankerHighlight;
  ctx.beginPath();
  ctx.ellipse(0, -height / 2 - 2, length / 2 - 4, height / 3, rotation, Math.PI, Math.PI * 2);
  ctx.fill();

  // End caps
  ctx.fillStyle = COLORS.train.tankerDark;
  const endCapOffset = length / 2 - 3;
  ctx.beginPath();
  ctx.arc(-endCapOffset * dirX, -endCapOffset * dirY - height / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(endCapOffset * dirX, endCapOffset * dirY - height / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Top hatch
  ctx.beginPath();
  ctx.arc(0, -height - 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Coal carriage - open-top hopper (isometric)
 */
function drawCoalCarriage(
  ctx: CanvasRenderingContext2D,
  length: number,
  height: number,
  _baseOffset: number,
  rotation: number,
  dirX: number,
  dirY: number
) {
  // Hopper body
  ctx.fillStyle = COLORS.train.coal;
  drawRotatedRect(ctx, 0, -height / 2 + 1, length, height, rotation);

  // Inner (coal area)
  ctx.fillStyle = COLORS.train.coalDark;
  drawRotatedRect(ctx, 0, -height / 2, length - 4, height - 3, rotation);

  // Coal pile
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  const pilePoints = [
    { x: -length / 2 + 4, y: -height / 2 },
    { x: -length / 2 + 6, y: -height - 2 },
    { x: -2, y: -height - 4 },
    { x: 4, y: -height - 2 },
    { x: length / 2 - 4, y: -height - 3 },
    { x: length / 2 - 4, y: -height / 2 },
  ];
  ctx.moveTo(pilePoints[0].x * dirX, pilePoints[0].x * dirY + pilePoints[0].y);
  for (let i = 1; i < pilePoints.length; i++) {
    ctx.lineTo(pilePoints[i].x * dirX, pilePoints[i].x * dirY + pilePoints[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // Rim highlight
  ctx.fillStyle = COLORS.train.coalHighlight;
  drawRotatedRect(ctx, 0, -height / 2 - height + 2, length, 2, rotation);
}

/**
 * Caboose carriage - darker red with cupola (isometric)
 */
function drawCabooseCarriage(
  ctx: CanvasRenderingContext2D,
  length: number,
  height: number,
  _baseOffset: number,
  rotation: number,
  dirX: number,
  dirY: number
) {
  // Main body
  ctx.fillStyle = COLORS.train.caboose;
  drawRotatedRect(ctx, 0, -height / 2, length, height + 2, rotation);

  // Highlight
  ctx.fillStyle = COLORS.train.cabooseHighlight;
  drawRotatedRect(ctx, 0, -height / 2 - 1, length - 4, 3, rotation);

  // Cupola (raised observation area)
  ctx.fillStyle = COLORS.train.caboose;
  drawRotatedRect(ctx, 0, -height - 3, 8, 5, rotation);

  // Cupola highlight
  ctx.fillStyle = COLORS.train.cabooseHighlight;
  drawRotatedRect(ctx, 0, -height - 4, 6, 2, rotation);

  // Cupola window
  ctx.fillStyle = COLORS.train.window;
  drawRotatedRect(ctx, 0, -height - 2, 4, 2, rotation);

  // Side windows
  ctx.fillStyle = COLORS.train.window;
  const windowOffset = length / 2 - 5;
  drawRotatedRect(ctx, -windowOffset * dirX, -windowOffset * dirY - height / 2, 3, 3, rotation);
  drawRotatedRect(ctx, windowOffset * dirX, windowOffset * dirY - height / 2, 3, 3, rotation);

  // End railings
  ctx.fillStyle = COLORS.train.cabooseDark;
  const railOffset = length / 2 + 1;
  drawRotatedRect(ctx, -railOffset * dirX, -railOffset * dirY - height / 2, 2, height, rotation);
  drawRotatedRect(ctx, railOffset * dirX, railOffset * dirY - height / 2, 2, height, rotation);
}


/**
 * Draw smoke puffs from the train chimney
 */
export function drawSmoke(
  ctx: CanvasRenderingContext2D,
  position: TrainPosition,
  time: number
) {
  const { worldX, worldY, rotation } = position;

  // Train dimensions (must match drawTrain)
  const trainLength = 28;
  const bodyHeight = 10;

  // Calculate chimney position (at front of train)
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);
  const chimneyOffsetX = (-trainLength / 2 + 8) * dirX;
  const chimneyOffsetY = (-trainLength / 2 + 8) * dirY;

  const chimneyX = worldX + chimneyOffsetX;
  const chimneyY = worldY + chimneyOffsetY - bodyHeight - 6;

  // Draw smoke puffs
  for (let i = 0; i < 3; i++) {
    const puffAge = (time * 2 + i * 0.5) % 1.5;
    const puffSize = 3 + puffAge * 8;
    const puffY = chimneyY - puffAge * 20;
    const puffX = chimneyX + Math.sin(puffAge * 4) * 3;
    const alpha = Math.max(0, 0.6 - puffAge * 0.4);

    ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(puffX, puffY, puffSize, 0, Math.PI * 2);
    ctx.fill();
  }
}
