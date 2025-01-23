import React, { useState } from "react";
import { View, StyleSheet, Image, TextInput, Button, Alert } from "react-native";
import { Text, Card, IconButton } from "react-native-paper";
import Colors from "@/constants/Colors";
import { auth } from "@/components/firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and sign-up modes
  const [user, setUser] = useState(auth.currentUser); // Track logged-in user

  const handleAuthAction = async () => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created successfully!");
        setUser(auth.currentUser);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Logged in successfully!");
        setUser(auth.currentUser);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred.");
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      Alert.alert("Success", "Logged out successfully!");
      setUser(null);
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Card style={styles.card}>
        <Image
          source={require("@/assets/images/shrug_emoji.png")}
          style={styles.image}
        />
        <Card.Content>
          {user ? (
            <>
              <Text style={[styles.text, { color: Colors.text }]}>
                Welcome, {user.email || "User"}!
              </Text>
              <Button title="Logout" onPress={handleLogout} />
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.text}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.text}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Button
                title={isSignUp ? "Sign Up" : "Log In"}
                onPress={handleAuthAction}
              />
              <Text
                style={[styles.toggleText, { color: Colors.text }]}
                onPress={() => setIsSignUp((prev) => !prev)}
              >
                {isSignUp
                  ? "Already have an account? Log in"
                  : "Don't have an account? Sign up"}
              </Text>
            </>
          )}
        </Card.Content>
      </Card>
      <IconButton icon="cog" size={24} onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "90%",
    padding: 16,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  text: {
    fontSize: 18,
    marginBottom: 16,
  },
  toggleText: {
    marginTop: 10,
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  input: {
    height: 40,
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontFamily: 'Parkinsans', // Apply correct font
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
});

