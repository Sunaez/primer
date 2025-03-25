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

type SignUpInProps = {
  // Called when the user successfully logs in or signs up.
  onAuthSuccess: () => void;
};

export default function SignUpIn({ onAuthSuccess }: SignUpInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuthAction = async () => {
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;
        await setDoc(doc(db, "profile", uid), {
          username: "",
          bannerColor: "#333333",
          photoURL: null,
          theme: "Dark",
          stats: {
            bestPerfectTime: null,
            gamesPlayed: 0,
          },
        });
        Alert.alert("Success", "Account created successfully!");
        onAuthSuccess();
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;
        const profileRef = doc(db, "profile", uid);
        const snap = await getDoc(profileRef);
        if (!snap.exists()) {
          await setDoc(profileRef, {
            username: "",
            bannerColor: "#333333",
            photoURL: null,
            theme: "Dark",
            stats: {
              bestPerfectTime: null,
              gamesPlayed: 0,
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#cccccc"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#cccccc"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isSignUp ? "Sign Up" : "Log In"} onPress={handleAuthAction} />
      <Text style={styles.toggleText} onPress={() => setIsSignUp((prev) => !prev)}>
        {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  toggleText: {
    marginTop: 10,
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
    color: "#fff",
  },
});
