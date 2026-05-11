import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Alert,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import { auth, db } from '@/components/firebaseConfig';
import {
  useUserContext,
  useThemeContext,
  UserProfile,
  ThemeName,
} from '@/context/UserContext';
import THEMES from '@/constants/themes';
import adjectives from '@/constants/UsernameGenerator/adjectives';
import names from '@/constants/UsernameGenerator/names';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignUpInProps = {
  onAuthSuccess: () => void;
};

function ChecklistItem({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <View style={styles.checklistItem}>
      <Ionicons
        name={met ? 'checkmark-circle-outline' : 'close-circle-outline'}
        size={16}
        color={met ? '#2e9b57' : '#d04a4a'}
      />
      <Text style={styles.checklistText}>{label}</Text>
    </View>
  );
}

export default function SignUpIn({ onAuthSuccess }: SignUpInProps) {
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { setUser } = useUserContext();

  const passContainerHeight = useSharedValue(1);

  useEffect(() => {
    passContainerHeight.value = withTiming(isForgotPassword ? 0 : 1, { duration: 260 });
  }, [isForgotPassword, passContainerHeight]);

  const passAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(passContainerHeight.value, [0, 1], [0, 76]),
    opacity: passContainerHeight.value,
    overflow: 'hidden',
  }));

  function validatePassword(pw: string) {
    return passwordRegex.test(pw);
  }

  function isValidEmail(emailValue: string) {
    return emailRegex.test(emailValue);
  }

  function generateRandomUsername() {
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomNumber = Math.floor(Math.random() * 98) + 2;
    return `${randomAdjective}${randomName}${randomNumber}`;
  }

  const handleAuthAction = async () => {
    if (!email.trim()) {
      Alert.alert('Input error', 'Please enter an email address.');
      return;
    }
    if (!isForgotPassword && !password) {
      Alert.alert('Input error', 'Please enter a password.');
      return;
    }
    if (isSignUp && !isForgotPassword && !validatePassword(password)) {
      Alert.alert(
        'Weak password',
        'Use at least 8 characters with 1 uppercase letter, 1 lowercase letter, and 1 number.'
      );
      return;
    }
    if (!isValidEmail(email.trim())) {
      Alert.alert('Input error', 'Please enter a valid email address.');
      return;
    }

    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email.trim());
        Alert.alert('Reset email sent', 'Check your inbox for the password reset link.');
        setIsForgotPassword(false);
        return;
      }

      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCred.user.uid;
        const profileData: Omit<UserProfile, 'uid'> = {
          username: generateRandomUsername(),
          bannerColor: '#333333',
          photoURL: null,
          theme: 'Dark' as ThemeName,
          friends: { friends: [], friendRequests: [], blocked: [] },
        };
        await setDoc(doc(db, 'profile', uid), profileData);
        setUser({ uid, ...profileData });
        onAuthSuccess();
        return;
      }

      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;
      const profileRef = doc(db, 'profile', uid);
      const snap = await getDoc(profileRef);
      if (!snap.exists()) {
        const profileData: Omit<UserProfile, 'uid'> = {
          username: generateRandomUsername(),
          bannerColor: '#333333',
          photoURL: null,
          theme: 'Dark' as ThemeName,
          friends: { friends: [], friendRequests: [], blocked: [] },
        };
        await setDoc(profileRef, profileData);
        setUser({ uid, ...profileData });
      }
      onAuthSuccess();
    } catch (error: any) {
      if (isSignUp && error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'That email is already in use.');
      } else if (!isSignUp && error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No account was found for that email.');
      } else {
        console.error('Authentication error:', error);
        Alert.alert('Error', error.message || 'Please try again later.');
      }
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.freeplay, currentTheme.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={width >= 920 ? { ...styles.hero, ...styles.heroWide } : styles.hero}
      >
        <Text style={styles.heroEyebrow}>Profile</Text>
        <Text style={styles.heroTitle}>Save your progress and make the app yours.</Text>
        <Text style={styles.heroDescription}>
          Accounts unlock streak tracking, social activity, friends, and profile customization.
        </Text>
      </LinearGradient>

      <View
        style={[
          styles.card,
          {
            backgroundColor: currentTheme.surface,
            borderColor: currentTheme.border,
            maxWidth: 620,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: currentTheme.text }]}>
          {isForgotPassword
            ? 'Reset your password'
            : isSignUp
            ? 'Create your account'
            : 'Log back in'}
        </Text>
        <Text style={[styles.cardDescription, { color: currentTheme.text }]}>
          {isForgotPassword
            ? 'We will send a reset link to your email.'
            : isSignUp
            ? 'Start with a generated username and personalize everything later.'
            : 'Jump back into your stats, streak, and social feed.'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              {
                color: currentTheme.text,
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.background,
              },
            ]}
            placeholder="Email"
            placeholderTextColor={currentTheme.text}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {isSignUp && !isForgotPassword ? (
            <View style={styles.checklistGroup}>
              <ChecklistItem met={isValidEmail(email.trim())} label="Valid email address" />
            </View>
          ) : null}

          <Animated.View style={[passAnimatedStyle]}>
            {!isForgotPassword ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: currentTheme.text,
                    borderColor: currentTheme.border,
                    backgroundColor: currentTheme.background,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={currentTheme.text}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            ) : null}
          </Animated.View>

          {isSignUp && !isForgotPassword ? (
            <View style={styles.checklistGroup}>
              <ChecklistItem met={password.length >= 8} label="At least 8 characters" />
              <ChecklistItem met={/[A-Z]/.test(password)} label="One uppercase letter" />
              <ChecklistItem met={/[a-z]/.test(password)} label="One lowercase letter" />
              <ChecklistItem met={/\d/.test(password)} label="One number" />
            </View>
          ) : null}

          <Pressable
            style={[styles.primaryButton, { backgroundColor: currentTheme.primary }]}
            onPress={handleAuthAction}
          >
            <Text style={styles.primaryButtonText}>
              {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Log In'}
            </Text>
          </Pressable>

          <View style={styles.linkGroup}>
            {!isForgotPassword ? (
              <Pressable onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={[styles.linkText, { color: currentTheme.text }]}>
                  {isSignUp
                    ? 'Already have an account? Log in'
                    : 'Need an account? Create one'}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setIsForgotPassword(!isForgotPassword)}>
              <Text style={[styles.linkText, { color: currentTheme.text }]}>
                {isForgotPassword ? 'Back to sign in' : 'Forgot your password?'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
    gap: 18,
  },
  hero: {
    borderRadius: 30,
    padding: 24,
  },
  heroWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 620,
  },
  heroEyebrow: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Parkinsans',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    marginTop: 10,
    fontFamily: 'Parkinsans',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    fontFamily: 'Parkinsans',
  },
  card: {
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  cardDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    fontFamily: 'Parkinsans',
  },
  form: {
    marginTop: 20,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Parkinsans',
    marginBottom: 12,
  },
  checklistGroup: {
    marginBottom: 12,
    gap: 6,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistText: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Parkinsans',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  linkGroup: {
    marginTop: 18,
    gap: 12,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontFamily: 'Parkinsans',
  },
});
