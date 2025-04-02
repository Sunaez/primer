import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

export default function SnapGame() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.text, { color: currentTheme.text }]}>
        Snap Game Coming Soon!
      </Text>
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
    fontFamily: 'Parkinsans',
  },
});
