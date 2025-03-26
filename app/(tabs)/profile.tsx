// Profile.tsx
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
import Ionicons from "@expo/vector-icons/Ionicons";
import { auth, db } from "@/components/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useThemeContext } from "@/context/ThemeContext";
import THEMES from "@/constants/themes";
import UserSettings from "@/components/profile/UserSettings";
import SignUpIn from "@/components/profile/SignUp-In";
import BannerChange from "@/components/profile/BannerChange";

export default function Profile() {
  // ---- THEME HOOKS ----
  const { themeName, setThemeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // ---- USER STATE & PROFILE FIELDS ----
  const [user, setUser] = useState(auth.currentUser);
  const [username, setUsername] = useState("");
  const [bannerColor, setBannerColor] = useState("#333333");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [localThemeName, setLocalThemeName] = useState<keyof typeof THEMES>("Dark");

  // Example stats
  const [bestPerfectTime, setBestPerfectTime] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);

  // Toggles & Panel Visibility
  const [showCustom, setShowCustom] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showBannerChange, setShowBannerChange] = useState(false);

  // Responsive layout
  const screenWidth = Dimensions.get("window").width;
  const isMobile = screenWidth < 768;

  // ---- FETCH USER PREFERRED THEME ----
  async function fetchUserPreferredTheme() {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        const snap = await getDoc(doc(db, "profile", uid));
        if (snap.exists()) {
          const data = snap.data();
          const userTheme = data.theme || "Dark";
          setLocalThemeName(userTheme);
          setThemeName(userTheme);
        } else {
          console.log("Profile doc not found, defaulting to Dark theme.");
          setThemeName("Dark");
          setLocalThemeName("Dark");
        }
      } catch (error) {
        console.error("Error fetching theme:", error);
        setThemeName("Dark");
        setLocalThemeName("Dark");
      }
    } else {
      console.log("No user logged in, defaulting to Dark theme.");
      setThemeName("Dark");
      setLocalThemeName("Dark");
    }
  }

  // ---- FETCH PROFILE DOC (excluding theme, which is fetched above) ----
  async function fetchUserProfileData() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const snap = await getDoc(doc(db, "profile", uid));
    if (snap.exists()) {
      const data = snap.data();
      setUsername(data.username || "");
      setBannerColor(data.bannerColor || "#333333");
      setPhotoURL(data.photoURL || null);
      if (data.stats) {
        setBestPerfectTime(data.stats.bestPerfectTime);
        setGamesPlayed(data.stats.gamesPlayed);
      }
    } else {
      console.log("Profile doc not found (data)");
    }
  }

  // useEffect(() => {
  //   // 1. See the user's preferred theme and apply it
  //   fetchUserPreferredTheme();
  // },); // Run only once on component mount

  useEffect(() => {
    // 2. Fetch other profile data after user is authenticated
    if (user) {
      fetchUserProfileData();
    }
  }, [user]);

  // ---- UPDATE APPEARANCE (Banner & Profile Picture) ----
  async function handleUpdateCustomization() {
    if (!user) {
      Alert.alert("Not logged in", "Log in to update your profile.");
      return;
    }
    const uid = user.uid;
    try {
      await updateDoc(doc(db, "profile", uid), {
        bannerColor,
        photoURL,
      });
      Alert.alert("Profile Updated", "Your appearance has been updated!");
      setShowCustom(false);
    } catch (error: any) {
      Alert.alert("Update Error", error.message || "An error occurred.");
    }
  }

  // ---- SETTINGS PANEL CALLBACKS ----
  const handleSettingsUpdate = async (
    newUsername: string,
    newTheme: keyof typeof THEMES
  ) => {
    console.log("handleSettingsUpdate called with:", { newUsername, newTheme });
    if (!user) {
      Alert.alert("Not logged in", "Log in to update your profile.");
      return;
    }
    const uid = user.uid;
    console.log("Updating theme for user:", uid, "to:", newTheme);
    try {
      await updateDoc(doc(db, "profile", uid), {
        username: newUsername,
        theme: newTheme,
      });
      console.log("Firebase update successful for theme:", newTheme);
      setUsername(newUsername);
      setLocalThemeName(newTheme);
      setThemeName(newTheme);
      console.log("Local theme states updated to:", newTheme);
      Alert.alert("Profile Updated", "Your profile has been updated!");
      // Settings panel remains visible.
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Update Error", error.message || "An error occurred.");
    }
  };

  const handleSettingsLogout = async () => {
    try {
      await auth.signOut();
      resetProfileFields();
      setUser(null);
      setThemeName("Dark");
      Alert.alert("Success", "Logged out successfully!");
      setSettingsVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred.");
    }
  };

  const handleSettingsDelete = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await handleDeleteConfirm();
            setSettingsVisible(false);
          },
        },
      ]
    );
  };

  async function handleDeleteConfirm() {
    if (!user || !user.email) {
      Alert.alert("Not logged in", "No user to delete.");
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

  function resetProfileFields() {
    setUsername("");
    setBannerColor("#333333");
    setPhotoURL(null);
    setBestPerfectTime(null);
    setGamesPlayed(null);
    setLocalThemeName("Dark");
    setThemeName("Dark");
  }

  // ---- IF USER NOT LOGGED IN, SHOW AUTH COMPONENT ----
  if (!user) {
    return (
      <SignUpIn
        onAuthSuccess={async () => {
          const currentUser = auth.currentUser;
          setUser(currentUser);
          if (currentUser) {
            await fetchUserPreferredTheme();
          }
        }}
      />
    );
  }
  

  const themeStyles = {
    backgroundColor: currentTheme.background,
    textColor: currentTheme.text,
    primary: currentTheme.primary,
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Banner Section */}
      <View style={styles.bannerContainer}>
        <View style={[styles.banner, { backgroundColor: bannerColor }]} />
        <View
          style={[
            styles.profileImageWrapper,
            { left: isMobile ? "50%" : 20, transform: isMobile ? [{ translateX: -40 }] : [] },
          ]}
        >
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profileImage} resizeMode="cover" />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: "#999" }]} />
          )}
        </View>
        {/* Paintbrush Icon to Open BannerChange Modal */}
        <TouchableOpacity style={styles.paintbrushIcon} onPress={() => setShowBannerChange(true)}>
          <Ionicons name="color-palette-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profile Info & Stats */}
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

        {/* In-Page Appearance Customization: Banner Color & Profile Picture */}
        <View style={{ marginVertical: 8 }}>
          <Button
            title={showCustom ? "Hide Appearance Options" : "Customize Appearance"}
            onPress={() => setShowCustom(!showCustom)}
          />
        </View>
        {showCustom && (
          <View>
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
              onChangeText={setPhotoURL}
            />
            <Button title="Update Appearance" onPress={handleUpdateCustomization} />
          </View>
        )}
      </ScrollView>

      {/* Settings Icon */}
      <TouchableOpacity style={styles.settingsIcon} onPress={() => setSettingsVisible(true)}>
        <Ionicons name="settings-outline" size={28} color={themeStyles.primary} />
      </TouchableOpacity>

      {/* Sliding Settings Panel */}
      <UserSettings
        visible={settingsVisible}
        initialUsername={username}
        initialTheme={localThemeName}
        onUpdateProfile={handleSettingsUpdate}
        onLogout={handleSettingsLogout}
        onDeleteAccount={handleSettingsDelete}
        onClose={() => setSettingsVisible(false)}
      />

      {/* BannerChange Modal */}
      <BannerChange
        visible={showBannerChange}
        initialColor={bannerColor}
        onCancel={() => setShowBannerChange(false)}
        onConfirm={(color) => {
          setBannerColor(color);
          setShowBannerChange(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerContainer: {
    width: "100%",
    height: 200,
    position: "relative",
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
  settingsIcon: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  paintbrushIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 6,
    borderRadius: 20,
  },
});