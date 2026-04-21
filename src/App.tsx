import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { GameScreen } from './screens/GameScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { AbandonedScreen } from './screens/AbandonedScreen';
import { JoiningScreen } from './screens/JoiningScreen';
import { useGameStore } from './game/store';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  switch (screen) {
    case 'home':
      return <HomeScreen />;
    case 'joining':
      return <JoiningScreen />;
    case 'lobby':
      return <LobbyScreen />;
    case 'game':
      return <GameScreen />;
    case 'victory':
      return <VictoryScreen />;
    case 'abandoned':
      return <AbandonedScreen />;
  }
}
