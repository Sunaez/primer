import React from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
// Our new imports:
import MobileNavBar from '@/components/NavigationBar/MobileNavBar';
import DesktopNavBar from '@/components/NavigationBar/DesktopNavBar';

export default function TabLayout() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (!isDesktop) {
    // MOBILE
    return <MobileNavBar theme={currentTheme} />;
  }

  // DESKTOP
  return <DesktopNavBar theme={currentTheme} />;
}
