// file: components/NavigationBar/DesktopNavBar.tsx

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Slot, Link, LinkProps, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import THEMES from '@/constants/themes';

type DesktopNavBarProps = {
  theme: typeof THEMES[keyof typeof THEMES];
};

const NAV_LINKS = [
  { title: 'Daily', href: '/(tabs)', iconName: 'home-sharp' },
  { title: 'Freeplay', href: '/(tabs)/freeplay', iconName: 'game-controller' },
  { title: 'Social', href: '/(tabs)/social', iconName: 'people' },
  { title: 'Profile', href: '/(tabs)/profile', iconName: 'person' },
] as const;

export default function DesktopNavBar({ theme }: DesktopNavBarProps) {
  return (
    <View style={[styles.desktopContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.sideNav, { backgroundColor: theme.surface }]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: theme.primary }]}>Primer</Text>
        </View>
        {NAV_LINKS.map((link) => (
          <DesktopNavItem
            key={link.title}
            title={link.title}
            href={link.href}
            iconName={link.iconName}
            theme={theme}
          />
        ))}
        <View style={{
          borderTopColor: theme.divider,
          borderTopWidth: 1,
          width: '100%', // Make the line span the entire width of the nav
          marginTop: 10, // Add some space above the line
        }} />
      </View>
      <View style={[styles.mainContent, { backgroundColor: theme.background }]}>
        <Slot />
      </View>
    </View>
  );
}

type DesktopNavItemProps = {
  title: string;
  href: LinkProps['href'];
  iconName: keyof typeof Ionicons.glyphMap;
  theme: typeof THEMES[keyof typeof THEMES];
};

function DesktopNavItem({ title, href, iconName, theme }: DesktopNavItemProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  const isActive = pathname.startsWith(typeof href === 'string' ? href : href.pathname);
  const backgroundColor = isActive
    ? theme.selection
    : hovered
    ? theme.hover
    : 'transparent';

  const textColor = isActive ? theme.contrast : theme.text;

  return (
    <Link href={href} asChild>
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.navItemDesktop,
          {
            backgroundColor: pressed ? theme.primary : backgroundColor,
            borderColor: isActive ? theme.primary : 'transparent', // Border color
            borderWidth: 2, // Border width
          },
        ]}
      >
        <View style={styles.navItemContent}>
          <Ionicons name={iconName} size={40} color={textColor} style={styles.iconStyle} />
          <Text style={[styles.navTextDesktop, { color: textColor }]}>
            {title}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sideNav: {
    width: 256,
    paddingTop: 5,
    paddingLeft: 16,
    paddingRight: 16,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    gap: 8,
  },
  mainContent: {
    flex: 1,
  },
  logoContainer: {
    marginBottom: 16,
    width: '100%',
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  navItemDesktop: {
    borderRadius: 8,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconStyle: {
    width: 40,
    marginRight: 12,
  },
  navTextDesktop: {
    fontSize: 20, // Increased font size
    fontWeight: '600',
  },
});