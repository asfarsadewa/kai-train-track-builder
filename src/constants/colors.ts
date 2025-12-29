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
    forest: {
      top: '#2E7D32', // Dark green forest floor
      left: '#1B5E20',
      right: '#388E3C',
    },
    farm: {
      top: '#C0CA33', // Yellow-green wheat field
      left: '#9E9D24',
      right: '#AFB42B',
    },
    village: {
      top: '#A1887F', // Brown dirt/path
      left: '#6D4C41',
      right: '#8D6E63',
    },
    flowers: {
      top: '#81C784', // Light green with flowers
      left: '#4CAF50',
      right: '#66BB6A',
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
    // Passenger carriage (blue)
    passenger: '#1976D2',
    passengerHighlight: '#42A5F5',
    // Cargo/freight carriage (brown)
    cargo: '#8D6E63',
    cargoHighlight: '#A1887F',
    cargoDark: '#5D4037',
    // Tanker carriage (silver/gray)
    tanker: '#546E7A',
    tankerHighlight: '#78909C',
    tankerDark: '#455A64',
    // Coal hopper (dark gray)
    coal: '#424242',
    coalHighlight: '#616161',
    coalDark: '#212121',
    // Caboose (darker red)
    caboose: '#C62828',
    cabooseHighlight: '#E53935',
    cabooseDark: '#B71C1C',
    // Common
    wheel: '#37474F',
    chimney: '#212121',
    window: '#81D4FA',
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
