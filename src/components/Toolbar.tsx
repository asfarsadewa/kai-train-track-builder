// Toolbar component with tool selection

import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { TrackPalette } from './TrackPalette';
import { TerrainPalette } from './TerrainPalette';
import { SaveLoadModal } from './SaveLoadModal';
import { HelpOverlay } from './HelpOverlay';
import { SoundManager } from '../audio';
import type { ToolType } from '../types';

const TOOLS: { id: ToolType; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '👆' },
  { id: 'remove', label: 'Remove', icon: '🗑️' },
  { id: 'terrain_raise', label: 'Raise', icon: '⬆️' },
  { id: 'terrain_lower', label: 'Lower', icon: '⬇️' },
];

export function Toolbar() {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useGame();
  const [modalMode, setModalMode] = useState<'save' | 'load' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Handle ? key for help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.key === 'Escape' && showHelp)) {
        setShowHelp((prev) => e.key === '?' ? !prev : false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp]);

  // Handle train sound and music
  useEffect(() => {
    if (state.isPlaying && soundEnabled) {
      SoundManager.startChug();
      SoundManager.startMusic();
    } else {
      SoundManager.stopChug();
      SoundManager.stopMusic();
    }
  }, [state.isPlaying, soundEnabled]);

  // Update sound manager when toggle changes
  useEffect(() => {
    SoundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  return (
    <div style={styles.toolbar}>
      {modalMode && (
        <SaveLoadModal mode={modalMode} onClose={() => setModalMode(null)} />
      )}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}

      <div style={styles.headerRow}>
        <h3 style={styles.titleMain}>Kai's Train Builder</h3>
        <button
          onClick={() => setShowHelp(true)}
          style={styles.helpButton}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
      </div>

      <div style={styles.divider} />

      <h3 style={styles.title}>Tools</h3>

      <div style={styles.toolRow}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => dispatch({ type: 'SET_TOOL', tool: tool.id })}
            style={{
              ...styles.iconButton,
              ...(state.selectedTool === tool.id ? styles.iconButtonActive : {}),
            }}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div style={styles.divider} />

      <TrackPalette />

      <div style={styles.divider} />

      <TerrainPalette />

      <div style={styles.divider} />

      <h3 style={styles.title}>Info</h3>
      <div style={styles.info}>
        {state.hoveredCell ? (
          <p>
            Cell: ({state.hoveredCell.x}, {state.hoveredCell.y})
            <br />
            Elevation:{' '}
            {state.grid.cells[state.hoveredCell.y][state.hoveredCell.x].elevation}
          </p>
        ) : (
          <p>Hover over a tile</p>
        )}
      </div>

      <div style={styles.divider} />

      <h3 style={styles.title}>Train</h3>
      <div style={styles.trainControls}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          style={{
            ...styles.playButton,
            ...(state.isPlaying ? styles.playButtonActive : {}),
          }}
          disabled={state.tracks.size === 0}
        >
          {state.isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        {state.isPlaying && (
          <button
            onClick={() => dispatch({ type: 'SET_PLAYING', isPlaying: false })}
            style={styles.stopButton}
          >
            ⏹️ Stop
          </button>
        )}
      </div>
      {state.tracks.size === 0 && (
        <p style={styles.hint}>Place some tracks first!</p>
      )}

      <div style={styles.divider} />

      <h3 style={styles.title}>Save / Load</h3>
      <div style={styles.saveLoadButtons}>
        <button
          onClick={() => setModalMode('save')}
          style={styles.saveButton}
          disabled={state.tracks.size === 0}
        >
          💾 Save
        </button>
        <button
          onClick={() => setModalMode('load')}
          style={styles.loadButtonSmall}
        >
          📂 Load
        </button>
      </div>

      <div style={styles.divider} />

      <h3 style={styles.title}>Sound</h3>
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        style={{
          ...styles.soundButton,
          ...(soundEnabled ? {} : styles.soundButtonMuted),
        }}
      >
        {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
      </button>

      <div style={styles.divider} />

      <h3 style={styles.title}>Edit</h3>
      <div style={styles.undoRedoButtons}>
        <button
          onClick={undo}
          style={{
            ...styles.undoButton,
            ...(canUndo ? {} : styles.buttonDisabled),
          }}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↩️ Undo
        </button>
        <button
          onClick={redo}
          style={{
            ...styles.redoButton,
            ...(canRedo ? {} : styles.buttonDisabled),
          }}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↪️ Redo
        </button>
      </div>
      <button
        onClick={() => dispatch({ type: 'CLEAR_LAYOUT' })}
        style={styles.clearButton}
      >
        🗑️ Clear All
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    width: '220px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleMain: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#2196F3',
  },
  helpButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1px solid #999',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  toolRow: {
    display: 'flex',
    gap: '4px',
  },
  iconButton: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.15s ease',
  },
  iconButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.3)',
  },
  divider: {
    height: '1px',
    backgroundColor: '#ddd',
    margin: '8px 0',
  },
  info: {
    fontSize: '12px',
    color: '#666',
  },
  actionButton: {
    padding: '8px 12px',
    border: '1px solid #f44336',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.15s ease',
  },
  trainControls: {
    display: 'flex',
    gap: '8px',
  },
  playButton: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #4CAF50',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#4CAF50',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
  playButtonActive: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  stopButton: {
    padding: '10px 12px',
    border: '1px solid #FF9800',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#FF9800',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.15s ease',
  },
  hint: {
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
    margin: '4px 0 0 0',
  },
  saveLoadButtons: {
    display: 'flex',
    gap: '8px',
  },
  saveButton: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #4CAF50',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#4CAF50',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
  loadButtonSmall: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #2196F3',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#2196F3',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
  soundButton: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #9C27B0',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#9C27B0',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
  soundButtonMuted: {
    borderColor: '#999',
    color: '#999',
  },
  undoRedoButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  undoButton: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #607D8B',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#607D8B',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
  redoButton: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #607D8B',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#607D8B',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  clearButton: {
    padding: '8px 12px',
    border: '1px solid #f44336',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
};
