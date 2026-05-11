import React, { useMemo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';

type MobileNavBarProps = {
  theme: typeof THEMES[keyof typeof THEMES];
};

function AnimatedTabIcon({
  name,
  color,
  focused,
  size,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  size: number;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(focused ? 1.08 : 1, { duration: 180 }) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation, theme, profilePicture }: any) {
  return (
    <View style={styles.outerWrap}>
      <View
        style={[
          styles.dock,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border || theme.divider,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const labelMap: Record<string, string> = {
            index: 'Daily',
            freeplay: 'Freeplay',
            social: 'Social',
            friends: 'Friends',
            profile: 'Profile',
          };

          const tintMap: Record<string, string> = {
            index: theme.daily,
            freeplay: theme.freeplay,
            social: theme.social,
            friends: theme.friends,
            profile: theme.text,
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.85}
              style={[
                styles.tabButton,
                {
                  backgroundColor: focused ? theme.background : 'transparent',
                  borderColor: focused ? theme.border || theme.divider : 'transparent',
                },
              ]}
            >
              {route.name === 'profile' && profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profileImage} />
              ) : typeof options.tabBarIcon === 'function' ? (
                options.tabBarIcon({
                  color: tintMap[route.name] || theme.text,
                  focused,
                  size: 22,
                })
              ) : null}
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? theme.text : tintMap[route.name] || theme.text },
                ]}
              >
                {labelMap[route.name] || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MobileNavBar({ theme }: MobileNavBarProps) {
  const { user } = useUserContext();
  const profilePicture = user?.photoURL || null;
  const ICON_SIZE = 22;

  const screenOptions = useMemo(
    () => ({
      tabBarShowLabel: false,
      headerShown: false,
      tabBarStyle: {
        display: 'none' as const,
      },
    }),
    []
  );

  return (
    <Tabs
      screenOptions={screenOptions}
      tabBar={(props) => (
        <CustomTabBar {...props} theme={theme} profilePicture={profilePicture} />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="home-sharp"
              size={ICON_SIZE}
              color={theme.daily}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="freeplay"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="game-controller"
              size={ICON_SIZE}
              color={theme.freeplay}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="chatbubbles"
              size={ICON_SIZE}
              color={theme.social}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="people-circle"
              size={ICON_SIZE}
              color={theme.friends}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="person"
              size={ICON_SIZE}
              color={theme.text}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  dock: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  profileImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
