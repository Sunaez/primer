import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import THEMES from '@/constants/themes';

export type ThemeName = keyof typeof THEMES;

interface ThemeContextValue {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'Dark',
  setThemeName: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('Dark');

  // Create a wrapped setter that updates AsyncStorage as well
  const setThemeName = async (name: ThemeName) => {
    setThemeNameState(name);
    try {
      await AsyncStorage.setItem('userTheme', name);
    } catch (error) {
      console.error('Error saving theme to AsyncStorage:', error);
    }
  };

  // On mount, load stored theme from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('userTheme');
        if (storedTheme && storedTheme in THEMES) {
          setThemeNameState(storedTheme as ThemeName);
        }
      } catch (error) {
        console.error('Error loading theme from AsyncStorage:', error);
      }
    })();
  }, []);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
