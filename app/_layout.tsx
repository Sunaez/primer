import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProvider, useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import OnboardingModal from '@/components/Onboarding/OnboardingModal';

const ONBOARDING_STORAGE_KEY = 'primer:onboarding-complete';

function RootContent({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { user, loading } = useUserContext();
  // Use the user's theme if available, otherwise default to Dark.
  const currentTheme = THEMES[user ? user.theme : 'Dark'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {(loading || !fontsLoaded) && (
        <View style={[styles.loadingOverlay, { backgroundColor: currentTheme.background }]}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

// This component manages the onboarding state and navigation.
function AppContainer({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { user, loading } = useUserContext();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOnboardingState() {
      try {
        const storedValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (mounted) {
          setOnboardingCompleted(storedValue === 'true');
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      } finally {
        if (mounted) {
          setOnboardingReady(true);
        }
      }
    }

    loadOnboardingState();

    return () => {
      mounted = false;
    };
  }, []);

  const handleOnboardingComplete = async () => {
    setOnboardingCompleted(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  return (
    <>
      <RootContent fontsLoaded={fontsLoaded} />
      {fontsLoaded && onboardingReady && !loading && !user && !onboardingCompleted && (
        <OnboardingModal visible={true} onClose={handleOnboardingComplete} />
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fontTimeout = setTimeout(() => {
      console.warn('Font loading timed out; continuing with fallback fonts.');
      if (mounted) {
        setFontsLoaded(true);
      }
    }, 5000);

    async function loadFonts() {
      try {
        await Font.loadAsync({
          Parkinsans: require('@/assets/fonts/Parkinsans.ttf'),
        });
        if (mounted) {
          setFontsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading fonts', error);
        // Fallback: even if fonts fail to load, continue rendering the app.
        if (mounted) {
          setFontsLoaded(true);
        }
      } finally {
        clearTimeout(fontTimeout);
      }
    }
    loadFonts();

    return () => {
      mounted = false;
      clearTimeout(fontTimeout);
    };
  }, []);

  return (
    <UserProvider>
      <AppContainer fontsLoaded={fontsLoaded} />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export { RootContent };
