// MobileNavBar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Image, TouchableOpacity, LayoutChangeEvent, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/components/firebaseConfig';
import THEMES from '@/constants/themes';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

type MobileNavBarProps = {
  theme: typeof THEMES[keyof typeof THEMES];
};

// A small animated icon component for each tab icon
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
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withTiming(focused ? 1.1 : 1, { duration: 200 }) }],
    };
  });
  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

// A custom tab bar with a little animated line on top
function CustomTabBar({ state, descriptors, navigation, theme }: any) {
  // We'll store widths of each tab so we can animate the line horizontally
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const translateX = useSharedValue(0);

  // Whenever active tab changes, move the line
  React.useEffect(() => {
    if (tabWidths.length === state.routes.length) {
      let offset = 0;
      for (let i = 0; i < state.index; i++) {
        offset += tabWidths[i] || 0;
      }
      translateX.value = withTiming(offset, { duration: 250 });
    }
  }, [state.index, tabWidths]);

  // Capture the width of each tab
  const onLayoutTab = (index: number) => (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setTabWidths((prev) => {
      const updated = [...prev];
      updated[index] = width;
      return updated;
    });
  };

  // Animated top line style
  const animatedLineStyle = useAnimatedStyle(() => {
    const currentTabWidth = tabWidths[state.index] || 0;
    return {
      width: currentTabWidth,
      transform: [{ translateX: translateX.value }],
      backgroundColor: theme.contrast,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* The little line at the top */}
      <Animated.View style={[styles.indicator, animatedLineStyle]} />
      {/* Row of tabs */}
      <View style={styles.row}>
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

          // Use the same icon if provided, or fallback
          const iconName = (options as any).iconName || 'alert-circle';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLayout={onLayoutTab(index)}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              {/* If there's a custom tabBarIcon function, use it. Otherwise fallback */}
              {typeof options.tabBarIcon === 'function' ? (
                options.tabBarIcon({
                  color: theme.contrast,
                  focused,
                  size: 28,
                })
              ) : (
                <Ionicons
                  name={iconName}
                  size={28}
                  color={theme.contrast}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MobileNavBar({ theme }: MobileNavBarProps) {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      getDoc(doc(db, 'profile', uid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.photoURL) {
              setProfilePicture(data.photoURL);
            }
          }
        })
        .catch((error) => console.error('Error fetching profile picture:', error));
    }
  }, []);

  const ICON_SIZE = 28;

  const screenOptions = useMemo(
    () => ({
      tabBarShowLabel: false,
      headerShown: false,
      tabBarStyle: {
        backgroundColor: theme.background,
        // Control overall height here
        height: 50,
        borderTopWidth: 1,
        borderTopColor: theme.border || '#ccc',
      },
    }),
    [theme]
  );

  return (
    <Tabs
      screenOptions={screenOptions}
      // We override the default tab bar to draw our own line on top
      tabBar={(props) => <CustomTabBar {...props} theme={theme} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          // Removed invalid iconName property
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
          // Removed invalid iconName property
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
          // Removed invalid iconName property
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
          // Removed invalid iconName property
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
          // Removed invalid iconName property
          tabBarIcon: ({ focused }) =>
            profilePicture ? (
              <Animated.View
                style={{
                  transform: [{ scale: withTiming(focused ? 1.1 : 1, { duration: 200 }) }],
                }}
              >
                <Image
                  source={{ uri: profilePicture }}
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    borderRadius: ICON_SIZE / 2,
                  }}
                />
              </Animated.View>
            ) : (
              <AnimatedTabIcon
                name="person"
                size={ICON_SIZE}
                color={theme.contrast}
                focused={focused}
              />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: 2,
  },
});
