import React from 'react';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: { backgroundColor: Colors.background },
        headerShown: false,
        tabBarLabelStyle: { fontFamily: 'Parkinsans' }, // Ensures consistent font for tab labels
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Daily' }} />
      <Tabs.Screen name="freeplay" options={{ title: 'Freeplay' }} />
      <Tabs.Screen name="social" options={{ title: 'Social' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
