// Keyboard shortcuts help overlay

import type { CSSProperties } from 'react';

interface HelpOverlayProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { category: 'General', items: [
    { keys: ['Space'], description: 'Play / Pause train' },
    { keys: ['Ctrl', 'Z'], description: 'Undo' },
    { keys: ['Ctrl', 'Y'], description: 'Redo' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)' },
    { keys: ['?'], description: 'Show this help' },
  ]},
  { category: 'Track Editing', items: [
    { keys: ['R'], description: 'Rotate track under cursor' },
    { keys: ['Click'], description: 'Place / Remove / Select' },
  ]},
  { category: 'Camera', items: [
    { keys: ['\u2190', '\u2192', '\u2191', '\u2193'], description: 'Pan camera' },
    { keys: ['+', '-'], description: 'Zoom in / out' },
    { keys: ['0'], description: 'Reset camera' },
    { keys: ['Scroll'], description: 'Zoom' },
    { keys: ['Middle Drag'], description: 'Pan camera' },
    { keys: ['Right Drag'], description: 'Pan camera' },
  ]},
];

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Keyboard Shortcuts</h2>
          <button style={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div style={styles.content}>
          {SHORTCUTS.map((section) => (
            <div key={section.category} style={styles.section}>
              <h3 style={styles.sectionTitle}>{section.category}</h3>
              <div style={styles.shortcutList}>
                {section.items.map((shortcut, index) => (
                  <div key={index} style={styles.shortcutRow}>
                    <div style={styles.keys}>
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd style={styles.key}>{key}</kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span style={styles.keyPlus}>+</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div style={styles.description}>{shortcut.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <p style={styles.tip}>Press <kbd style={styles.key}>?</kbd> or <kbd style={styles.key}>Esc</kbd> to close</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
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
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f8f9fa',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0 4px',
  },
  content: {
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  shortcutList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  shortcutRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  keys: {
    minWidth: '140px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
  },
  key: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  keyPlus: {
    margin: '0 2px',
    color: '#999',
    fontSize: '12px',
  },
  description: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  tip: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
  },
};
