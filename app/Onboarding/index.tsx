// /app/Onboarding/index.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Onboarding() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const router = useRouter();

  const handleGetStarted = () => {
    // Delay navigation to ensure the root layout is mounted.
    setTimeout(() => {
      router.push('/(tabs)');
    }, 0);
  };

  const handleHamburgerPress = () => {
    console.log('Hamburger pressed');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator
    >
      <View style={styles.header}>
        <Pressable onPress={handleHamburgerPress} style={styles.hamburgerButton}>
          <Ionicons name="menu-outline" size={30} color={currentTheme.text} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={[styles.heroTitle, { color: currentTheme.primary }]}>
          Welcome to Primer
        </Text>
        <Text style={[styles.heroSubtitle, { color: currentTheme.text }]}>
          Discover daily challenges, freeplay games, and an amazing community.
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: currentTheme.button }]}
          onPress={handleGetStarted}
        >
          <Text style={[styles.ctaButtonText, { color: currentTheme.buttonText }]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          How It Works
        </Text>
        <Text style={[styles.sectionText, { color: currentTheme.text }]}>
          Primer is your daily source of fun and engaging content. Here you can take on daily challenges,
          enjoy freeplay games to unwind, and interact with a vibrant social community.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          Features
        </Text>
        <Text style={[styles.sectionText, { color: currentTheme.text }]}>
          - Daily Challenges to keep you sharp{'\n'}
          - Freeplay Games for endless fun{'\n'}
          - Social interactions and friend networking
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: currentTheme.text }]}>
          Primer makes every day a new adventure. Ready to join the fun?
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  hamburgerButton: {
    padding: 6,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
});
