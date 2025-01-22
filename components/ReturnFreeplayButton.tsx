// File: components/ReturnFreeplayButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

export default function ReturnFreeplayButton() {
  const router = useRouter();

  function handlePress() {
    // Navigate or replace to your Freeplay tab
    router.replace('/(tabs)/freeplay');
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Text style={styles.buttonText}>Return to Freeplay</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.button,    // e.g. '#00E676'
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    color: Colors.buttonText,         // e.g. '#FFFFFF'
    fontSize: 18,
  },
});
