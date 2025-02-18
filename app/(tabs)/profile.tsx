import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Text,
  ScrollView,
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
  deleteDoc,
} from "firebase/firestore";
import { useThemeContext } from "@/context/ThemeContext";
import THEMES from "@/constants/themes";

export default function Profile() {
  // ---- THEME HOOKS ----
  const { themeName, setThemeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // ---- AUTH & PROFILE STATES ----
  const [user, setUser] = useState(auth.currentUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Profile doc fields
  const [username, setUsername] = useState("");
  const [bannerColor, setBannerColor] = useState("#333333");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [localThemeName, setLocalThemeName] = useState<keyof typeof THEMES>("Dark");

  // Example stats
  const [bestPerfectTime, setBestPerfectTime] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);

  // Toggles
  const [showCustom, setShowCustom] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");

  // Once the user is set, fetch the doc
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // ---- AUTH: SIGN UP / LOGIN ----
  const handleAuthAction = async () => {
    try {
      if (isSignUp) {
        // Create user in Auth
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;

        // Create doc with defaults
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
        setUser(auth.currentUser);
      } else {
        // Log in existing user
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;

        // Check if doc exists, if not create it
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
        setUser(auth.currentUser);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred.");
    }
  };

  // ---- LOGOUT ----
  const handleLogout = async () => {
    try {
      await auth.signOut();
      resetProfileFields();
      setUser(null);
      Alert.alert("Success", "Logged out successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred.");
    }
  };

  function resetProfileFields() {
    setUsername("");
    setBannerColor("#333333");
    setPhotoURL(null);
    setBestPerfectTime(null);
    setGamesPlayed(null);
    setLocalThemeName("Dark");
    setThemeName("Dark");
    setShowCustom(false);
    setShowDeleteConfirm(false);
    setDeleteEmailInput("");
  }

  // ---- FETCH PROFILE DOC ----
  async function fetchUserProfile() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const snap = await getDoc(doc(db, "profile", uid));
    if (snap.exists()) {
      const data = snap.data();
      setUsername(data.username || "");
      setBannerColor(data.bannerColor || "#333333");
      setPhotoURL(data.photoURL || null);

      const userTheme = data.theme || "Dark";
      setLocalThemeName(userTheme);
      setThemeName(userTheme);

      if (data.stats) {
        setBestPerfectTime(data.stats.bestPerfectTime);
        setGamesPlayed(data.stats.gamesPlayed);
      }
    } else {
      console.log("Profile doc not found");
    }
  }

  // ---- UPDATE PROFILE ----
  async function handleUpdateProfile() {
    if (!user) {
      Alert.alert("Not logged in", "Log in to update your profile.");
      return;
    }

    const uid = user.uid;
    await updateDoc(doc(db, "profile", uid), {
      username,
      bannerColor,
      photoURL,
      theme: localThemeName,
    });

    // update global theme
    setThemeName(localThemeName);

    Alert.alert("Profile Updated", "Your profile has been updated!");
    setShowCustom(false);
  }

  // ---- DELETE PROFILE ----
  function toggleDeleteConfirm() {
    // Show/hide the mini form that asks user to confirm their email
    setShowDeleteConfirm((prev) => !prev);
    setDeleteEmailInput("");
  }

  async function handleDeleteConfirm() {
    if (!user || !user.email) {
      Alert.alert("Not logged in", "No user to delete.");
      return;
    }

    // Basic check: typed email must match user's email
    if (deleteEmailInput.trim().toLowerCase() !== user.email.toLowerCase()) {
      Alert.alert("Invalid Email", "Entered email does not match your account email.");
      return;
    }

    try {
      const uid = user.uid;

      // 1) delete doc
      await deleteDoc(doc(db, "profile", uid));

      // 2) delete auth account
      await user.delete();

      Alert.alert("Deleted", "Your profile and account have been deleted.");
      resetProfileFields();
      setUser(null);
    } catch (err: any) {
      // If re-auth needed or some other error
      Alert.alert("Error Deleting Account", err.message || "Could not delete account.");
    }
  }

  // ---- IF USER NOT LOGGED IN ----
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

  // ---- IF USER LOGGED IN ----
  const themeStyles = {
    backgroundColor: currentTheme.background,
    textColor: currentTheme.text,
    cardColor: currentTheme.surface,
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ alignItems: "center" }}>
        <Card style={[styles.card, { backgroundColor: themeStyles.cardColor }]}>
          {/* Banner + profile image */}
          <View style={styles.bannerContainer}>
            <View style={[styles.banner, { backgroundColor: bannerColor }]} />
            <View style={styles.profileImageWrapper}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.profileImage} resizeMode="cover" />
              ) : (
                <View style={[styles.profileImage, { backgroundColor: "#999" }]} />
              )}
            </View>
          </View>

          <Card.Content>
            <Text style={[styles.text, { color: themeStyles.textColor }]}>
              {username ? `Welcome, ${username}!` : `Welcome, ${user.email}`}
            </Text>

            <Text style={[styles.statsText, { color: themeStyles.textColor }]}>
              Games Played: {gamesPlayed ?? 0}
            </Text>
            <Text style={[styles.statsText, { color: themeStyles.textColor }]}>
              Best Perfect Time: {bestPerfectTime ?? "--"}
            </Text>

            {/* Customize Profile */}
            <View style={{ marginVertical: 8 }}>
              <Button
                title={showCustom ? "Hide Customization" : "Customize Profile"}
                onPress={() => setShowCustom(!showCustom)}
              />
            </View>

            {showCustom && (
              <View>
                <Text style={[styles.label, { color: themeStyles.textColor }]}>Username:</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor },
                  ]}
                  value={username}
                  onChangeText={setUsername}
                />

                <Text style={[styles.label, { color: themeStyles.textColor }]}>Banner Color (hex):</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor },
                  ]}
                  value={bannerColor}
                  onChangeText={setBannerColor}
                />

                <Text style={[styles.label, { color: themeStyles.textColor }]}>Profile Picture URL:</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor },
                  ]}
                  value={photoURL || ""}
                  onChangeText={(val) => setPhotoURL(val)}
                />

                <Text style={[styles.label, { color: themeStyles.textColor }]}>Theme:</Text>
                <View style={styles.themeRow}>
                  {Object.keys(THEMES).map(key => (
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
                      <Text style={{ color: THEMES[key as keyof typeof THEMES].text }}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button title="Update Profile" onPress={handleUpdateProfile} />
              </View>
            )}

            <View style={{ height: 16 }} />
            <Button title="Logout" onPress={handleLogout} />

            {/* Delete account */}
            <View style={{ height: 16 }} />
            {!showDeleteConfirm ? (
              <Button
                title="Delete Account"
                color="red"
                onPress={toggleDeleteConfirm}
              />
            ) : (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.label, { color: themeStyles.textColor }]}>
                  Type your email to confirm account deletion:
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor },
                  ]}
                  placeholder="Enter your email"
                  value={deleteEmailInput}
                  onChangeText={setDeleteEmailInput}
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Button title="Cancel" onPress={toggleDeleteConfirm} />
                  <Button title="Confirm Delete" color="red" onPress={handleDeleteConfirm} />
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <IconButton
        icon="cog"
        size={24}
        onPress={() => {}}
        iconColor={currentTheme.primary}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    width: "90%",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
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
    bottom: -40,
    left: "50%",
    transform: [{ translateX: -40 }],
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  text: {
    fontSize: 18,
    marginTop: 48,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 15,
    marginBottom: 2,
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
    width: "100%",
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
  toggleText: {
    marginTop: 10,
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
    color: "#fff",
  },
});
