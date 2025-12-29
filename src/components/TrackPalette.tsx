// Track selection palette component

import { useGame } from '../context/GameContext';
import type { TrackType } from '../types';
import { TRACK_DEFINITIONS } from '../constants';

// Track type display info with icons
const TRACK_DISPLAY: { type: TrackType; icon: string; available: boolean }[] = [
  { type: 'straight', icon: '║', available: true },
  { type: 'curve_90', icon: '╰', available: true },
  { type: 'switch_left', icon: '╠', available: true },
  { type: 'switch_right', icon: '╣', available: true },
  { type: 'crossing', icon: '╬', available: true },
  { type: 'bridge', icon: '🌉', available: true },
  { type: 'station', icon: '🏠', available: true },
  { type: 'signal', icon: '🚦', available: true },
  { type: 'slope_up', icon: '⬈', available: false }, // Phase 4
  { type: 'slope_down', icon: '⬊', available: false }, // Phase 4
  { type: 'tunnel_entrance', icon: '🚇', available: false }, // Phase 4
];

export function TrackPalette() {
  const { state, dispatch } = useGame();

  const handleTrackSelect = (trackType: TrackType) => {
    dispatch({ type: 'SET_SELECTED_TRACK_TYPE', trackType });
    dispatch({ type: 'SET_TOOL', tool: 'place_track' });
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Track Pieces</h4>
      <div style={styles.grid}>
        {TRACK_DISPLAY.filter((t) => t.available).map(({ type, icon }) => {
          const def = TRACK_DEFINITIONS[type];
          const isSelected =
            state.selectedTool === 'place_track' &&
            state.selectedTrackType === type;

          return (
            <button
              key={type}
              onClick={() => handleTrackSelect(type)}
              style={{
                ...styles.trackButton,
                ...(isSelected ? styles.trackButtonSelected : {}),
              }}
              title={def?.name || type}
            >
              <span style={styles.icon}>{icon}</span>
              <span style={styles.label}>{def?.name || type}</span>
            </button>
          );
        })}
      </div>

      {state.selectedTrackType && state.selectedTool === 'place_track' && (
        <div style={styles.hint}>
          Click on the grid to place{' '}
          <strong>{TRACK_DEFINITIONS[state.selectedTrackType]?.name}</strong>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '8px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '4px',
  },
  trackButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 4px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
    minHeight: '50px',
  },
  trackButtonSelected: {
    backgroundColor: '#2196F3',
    color: 'white',
    borderColor: '#2196F3',
  },
  icon: {
    fontSize: '18px',
    marginBottom: '2px',
  },
  label: {
    fontSize: '10px',
    textAlign: 'center',
  },
  hint: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#E3F2FD',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#1565C0',
  },
};
