// file: app/(tabs)/_layout.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Tabs, Link, Slot, LinkProps, usePathname } from 'expo-router';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

export default function TabLayout() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (!isDesktop) {
    // --- MOBILE LAYOUT (BOTTOM TABS) with custom tab labels ---
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: currentTheme.primary,
          tabBarInactiveTintColor: currentTheme.secondary,
          tabBarActiveBackgroundColor: currentTheme.selection,
          tabBarInactiveBackgroundColor: currentTheme.background,
          tabBarStyle: {
            backgroundColor: currentTheme.background,
            height: 60,
            paddingHorizontal: 16,
            borderTopWidth: 1,
            borderTopColor: currentTheme.border || '#ccc',
          },
          headerShown: false,
          // Force center alignment for each tab item.
          tabBarItemStyle: {
            borderRightWidth: 1,
            borderRightColor: currentTheme.border || '#ccc',
            alignItems: 'center',
            justifyContent: 'center',
          },
          // Remove the default icon and its container.
          tabBarIcon: () => null,
          tabBarIconStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Daily',
            tabBarLabel: ({ focused, color }) => (
              <View style={styles.tabLabelContainer}>
                {focused && (
                  <View style={styles.tabLabelIconContainer}>
                    <Text style={[styles.tabLabelArrow, { color }]}>▲</Text>
                  </View>
                )}
                <View style={styles.tabLabelTextContainer}>
                  <Text style={[styles.tabLabelText, { color }]}>Daily</Text>
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="freeplay"
          options={{
            title: 'Freeplay',
            tabBarLabel: ({ focused, color }) => (
              <View style={styles.tabLabelContainer}>
                {focused && (
                  <View style={styles.tabLabelIconContainer}>
                    <Text style={[styles.tabLabelArrow, { color }]}>▲</Text>
                  </View>
                )}
                <View style={styles.tabLabelTextContainer}>
                  <Text style={[styles.tabLabelText, { color }]}>Freeplay</Text>
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="social"
          options={{
            title: 'Social',
            tabBarLabel: ({ focused, color }) => (
              <View style={styles.tabLabelContainer}>
                {focused && (
                  <View style={styles.tabLabelIconContainer}>
                    <Text style={[styles.tabLabelArrow, { color }]}>▲</Text>
                  </View>
                )}
                <View style={styles.tabLabelTextContainer}>
                  <Text style={[styles.tabLabelText, { color }]}>Social</Text>
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: ({ focused, color }) => (
              <View style={styles.tabLabelContainer}>
                {focused && (
                  <View style={styles.tabLabelIconContainer}>
                    <Text style={[styles.tabLabelArrow, { color }]}>▲</Text>
                  </View>
                )}
                <View style={styles.tabLabelTextContainer}>
                  <Text style={[styles.tabLabelText, { color }]}>Profile</Text>
                </View>
              </View>
            ),
          }}
        />
      </Tabs>
    );
  }

  // --- DESKTOP LAYOUT (SIDEBAR) ---
  return (
    <View style={[styles.desktopContainer, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.sideNav, { backgroundColor: currentTheme.surface }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoPlaceholder, { backgroundColor: currentTheme.primary }]}>
            <Text style={[styles.logoText, { color: currentTheme.contrast }]}>LOGO</Text>
          </View>
        </View>
        {/* Navigation Items */}
        {NAV_LINKS.map((link, index) => (
          <NavLink
            key={link.title}
            title={link.title}
            href={link.href}
            theme={currentTheme}
            isMobile={false}
            style={{
              marginTop: index === 0 ? 16 : 8,
              marginBottom: 8,
            }}
          />
        ))}
      </View>
      <View style={[styles.mainContent, { backgroundColor: currentTheme.background }]}>
        <Slot />
      </View>
    </View>
  );
}

const NAV_LINKS = [
  { title: 'Daily', href: '/(tabs)' as const },
  { title: 'Freeplay', href: '/(tabs)/freeplay' as const },
  { title: 'Social', href: '/(tabs)/social' as const },
  { title: 'Profile', href: '/(tabs)/profile' as const },
];

type NavLinkProps = {
  title: string;
  href: LinkProps['href'];
  theme: typeof THEMES[keyof typeof THEMES];
  isMobile: boolean;
  style?: object;
};

function NavLink({ title, href, theme, isMobile, style }: NavLinkProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const isActive = pathname.startsWith(typeof href === 'string' ? href : href.pathname);
  const backgroundColor = isActive ? theme.selection : hovered ? theme.hover : 'transparent';
  const textColor = isActive ? theme.contrast : theme.text;
  return (
    <Link href={href} asChild>
      {isMobile ? (
        <Pressable
          style={({ pressed }) => ({
            ...styles.navItemMobile,
            backgroundColor: pressed ? theme.primary : backgroundColor,
            opacity: pressed ? 0.85 : 1,
            ...style,
          })}
        >
          <Text style={[styles.navTextMobile, { color: textColor }]}>{title}</Text>
        </Pressable>
      ) : (
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...styles.navItemDesktop as React.CSSProperties,
            backgroundColor,
            cursor: 'pointer',
            ...style,
          }}
        >
          <Text style={[styles.navTextDesktop, { color: textColor }]}>{title}</Text>
        </div>
      )}
    </Link>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sideNav: {
    width: 320,
    paddingTop: 30,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoPlaceholder: {
    width: 120,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  logoText: {
    fontFamily: 'Parkinsans',
    fontSize: 20,
    fontWeight: 'bold',
  },
  navItemMobile: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  navItemDesktop: {
    width: '100%',
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  navTextMobile: {
    fontFamily: 'Parkinsans',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navTextDesktop: {
    fontFamily: 'Parkinsans',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Custom tab label styles.
  tabLabelContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabelIconContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabelTextContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabelArrow: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Parkinsans',
    textAlign: 'center',
  },
  tabLabelText: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Parkinsans',
    textAlign: 'center',
  },
});
