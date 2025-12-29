// Track type definitions and metadata

import type { TrackDefinition, CardinalDirection } from '../types';

// Track definitions with connection paths
// Each path array represents connected directions (e.g., ['N', 'S'] = through connection)
export const TRACK_DEFINITIONS: Record<string, TrackDefinition> = {
  straight: {
    type: 'straight',
    name: 'Straight',
    description: 'A straight track section',
    baseConnections: [['N', 'S']], // Through connection N<->S
    canElevate: true,
  },
  curve_90: {
    type: 'curve_90',
    name: 'Curve',
    description: 'A 90-degree curved track',
    baseConnections: [['N', 'E']], // Through connection N<->E
    canElevate: true,
  },
  switch_left: {
    type: 'switch_left',
    name: 'Switch (Left)',
    description: 'A track switch that can divert left',
    baseConnections: [
      ['S', 'N'], // Main path
      ['S', 'W'], // Divert path
    ],
    canElevate: false,
  },
  switch_right: {
    type: 'switch_right',
    name: 'Switch (Right)',
    description: 'A track switch that can divert right',
    baseConnections: [
      ['S', 'N'], // Main path
      ['S', 'E'], // Divert path
    ],
    canElevate: false,
  },
  crossing: {
    type: 'crossing',
    name: 'Crossing',
    description: 'Two tracks crossing each other',
    baseConnections: [
      ['N', 'S'], // Vertical path
      ['E', 'W'], // Horizontal path
    ],
    canElevate: false,
  },
  slope_up: {
    type: 'slope_up',
    name: 'Slope Up',
    description: 'Track going up one elevation level',
    baseConnections: [['N', 'S']],
    canElevate: true,
    elevationChange: 1,
  },
  slope_down: {
    type: 'slope_down',
    name: 'Slope Down',
    description: 'Track going down one elevation level',
    baseConnections: [['N', 'S']],
    canElevate: true,
    elevationChange: -1,
  },
  bridge: {
    type: 'bridge',
    name: 'Bridge',
    description: 'Elevated bridge section',
    baseConnections: [['N', 'S']],
    canElevate: true,
  },
  tunnel_entrance: {
    type: 'tunnel_entrance',
    name: 'Tunnel',
    description: 'Tunnel entrance through a hill',
    baseConnections: [['N', 'S']],
    canElevate: false,
  },
  station: {
    type: 'station',
    name: 'Station',
    description: 'Train station platform',
    baseConnections: [['N', 'S']],
    canElevate: false,
  },
  signal: {
    type: 'signal',
    name: 'Signal',
    description: 'Track signal light',
    baseConnections: [['N', 'S']],
    canElevate: true,
  },
};

// Get all unique directions a track type can connect to
export function getTrackDirections(
  trackType: string,
  rotation: number
): CardinalDirection[] {
  const def = TRACK_DEFINITIONS[trackType];
  if (!def) return [];

  const directions = new Set<CardinalDirection>();
  const allDirections: CardinalDirection[] = ['N', 'E', 'S', 'W'];

  for (const path of def.baseConnections) {
    for (const dir of path) {
      // Apply rotation
      const dirIndex = allDirections.indexOf(dir as CardinalDirection);
      const rotatedIndex = (dirIndex + rotation / 90) % 4;
      directions.add(allDirections[rotatedIndex]);
    }
  }

  return Array.from(directions);
}
