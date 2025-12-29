// Train rendering - cute wooden toy train aesthetic for isometric view

import type { TrainPosition } from '../logic/trainMovement';
import type { CarriageType } from '../types';

/**
 * Draw a 3D isometric box (like terrain tiles have)
 * This gives train parts actual visible depth
 */
function draw3DBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  depth: number,
  rotation: number,
  topColor: string,
  frontColor: string,
  sideColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Calculate direction vectors based on rotation
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);
  const perpX = -dirY;
  const perpY = dirX;

  // Half dimensions
  const hw = width / 2;
  const hh = height / 2;

  // Corner positions for top face
  const topCorners = [
    { x: -hw * dirX - hh * perpX, y: -hw * dirY - hh * perpY - depth },
    { x: hw * dirX - hh * perpX, y: hw * dirY - hh * perpY - depth },
    { x: hw * dirX + hh * perpX, y: hw * dirY + hh * perpY - depth },
    { x: -hw * dirX + hh * perpX, y: -hw * dirY + hh * perpY - depth },
  ];

  // Bottom corners (at y=0)
  const bottomCorners = [
    { x: -hw * dirX - hh * perpX, y: -hw * dirY - hh * perpY },
    { x: hw * dirX - hh * perpX, y: hw * dirY - hh * perpY },
    { x: hw * dirX + hh * perpX, y: hw * dirY + hh * perpY },
    { x: -hw * dirX + hh * perpX, y: -hw * dirY + hh * perpY },
  ];

  // Draw front face (bottom edge to top edge on the "front" side)
  const frontGradient = ctx.createLinearGradient(0, 0, 0, -depth);
  frontGradient.addColorStop(0, darkenHex(frontColor, 20));
  frontGradient.addColorStop(1, frontColor);
  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  ctx.moveTo(bottomCorners[2].x, bottomCorners[2].y);
  ctx.lineTo(bottomCorners[3].x, bottomCorners[3].y);
  ctx.lineTo(topCorners[3].x, topCorners[3].y);
  ctx.lineTo(topCorners[2].x, topCorners[2].y);
  ctx.closePath();
  ctx.fill();

  // Draw side face
  const sideGradient = ctx.createLinearGradient(0, 0, 0, -depth);
  sideGradient.addColorStop(0, darkenHex(sideColor, 25));
  sideGradient.addColorStop(1, sideColor);
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(bottomCorners[1].x, bottomCorners[1].y);
  ctx.lineTo(bottomCorners[2].x, bottomCorners[2].y);
  ctx.lineTo(topCorners[2].x, topCorners[2].y);
  ctx.lineTo(topCorners[1].x, topCorners[1].y);
  ctx.closePath();
  ctx.fill();

  // Draw top face with gradient
  const topGradient = ctx.createLinearGradient(
    topCorners[0].x, topCorners[0].y,
    topCorners[2].x, topCorners[2].y
  );
  topGradient.addColorStop(0, lightenHex(topColor, 15));
  topGradient.addColorStop(0.5, topColor);
  topGradient.addColorStop(1, darkenHex(topColor, 10));
  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(topCorners[0].x, topCorners[0].y);
  ctx.lineTo(topCorners[1].x, topCorners[1].y);
  ctx.lineTo(topCorners[2].x, topCorners[2].y);
  ctx.lineTo(topCorners[3].x, topCorners[3].y);
  ctx.closePath();
  ctx.fill();

  // Top face highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(topCorners[0].x, topCorners[0].y);
  ctx.lineTo(topCorners[1].x, topCorners[1].y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper to lighten a hex color
 */
function lightenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Helper to darken a hex color
 */
function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(2.55 * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Draw a 3D-style wheel with rim, hub, and visible thickness
 */
function drawWheel3D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number
) {
  // Wheel thickness (visible as a cylinder from the side)
  const thickness = 3;
  const perpX = -Math.sin(rotation);
  const perpY = Math.cos(rotation);

  // Draw wheel side (cylinder edge) - darker
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(x + perpX * thickness, y + perpY * thickness * 0.3, radius, radius * 0.6, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Outer rim shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1.5, radius + 1, radius * 0.6 + 0.5, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Main wheel face with gradient
  const wheelGradient = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, radius);
  wheelGradient.addColorStop(0, '#7D8B95');
  wheelGradient.addColorStop(0.4, '#546E7A');
  wheelGradient.addColorStop(0.8, '#37474F');
  wheelGradient.addColorStop(1, '#263238');

  ctx.fillStyle = wheelGradient;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.6, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Wheel rim ring
  ctx.strokeStyle = '#455A64';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 0.8, radius * 0.48, rotation, 0, Math.PI * 2);
  ctx.stroke();

  // Hub with gradient
  const hubGradient = ctx.createRadialGradient(x - 0.5, y - 0.5, 0, x, y, radius * 0.4);
  hubGradient.addColorStop(0, '#B0BEC5');
  hubGradient.addColorStop(0.5, '#78909C');
  hubGradient.addColorStop(1, '#546E7A');

  ctx.fillStyle = hubGradient;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 0.4, radius * 0.24, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.2, y - radius * 0.15, radius * 0.2, radius * 0.1, rotation, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw the train engine at a position
 * Now with proper 3D isometric boxes for visible depth
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
  const trainWidth = 12;
  const bodyDepth = 8; // Height of the 3D box
  const baseOffset = 4;

  // Calculate direction vector from rotation
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);
  const perpX = -dirY;
  const perpY = dirX;

  // Draw shadow
  const shadowGradient = ctx.createRadialGradient(0, baseOffset + 3, 0, 0, baseOffset + 3, trainLength / 2 + 2);
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(0, baseOffset + 3, trainLength / 2 + 4, 7, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Draw wheels (back wheels first, then front)
  const wheelRadius = 4;
  const wheelSpacingLength = trainLength / 2 - 7;
  const wheelSpacingWidth = 6;

  // Sort wheels by depth for proper layering
  const wheelPositions = [];
  for (const lengthMult of [-1, 1]) {
    for (const widthMult of [-1, 1]) {
      const wx = lengthMult * wheelSpacingLength * dirX + widthMult * wheelSpacingWidth * perpX;
      const wy = lengthMult * wheelSpacingLength * dirY + widthMult * wheelSpacingWidth * perpY + baseOffset;
      wheelPositions.push({ x: wx, y: wy, depth: wy });
    }
  }
  wheelPositions.sort((a, b) => a.depth - b.depth);
  for (const wheel of wheelPositions) {
    drawWheel3D(ctx, wheel.x, wheel.y, wheelRadius, rotation);
  }

  // Draw main body as 3D box
  draw3DBox(
    ctx,
    0, baseOffset - 2,
    trainLength, trainWidth, bodyDepth,
    rotation,
    '#E53935',  // Top - bright red
    '#C62828',  // Front - medium red
    '#B71C1C'   // Side - dark red
  );

  // Boiler (cylinder at front) - draw as 3D rounded shape
  const boilerOffsetX = (-trainLength / 4) * dirX;
  const boilerOffsetY = (-trainLength / 4) * dirY;

  // Boiler top (rounded)
  const boilerGradient = ctx.createLinearGradient(
    boilerOffsetX - 8, 0, boilerOffsetX + 8, 0
  );
  boilerGradient.addColorStop(0, '#EF5350');
  boilerGradient.addColorStop(0.3, '#F44336');
  boilerGradient.addColorStop(0.7, '#D32F2F');
  boilerGradient.addColorStop(1, '#C62828');
  ctx.fillStyle = boilerGradient;
  ctx.beginPath();
  ctx.ellipse(boilerOffsetX, boilerOffsetY + baseOffset - bodyDepth - 2, 10, 5, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Boiler highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(boilerOffsetX - 3, boilerOffsetY + baseOffset - bodyDepth - 3, 5, 2, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Cabin (back of train) - taller 3D box
  const cabinOffsetX = (trainLength / 2 - 6) * dirX;
  const cabinOffsetY = (trainLength / 2 - 6) * dirY;

  draw3DBox(
    ctx,
    cabinOffsetX, cabinOffsetY + baseOffset - 5,
    10, trainWidth, 12,
    rotation,
    '#C62828',  // Top
    '#B71C1C',  // Front
    '#8B0000'   // Side
  );

  // Cabin roof
  draw3DBox(
    ctx,
    cabinOffsetX, cabinOffsetY + baseOffset - 14,
    12, trainWidth + 2, 3,
    rotation,
    '#8B0000',  // Top
    '#6B0000',  // Front
    '#5B0000'   // Side
  );

  // Cabin windows (on both sides)
  for (const side of [-1, 1]) {
    const windowX = cabinOffsetX + side * 5 * perpX;
    const windowY = cabinOffsetY + side * 5 * perpY + baseOffset - 10;

    const windowGradient = ctx.createLinearGradient(windowX - 2, windowY - 2, windowX + 2, windowY + 2);
    windowGradient.addColorStop(0, '#E1F5FE');
    windowGradient.addColorStop(0.5, '#81D4FA');
    windowGradient.addColorStop(1, '#29B6F6');
    ctx.fillStyle = windowGradient;

    ctx.save();
    ctx.translate(windowX, windowY);
    ctx.rotate(rotation);
    ctx.fillRect(-3, -3, 6, 5);

    // Window glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(-2, -3, 2, 2);
    ctx.restore();
  }

  // Chimney (cylindrical 3D)
  const chimneyOffsetX = (-trainLength / 2 + 6) * dirX;
  const chimneyOffsetY = (-trainLength / 2 + 6) * dirY;
  const chimneyBaseY = baseOffset - bodyDepth - 2;

  // Chimney body (cylinder effect)
  const chimneyBodyGradient = ctx.createLinearGradient(
    chimneyOffsetX - 4, 0, chimneyOffsetX + 4, 0
  );
  chimneyBodyGradient.addColorStop(0, '#616161');
  chimneyBodyGradient.addColorStop(0.3, '#424242');
  chimneyBodyGradient.addColorStop(0.7, '#303030');
  chimneyBodyGradient.addColorStop(1, '#212121');
  ctx.fillStyle = chimneyBodyGradient;

  ctx.beginPath();
  ctx.moveTo(chimneyOffsetX - 3, chimneyOffsetY + chimneyBaseY);
  ctx.lineTo(chimneyOffsetX + 3, chimneyOffsetY + chimneyBaseY);
  ctx.lineTo(chimneyOffsetX + 4, chimneyOffsetY + chimneyBaseY - 10);
  ctx.lineTo(chimneyOffsetX - 4, chimneyOffsetY + chimneyBaseY - 10);
  ctx.closePath();
  ctx.fill();

  // Chimney top (flared)
  const chimneyTopGradient = ctx.createRadialGradient(
    chimneyOffsetX - 1, chimneyOffsetY + chimneyBaseY - 12, 0,
    chimneyOffsetX, chimneyOffsetY + chimneyBaseY - 11, 7
  );
  chimneyTopGradient.addColorStop(0, '#757575');
  chimneyTopGradient.addColorStop(0.5, '#424242');
  chimneyTopGradient.addColorStop(1, '#212121');
  ctx.fillStyle = chimneyTopGradient;
  ctx.beginPath();
  ctx.ellipse(chimneyOffsetX, chimneyOffsetY + chimneyBaseY - 11, 6, 3, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Chimney highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(chimneyOffsetX - 2, chimneyOffsetY + chimneyBaseY - 12, 2, 1, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Front bumper / cow catcher
  const bumperOffsetX = (-trainLength / 2 - 1) * dirX;
  const bumperOffsetY = (-trainLength / 2 - 1) * dirY;

  draw3DBox(
    ctx,
    bumperOffsetX, bumperOffsetY + baseOffset,
    4, 10, 4,
    rotation,
    '#8D6E63',
    '#6D4C41',
    '#5D4037'
  );

  ctx.restore();
}


/**
 * Draw a carriage following the train
 * Uses proper 3D boxes like the locomotive
 */
export function drawCarriage(
  ctx: CanvasRenderingContext2D,
  position: TrainPosition,
  type: Exclude<CarriageType, 'engine'> = 'passenger'
) {
  const { worldX, worldY, rotation } = position;

  ctx.save();
  ctx.translate(worldX, worldY);

  const carriageLength = 22;
  const carriageWidth = 10;
  const baseOffset = 4;

  // Calculate direction vector from rotation
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);
  const perpX = -dirY;
  const perpY = dirX;

  // Shadow
  const shadowGradient = ctx.createRadialGradient(0, baseOffset + 3, 0, 0, baseOffset + 3, carriageLength / 2 + 2);
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(0, baseOffset + 3, carriageLength / 2 + 4, 6, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Draw wheels
  const wheelRadius = 3;
  const wheelSpacingLength = carriageLength / 2 - 5;
  const wheelSpacingWidth = 5;

  const wheelPositions = [];
  for (const lengthMult of [-1, 1]) {
    for (const widthMult of [-1, 1]) {
      const wx = lengthMult * wheelSpacingLength * dirX + widthMult * wheelSpacingWidth * perpX;
      const wy = lengthMult * wheelSpacingLength * dirY + widthMult * wheelSpacingWidth * perpY + baseOffset;
      wheelPositions.push({ x: wx, y: wy, depth: wy });
    }
  }
  wheelPositions.sort((a, b) => a.depth - b.depth);
  for (const wheel of wheelPositions) {
    drawWheel3D(ctx, wheel.x, wheel.y, wheelRadius, rotation);
  }

  // Draw type-specific carriage body
  switch (type) {
    case 'passenger':
      drawPassengerCarriage3D(ctx, carriageLength, carriageWidth, baseOffset, rotation, perpX, perpY);
      break;
    case 'cargo':
      drawCargoCarriage3D(ctx, carriageLength, carriageWidth, baseOffset, rotation);
      break;
    case 'tanker':
      drawTankerCarriage3D(ctx, carriageLength, carriageWidth, baseOffset, rotation);
      break;
    case 'coal':
      drawCoalCarriage3D(ctx, carriageLength, carriageWidth, baseOffset, rotation);
      break;
    case 'caboose':
      drawCabooseCarriage3D(ctx, carriageLength, carriageWidth, baseOffset, rotation, perpX, perpY);
      break;
  }

  ctx.restore();
}

/**
 * Passenger carriage - blue with windows (3D isometric)
 */
function drawPassengerCarriage3D(
  ctx: CanvasRenderingContext2D,
  length: number,
  width: number,
  baseOffset: number,
  rotation: number,
  perpX: number,
  perpY: number
) {
  const bodyDepth = 7;

  // Main body as 3D box
  draw3DBox(
    ctx,
    0, baseOffset - 1,
    length, width, bodyDepth,
    rotation,
    '#42A5F5',  // Top - bright blue
    '#1E88E5',  // Front - medium blue
    '#1565C0'   // Side - dark blue
  );

  // Roof (slightly wider)
  draw3DBox(
    ctx,
    0, baseOffset - bodyDepth - 1,
    length + 1, width + 1, 2,
    rotation,
    '#1565C0',
    '#0D47A1',
    '#0D47A1'
  );

  // Windows on both sides
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const dirX = Math.cos(rotation);
      const dirY = Math.sin(rotation);
      const windowX = i * 6 * dirX + side * (width / 2 + 0.5) * perpX;
      const windowY = i * 6 * dirY + side * (width / 2 + 0.5) * perpY + baseOffset - bodyDepth / 2 - 1;

      const windowGradient = ctx.createLinearGradient(windowX - 2, windowY - 2, windowX + 2, windowY + 2);
      windowGradient.addColorStop(0, '#E1F5FE');
      windowGradient.addColorStop(0.5, '#81D4FA');
      windowGradient.addColorStop(1, '#29B6F6');
      ctx.fillStyle = windowGradient;

      ctx.save();
      ctx.translate(windowX, windowY);
      ctx.rotate(rotation);
      ctx.fillRect(-2, -2, 4, 3);

      // Window glare
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(-1.5, -2, 1, 1.5);
      ctx.restore();
    }
  }
}


/**
 * Cargo carriage - brown box car (3D isometric)
 */
function drawCargoCarriage3D(
  ctx: CanvasRenderingContext2D,
  length: number,
  width: number,
  baseOffset: number,
  rotation: number
) {
  const bodyDepth = 8;

  // Main body as 3D box
  draw3DBox(
    ctx,
    0, baseOffset - 1,
    length, width, bodyDepth,
    rotation,
    '#8D6E63',  // Top - light brown
    '#6D4C41',  // Front - medium brown
    '#5D4037'   // Side - dark brown
  );

  // Sliding door detail (recessed panel)
  ctx.save();
  ctx.translate(0, baseOffset - bodyDepth / 2);
  ctx.rotate(rotation);

  // Door frame shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(-5, -2, 10, 5);

  // Door panel
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-4, -1.5, 8, 4);

  // Door handle
  ctx.fillStyle = '#90A4AE';
  ctx.fillRect(2, 0, 1.5, 1.5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(2.2, 0.2, 0.6, 0.6);

  ctx.restore();
}


/**
 * Tanker carriage - cylindrical silver tank (3D isometric)
 */
function drawTankerCarriage3D(
  ctx: CanvasRenderingContext2D,
  length: number,
  width: number,
  baseOffset: number,
  rotation: number
) {
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);

  // Undercarriage / frame
  draw3DBox(
    ctx,
    0, baseOffset,
    length - 2, width - 2, 3,
    rotation,
    '#455A64',
    '#37474F',
    '#263238'
  );

  // Tank cylinder - draw as ellipse with 3D shading
  const tankHeight = 6;
  const tankY = baseOffset - 4;

  // Tank body (cylinder approximation with gradient)
  const tankGradient = ctx.createLinearGradient(0, tankY - tankHeight, 0, tankY + 2);
  tankGradient.addColorStop(0, '#B0BEC5');
  tankGradient.addColorStop(0.2, '#90A4AE');
  tankGradient.addColorStop(0.5, '#78909C');
  tankGradient.addColorStop(0.8, '#546E7A');
  tankGradient.addColorStop(1, '#455A64');
  ctx.fillStyle = tankGradient;
  ctx.beginPath();
  ctx.ellipse(0, tankY - tankHeight / 2, length / 2 - 1, tankHeight, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Tank specular highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(-2, tankY - tankHeight + 1, length / 3, tankHeight / 3, rotation, 0, Math.PI * 2);
  ctx.fill();

  // End caps (visible as circles at ends)
  for (const mult of [-1, 1]) {
    const capX = mult * (length / 2 - 2) * dirX;
    const capY = mult * (length / 2 - 2) * dirY + tankY - tankHeight / 2;

    const capGradient = ctx.createRadialGradient(capX - 1, capY - 1, 0, capX, capY, 4);
    capGradient.addColorStop(0, '#90A4AE');
    capGradient.addColorStop(0.5, '#78909C');
    capGradient.addColorStop(1, '#455A64');
    ctx.fillStyle = capGradient;
    ctx.beginPath();
    ctx.ellipse(capX, capY, 4, 5, rotation, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top hatch
  const hatchGradient = ctx.createRadialGradient(-0.5, tankY - tankHeight - 1, 0, 0, tankY - tankHeight, 3);
  hatchGradient.addColorStop(0, '#CFD8DC');
  hatchGradient.addColorStop(0.5, '#90A4AE');
  hatchGradient.addColorStop(1, '#607D8B');
  ctx.fillStyle = hatchGradient;
  ctx.beginPath();
  ctx.arc(0, tankY - tankHeight, 3, 0, Math.PI * 2);
  ctx.fill();

  // Hatch highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(-1, tankY - tankHeight - 1, 1, 0, Math.PI * 2);
  ctx.fill();

  // Support bands
  ctx.strokeStyle = '#455A64';
  ctx.lineWidth = 1.5;
  for (const offset of [-length / 4, 0, length / 4]) {
    const bandX = offset * dirX;
    const bandY = offset * dirY + tankY - tankHeight / 2;
    ctx.beginPath();
    ctx.ellipse(bandX, bandY, 2, tankHeight * 0.8, rotation, 0, Math.PI * 2);
    ctx.stroke();
  }
}


/**
 * Coal carriage - open-top hopper (3D isometric)
 */
function drawCoalCarriage3D(
  ctx: CanvasRenderingContext2D,
  length: number,
  width: number,
  baseOffset: number,
  rotation: number
) {
  const bodyDepth = 6;
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);

  // Hopper body as 3D box (open top)
  draw3DBox(
    ctx,
    0, baseOffset - 1,
    length, width, bodyDepth,
    rotation,
    '#616161',  // Top - gray
    '#424242',  // Front
    '#303030'   // Side
  );

  // Inner coal area (dark recess) - drawn on top face
  ctx.save();
  ctx.translate(0, baseOffset - bodyDepth - 1);
  ctx.rotate(rotation);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(-(length - 4) / 2, -(width - 4) / 2, length - 4, width - 4);
  ctx.restore();

  // Coal pile with 3D effect
  const coalGradient = ctx.createRadialGradient(
    -2, baseOffset - bodyDepth - 3, 0,
    0, baseOffset - bodyDepth - 2, 8
  );
  coalGradient.addColorStop(0, '#3a3a3a');
  coalGradient.addColorStop(0.5, '#1a1a1a');
  coalGradient.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = coalGradient;

  // Irregular coal pile shape
  ctx.beginPath();
  const pileY = baseOffset - bodyDepth - 1;
  ctx.moveTo(-length / 2 + 3, pileY);
  ctx.lineTo(-length / 2 + 4, pileY - 3);
  ctx.quadraticCurveTo(-length / 4, pileY - 5, 0, pileY - 4);
  ctx.quadraticCurveTo(length / 4, pileY - 6, length / 2 - 4, pileY - 3);
  ctx.lineTo(length / 2 - 3, pileY);
  ctx.closePath();
  ctx.fill();

  // Coal chunks on top
  ctx.fillStyle = '#2a2a2a';
  const chunks = [
    { x: -4 * dirX, y: -4 * dirY + pileY - 3 },
    { x: 2 * dirX, y: 2 * dirY + pileY - 4 },
    { x: -1 * dirX, y: -1 * dirY + pileY - 2 },
    { x: 5 * dirX, y: 5 * dirY + pileY - 2 },
  ];
  for (const chunk of chunks) {
    ctx.beginPath();
    ctx.arc(chunk.x, chunk.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Metal rim around top edge
  ctx.strokeStyle = '#757575';
  ctx.lineWidth = 2;
  ctx.save();
  ctx.translate(0, baseOffset - bodyDepth - 1);
  ctx.rotate(rotation);
  ctx.strokeRect(-length / 2, -width / 2, length, width);

  // Rim highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-length / 2, -width / 2);
  ctx.lineTo(length / 2, -width / 2);
  ctx.stroke();
  ctx.restore();
}


/**
 * Caboose carriage - darker red with cupola (3D isometric)
 */
function drawCabooseCarriage3D(
  ctx: CanvasRenderingContext2D,
  length: number,
  width: number,
  baseOffset: number,
  rotation: number,
  perpX: number,
  perpY: number
) {
  const bodyDepth = 7;
  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);

  // Main body as 3D box
  draw3DBox(
    ctx,
    0, baseOffset - 1,
    length, width, bodyDepth,
    rotation,
    '#E53935',  // Top - bright red
    '#D32F2F',  // Front
    '#C62828'   // Side
  );

  // Roof
  draw3DBox(
    ctx,
    0, baseOffset - bodyDepth - 1,
    length + 1, width + 1, 2,
    rotation,
    '#B71C1C',
    '#8B0000',
    '#7B0000'
  );

  // Cupola (raised observation box on roof)
  draw3DBox(
    ctx,
    0, baseOffset - bodyDepth - 4,
    8, 6, 4,
    rotation,
    '#D32F2F',
    '#C62828',
    '#B71C1C'
  );

  // Cupola roof
  draw3DBox(
    ctx,
    0, baseOffset - bodyDepth - 6,
    10, 8, 2,
    rotation,
    '#8B0000',
    '#7B0000',
    '#6B0000'
  );

  // Cupola windows (all sides)
  for (const side of [-1, 1]) {
    const windowX = side * 3 * perpX;
    const windowY = side * 3 * perpY + baseOffset - bodyDepth - 4;

    const windowGradient = ctx.createLinearGradient(windowX - 1, windowY - 1, windowX + 1, windowY + 1);
    windowGradient.addColorStop(0, '#E1F5FE');
    windowGradient.addColorStop(1, '#29B6F6');
    ctx.fillStyle = windowGradient;

    ctx.save();
    ctx.translate(windowX, windowY);
    ctx.rotate(rotation);
    ctx.fillRect(-2, -1.5, 4, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(-1.5, -1.5, 1, 1);
    ctx.restore();
  }

  // Side windows on main body
  for (const side of [-1, 1]) {
    for (const pos of [-1, 1]) {
      const windowX = pos * (length / 3) * dirX + side * (width / 2 + 0.5) * perpX;
      const windowY = pos * (length / 3) * dirY + side * (width / 2 + 0.5) * perpY + baseOffset - bodyDepth / 2 - 1;

      const windowGradient = ctx.createLinearGradient(windowX - 1, windowY - 1, windowX + 1, windowY + 1);
      windowGradient.addColorStop(0, '#E1F5FE');
      windowGradient.addColorStop(1, '#29B6F6');
      ctx.fillStyle = windowGradient;

      ctx.save();
      ctx.translate(windowX, windowY);
      ctx.rotate(rotation);
      ctx.fillRect(-2, -2, 4, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(-1.5, -2, 1, 1.5);
      ctx.restore();
    }
  }

  // End platforms/railings
  for (const end of [-1, 1]) {
    const platformX = end * (length / 2 + 2) * dirX;
    const platformY = end * (length / 2 + 2) * dirY;

    draw3DBox(
      ctx,
      platformX, platformY + baseOffset,
      3, width - 2, 2,
      rotation,
      '#8D6E63',
      '#6D4C41',
      '#5D4037'
    );

    // Railing posts
    for (const side of [-1, 1]) {
      const postX = platformX + side * (width / 2 - 2) * perpX;
      const postY = platformY + side * (width / 2 - 2) * perpY + baseOffset - 4;

      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.moveTo(postX, postY + 4);
      ctx.lineTo(postX, postY);
      ctx.lineTo(postX + 1, postY);
      ctx.lineTo(postX + 1, postY + 4);
      ctx.closePath();
      ctx.fill();
    }
  }
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

/**
 * Draw a 3D evil wheel with glowing red center
 */
function drawEvilWheel3D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number
) {
  const thickness = 3;
  const perpX = -Math.sin(rotation);
  const perpY = Math.cos(rotation);

  // Wheel side (cylinder edge) - pure black
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.ellipse(x + perpX * thickness, y + perpY * thickness * 0.3, radius, radius * 0.6, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, radius + 1, radius * 0.6 + 0.5, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Main wheel - dark with subtle purple tint
  const wheelGradient = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, radius);
  wheelGradient.addColorStop(0, '#2a1a2a');
  wheelGradient.addColorStop(0.5, '#1a0a1a');
  wheelGradient.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = wheelGradient;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.6, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Evil red glowing hub
  const hubGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.5);
  hubGradient.addColorStop(0, '#ff3333');
  hubGradient.addColorStop(0.5, '#aa0000');
  hubGradient.addColorStop(1, '#550000');
  ctx.fillStyle = hubGradient;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 0.45, radius * 0.27, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Red glow effect
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 0.7, radius * 0.42, rotation, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a 3D evil box (dark with purple/red accents)
 */
function draw3DEvilBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  depth: number,
  rotation: number,
  hasGlow: boolean = false
) {
  ctx.save();
  ctx.translate(cx, cy);

  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);
  const perpX = -dirY;
  const perpY = dirX;

  const hw = width / 2;
  const hh = height / 2;

  // Corner positions for top face
  const topCorners = [
    { x: -hw * dirX - hh * perpX, y: -hw * dirY - hh * perpY - depth },
    { x: hw * dirX - hh * perpX, y: hw * dirY - hh * perpY - depth },
    { x: hw * dirX + hh * perpX, y: hw * dirY + hh * perpY - depth },
    { x: -hw * dirX + hh * perpX, y: -hw * dirY + hh * perpY - depth },
  ];

  const bottomCorners = [
    { x: -hw * dirX - hh * perpX, y: -hw * dirY - hh * perpY },
    { x: hw * dirX - hh * perpX, y: hw * dirY - hh * perpY },
    { x: hw * dirX + hh * perpX, y: hw * dirY + hh * perpY },
    { x: -hw * dirX + hh * perpX, y: -hw * dirY + hh * perpY },
  ];

  // Front face - dark with purple tint
  const frontGradient = ctx.createLinearGradient(0, 0, 0, -depth);
  frontGradient.addColorStop(0, '#0a0510');
  frontGradient.addColorStop(1, '#1a0a20');
  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  ctx.moveTo(bottomCorners[2].x, bottomCorners[2].y);
  ctx.lineTo(bottomCorners[3].x, bottomCorners[3].y);
  ctx.lineTo(topCorners[3].x, topCorners[3].y);
  ctx.lineTo(topCorners[2].x, topCorners[2].y);
  ctx.closePath();
  ctx.fill();

  // Side face - darker
  const sideGradient = ctx.createLinearGradient(0, 0, 0, -depth);
  sideGradient.addColorStop(0, '#050308');
  sideGradient.addColorStop(1, '#100515');
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(bottomCorners[1].x, bottomCorners[1].y);
  ctx.lineTo(bottomCorners[2].x, bottomCorners[2].y);
  ctx.lineTo(topCorners[2].x, topCorners[2].y);
  ctx.lineTo(topCorners[1].x, topCorners[1].y);
  ctx.closePath();
  ctx.fill();

  // Top face - darkest with subtle purple
  const topGradient = ctx.createLinearGradient(
    topCorners[0].x, topCorners[0].y,
    topCorners[2].x, topCorners[2].y
  );
  topGradient.addColorStop(0, '#201025');
  topGradient.addColorStop(0.5, '#150a1a');
  topGradient.addColorStop(1, '#0a050f');
  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(topCorners[0].x, topCorners[0].y);
  ctx.lineTo(topCorners[1].x, topCorners[1].y);
  ctx.lineTo(topCorners[2].x, topCorners[2].y);
  ctx.lineTo(topCorners[3].x, topCorners[3].y);
  ctx.closePath();
  ctx.fill();

  // Evil purple edge highlight
  ctx.strokeStyle = 'rgba(100, 0, 150, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(topCorners[0].x, topCorners[0].y);
  ctx.lineTo(topCorners[1].x, topCorners[1].y);
  ctx.stroke();

  // Optional red glow underneath
  if (hasGlow) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 3, width / 2, height / 3, rotation, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw the evil train engine (dark variant for danger mode)
 * Now with proper 3D isometric boxes
 */
export function drawEvilTrain(
  ctx: CanvasRenderingContext2D,
  position: TrainPosition
) {
  const { worldX, worldY, rotation } = position;

  ctx.save();
  ctx.translate(worldX, worldY);

  const trainLength = 28;
  const trainWidth = 12;
  const bodyDepth = 8;
  const baseOffset = 4;

  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);
  const perpX = -dirY;
  const perpY = dirX;

  // Dark ominous shadow with red tint
  const shadowGradient = ctx.createRadialGradient(0, baseOffset + 3, 0, 0, baseOffset + 3, trainLength / 2 + 4);
  shadowGradient.addColorStop(0, 'rgba(50, 0, 0, 0.5)');
  shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(0, baseOffset + 3, trainLength / 2 + 6, 8, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Draw evil wheels
  const wheelRadius = 4;
  const wheelSpacingLength = trainLength / 2 - 7;
  const wheelSpacingWidth = 6;

  const wheelPositions = [];
  for (const lengthMult of [-1, 1]) {
    for (const widthMult of [-1, 1]) {
      const wx = lengthMult * wheelSpacingLength * dirX + widthMult * wheelSpacingWidth * perpX;
      const wy = lengthMult * wheelSpacingLength * dirY + widthMult * wheelSpacingWidth * perpY + baseOffset;
      wheelPositions.push({ x: wx, y: wy, depth: wy });
    }
  }
  wheelPositions.sort((a, b) => a.depth - b.depth);
  for (const wheel of wheelPositions) {
    drawEvilWheel3D(ctx, wheel.x, wheel.y, wheelRadius, rotation);
  }

  // Main body as evil 3D box
  draw3DEvilBox(ctx, 0, baseOffset - 2, trainLength, trainWidth, bodyDepth, rotation, true);

  // Evil boiler (front cylinder with dark metal look)
  const boilerOffsetX = (-trainLength / 4) * dirX;
  const boilerOffsetY = (-trainLength / 4) * dirY;

  const boilerGradient = ctx.createLinearGradient(
    boilerOffsetX - 8, 0, boilerOffsetX + 8, 0
  );
  boilerGradient.addColorStop(0, '#1a0a1a');
  boilerGradient.addColorStop(0.3, '#100510');
  boilerGradient.addColorStop(0.7, '#0a0308');
  boilerGradient.addColorStop(1, '#050205');
  ctx.fillStyle = boilerGradient;
  ctx.beginPath();
  ctx.ellipse(boilerOffsetX, boilerOffsetY + baseOffset - bodyDepth - 2, 10, 5, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Boiler evil glow
  ctx.fillStyle = 'rgba(150, 0, 50, 0.2)';
  ctx.beginPath();
  ctx.ellipse(boilerOffsetX, boilerOffsetY + baseOffset - bodyDepth - 2, 12, 6, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Evil cabin
  const cabinOffsetX = (trainLength / 2 - 6) * dirX;
  const cabinOffsetY = (trainLength / 2 - 6) * dirY;

  draw3DEvilBox(ctx, cabinOffsetX, cabinOffsetY + baseOffset - 5, 10, trainWidth, 12, rotation);

  // Evil cabin roof
  draw3DEvilBox(ctx, cabinOffsetX, cabinOffsetY + baseOffset - 14, 12, trainWidth + 2, 3, rotation);

  // Glowing red windows
  for (const side of [-1, 1]) {
    const windowX = cabinOffsetX + side * 5 * perpX;
    const windowY = cabinOffsetY + side * 5 * perpY + baseOffset - 10;

    // Window glow
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(windowX, windowY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Window
    const windowGradient = ctx.createRadialGradient(windowX, windowY, 0, windowX, windowY, 4);
    windowGradient.addColorStop(0, '#ff3333');
    windowGradient.addColorStop(0.5, '#cc0000');
    windowGradient.addColorStop(1, '#660000');
    ctx.fillStyle = windowGradient;

    ctx.save();
    ctx.translate(windowX, windowY);
    ctx.rotate(rotation);
    ctx.fillRect(-3, -3, 6, 5);
    ctx.restore();
  }

  // Evil chimney with ember glow
  const chimneyOffsetX = (-trainLength / 2 + 6) * dirX;
  const chimneyOffsetY = (-trainLength / 2 + 6) * dirY;
  const chimneyBaseY = baseOffset - bodyDepth - 2;

  // Chimney body
  const chimneyGradient = ctx.createLinearGradient(
    chimneyOffsetX - 4, 0, chimneyOffsetX + 4, 0
  );
  chimneyGradient.addColorStop(0, '#1a0a0a');
  chimneyGradient.addColorStop(0.5, '#0a0505');
  chimneyGradient.addColorStop(1, '#050303');
  ctx.fillStyle = chimneyGradient;
  ctx.beginPath();
  ctx.moveTo(chimneyOffsetX - 3, chimneyOffsetY + chimneyBaseY);
  ctx.lineTo(chimneyOffsetX + 3, chimneyOffsetY + chimneyBaseY);
  ctx.lineTo(chimneyOffsetX + 4, chimneyOffsetY + chimneyBaseY - 10);
  ctx.lineTo(chimneyOffsetX - 4, chimneyOffsetY + chimneyBaseY - 10);
  ctx.closePath();
  ctx.fill();

  // Chimney top with ember glow
  ctx.fillStyle = 'rgba(255, 50, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(chimneyOffsetX, chimneyOffsetY + chimneyBaseY - 11, 8, 4, rotation, 0, Math.PI * 2);
  ctx.fill();

  const chimneyTopGradient = ctx.createRadialGradient(
    chimneyOffsetX, chimneyOffsetY + chimneyBaseY - 11, 0,
    chimneyOffsetX, chimneyOffsetY + chimneyBaseY - 11, 6
  );
  chimneyTopGradient.addColorStop(0, '#331111');
  chimneyTopGradient.addColorStop(0.5, '#1a0a0a');
  chimneyTopGradient.addColorStop(1, '#0a0505');
  ctx.fillStyle = chimneyTopGradient;
  ctx.beginPath();
  ctx.ellipse(chimneyOffsetX, chimneyOffsetY + chimneyBaseY - 11, 6, 3, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Menacing front bumper with spikes
  const bumperOffsetX = (-trainLength / 2 - 1) * dirX;
  const bumperOffsetY = (-trainLength / 2 - 1) * dirY;

  draw3DEvilBox(ctx, bumperOffsetX, bumperOffsetY + baseOffset, 4, 10, 4, rotation);

  // Spikes on bumper
  ctx.fillStyle = '#1a0a0a';
  for (const spikePos of [-3, 0, 3]) {
    const spikeBaseX = bumperOffsetX + spikePos * perpX - 3 * dirX;
    const spikeBaseY = bumperOffsetY + spikePos * perpY - 3 * dirY + baseOffset - 2;

    ctx.beginPath();
    ctx.moveTo(spikeBaseX - 1.5 * perpX, spikeBaseY - 1.5 * perpY);
    ctx.lineTo(spikeBaseX - 6 * dirX, spikeBaseY - 6 * dirY);
    ctx.lineTo(spikeBaseX + 1.5 * perpX, spikeBaseY + 1.5 * perpY);
    ctx.closePath();
    ctx.fill();
  }

  // Spike tips glow
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  for (const spikePos of [-3, 0, 3]) {
    const tipX = bumperOffsetX + spikePos * perpX - 9 * dirX;
    const tipY = bumperOffsetY + spikePos * perpY - 9 * dirY + baseOffset - 2;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw evil smoke (dark with red tint)
 */
export function drawEvilSmoke(
  ctx: CanvasRenderingContext2D,
  position: TrainPosition,
  time: number
) {
  const { worldX, worldY, rotation } = position;

  const trainLength = 28;
  const bodyHeight = 10;

  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);
  const chimneyOffsetX = (-trainLength / 2 + 8) * dirX;
  const chimneyOffsetY = (-trainLength / 2 + 8) * dirY;

  const chimneyX = worldX + chimneyOffsetX;
  const chimneyY = worldY + chimneyOffsetY - bodyHeight - 6;

  // Draw dark smoke puffs with red tint
  for (let i = 0; i < 3; i++) {
    const puffAge = (time * 2 + i * 0.5) % 1.5;
    const puffSize = 3 + puffAge * 8;
    const puffY = chimneyY - puffAge * 20;
    const puffX = chimneyX + Math.sin(puffAge * 4) * 3;
    const alpha = Math.max(0, 0.6 - puffAge * 0.4);

    // Dark smoke with red tint
    ctx.fillStyle = `rgba(50, 20, 20, ${alpha})`;
    ctx.beginPath();
    ctx.arc(puffX, puffY, puffSize, 0, Math.PI * 2);
    ctx.fill();

    // Add ember particles
    if (puffAge < 0.5) {
      ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(puffX + Math.random() * 4 - 2, puffY + Math.random() * 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw evil carriage (dark variant) - now with proper 3D
 */
export function drawEvilCarriage(
  ctx: CanvasRenderingContext2D,
  position: TrainPosition,
  type: Exclude<CarriageType, 'engine'> = 'passenger'
) {
  const { worldX, worldY, rotation } = position;

  ctx.save();
  ctx.translate(worldX, worldY);

  const carriageLength = 22;
  const carriageWidth = 10;
  const bodyDepth = 7;
  const baseOffset = 4;

  const dirX = Math.cos(rotation);
  const dirY = Math.sin(rotation);
  const perpX = -dirY;
  const perpY = dirX;

  // Dark shadow with red tint
  const shadowGradient = ctx.createRadialGradient(0, baseOffset + 3, 0, 0, baseOffset + 3, carriageLength / 2 + 2);
  shadowGradient.addColorStop(0, 'rgba(30, 0, 0, 0.4)');
  shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(0, baseOffset + 3, carriageLength / 2 + 4, 6, rotation, 0, Math.PI * 2);
  ctx.fill();

  // Evil wheels
  const wheelRadius = 3;
  const wheelSpacingLength = carriageLength / 2 - 5;
  const wheelSpacingWidth = 5;

  const wheelPositions = [];
  for (const lengthMult of [-1, 1]) {
    for (const widthMult of [-1, 1]) {
      const wx = lengthMult * wheelSpacingLength * dirX + widthMult * wheelSpacingWidth * perpX;
      const wy = lengthMult * wheelSpacingLength * dirY + widthMult * wheelSpacingWidth * perpY + baseOffset;
      wheelPositions.push({ x: wx, y: wy, depth: wy });
    }
  }
  wheelPositions.sort((a, b) => a.depth - b.depth);
  for (const wheel of wheelPositions) {
    drawEvilWheel3D(ctx, wheel.x, wheel.y, wheelRadius, rotation);
  }

  // Main body as evil 3D box
  draw3DEvilBox(ctx, 0, baseOffset - 1, carriageLength, carriageWidth, bodyDepth, rotation, true);

  // Type-specific details
  if (type === 'passenger' || type === 'caboose') {
    // Evil roof
    draw3DEvilBox(ctx, 0, baseOffset - bodyDepth - 1, carriageLength + 1, carriageWidth + 1, 2, rotation);

    // Glowing red windows on both sides
    for (const side of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        const windowX = i * 6 * dirX + side * (carriageWidth / 2 + 0.5) * perpX;
        const windowY = i * 6 * dirY + side * (carriageWidth / 2 + 0.5) * perpY + baseOffset - bodyDepth / 2 - 1;

        // Window glow
        ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(windowX, windowY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Window
        const windowGradient = ctx.createRadialGradient(windowX, windowY, 0, windowX, windowY, 3);
        windowGradient.addColorStop(0, '#ff2222');
        windowGradient.addColorStop(0.6, '#aa0000');
        windowGradient.addColorStop(1, '#550000');
        ctx.fillStyle = windowGradient;

        ctx.save();
        ctx.translate(windowX, windowY);
        ctx.rotate(rotation);
        ctx.fillRect(-2, -2, 4, 3);
        ctx.restore();
      }
    }

    // Caboose cupola
    if (type === 'caboose') {
      draw3DEvilBox(ctx, 0, baseOffset - bodyDepth - 4, 8, 6, 4, rotation);

      // Cupola glowing window
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(0, baseOffset - bodyDepth - 4, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cupola window center
      const windowX = 0;
      const windowY = baseOffset - bodyDepth - 4;

      ctx.save();
      ctx.translate(windowX, windowY);
      ctx.rotate(rotation);

      // Create gradient relative to translated origin
      const cupolaWindowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 3);
      cupolaWindowGradient.addColorStop(0, '#ff3333');
      cupolaWindowGradient.addColorStop(1, '#660000');
      ctx.fillStyle = cupolaWindowGradient;

      // Draw window centered at origin
      ctx.fillRect(-2, -1.5, 4, 3);
      ctx.restore();
    }
  } else if (type === 'tanker') {
    // Evil tanker - dark cylinder
    const tankY = baseOffset - 4;
    const tankHeight = 6;

    const tankGradient = ctx.createLinearGradient(0, tankY - tankHeight, 0, tankY + 2);
    tankGradient.addColorStop(0, '#2a1a2a');
    tankGradient.addColorStop(0.5, '#150a15');
    tankGradient.addColorStop(1, '#0a050a');
    ctx.fillStyle = tankGradient;
    ctx.beginPath();
    ctx.ellipse(0, tankY - tankHeight / 2, carriageLength / 2 - 1, tankHeight, rotation, 0, Math.PI * 2);
    ctx.fill();

    // Purple sheen
    ctx.fillStyle = 'rgba(100, 0, 100, 0.2)';
    ctx.beginPath();
    ctx.ellipse(-2, tankY - tankHeight + 1, carriageLength / 3, tankHeight / 3, rotation, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'cargo') {
    // Dark cargo door
    ctx.save();
    ctx.translate(0, baseOffset - bodyDepth / 2);
    ctx.rotate(rotation);
    ctx.fillStyle = '#0a0508';
    ctx.fillRect(-4, -1.5, 8, 4);
    ctx.restore();
  } else if (type === 'coal') {
    // Dark coal pile with ember glow
    ctx.fillStyle = '#050505';
    const pileY = baseOffset - bodyDepth - 1;
    ctx.beginPath();
    ctx.moveTo(-carriageLength / 2 + 3, pileY);
    ctx.quadraticCurveTo(0, pileY - 5, carriageLength / 2 - 3, pileY);
    ctx.closePath();
    ctx.fill();

    // Ember glow spots
    ctx.fillStyle = 'rgba(255, 50, 0, 0.4)';
    for (const ember of [{x: -3, y: pileY - 3}, {x: 2, y: pileY - 2}, {x: -1, y: pileY - 4}]) {
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
