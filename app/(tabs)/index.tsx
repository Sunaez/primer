import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueuePlay } from '@/games/QueuePlay';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

export default function Home() {
  const router = useRouter();
  const { startGameQueue } = useQueuePlay();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  useEffect(() => {
    const dailyGames = [
      { id: 'reaction', difficulty: 'normal' },
      { id: 'maths', difficulty: 'medium' },
    ];
    startGameQueue(dailyGames);
  }, [startGameQueue]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Daily Challenge</Text>
      <Button
        title="Play Today's Games"
        onPress={() => router.push('/games/queue')}
        color={currentTheme.primary}
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
    fontFamily: 'Parkinsans',
  },
});
