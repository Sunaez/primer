import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

export default function ReturnFreeplayButton() {
  const router = useRouter();
  const { themeName } = useThemeContext();
  const theme = THEMES[themeName] || THEMES.Dark;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.button }]}
      onPress={() => router.replace('/(tabs)/freeplay')}
    >
      <Text style={[styles.buttonText, { color: theme.buttonText, fontFamily: 'Parkisans' }]}>
        Return to Freeplay
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 20,
    textAlign: 'center',
  },
});
