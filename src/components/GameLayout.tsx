// Main game layout component

import { GameCanvas } from './GameCanvas';
import { Toolbar } from './Toolbar';
import { WelcomeTips } from './WelcomeTips';

export function GameLayout() {
  return (
    <div style={styles.container}>
      <WelcomeTips />
      <Toolbar />
      <div style={styles.canvasContainer}>
        <GameCanvas />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    overflow: 'auto',
    padding: '20px',
  },
};
