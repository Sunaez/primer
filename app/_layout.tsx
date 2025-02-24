import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import { QueuePlayProvider } from '@/games/QueuePlay';
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
    const loadFonts = async () => {
      await Font.loadAsync({
        Parkinsans: require('@/assets/fonts/Parkinsans.ttf'),
      });

      // Default text styling for Parkinsans
      (Text as any).defaultProps = (Text as any).defaultProps || {};
      (Text as any).defaultProps.style = {
        fontFamily: 'Parkinsans',
        ...(Text as any).defaultProps.style,
      };

      setFontsLoaded(true);
    };

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    // While fonts are loading, show a loader with a fallback dark background.
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <QueuePlayProvider>
        <RootContent />
      </QueuePlayProvider>
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
    backgroundColor: '#121212', // fallback dark background
  },
});
