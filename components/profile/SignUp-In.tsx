// /components/profile/SignUp-In.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Button,
  Text,
  Alert,
} from "react-native";
import { auth, db } from "@/components/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useUserContext, useThemeContext, UserProfile, ThemeName } from "@/context/UserContext";
import THEMES from "@/constants/themes";

// Import adjectives and names from your UsernameGenerator constants
import adjectives from "@/constants/UsernameGenerator/adjectives";
import names from "@/constants/UsernameGenerator/names";

type SignUpInProps = {
  // Called when the user successfully logs in or signs up.
  onAuthSuccess: () => void;
};

export default function SignUpIn({ onAuthSuccess }: SignUpInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Use our unified context for theme (backward compatibility)
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { setUser } = useUserContext();

  // Function to generate a random username.
  function generateRandomUsername() {
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomName =
      names[Math.floor(Math.random() * names.length)];
    const randomNumber = Math.floor(Math.random() * 98) + 2;
    return `${randomAdjective}${randomName}${randomNumber}`;
  }

  const handleAuthAction = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Input Error", "Please provide a valid email and password.");
      return;
    }
    try {
      if (isSignUp) {
        // Sign Up Flow
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const uid = userCred.user.uid;
        const randomUsername = generateRandomUsername();
        // Define profileData and cast the theme property as ThemeName.
        const profileData: Omit<UserProfile, "uid"> = {
          username: randomUsername,
          bannerColor: "#333333",
          photoURL: null,
          theme: "Dark" as ThemeName,
          friends: {
            friends: [],
            friendRequests: [],
            blocked: [],
          },
        };
        await setDoc(doc(db, "profile", uid), profileData);
        // Update UserContext immediately.
        setUser({ uid, ...profileData });
        Alert.alert(
          "Success",
          `Account created successfully!\nYour temporary username is "${randomUsername}". Change it in your profile.`
        );
        onAuthSuccess();
      } else {
        // Sign In Flow
        const userCred = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const uid = userCred.user.uid;
        const profileRef = doc(db, "profile", uid);
        const snap = await getDoc(profileRef);
        if (!snap.exists()) {
          const randomUsername = generateRandomUsername();
          const profileData: Omit<UserProfile, "uid"> = {
            username: randomUsername,
            bannerColor: "#333333",
            photoURL: null,
            theme: "Dark" as ThemeName,
            friends: {
              friends: [],
              friendRequests: [],
              blocked: [],
            },
          };
          await setDoc(profileRef, profileData);
          setUser({ uid, ...profileData });
        }
        Alert.alert("Success", "Logged in successfully!");
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      Alert.alert("Error", error.message || "An error occurred. Please check your input or try again later.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <TextInput
        style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.text }]}
        placeholder="Email"
        placeholderTextColor={currentTheme.text}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.text }]}
        placeholder="Password"
        placeholderTextColor={currentTheme.text}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.buttonContainer}>
        <Button
          title={isSignUp ? "Sign Up" : "Log In"}
          onPress={handleAuthAction}
          color={currentTheme.primary}
        />
      </View>
      <Text
        style={[styles.toggleText, { color: currentTheme.text }]}
        onPress={() => setIsSignUp((prev) => !prev)}
      >
        {isSignUp
          ? "Already have an account? Log in"
          : "Don't have an account? Sign up"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: "center",
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
