import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import { UserProvider, useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import OnboardingModal from '@/components/Onboarding/OnboardingModal';

function RootContent() {
  const { user, loading } = useUserContext();
  // Use the user's theme if available, otherwise default to Dark.
  const currentTheme = THEMES[user ? user.theme : 'Dark'];

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaView>
  );
}

// This component manages the onboarding state and navigation.
function AppContainer() {
  const { user } = useUserContext();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const router = useRouter();

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
    // Navigate to the main interface when onboarding completes.
    router.push('/(tabs)');
  };

  return (
    <>
      <RootContent />
      {(!user && !onboardingCompleted) && (
        <OnboardingModal visible={true} onClose={handleOnboardingComplete} />
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Parkinsans: require('@/assets/fonts/Parkinsans.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts', error);
        // Fallback: even if fonts fail to load, continue rendering the app.
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <UserProvider>
      <AppContainer />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export { RootContent };
