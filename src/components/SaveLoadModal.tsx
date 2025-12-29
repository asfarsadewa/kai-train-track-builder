// Save/Load modal component

import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import {
  getSavedLayouts,
  saveLayout,
  deleteLayout,
  serializeLayout,
  deserializeLayout,
  formatTimestamp,
  type SavedLayout,
} from '../utils/storage';

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  onClose: () => void;
}

export function SaveLoadModal({ mode, onClose }: SaveLoadModalProps) {
  const { state, dispatch } = useGame();
  const [layouts, setLayouts] = useState<SavedLayout[]>([]);
  const [saveName, setSaveName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load saved layouts on mount
  useEffect(() => {
    setLayouts(getSavedLayouts());
  }, []);

  const handleSave = () => {
    if (!saveName.trim()) return;

    const layout = serializeLayout(saveName.trim(), state.grid, state.tracks, state.carriageConfig);
    if (saveLayout(layout)) {
      setLayouts(getSavedLayouts());
      setSaveName('');
      onClose();
    }
  };

  const handleLoad = () => {
    if (!selectedId) return;

    const layout = layouts.find((l) => l.id === selectedId);
    if (layout) {
      const { grid, tracks, carriageConfig } = deserializeLayout(layout);
      dispatch({ type: 'LOAD_LAYOUT', grid, tracks, carriageConfig });
      onClose();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this saved layout?')) {
      deleteLayout(id);
      setLayouts(getSavedLayouts());
      if (selectedId === id) {
        setSelectedId(null);
      }
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>
          {mode === 'save' ? '💾 Save Layout' : '📂 Load Layout'}
        </h2>

        {mode === 'save' && (
          <div style={styles.saveSection}>
            <input
              type="text"
              placeholder="Enter layout name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              style={styles.input}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              style={{
                ...styles.button,
                ...styles.saveButton,
                opacity: saveName.trim() ? 1 : 0.5,
              }}
            >
              Save
            </button>
          </div>
        )}

        <div style={styles.layoutList}>
          {layouts.length === 0 ? (
            <p style={styles.emptyText}>
              {mode === 'save'
                ? 'No saved layouts yet. Enter a name above to save your first layout!'
                : 'No saved layouts found. Create some tracks and save them first!'}
            </p>
          ) : (
            layouts
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((layout) => (
                <div
                  key={layout.id}
                  style={{
                    ...styles.layoutItem,
                    ...(selectedId === layout.id ? styles.layoutItemSelected : {}),
                  }}
                  onClick={() => setSelectedId(layout.id)}
                >
                  <div style={styles.layoutInfo}>
                    <span style={styles.layoutName}>{layout.name}</span>
                    <span style={styles.layoutDate}>
                      {formatTimestamp(layout.timestamp)}
                    </span>
                    <span style={styles.layoutMeta}>
                      {layout.tracks.length} tracks
                      {layout.carriageConfig && layout.carriageConfig.length > 0 &&
                        ` · ${layout.carriageConfig.length} carriage${layout.carriageConfig.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(layout.id);
                    }}
                    style={styles.deleteButton}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))
          )}
        </div>

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.button}>
            Cancel
          </button>
          {mode === 'load' && (
            <button
              onClick={handleLoad}
              disabled={!selectedId}
              style={{
                ...styles.button,
                ...styles.loadButton,
                opacity: selectedId ? 1 : 0.5,
              }}
            >
              Load Selected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '400px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 600,
  },
  saveSection: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
  },
  layoutList: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '16px',
    border: '1px solid #eee',
    borderRadius: '4px',
    minHeight: '150px',
    maxHeight: '300px',
  },
  emptyText: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '13px',
  },
  layoutItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  layoutItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  layoutInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  layoutName: {
    fontWeight: 600,
    fontSize: '14px',
  },
  layoutDate: {
    fontSize: '12px',
    color: '#666',
  },
  layoutMeta: {
    fontSize: '11px',
    color: '#999',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    fontSize: '14px',
    opacity: 0.6,
    transition: 'opacity 0.15s',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  button: {
    padding: '10px 16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.15s',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    borderColor: '#4CAF50',
  },
  loadButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    borderColor: '#2196F3',
  },
};
