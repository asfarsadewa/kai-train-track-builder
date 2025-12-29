// Crash dialog - shown after collision in Danger Mode

import { useGame } from '../context/GameContext';

interface CrashDialogProps {
  onRestart: () => void;
}

export function CrashDialog({ onRestart }: CrashDialogProps) {
  const { dispatch } = useGame();

  const handleRestartSafe = () => {
    // Reset to normal mode
    dispatch({ type: 'SET_DANGER_MODE', enabled: false });
    dispatch({ type: 'SET_COLLISION', collision: null });
    dispatch({ type: 'SET_PLAYING', isPlaying: false });
    onRestart();
  };

  const handleRestartDanger = () => {
    // Keep danger mode, just restart
    dispatch({ type: 'SET_COLLISION', collision: null });
    dispatch({ type: 'SET_PLAYING', isPlaying: false });
    onRestart();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <div style={styles.explosionEmoji}>💥</div>
        <h2 style={styles.title}>CRASH!</h2>
        <p style={styles.message}>
          The trains have collided in a spectacular crash!
        </p>
        <div style={styles.buttons}>
          <button onClick={handleRestartSafe} style={styles.primaryButton}>
            Restart (Safe Mode)
          </button>
          <button onClick={handleRestartDanger} style={styles.secondaryButton}>
            Try Again (Danger Mode)
          </button>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#1a1a2e',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
    boxShadow: '0 0 40px rgba(255, 87, 34, 0.5)',
    border: '3px solid #FF5722',
  },
  explosionEmoji: {
    fontSize: '64px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '42px',
    color: '#FF5722',
    margin: '0 0 16px 0',
    fontFamily: '"Comic Sans MS", cursive, sans-serif',
    textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
  },
  message: {
    fontSize: '16px',
    color: '#ccc',
    marginBottom: '32px',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryButton: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
  },
  secondaryButton: {
    padding: '14px 24px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#FF5722',
    border: '2px solid #FF5722',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
  },
};
