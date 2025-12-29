// Welcome tips overlay for first-time users

import { useState, useEffect, type CSSProperties } from 'react';

const STORAGE_KEY = 'kai-train-builder-welcomed';

export function WelcomeTips() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome tips
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={styles.overlay} onClick={handleDismiss}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.trainIcon}>🚂</span>
          <h2 style={styles.title}>Welcome to Kai's Train Builder!</h2>
        </div>

        <div style={styles.content}>
          <div style={styles.tip}>
            <span style={styles.tipIcon}>🛤️</span>
            <div style={styles.tipText}>
              <strong>Place Tracks</strong>
              <p>Select a track piece from the palette, then click on the grid to place it</p>
            </div>
          </div>

          <div style={styles.tip}>
            <span style={styles.tipIcon}>🔄</span>
            <div style={styles.tipText}>
              <strong>Rotate Tracks</strong>
              <p>Press <kbd style={styles.key}>R</kbd> to rotate a track piece under your cursor</p>
            </div>
          </div>

          <div style={styles.tip}>
            <span style={styles.tipIcon}>⛰️</span>
            <div style={styles.tipText}>
              <strong>Shape Terrain</strong>
              <p>Use Raise/Lower tools to create hills and valleys</p>
            </div>
          </div>

          <div style={styles.tip}>
            <span style={styles.tipIcon}>▶️</span>
            <div style={styles.tipText}>
              <strong>Run the Train</strong>
              <p>Press <kbd style={styles.key}>Space</kbd> or click Play to watch your train go!</p>
            </div>
          </div>

          <div style={styles.tip}>
            <span style={styles.tipIcon}>❓</span>
            <div style={styles.tipText}>
              <strong>More Help</strong>
              <p>Press <kbd style={styles.key}>?</kbd> anytime to see all keyboard shortcuts</p>
            </div>
          </div>
        </div>

        <button style={styles.startButton} onClick={handleDismiss}>
          Let's Build!
        </button>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    maxWidth: '450px',
    width: '90%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '24px',
    textAlign: 'center',
  },
  trainIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '8px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
  },
  content: {
    padding: '24px',
  },
  tip: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  tipIcon: {
    fontSize: '24px',
    lineHeight: 1,
  },
  tipText: {
    flex: 1,
  },
  key: {
    display: 'inline-block',
    padding: '2px 6px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '3px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  startButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
};
