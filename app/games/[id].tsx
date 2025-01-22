// File: app/games/[id].tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Import your games
import ArithmeticChallenge from '@/games/maths';
import ReactionGame from '@/games/reaction';
import SnapGame from '@/games/snap';

const gameComponents: Record<string, React.ComponentType<any>> = {
  maths: ArithmeticChallenge,
  reaction: ReactionGame,
  snap: SnapGame,
};

export default function GameScreen() {
  const router = useRouter();
  const { id, difficulty = 'normal' } = useLocalSearchParams();

  const CurrentGame = id && gameComponents[id as string];

  if (!CurrentGame) {
    return (
      <View style={styles.container}>
        {/* Show an error if game not found */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CurrentGame
        difficulty={difficulty}
        onGameEnd={() => {
          // When "Home" is pressed in Maths, we navigate to the tabs 
          // (or anywhere else you want to go)
          router.replace('/(tabs)/freeplay');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
