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
  Dimensions,
} from "react-native";
import { IconButton } from "react-native-paper";
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
  // Local theme for Firestore update (while global theme updates immediately)
  const [localThemeName, setLocalThemeName] = useState<keyof typeof THEMES>("Dark");

  // Example stats
  const [bestPerfectTime, setBestPerfectTime] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);

  // Toggles
  const [showCustom, setShowCustom] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");

  // Responsive layout
  const screenWidth = Dimensions.get("window").width;
  const isMobile = screenWidth < 768;

  // Fetch profile on login
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // ---- AUTH: SIGN UP / LOGIN ----
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
        setUser(auth.currentUser);
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
      // Reset global theme on sign out
      setThemeName("Dark");
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
      // Update global theme immediately
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
    Alert.alert("Profile Updated", "Your profile has been updated!");
    setShowCustom(false);
  }

  // ---- DELETE PROFILE ----
  function toggleDeleteConfirm() {
    setShowDeleteConfirm((prev) => !prev);
    setDeleteEmailInput("");
  }

  async function handleDeleteConfirm() {
    if (!user || !user.email) {
      Alert.alert("Not logged in", "No user to delete.");
      return;
    }
    if (deleteEmailInput.trim().toLowerCase() !== user.email.toLowerCase()) {
      Alert.alert("Invalid Email", "Entered email does not match your account email.");
      return;
    }
    try {
      const uid = user.uid;
      await deleteDoc(doc(db, "profile", uid));
      await user.delete();
      Alert.alert("Deleted", "Your profile and account have been deleted.");
      resetProfileFields();
      setUser(null);
    } catch (err: any) {
      Alert.alert("Error Deleting Account", err.message || "Could not delete account.");
    }
  }

  // ---- IF USER NOT LOGGED IN ----
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: THEMES.Dark.background }]}>
        <View style={styles.authContainer}>
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
      </View>
    );
  }

  const themeStyles = {
    backgroundColor: currentTheme.background,
    textColor: currentTheme.text,
    cardColor: currentTheme.surface,
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Banner Section */}
      <View style={styles.bannerContainer}>
        <View style={[styles.banner, { backgroundColor: bannerColor }]} />
        <View
          style={[
            styles.profileImageWrapper,
            {
              left: isMobile ? "50%" : 20,
              transform: isMobile ? [{ translateX: -40 }] : [],
            },
          ]}
        >
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profileImage} resizeMode="cover" />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: "#999" }]} />
          )}
        </View>
      </View>

      {/* Profile Info */}
      <ScrollView contentContainerStyle={styles.infoContainer}>
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
              style={[styles.input, { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor }]}
              value={username}
              onChangeText={setUsername}
            />
            <Text style={[styles.label, { color: themeStyles.textColor }]}>Banner Color (hex):</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor }]}
              value={bannerColor}
              onChangeText={setBannerColor}
            />
            <Text style={[styles.label, { color: themeStyles.textColor }]}>Profile Picture URL:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor }]}
              value={photoURL || ""}
              onChangeText={(val) => setPhotoURL(val)}
            />
            <Text style={[styles.label, { color: themeStyles.textColor }]}>Theme:</Text>
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
                  onPress={() => {
                    const newTheme = key as keyof typeof THEMES;
                    setLocalThemeName(newTheme);
                    setThemeName(newTheme);
                  }}
                >
                  <Text style={{ color: THEMES[key as keyof typeof THEMES].text, fontFamily: "Parkinsans" }}>
                    {key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Update Profile" onPress={handleUpdateProfile} />
          </View>
        )}

        {/* Button Row for Logout & Delete Account */}
        <View style={styles.buttonRow}>
          <View style={styles.buttonContainer}>
            <Button title="Logout" onPress={handleLogout} />
          </View>
          <View style={styles.buttonContainer}>
            {!showDeleteConfirm ? (
              <Button title="Delete Account" color="red" onPress={toggleDeleteConfirm} />
            ) : null}
          </View>
        </View>

        {showDeleteConfirm && (
          <View style={styles.deleteContainer}>
            <Text style={[styles.label, { color: themeStyles.textColor }]}>
              Type your email to confirm account deletion:
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor }]}
              placeholder="Enter your email"
              value={deleteEmailInput}
              onChangeText={setDeleteEmailInput}
            />
            <View style={styles.buttonRow}>
              <View style={styles.buttonContainer}>
                <Button title="Cancel" onPress={toggleDeleteConfirm} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="Confirm Delete" color="red" onPress={handleDeleteConfirm} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      <IconButton icon="cog" size={24} onPress={() => {}} iconColor={currentTheme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    padding: 16,
  },
  bannerContainer: {
    width: "100%",
    height: 200,
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  profileImageWrapper: {
    position: "absolute",
    bottom: -40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
  },
  infoContainer: {
    padding: 16,
    paddingTop: 56,
  },
  text: {
    fontSize: 18,
    fontFamily: "Parkinsans",
    marginTop: 16,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 15,
    fontFamily: "Parkinsans",
    marginBottom: 2,
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: "Parkinsans",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 6,
    paddingHorizontal: 8,
    width: "100%",
    fontFamily: "Parkinsans",
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
    fontFamily: "Parkinsans",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
  },
  buttonContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  deleteContainer: {
    marginTop: 16,
  },
});
