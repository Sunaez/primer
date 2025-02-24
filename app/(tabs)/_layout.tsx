import React from 'react';
import { Tabs } from 'expo-router';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

export default function TabLayout() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentTheme.primary,
        tabBarInactiveTintColor: currentTheme.secondary,
        tabBarStyle: {
          backgroundColor: currentTheme.background,
          height: 70, // Increase the height of the nav bar
          paddingHorizontal: 16,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: 'Parkinsans',
          fontSize: 14,
          marginBottom: 6, // add a bit of bottom margin if needed
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Daily' }} />
      <Tabs.Screen name="freeplay" options={{ title: 'Freeplay' }} />
      <Tabs.Screen name="social" options={{ title: 'Social' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
