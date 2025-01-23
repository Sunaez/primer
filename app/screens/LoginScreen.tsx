import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { auth } from "@/components/firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and sign-up modes

  // Handle login or sign-up action
  const handleAuthAction = async () => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Logged in successfully!");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Something went wrong.";
      Alert.alert("Error", errorMessage);
    }
  };

  // Toggle between login and sign-up modes
  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? "Sign Up" : "Login"}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={isSignUp ? "Create Account" : "Login"}
        onPress={handleAuthAction}
      />
      <Text style={styles.toggleText}>
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
      </Text>
      <Button
        title={isSignUp ? "Switch to Login" : "Switch to Sign Up"}
        onPress={toggleAuthMode}
        color="#007BFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 40,
    width: "80%",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  toggleText: {
    marginTop: 15,
    fontSize: 14,
    color: "#666",
  },
});
