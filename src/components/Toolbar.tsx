// Toolbar component with tool selection

import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { CollapsibleSection } from './CollapsibleSection';
import { TrackPalette } from './TrackPalette';
import { TerrainPalette } from './TerrainPalette';
import { TrainPalette } from './TrainPalette';
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

  // Check if there's at least one station (required for train to spawn)
  const hasStation = Array.from(state.tracks.values()).some(
    (track) => track.type === 'station'
  );
  const canPlay = state.tracks.size > 0 && hasStation;

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

      {/* Danger Mode Toggle */}
      <label
        style={{
          ...styles.dangerToggle,
          ...(state.isPlaying ? styles.dangerToggleDisabled : {}),
        }}
        title="Two trains, one collision!"
      >
        <input
          type="checkbox"
          checked={state.isDangerMode}
          onChange={(e) => dispatch({ type: 'SET_DANGER_MODE', enabled: e.target.checked })}
          disabled={state.isPlaying}
          style={styles.hiddenCheckbox}
        />
        <span
          style={{
            ...styles.toggleTrack,
            ...(state.isDangerMode ? styles.toggleTrackActive : {}),
          }}
        >
          <span
            style={{
              ...styles.toggleThumb,
              ...(state.isDangerMode ? styles.toggleThumbActive : {}),
            }}
          />
        </span>
        <span style={styles.dangerLabel}>
          ☠️ Danger Mode
        </span>
      </label>

      <CollapsibleSection title="Tools" defaultExpanded>
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
      </CollapsibleSection>

      <CollapsibleSection title="Track Pieces" defaultExpanded>
        <TrackPalette />
      </CollapsibleSection>

      <CollapsibleSection title="Terrain">
        <TerrainPalette />
      </CollapsibleSection>

      <CollapsibleSection title="Train Composition">
        <TrainPalette />
      </CollapsibleSection>

      <CollapsibleSection title="Train Controls" defaultExpanded>
      <div style={styles.trainControls}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          style={{
            ...styles.playButton,
            ...(state.isPlaying ? styles.playButtonActive : {}),
          }}
          disabled={!canPlay}
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
      {!canPlay && (
        <p style={styles.hint}>
          {state.tracks.size === 0
            ? 'Place some tracks first!'
            : 'Place a station for the train to spawn!'}
        </p>
      )}
      </CollapsibleSection>

      <CollapsibleSection title="Save / Load">
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
      </CollapsibleSection>

      <CollapsibleSection title="Sound">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            ...styles.soundButton,
            ...(soundEnabled ? {} : styles.soundButtonMuted),
          }}
        >
          {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
      </CollapsibleSection>

      <CollapsibleSection title="Edit">
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
      </CollapsibleSection>

      {/* Footer */}
      <div style={styles.footer}>
        <a
          href="https://x.com/ashthepeasant"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLink}
        >
          © ashthepeasant
        </a>
      </div>
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
  footer: {
    marginTop: 'auto',
    paddingTop: '16px',
    textAlign: 'center',
  },
  footerLink: {
    fontSize: '11px',
    color: '#999',
    textDecoration: 'none',
  },
  dangerToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  dangerToggleDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  hiddenCheckbox: {
    position: 'absolute' as const,
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleTrack: {
    position: 'relative' as const,
    width: '40px',
    height: '22px',
    backgroundColor: '#ccc',
    borderRadius: '11px',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  },
  toggleTrackActive: {
    backgroundColor: '#FF5722',
  },
  toggleThumb: {
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    width: '18px',
    height: '18px',
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s ease',
  },
  toggleThumbActive: {
    transform: 'translateX(18px)',
  },
  dangerLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
  },
};
