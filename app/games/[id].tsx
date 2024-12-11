import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MemoryGame from './memory';
import ReactionGame from './reaction';
import PuzzleGame from './puzzle';

export default function GameScreen() {
  const { id } = useLocalSearchParams();

  const renderGame = () => {
    switch (id) {
      case 'memory':
        return <MemoryGame />;
      case 'reaction':
        return <ReactionGame />;
      case 'puzzle':
        return <PuzzleGame />;
      default:
        return <Text>Game not found</Text>;
    }
  };

  return <View style={{ flex: 1 }}>{renderGame()}</View>;
}
