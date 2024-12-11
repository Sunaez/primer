import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function RootLayout() {
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
