// File: app/games/[id].tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';

export default function GameScreen() {
  const { id } = useLocalSearchParams(); // Corrected usage of dynamic params

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Text style={[styles.text, { color: Colors.text }]}>Welcome to the {id} game!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
