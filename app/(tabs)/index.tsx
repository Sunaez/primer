import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueuePlay } from '@/games/QueuePlay';
import Colors from '@/constants/Colors';

export default function Home() {
  const router = useRouter();
  const { startGameQueue } = useQueuePlay();

  useEffect(() => {
    const dailyGames = [
      { id: 'reaction', difficulty: 'normal' },
      { id: 'maths', difficulty: 'medium' },
    ];
    startGameQueue(dailyGames);
  }, [startGameQueue]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Text style={[styles.title, { color: Colors.text }]}>Daily Challenge</Text>
      <Button
        title="Play Today's Games"
        onPress={() => {
          router.push('/games/queue');
        }}
        color={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontFamily: 'Parkinsans', // Apply correct font
  },
});
