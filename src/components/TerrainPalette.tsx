// Terrain palette component for selecting terrain types

import { useGame } from '../context/GameContext';
import type { TerrainType } from '../types';

interface TerrainOption {
  type: TerrainType;
  label: string;
  icon: string;
  color: string;
}

const TERRAIN_OPTIONS: TerrainOption[] = [
  { type: 'grass', label: 'Grass', icon: '🌿', color: '#7CB342' },
  { type: 'water', label: 'Water', icon: '🌊', color: '#4FC3F7' },
  { type: 'sand', label: 'Sand', icon: '🏖️', color: '#FFD54F' },
  { type: 'rock', label: 'Rock', icon: '🪨', color: '#9E9E9E' },
  { type: 'forest', label: 'Forest', icon: '🌲', color: '#2E7D32' },
  { type: 'farm', label: 'Farm', icon: '🌾', color: '#C0CA33' },
  { type: 'village', label: 'Village', icon: '🏠', color: '#A1887F' },
  { type: 'flowers', label: 'Flowers', icon: '🌸', color: '#81C784' },
];

export function TerrainPalette() {
  const { state, dispatch } = useGame();

  const handleSelect = (type: TerrainType) => {
    dispatch({ type: 'SET_SELECTED_TERRAIN_TYPE', terrainType: type });
    dispatch({ type: 'SET_TOOL', tool: 'terrain_paint' });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Terrain</h3>
      <div style={styles.grid}>
        {TERRAIN_OPTIONS.map((terrain) => {
          const isSelected =
            state.selectedTerrainType === terrain.type &&
            state.selectedTool === 'terrain_paint';

          return (
            <button
              key={terrain.type}
              onClick={() => handleSelect(terrain.type)}
              style={{
                ...styles.button,
                ...(isSelected ? styles.buttonSelected : {}),
              }}
              title={terrain.label}
            >
              <div
                style={{
                  ...styles.colorSwatch,
                  backgroundColor: terrain.color,
                }}
              />
              <span style={styles.icon}>{terrain.icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '4px',
  },
  button: {
    width: '44px',
    height: '44px',
    padding: '4px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    transition: 'all 0.15s ease',
  },
  buttonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
    boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.3)',
  },
  colorSwatch: {
    width: '16px',
    height: '8px',
    borderRadius: '2px',
    border: '1px solid rgba(0,0,0,0.1)',
  },
  icon: {
    fontSize: '16px',
    lineHeight: 1,
  },
};
