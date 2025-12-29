import { GameProvider } from './context/GameContext';
import { GameLayout } from './components';
import './App.css';

function App() {
  return (
    <GameProvider>
      <GameLayout />
    </GameProvider>
  );
}

export default App;
