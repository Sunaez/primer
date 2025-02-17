import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Platform,
  Text,
} from "react-native";
import { Card, IconButton } from "react-native-paper";

import { auth, db } from "@/components/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { useThemeContext } from "@/context/ThemeContext";
import THEMES from "@/constants/themes";

export default function Profile() {
  const { themeName, setThemeName } = useThemeContext(); // From ThemeContext
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Basic auth states
  const [user, setUser] = useState(auth.currentUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Profile fields
  const [username, setUsername] = useState("");
  const [iconColor, setIconColor] = useState("#ff0000");
  const [bannerColor, setBannerColor] = useState("#333333");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [localThemeName, setLocalThemeName] = useState<keyof typeof THEMES>("Dark");

  // Stats example
  const [bestPerfectTime, setBestPerfectTime] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);

  // Toggle for showing/hiding custom fields
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Sign up / Log in
  const handleAuthAction = async () => {
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;

        // Create default doc
        await setDoc(doc(db, "users", uid), {
          username: "",
          iconColor: "#ff0000",
          bannerColor: "#333333",
          photoURL: null,
          theme: "Dark",
          stats: {
            bestPerfectTime: null,
            gamesPlayed: 0,
          },
        });

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
      setUser(null);
      resetProfileFields();
      Alert.alert("Success", "Logged out successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred.");
    }
  };

  // Reset local states
  function resetProfileFields() {
    setUsername("");
    setIconColor("#ff0000");
    setBannerColor("#333333");
    setPhotoURL(null);
    setBestPerfectTime(null);
    setGamesPlayed(null);
    setLocalThemeName("Dark");
    setThemeName("Dark");
    setShowCustom(false);
  }

  // Fetch user doc from Firestore
  async function fetchUserProfile() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      setUsername(data.username || "");
      setIconColor(data.iconColor || "#ff0000");
      setBannerColor(data.bannerColor || "#333333");
      setPhotoURL(data.photoURL || null);

      // local theme
      const userTheme = data.theme || "Dark";
      setLocalThemeName(userTheme);
      // also update global
      setThemeName(userTheme);

      if (data.stats) {
        setBestPerfectTime(data.stats.bestPerfectTime);
        setGamesPlayed(data.stats.gamesPlayed);
      }
    }
  }

  // Update user doc
  async function handleUpdateProfile() {
    if (!user) {
      Alert.alert("Not logged in", "Log in to update your profile.");
      return;
    }
    const uid = user.uid;
    try {
      await updateDoc(doc(db, "users", uid), {
        username,
        iconColor,
        bannerColor,
        photoURL,
        theme: localThemeName, // store the local selected theme
      });

      // also set global theme
      setThemeName(localThemeName);

      Alert.alert("Profile Updated", "Your profile has been updated!");
      setShowCustom(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not update profile.");
    }
  }

  // If logged out
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: THEMES.Dark.background }]}>
        <Card style={[styles.card, { backgroundColor: THEMES.Dark.surface }]}>
          <Card.Content>
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
            <Button
              title={isSignUp ? "Sign Up" : "Log In"}
              onPress={handleAuthAction}
            />
            <Text
              style={styles.toggleText}
              onPress={() => setIsSignUp((prev) => !prev)}
            >
              {isSignUp
                ? "Already have an account? Log in"
                : "Don't have an account? Sign up"}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // If logged in
  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Card style={[styles.card, { backgroundColor: currentTheme.surface }]}>
        {/* Banner behind the profile image */}
        <View style={styles.bannerContainer}>
          <View style={[styles.banner, { backgroundColor: bannerColor }]} />
          {/* Overlapping profile image */}
          <View style={styles.profileImageWrapper}>
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: iconColor }]} />
            )}
          </View>
        </View>

        <Card.Content>
          <Text style={[styles.text, { color: currentTheme.text }]}>
            {username ? `Welcome, ${username}!` : `Welcome, ${user.email || "User"}!`}
          </Text>

          {/* Basic Stats */}
          <Text style={[styles.statsText, { color: currentTheme.text }]}>
            Games Played: {gamesPlayed ?? 0}
          </Text>
          <Text style={[styles.statsText, { color: currentTheme.text }]}>
            Best Perfect Time: {bestPerfectTime ?? "--"}
          </Text>

          {/* One button to toggle custom UI */}
          <View style={{ marginVertical: 8 }}>
            <Button
              title={showCustom ? "Hide Customization" : "Customize Profile"}
              onPress={() => setShowCustom((prev) => !prev)}
            />
          </View>

          {/* If showCustom is true, show the fields */}
          {showCustom && (
            <View>
              <Text style={[styles.label, { color: currentTheme.text }]}>Username:</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                  },
                ]}
                value={username}
                onChangeText={setUsername}
              />

              <Text style={[styles.label, { color: currentTheme.text }]}>Icon Color (hex):</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                  },
                ]}
                value={iconColor}
                onChangeText={setIconColor}
              />

              <Text style={[styles.label, { color: currentTheme.text }]}>Banner Color (hex):</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                  },
                ]}
                value={bannerColor}
                onChangeText={setBannerColor}
              />

              <Text style={[styles.label, { color: currentTheme.text }]}>Profile Picture URL:</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                  },
                ]}
                value={photoURL || ""}
                onChangeText={(val) => setPhotoURL(val)}
              />

              <Text style={[styles.label, { color: currentTheme.text }]}>Theme:</Text>
              <View style={styles.themeRow}>
                {Object.keys(THEMES).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.themeOption,
                      {
                        borderColor: key === localThemeName ? currentTheme.primary : "gray",
                        backgroundColor: THEMES[key as keyof typeof THEMES].background,
                      },
                    ]}
                    onPress={() => setLocalThemeName(key as keyof typeof THEMES)}
                  >
                    <Text style={{ color: THEMES[key as keyof typeof THEMES].text }}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button title="Update Profile" onPress={handleUpdateProfile} />
            </View>
          )}

          <View style={{ height: 16 }} />
          <Button title="Logout" onPress={handleLogout} />
        </Card.Content>
      </Card>

      <IconButton
        icon="cog"
        size={24}
        onPress={() => {}}
        iconColor={currentTheme.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  card: {
    width: "90%",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  bannerContainer: {
    width: "100%",
    height: 120,
    position: "relative",
    marginBottom: 60, 
  },
  banner: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  profileImageWrapper: {
    position: "absolute",
    bottom: -40, // overlap
    left: "50%",
    transform: [{ translateX: -40 }], // half of the image width
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  text: {
    fontSize: 18,
    marginTop: 48, // to compensate for the overlap
    marginBottom: 8,
  },
  statsText: {
    fontSize: 15,
    marginBottom: 2,
  },
  toggleText: {
    marginTop: 10,
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
    color: "#fff",
  },
  label: {
    marginTop: 10,
    fontSize: 14,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  themeRow: {
    flexDirection: "row",
    marginVertical: 8,
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  themeOption: {
    width: 80,
    height: 40,
    margin: 4,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
