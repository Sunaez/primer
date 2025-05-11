// /app/(tabs)/_layout.tsx
import React from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import Ionicons from '@expo/vector-icons/Ionicons';
import MobileNavBar from '@/components/NavigationBar/MobileNavBar';
import DesktopNavBar from '@/components/NavigationBar/DesktopNavBar';

export default function TabLayout() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (!isDesktop) {
    return <MobileNavBar theme={currentTheme} />;
  }
  return <DesktopNavBar theme={currentTheme} />;
}
