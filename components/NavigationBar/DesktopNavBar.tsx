// /components/NavigationBar/DesktopNavBar.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Slot, Link, LinkProps, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/components/firebaseConfig';
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
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);

  // If user is logged in, fetch the user's profile picture from Firestore.
  useEffect(() => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      getDoc(doc(db, 'profile', uid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfilePicture(data.photoURL || undefined);
          }
        })
        .catch((error) => console.error('Error fetching profile picture:', error));
    }
  }, []);

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
            // For the Profile link, use the fetched profile picture if available
            profilePicture={link.title === 'Profile' ? profilePicture : undefined}
          />
        ))}
        <View style={styles.divider} />
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
  profilePicture?: string;
};

function DesktopNavItem({ title, href, iconName, theme, profilePicture }: DesktopNavItemProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  const isActive = pathname.startsWith(typeof href === 'string' ? href : (href as any).pathname);
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
            borderColor: isActive ? theme.primary : 'transparent',
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.navItemContent}>
          {title === 'Profile' && profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileIcon} />
          ) : (
            <Ionicons name={iconName} size={40} color={textColor} style={styles.iconStyle} />
          )}
          <Text style={[styles.navTextDesktop, { color: textColor }]}>{title}</Text>
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
    paddingHorizontal: 10,
    alignItems: 'flex-start',
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
  divider: {
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    width: '100%',
    marginTop: 10,
  },
  mainContent: {
    flex: 1,
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
  },
  iconStyle: {
    width: 40,
    marginRight: 12,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  navTextDesktop: {
    fontSize: 20,
    fontWeight: '600',
  },
});
