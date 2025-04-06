import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Slot, Link, LinkProps, usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
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
  { title: 'Social', href: '/(tabs)/social', iconName: 'chatbubbles' },
  { title: 'Friends', href: '/(tabs)/friends', iconName: 'people-circle' },
  { title: 'Profile', href: '/(tabs)/profile', iconName: 'person' },
] as const;

export default function DesktopNavBar({ theme }: DesktopNavBarProps) {
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);

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

function DesktopNavItem({
  title,
  href,
  iconName,
  theme,
  profilePicture,
}: DesktopNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(typeof href === 'string' ? href : (href as any).pathname);

  // Create a shared value for hover (0 = not hovered, 1 = hovered)
  const hoverValue = useSharedValue(0);

  // Animated style for hover using scale and background color interpolation.
  const animatedStyle = useAnimatedStyle(() => {
    const bgColor = isActive
      ? theme.selection
      : interpolateColor(hoverValue.value, [0, 1], ['transparent', theme.hover]);
    return {
      backgroundColor: bgColor,
      transform: [{ scale: 1 + 0.05 * hoverValue.value }],
    };
  });

  return (
    <Link href={href} asChild>
      <Pressable
        onHoverIn={() => {
          hoverValue.value = withTiming(1, { duration: 200 });
        }}
        onHoverOut={() => {
          hoverValue.value = withTiming(0, { duration: 200 });
        }}
        style={({ pressed }) => [
          styles.navItemDesktop,
          {
            borderColor: isActive ? theme.primary : 'transparent',
            borderWidth: 2,
          },
          pressed && { backgroundColor: theme.primary },
        ]}
      >
        <Animated.View style={animatedStyle}>
          <View style={styles.navItemContent}>
            {title === 'Profile' && profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profileIcon} />
            ) : (
              <Ionicons
                name={iconName}
                size={40}
                color={isActive ? theme.contrast : theme.text}
                style={styles.iconStyle}
              />
            )}
            <Text style={[styles.navTextDesktop, { color: isActive ? theme.contrast : theme.text }]}>
              {title}
            </Text>
          </View>
        </Animated.View>
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
