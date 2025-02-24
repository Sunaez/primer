import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

export default function Social() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  
  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Image
        source={require('@/assets/images/shrug_emoji.png')}
        style={styles.image}
      />
      <Text style={[styles.text, { color: currentTheme.text }]}>
        There is nothing here yet :/
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
  image: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Parkinsans',
  },
});
