// Train composition palette component

import { useGame } from '../context/GameContext';
import { MAX_CARRIAGES } from '../types';
import type { CarriageType } from '../types';

interface CarriageOption {
  type: Exclude<CarriageType, 'engine'>;
  label: string;
  icon: string;
  color: string;
}

const CARRIAGE_OPTIONS: CarriageOption[] = [
  { type: 'passenger', label: 'Passenger', icon: '🚃', color: '#1976D2' },
  { type: 'cargo', label: 'Cargo', icon: '📦', color: '#8D6E63' },
  { type: 'tanker', label: 'Tanker', icon: '🛢️', color: '#546E7A' },
  { type: 'coal', label: 'Coal', icon: '⬛', color: '#424242' },
  { type: 'caboose', label: 'Caboose', icon: '🔴', color: '#C62828' },
];

export function TrainPalette() {
  const { state, dispatch } = useGame();
  const canAdd = state.carriageConfig.length < MAX_CARRIAGES;
  const isPlaying = state.isPlaying;

  const handleAddCarriage = (type: Exclude<CarriageType, 'engine'>) => {
    if (canAdd && !isPlaying) {
      dispatch({ type: 'ADD_CARRIAGE', carriageType: type });
    }
  };

  const handleRemoveCarriage = (index: number) => {
    if (!isPlaying) {
      dispatch({ type: 'REMOVE_CARRIAGE', index });
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Train Composition</h3>

      {/* Current train preview */}
      <div style={styles.trainPreview}>
        {/* Engine (always present) */}
        <div style={styles.engineItem} title="Engine (always present)">
          <span style={styles.trainIcon}>🚂</span>
        </div>

        {/* Configured carriages */}
        {state.carriageConfig.map((carriage, index) => {
          const option = CARRIAGE_OPTIONS.find((o) => o.type === carriage.type);
          return (
            <div
              key={index}
              style={{
                ...styles.carriageItem,
                ...(isPlaying ? styles.carriageItemDisabled : {}),
              }}
              title={isPlaying ? option?.label : `${option?.label} - Click to remove`}
              onClick={() => handleRemoveCarriage(index)}
            >
              <span style={styles.trainIcon}>{option?.icon}</span>
              {!isPlaying && <span style={styles.removeHint}>×</span>}
            </div>
          );
        })}

        {/* Empty slot indicator */}
        {canAdd && !isPlaying && (
          <div style={styles.emptySlot} title="Add a carriage below">
            +
          </div>
        )}
      </div>

      <p style={styles.count}>
        {state.carriageConfig.length}/{MAX_CARRIAGES} carriages
      </p>

      {/* Carriage selection buttons */}
      {!isPlaying && (
        <>
          <h4 style={styles.subtitle}>Add Carriage</h4>
          <div style={styles.grid}>
            {CARRIAGE_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => handleAddCarriage(option.type)}
                disabled={!canAdd}
                style={{
                  ...styles.button,
                  ...(canAdd ? {} : styles.buttonDisabled),
                }}
                title={canAdd ? `Add ${option.label}` : 'Max carriages reached'}
              >
                <div
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: option.color,
                  }}
                />
                <span style={styles.icon}>{option.icon}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {isPlaying && (
        <p style={styles.hint}>Stop the train to modify carriages</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  subtitle: {
    margin: '4px 0 2px 0',
    fontSize: '12px',
    fontWeight: 500,
    color: '#666',
  },
  trainPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '6px',
    minHeight: '40px',
    flexWrap: 'wrap',
  },
  engineItem: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: '4px',
    border: '2px solid #B71C1C',
  },
  carriageItem: {
    position: 'relative',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #ccc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  carriageItemDisabled: {
    cursor: 'default',
    opacity: 0.8,
  },
  trainIcon: {
    fontSize: '16px',
    lineHeight: 1,
  },
  removeHint: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '14px',
    height: '14px',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '50%',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  emptySlot: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #ccc',
    borderRadius: '4px',
    color: '#999',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  count: {
    margin: 0,
    fontSize: '11px',
    color: '#666',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '4px',
  },
  button: {
    width: '36px',
    height: '36px',
    padding: '2px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1px',
    transition: 'all 0.15s ease',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  colorSwatch: {
    width: '14px',
    height: '6px',
    borderRadius: '2px',
    border: '1px solid rgba(0,0,0,0.1)',
  },
  icon: {
    fontSize: '14px',
    lineHeight: 1,
  },
  hint: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
};
