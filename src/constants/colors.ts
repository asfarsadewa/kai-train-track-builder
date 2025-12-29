// Color palette for the toy wooden train aesthetic

export const COLORS = {
  // Terrain colors
  terrain: {
    grass: {
      top: '#7CB342', // Light green for top face
      left: '#558B2F', // Darker green for left face
      right: '#689F38', // Medium green for right face
    },
    water: {
      top: '#4FC3F7',
      left: '#0288D1',
      right: '#03A9F4',
    },
    sand: {
      top: '#FFD54F',
      left: '#FFA000',
      right: '#FFB300',
    },
    rock: {
      top: '#9E9E9E',
      left: '#616161',
      right: '#757575',
    },
    // Elevation cliff faces
    cliff: {
      light: '#8D6E63',
      dark: '#5D4037',
    },
  },

  // Track colors (wooden toy style)
  track: {
    rail: '#5D4037', // Dark brown wood
    railHighlight: '#795548', // Lighter brown highlight
    sleeper: '#8D6E63', // Medium brown for sleepers/ties
    sleeperShadow: '#4E342E',
  },

  // Train colors
  train: {
    engine: '#D32F2F', // Classic red engine
    engineHighlight: '#EF5350',
    engineShadow: '#B71C1C',
    carriage: '#1976D2', // Blue carriage
    carriageHighlight: '#42A5F5',
    wheel: '#37474F',
    chimney: '#212121',
  },

  // UI colors
  ui: {
    hover: 'rgba(255, 255, 255, 0.3)',
    selected: 'rgba(76, 175, 80, 0.4)',
    invalid: 'rgba(244, 67, 54, 0.3)',
    grid: 'rgba(0, 0, 0, 0.1)',
  },

  // Background
  background: '#E8F5E9', // Light green tint
};
