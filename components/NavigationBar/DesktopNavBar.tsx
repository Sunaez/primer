import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Slot, Link, LinkProps, usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';

type DesktopNavBarProps = {
  theme: typeof THEMES[keyof typeof THEMES];
};

const NAV_LINKS = [
  { title: 'Daily', href: '/(tabs)', iconName: 'home-sharp', colorKey: 'daily' },
  { title: 'Freeplay', href: '/(tabs)/freeplay', iconName: 'game-controller', colorKey: 'freeplay' },
  { title: 'Social', href: '/(tabs)/social', iconName: 'chatbubbles', colorKey: 'social' },
  { title: 'Friends', href: '/(tabs)/friends', iconName: 'people-circle', colorKey: 'friends' },
  { title: 'Profile', href: '/(tabs)/profile', iconName: 'person', colorKey: 'text' },
] as const;

export default function DesktopNavBar({ theme }: DesktopNavBarProps) {
  const { user } = useUserContext();

  return (
    <View style={[styles.shell, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.sideNav,
          { backgroundColor: theme.surface, borderRightColor: theme.border || theme.divider },
        ]}
      >
        <View style={styles.brandBlock}>
          <Text style={[styles.brandName, { color: theme.text }]}>Primer</Text>
          <Text style={[styles.brandDescription, { color: theme.text }]}>
            Daily training, freeplay reps, and score tracking in one place.
          </Text>
        </View>

        <View style={styles.linkGroup}>
          {NAV_LINKS.map((link) => (
            <DesktopNavItem
              key={link.title}
              title={link.title}
              href={link.href}
              iconName={link.iconName}
              theme={theme}
              accentColor={theme[link.colorKey]}
              profilePicture={link.title === 'Profile' ? user?.photoURL : undefined}
            />
          ))}
        </View>

        <View
          style={[
            styles.footerCard,
            { backgroundColor: theme.background, borderColor: theme.border || theme.divider },
          ]}
        >
          <Text style={[styles.footerTitle, { color: theme.text }]}>
            {user?.username || 'Guest mode'}
          </Text>
          <Text style={[styles.footerCopy, { color: theme.text }]}>
            {user
              ? `${user.friends?.friends?.length || 0} friends connected`
              : 'Sign in from Profile to save streaks and social activity.'}
          </Text>
        </View>
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
  accentColor: string;
  profilePicture?: string | null;
};

function DesktopNavItem({
  title,
  href,
  iconName,
  theme,
  accentColor,
  profilePicture,
}: DesktopNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(typeof href === 'string' ? href : (href as any).pathname);
  const hoverValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isActive
      ? theme.background
      : interpolateColor(hoverValue.value, [0, 1], ['transparent', theme.background]),
    transform: [{ scale: withTiming(hoverValue.value ? 1.01 : 1, { duration: 180 }) }],
  }));

  return (
    <Link href={href} asChild>
      <Pressable
        onHoverIn={() => {
          hoverValue.value = withTiming(1, { duration: 180 });
        }}
        onHoverOut={() => {
          hoverValue.value = withTiming(0, { duration: 180 });
        }}
        style={[
          styles.navItem,
          {
            borderColor: isActive ? accentColor : 'transparent',
          },
        ]}
      >
        <Animated.View style={[styles.navInner, animatedStyle]}>
          <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>
            {title === 'Profile' && profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profileImage} />
            ) : (
              <Ionicons name={iconName} size={18} color="#fff" />
            )}
          </View>
          <View style={styles.linkCopy}>
            <Text style={[styles.navText, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.navSubtext, { color: theme.text }]}>
              {title === 'Daily'
                ? 'Two focused rounds'
                : title === 'Freeplay'
                ? 'Practice any game'
                : title === 'Social'
                ? 'Compare with friends'
                : title === 'Friends'
                ? 'Manage your circle'
                : 'Stats and identity'}
            </Text>
          </View>
          {isActive ? <View style={[styles.activeBar, { backgroundColor: accentColor }]} /> : null}
        </Animated.View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  sideNav: {
    width: 300,
    borderRightWidth: 1,
    padding: 18,
  },
  brandBlock: {
    marginBottom: 18,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  brandDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    fontFamily: 'Parkinsans',
  },
  linkGroup: {
    gap: 8,
  },
  navItem: {
    borderWidth: 1,
    borderRadius: 22,
  },
  navInner: {
    minHeight: 74,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
    position: 'relative',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  linkCopy: {
    flex: 1,
  },
  navText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  navSubtext: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.72,
    fontFamily: 'Parkinsans',
  },
  activeBar: {
    width: 6,
    height: 34,
    borderRadius: 999,
  },
  footerCard: {
    marginTop: 'auto',
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  footerCopy: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.78,
    fontFamily: 'Parkinsans',
  },
  mainContent: {
    flex: 1,
  },
});
