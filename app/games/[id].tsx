import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GAMES } from '@/constants/games';

export default function GameScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Look up the game data based on the id.
  const gameData = GAMES.find((game) => game.id === id);

  if (!gameData || !gameData.component) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Game not found.</Text>
      </View>
    );
  }

  const GameComponent = gameData.component;

  return (
    <View style={styles.container}>
      <GameComponent onGameEnd={() => router.replace('/(tabs)/freeplay')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
});
