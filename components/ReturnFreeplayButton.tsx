import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';

export default function ReturnFreeplayButton() {
  const router = useRouter();
  const { themeName } = useThemeContext();
  const theme = THEMES[themeName] || THEMES.Dark;

  function handlePress() {
    router.replace('/(tabs)/freeplay');
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.button }]}
        onPress={handlePress}
      >
        <Text
          style={[
            styles.buttonText,
            { color: theme.text, fontFamily: 'Parkinsans', },
          ]}
        >
          Return to Freeplay
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', // center children horizontally
  },
  button: {
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    fontSize: 18,
  },
});
