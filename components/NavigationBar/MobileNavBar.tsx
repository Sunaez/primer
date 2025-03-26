// /components/NavigationBar/MobileNavBar.tsx
import React, { useState, useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/components/firebaseConfig';
import THEMES from '@/constants/themes';

type MobileNavBarProps = {
  theme: typeof THEMES[keyof typeof THEMES];
};

export default function MobileNavBar({ theme }: MobileNavBarProps) {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Fetch profile picture if user is logged in
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

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false, // Remove text labels
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondary,
        tabBarActiveBackgroundColor: theme.selection,
        tabBarInactiveBackgroundColor: theme.background,
        tabBarStyle: {
          backgroundColor: theme.background,
          height: 60,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: theme.border || '#ccc',
        },
        headerShown: false,
      }}
    >
      {/* Daily */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-sharp" size={50} color={color} />
          ),
        }}
      />

      {/* Freeplay */}
      <Tabs.Screen
        name="freeplay"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="game-controller" size={50} color={color} />
          ),
        }}
      />

      {/* Social */}
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={50} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) =>
            profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
            ) : (
              <Ionicons name="person" size={50} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
