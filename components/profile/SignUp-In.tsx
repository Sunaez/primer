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
import { useThemeContext } from "@/context/ThemeContext";
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

  // Get current theme from context
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Function to generate a random username using adjectives, names, and a random number
  function generateRandomUsername() {
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomName =
      names[Math.floor(Math.random() * names.length)];
    // Generate a random number between 2 and 99 (1 and 100 not inclusive)
    const randomNumber = Math.floor(Math.random() * 98) + 2;
    return `${randomAdjective}${randomName}${randomNumber}`;
  }

  const handleAuthAction = async () => {
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const uid = userCred.user.uid;
        const randomUsername = generateRandomUsername();
        await setDoc(doc(db, "profile", uid), {
          username: randomUsername,
          bannerColor: "#333333",
          photoURL: null,
          theme: "Dark",
          friends: {
            friends: [],
            friendRequests: [],
            blocked: [],
          },
        });
        Alert.alert(
          "Success",
          `Account created successfully!\nYour temporary username is "${randomUsername}". Change it in your profile.`
        );
        onAuthSuccess();
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;
        const profileRef = doc(db, "profile", uid);
        const snap = await getDoc(profileRef);
        if (!snap.exists()) {
          const randomUsername = generateRandomUsername();
          await setDoc(profileRef, {
            username: randomUsername,
            bannerColor: "#333333",
            photoURL: null,
            theme: "Dark",
            friends: {
              friends: [],
              friendRequests: [],
              blocked: [],
            },
          });
        }
        Alert.alert("Success", "Logged in successfully!");
        onAuthSuccess();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred.");
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
