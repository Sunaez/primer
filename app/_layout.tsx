import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, createContext, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Define Theme Context
const ThemeContext = createContext<{
  colorScheme: 'light' | 'dark';
  setColorScheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  customColors: Partial<typeof colors.light>;
  setCustomColors: React.Dispatch<React.SetStateAction<Partial<typeof colors.light>>>;
}>({
  colorScheme: 'light',
  setColorScheme: () => {},
  customColors: {},
  setCustomColors: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    systemColorScheme || 'light'
  );
  const [customColors, setCustomColors] = useState<Partial<typeof colors.light>>({});

  // Merge custom colors with default themes
  const theme = {
    dark: colorScheme === 'dark',
    colors: {
      ...colors[colorScheme],
      ...customColors,
    },
    fonts: colorScheme === 'dark' ? DarkTheme.fonts : DefaultTheme.fonts, // Add fonts here
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, customColors, setCustomColors }}>
      <ThemeProvider value={theme}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </View>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
