// /components/NavigationBar/MobileNavBar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/components/firebaseConfig';
import THEMES from '@/constants/themes';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

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
  // Animated style for scaling
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

  // For mobile, we use the new icon colors per tab.
  const screenOptions = useMemo(
    () => ({
      tabBarShowLabel: false,
      tabBarActiveTintColor: theme.contrast,
      tabBarInactiveTintColor: theme.text,
      tabBarActiveBackgroundColor: theme.selection,
      tabBarInactiveBackgroundColor: theme.background,
      tabBarStyle: {
        backgroundColor: theme.background,
        height: 60,
        paddingHorizontal: 5,
        borderTopWidth: 1,
        borderTopColor: theme.border || '#ccc',
      },
      headerShown: false,
    }),
    [theme]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      {/* Daily */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="home-sharp" size={ICON_SIZE} color={focused ? theme.daily : theme.daily} focused={focused} />
          ),
        }}
      />

      {/* Freeplay */}
      <Tabs.Screen
        name="freeplay"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="game-controller" size={ICON_SIZE} color={focused ? theme.freeplay : theme.freeplay} focused={focused} />
          ),
        }}
      />

      {/* Social */}
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="chatbubbles" size={ICON_SIZE} color={focused ? theme.social : theme.social} focused={focused} />
          ),
        }}
      />

      {/* Friends */}
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="people-circle" size={ICON_SIZE} color={focused ? theme.friends : theme.friends} focused={focused} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) =>
            profilePicture ? (
              <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
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
              <AnimatedTabIcon name="person" size={ICON_SIZE} color={theme.text} focused={focused} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
