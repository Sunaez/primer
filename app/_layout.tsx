// /app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

function RootContent() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Parkinsans: require('@/assets/fonts/Parkinsans.ttf'),
      });

      // Set default text styling to use Parkinsans
      (Text as any).defaultProps = (Text as any).defaultProps || {};
      (Text as any).defaultProps.style = {
        fontFamily: 'Parkinsans',
        ...(Text as any).defaultProps.style,
      };

      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});
