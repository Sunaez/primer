import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import THEMES from '@/constants/themes';

// If you prefer, you can define the links in an array. But here, we just map over them directly below.

type MobileNavBarProps = {
  theme: typeof THEMES[keyof typeof THEMES];
};

export default function MobileNavBar({ theme }: MobileNavBarProps) {
  return (
    <Tabs
      screenOptions={{
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
        tabBarItemStyle: {
          borderRightWidth: 1,
          borderRightColor: theme.border || '#ccc',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
      }}
    >
      {/* Daily */}
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

      {/* Freeplay */}
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

      {/* Social */}
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

      {/* Profile */}
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

const styles = StyleSheet.create({
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
