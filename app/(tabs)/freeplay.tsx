import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/_layout';

export default function Freeplay() {
  const { colorScheme, customColors } = useTheme();
  const theme = customColors;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>Welcome to Freeplay!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
