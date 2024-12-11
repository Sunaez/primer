// File: app/games/snap.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

export default function SnapGame() {
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Text style={[styles.text, { color: Colors.text }]}>Snap Game Coming Soon!</Text>
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
