// Train rendering - cute wooden toy train aesthetic for isometric view

import { COLORS } from '../constants';
import type { TrainPosition } from '../logic/trainMovement';

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
 * Draw a simple carriage following the train
 */
export function drawCarriage(
  ctx: CanvasRenderingContext2D,
  position: TrainPosition,
  type: 'passenger' | 'cargo' = 'passenger'
) {
  const { worldX, worldY, rotation } = position;

  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.rotate(rotation);

  const carriageLength = 24;
  const carriageWidth = 12;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 4, carriageLength / 2, carriageWidth / 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Carriage body
  ctx.fillStyle = type === 'passenger' ? COLORS.train.carriage : '#8D6E63';
  roundRect(ctx, -carriageLength / 2, -carriageWidth / 2 - 4, carriageLength, carriageWidth, 3);
  ctx.fill();

  // Highlight
  ctx.fillStyle = type === 'passenger' ? COLORS.train.carriageHighlight : '#A1887F';
  roundRect(ctx, -carriageLength / 2 + 2, -carriageWidth / 2 - 2, carriageLength - 4, carriageWidth / 3, 2);
  ctx.fill();

  // Windows for passenger carriage
  if (type === 'passenger') {
    ctx.fillStyle = '#81D4FA';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-carriageLength / 2 + 4 + i * 7, -carriageWidth / 2 - 2, 4, 5);
    }
  }

  // Wheels
  ctx.fillStyle = COLORS.train.wheel;
  const wheelRadius = 3;
  const wheelY = carriageWidth / 2 - 1;

  ctx.beginPath();
  ctx.arc(-carriageLength / 2 + 5, wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-carriageLength / 2 + 5, -wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(carriageLength / 2 - 5, wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(carriageLength / 2 - 5, -wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper to draw rounded rectangles
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
