// /components/profile/Profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { auth, db } from "@/components/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";
import { useThemeContext } from "@/context/ThemeContext";
import THEMES from "@/constants/themes";
import UserSettings from "@/components/profile/UserSettings";
import SignUpIn from "@/components/profile/SignUp-In";
import BannerChange from "@/components/profile/BannerChange";
import PictureChange from "@/components/profile/PictureChange";

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

  // Toggles & Panel Visibility
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showBannerChange, setShowBannerChange] = useState(false);
  const [showPictureChange, setShowPictureChange] = useState(false);

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

  // ---- FETCH & UPDATE PROFILE DOC TO MATCH NEW SCHEMA ----
  async function fetchUserProfileData() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const profileDocRef = doc(db, "profile", uid);
    const snap = await getDoc(profileDocRef);
    if (snap.exists()) {
      const data = snap.data();
      let updateNeeded = false;
      const updates: any = {};

      // Add the friends object if it's missing.
      if (!("friends" in data)) {
        updates.friends = {
          friends: [],
          friendRequests: [],
          blocked: [],
        };
        updateNeeded = true;
      }
      // Remove the old stats field if it exists.
      if ("stats" in data) {
        updates.stats = deleteField();
        updateNeeded = true;
      }
      if (updateNeeded) {
        await updateDoc(profileDocRef, updates);
        // Optionally update local data with new schema fields.
        if (updates.friends) {
          data.friends = updates.friends;
        }
        if (updates.stats) {
          delete data.stats;
        }
      }
      setUsername(data.username || "");
      setBannerColor(data.bannerColor || "#333333");
      setPhotoURL(data.photoURL || null);
    } else {
      console.log("Profile doc not found (data)");
    }
  }

  useEffect(() => {
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
    } catch (error: any) {
      Alert.alert("Update Error", error.message || "An error occurred.");
    }
  }

  // ---- SETTINGS PANEL CALLBACKS ----
  const handleSettingsUpdate = async (
    newUsername: string,
    newTheme: keyof typeof THEMES
  ) => {
    if (!user) {
      Alert.alert("Not logged in", "Log in to update your profile.");
      return;
    }
    const uid = user.uid;
    try {
      await updateDoc(doc(db, "profile", uid), {
        username: newUsername,
        theme: newTheme,
      });
      setUsername(newUsername);
      setLocalThemeName(newTheme);
      setThemeName(newTheme);
      Alert.alert("Profile Updated", "Your profile has been updated!");
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
    setLocalThemeName("Dark");
    setThemeName("Dark");
  }

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
    <ScrollView
      style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}
      contentContainerStyle={styles.scrollContentContainer}
    >
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={[styles.bannerContainer, { backgroundColor: bannerColor }]} />
        <View style={styles.profileImageWrapper}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profileImage} resizeMode="cover" />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: "#999" }]} />
          )}
          <TouchableOpacity style={styles.pictureIcon} onPress={() => setShowPictureChange(true)}>
            <Ionicons name="image-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Settings Button at Bottom Right of Banner */}
        <TouchableOpacity style={styles.settingsIconBanner} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Paintbrush Icon for BannerChange */}
        <TouchableOpacity style={styles.paintbrushIcon} onPress={() => setShowBannerChange(true)}>
          <Ionicons name="color-palette-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <View style={styles.infoContainer}>
        <Text style={[styles.text, { color: themeStyles.textColor }]}>
          {username ? `Welcome, ${username}!` : `Welcome, ${user.email}`}
        </Text>

        {/* Friends Section */}
        <View style={styles.friendsContainer}>
          <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>Friends</Text>
          {/* Placeholder for Friends List */}
          <Text style={[styles.sectionContent, { color: themeStyles.textColor }]}>
            [Friends List Here]
          </Text>

          <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>Friend Requests</Text>
          {/* Placeholder for Friend Requests List */}
          <Text style={[styles.sectionContent, { color: themeStyles.textColor }]}>
            [Friend Requests Here]
          </Text>

          <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>Blocked</Text>
          {/* Placeholder for Blocked Users List */}
          <Text style={[styles.sectionContent, { color: themeStyles.textColor }]}>
            [Blocked Users Here]
          </Text>
        </View>

        {/* More Content */}
        <View style={styles.moreContent}>
          <Text style={[styles.text, { color: themeStyles.textColor }]}>More Content</Text>
          <Text style={{ color: themeStyles.textColor }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur congue, nunc vel vehicula suscipit, elit nulla congue mauris, eget pulvinar magna dolor nec magna.
          </Text>
        </View>
      </View>

      {/* Spacing at bottom */}
      <View style={{ height: 40 }} />

      {/* Modals */}
      <UserSettings
        visible={settingsVisible}
        initialUsername={username}
        initialTheme={localThemeName}
        onUpdateProfile={handleSettingsUpdate}
        onLogout={handleSettingsLogout}
        onDeleteAccount={handleSettingsDelete}
        onClose={() => setSettingsVisible(false)}
      />
      <BannerChange
        visible={showBannerChange}
        initialColor={bannerColor}
        onCancel={() => setShowBannerChange(false)}
        onConfirm={(color) => {
          setBannerColor(color);
          setShowBannerChange(false);
        }}
      />
      <PictureChange
        visible={showPictureChange}
        initialPhotoURL={photoURL}
        onCancel={() => setShowPictureChange(false)}
        onConfirm={(newPhotoURL) => {
          setPhotoURL(newPhotoURL);
          setShowPictureChange(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  headerContainer: {
    width: "100%",
    height: 250,
    position: "relative",
  },
  bannerContainer: {
    width: "100%",
    height: "100%",
  },
  profileImageWrapper: {
    position: "absolute",
    bottom: -50,
    left: 20,
    zIndex: 100,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
  },
  pictureIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    borderRadius: 20,
    zIndex: 200,
  },
  settingsIconBanner: {
    position: "absolute",
    bottom: 10,
    right: 10,
    zIndex: 300,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    borderRadius: 20,
  },
  paintbrushIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 6,
    borderRadius: 20,
  },
  infoContainer: {
    marginTop: 50,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
  },
  moreContent: {
    marginTop: 20,
  },
  friendsContainer: {
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 8,
  },
  sectionContent: {
    fontSize: 14,
    marginBottom: 10,
  },
});
