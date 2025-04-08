// /app/(tabs)/index.tsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useThemeContext } from '@/context/UserContext';
import Desktop from '@/components/index/Desktop';
import Mobile from '@/components/index/Mobile';
import THEMES from '@/constants/themes';

const Index: React.FC = () => {
  const { width } = useWindowDimensions();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  
  // Check if the platform is web and width is at least 768px
  const isDesktop = Platform.OS === 'web' && width >= 768;

  return (
    <View style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}>
      {isDesktop ? <Desktop /> : <Mobile />}
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
});
