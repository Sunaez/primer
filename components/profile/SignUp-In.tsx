import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { auth, db } from "@/components/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useUserContext, useThemeContext, UserProfile, ThemeName } from "@/context/UserContext";
import THEMES from "@/constants/themes";
import adjectives from "@/constants/UsernameGenerator/adjectives";
import names from "@/constants/UsernameGenerator/names";
import { Ionicons } from "@expo/vector-icons";

// Regex: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
// Simple email regex for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignUpInProps = {
  onAuthSuccess: () => void;
};

export default function SignUpIn({ onAuthSuccess }: SignUpInProps) {
  // Email/password inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Toggles for sign-up vs. login, and forgot-password mode
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // For theme and user context
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { setUser } = useUserContext();

  // A shared value to animate the password container’s height
  const passContainerHeight = useSharedValue(1); // 1 means fully visible, 0 means hidden

  // Animated style to interpolate container height between 0 and 60 (adjust as you wish)
  const passAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(passContainerHeight.value, [0, 1], [0, 60]);
    return {
      height,
      opacity: passContainerHeight.value,
      overflow: "hidden",
    };
  });

  // Toggle the forgot password mode
  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    // If forgetting password, hide the password container; otherwise, show it
    passContainerHeight.value = withTiming(isForgotPassword ? 1 : 0, { duration: 300 });
  };

  // Validate password meets the security requirements
  function validatePassword(pw: string) {
    return passwordRegex.test(pw);
  }

  // Validate email format
  function isValidEmail(email: string) {
    return emailRegex.test(email);
  }

  // Generate a random username (for new sign-ups)
  function generateRandomUsername() {
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomNumber = Math.floor(Math.random() * 98) + 2;
    return `${randomAdjective}${randomName}${randomNumber}`;
  }

  // Handle sign-up or login flow
  const handleAuthAction = async () => {
    if (!email.trim()) {
      Alert.alert("Input Error", "Please provide a valid email.");
      return;
    }
    if (!isForgotPassword && !password) {
      Alert.alert("Input Error", "Please provide a valid password.");
      return;
    }
    if (isSignUp && !isForgotPassword && !validatePassword(password)) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number."
      );
      return;
    }
    if (isSignUp && !isValidEmail(email.trim())) {
      Alert.alert("Input Error", "Please provide a valid email address.");
      return;
    }

    try {
      if (isForgotPassword) {
        // Forgot password flow
        await sendPasswordResetEmail(auth, email.trim());
        Alert.alert("Reset Email Sent", "Check your inbox for a password reset email.");
        toggleForgotPassword(); // hide forgot pass mode
        return;
      }

      if (isSignUp) {
        // Sign-up flow
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCred.user.uid;
        const randomUsername = generateRandomUsername();
        const profileData: Omit<UserProfile, "uid"> = {
          username: randomUsername,
          bannerColor: "#333333",
          photoURL: null,
          theme: "Dark" as ThemeName,
          friends: { friends: [], friendRequests: [], blocked: [] },
        };
        await setDoc(doc(db, "profile", uid), profileData);
        setUser({ uid, ...profileData });
        onAuthSuccess();
      } else {
        // Login flow
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCred.user.uid;
        const profileRef = doc(db, "profile", uid);
        const snap = await getDoc(profileRef);
        if (!snap.exists()) {
          // Create a default profile if none exists
          const randomUsername = generateRandomUsername();
          const profileData: Omit<UserProfile, "uid"> = {
            username: randomUsername,
            bannerColor: "#333333",
            photoURL: null,
            theme: "Dark" as ThemeName,
            friends: { friends: [], friendRequests: [], blocked: [] },
          };
          await setDoc(profileRef, profileData);
          setUser({ uid, ...profileData });
        }
        Alert.alert("Success", "Logged in successfully!");
        onAuthSuccess();
      }
    } catch (error: any) {
      // Email enumeration handling
      if (isSignUp && error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "This email is already in use.");
      } else if (!isSignUp && error.code === "auth/user-not-found") {
        Alert.alert("Error", "No account found with this email.");
      } else {
        console.error("Authentication error:", error);
        Alert.alert("Error", error.message || "Check your input or try again later.");
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Email Field (always visible) */}
      <TextInput
        style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.text }]}
        placeholder="Email"
        placeholderTextColor={currentTheme.text}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Email Validation Checklist for Sign Up */}
      {isSignUp && (
        <View style={styles.checklistContainer}>
          <View style={styles.checklistItem}>
            {isValidEmail(email.trim()) ? (
              <Ionicons name="checkmark-circle-outline" size={16} color="green" />
            ) : (
              <Ionicons name="close-circle-outline" size={16} color="red" />
            )}
            <Text style={styles.checklistText}> Valid Email Address</Text>
          </View>
        </View>
      )}

      {/* Password Field Container (animated) */}
      <Animated.View style={[styles.passwordContainer, passAnimatedStyle]}>
        {!isForgotPassword && (
          <TextInput
            style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.text }]}
            placeholder="Password"
            placeholderTextColor={currentTheme.text}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        )}
      </Animated.View>

      {/* Password Requirements Checklist for Sign Up */}
      {isSignUp && (
        <View style={styles.checklistContainer}>
          <View style={styles.checklistItem}>
            {password.length >= 8 ? (
              <Ionicons name="checkmark-circle-outline" size={16} color="green" />
            ) : (
              <Ionicons name="close-circle-outline" size={16} color="red" />
            )}
            <Text style={styles.checklistText}> At least 8 characters</Text>
          </View>
          <View style={styles.checklistItem}>
            {/[A-Z]/.test(password) ? (
              <Ionicons name="checkmark-circle-outline" size={16} color="green" />
            ) : (
              <Ionicons name="close-circle-outline" size={16} color="red" />
            )}
            <Text style={styles.checklistText}> At least one uppercase letter</Text>
          </View>
          <View style={styles.checklistItem}>
            {/[a-z]/.test(password) ? (
              <Ionicons name="checkmark-circle-outline" size={16} color="green" />
            ) : (
              <Ionicons name="close-circle-outline" size={16} color="red" />
            )}
            <Text style={styles.checklistText}> At least one lowercase letter</Text>
          </View>
          <View style={styles.checklistItem}>
            {/\d/.test(password) ? (
              <Ionicons name="checkmark-circle-outline" size={16} color="green" />
            ) : (
              <Ionicons name="close-circle-outline" size={16} color="red" />
            )}
            <Text style={styles.checklistText}> At least one number</Text>
          </View>
        </View>
      )}

      {/* Custom Sign In / Sign Up / Reset Password Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: currentTheme.primary }]}
        onPress={handleAuthAction}
      >
        <Text style={[styles.buttonText, { color: currentTheme.text }]}>
          {isForgotPassword ? "RESET PASSWORD" : isSignUp ? "Sign Up" : "Log In"}
        </Text>
      </TouchableOpacity>

      {/* Toggle between login & sign-up */}
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={[styles.toggleText, { color: currentTheme.text }]}>
          {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>

      {/* Toggle forgot password */}
      <TouchableOpacity onPress={toggleForgotPassword}>
        <Text style={[styles.toggleText, { color: currentTheme.text }]}>
          {isForgotPassword ? "I remember my password" : "I forgot my password"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: "center",
  },
  passwordContainer: {
    overflow: "hidden",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  checklistContainer: {
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  checklistText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  button: {
    marginVertical: 10,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
  },
  toggleText: {
    marginTop: 10,
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
  },
});
