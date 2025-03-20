// file: app/(tabs)/_layout.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Tabs, Link, Slot, LinkProps } from 'expo-router';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

export default function TabLayout() {
  // --- Theming ---
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // --- Determine mobile vs. desktop ---
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (!isDesktop) {
    // -------------- MOBILE LAYOUT (BOTTOM TABS) --------------
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: currentTheme.primary,
          tabBarInactiveTintColor: currentTheme.secondary,
          tabBarStyle: {
            backgroundColor: currentTheme.background,
            height: 70,
            paddingHorizontal: 16,
          },
          headerShown: false,
          tabBarLabelStyle: {
            fontFamily: 'Parkinsans',
            fontSize: 14,
            marginBottom: 6,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Daily' }} />
        <Tabs.Screen name="freeplay" options={{ title: 'Freeplay' }} />
        <Tabs.Screen name="social" options={{ title: 'Social' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    );
  } else {
    // -------------- DESKTOP LAYOUT (SIDEBAR) --------------
    return (
      <View style={[styles.desktopContainer, { backgroundColor: currentTheme.background }]}>
        {/* Left sidebar */}
        <View style={[styles.sideNav, { backgroundColor: currentTheme.surface }]}>
          {/* 2:1 Logo - uses theme.primary as background */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoPlaceholder, { backgroundColor: currentTheme.primary }]}>
              <Text style={[styles.logoText, { color: currentTheme.text }]}>LOGO</Text>
            </View>
          </View>

          {/* Nav links (typed routes) */}
          <NavLink title="Daily"    href={'/(tabs)' as const}    theme={currentTheme} />
          <NavLink title="Freeplay" href={'/(tabs)/freeplay' as const} theme={currentTheme} />
          <NavLink title="Social"   href={'/(tabs)/social' as const}   theme={currentTheme} />
          <NavLink title="Profile"  href={'/(tabs)/profile' as const}  theme={currentTheme} />
        </View>

        {/* Main content (screens) */}
        <View style={[styles.mainContent, { backgroundColor: currentTheme.background }]}>
          <Slot />
        </View>
      </View>
    );
  }
}

/**
 * Minimal NavLink that uses typed `href` and your theme’s color for text.
 * No special active styling included—just a direct link.
 */
type NavLinkProps = {
  title: string;
  href: LinkProps['href'];
  theme: typeof THEMES[keyof typeof THEMES]; // currentTheme object
};

function NavLink({ title, href, theme }: NavLinkProps) {
  return (
    <Link href={href} asChild>
      <TouchableOpacity style={styles.navItem}>
        <Text style={[styles.navText, { color: theme.text }]}>{title}</Text>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sideNav: {
    width: 200,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },

  // -- 2:1 Placeholder Logo --
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 100,  // 2:1 aspect ratio => 100x50
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  logoText: {
    fontFamily: 'Parkinsans',
  },

  // -- Nav Items --
  navItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  navText: {
    fontFamily: 'Parkinsans',
    fontSize: 16,
  },
});
