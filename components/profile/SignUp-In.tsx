// /components/profile/SignUp-In.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Button,
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

// Regex: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

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
        Alert.alert(
          "Success",
          `Account created successfully!\nYour temporary username is "${randomUsername}".`
        );
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
      {/* Password field container (animated) */}
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

      {/* Auth Button (Sign Up, Log In, or Reset Password) */}
      <View style={styles.buttonContainer}>
        <Button
          title={
            isForgotPassword
              ? "RESET PASSWORD"
              : isSignUp
              ? "Sign Up"
              : "Log In"
          }
          onPress={handleAuthAction}
          color={currentTheme.primary}
        />
      </View>

      {/* Toggle between login & sign-up */}
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={[styles.toggleText, { color: currentTheme.text }]}>
          {isSignUp
            ? "Already have an account? Log in"
            : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>

      {/* Toggle forgot password */}
      <TouchableOpacity onPress={toggleForgotPassword}>
        <Text style={[styles.toggleText, { color: currentTheme.text }]}>
          {isForgotPassword ? "Cancel forgot password" : "Forgot password?"}
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
  buttonContainer: {
    marginVertical: 10,
  },
  toggleText: {
    marginTop: 10,
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
  },
});
