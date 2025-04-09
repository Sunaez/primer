// /app/(tabs)/profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { auth, db } from "@/components/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";
import { useThemeContext, useUserContext } from "@/context/UserContext";
import THEMES from "@/constants/themes";
import SignUpIn from "@/components/profile/SignUp-In";
import UserSettings from "@/components/profile/UserSettings"; // Default export.
import BannerChange from "@/components/profile/BannerChange";
import PictureChange from "@/components/profile/PictureChange";
import MostPlayedGraph from "@/components/profile/MostPlayedGraph";
import BestScoreGraph from "@/components/profile/BestScoreGraph";
import MostConsistentGraph from "@/components/profile/MostConsistentGraph";

export default function Profile() {
  // Access the user and theme data from context.
  const { user } = useUserContext();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Responsive layout settings.
  const screenWidth = Dimensions.get("window").width;
  const graphWidth = screenWidth / 2.77;
  const graphHeight = 80;
  const singleGraphWidth = screenWidth / 2;

  // Local state to control modal visibility.
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showBannerChange, setShowBannerChange] = useState(false);
  const [showPictureChange, setShowPictureChange] = useState(false);

  // Fetch extra profile data or perform schema corrections.
  async function fetchUserProfileData() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const profileDocRef = doc(db, "profile", uid);
    const snap = await getDoc(profileDocRef);
    if (snap.exists()) {
      const data = snap.data();
      let updateNeeded = false;
      const updates: any = {};

      // If the friends field is missing, add it.
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
      }
    } else {
      console.log("Profile doc not found (data)");
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserProfileData();
    }
  }, [user]);

  // If no user is logged in, show the SignUpIn component.
  if (!user) {
    return (
      <SignUpIn
        onAuthSuccess={() => {
          // When a user signs in/up, the UserContext via onSnapshot will update automatically.
        }}
      />
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.scrollContentContainer}
    >
      {/* Header Section */}
      <View style={[styles.headerContainer, { height: 200 }]}>
        <View style={[styles.bannerContainer, { backgroundColor: user.bannerColor }]} />
        <View style={styles.profileImageWrapper}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} resizeMode="cover" />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: "#999" }]} />
          )}
          <TouchableOpacity style={styles.pictureIcon} onPress={() => setShowPictureChange(true)}>
            <Ionicons name="image-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.settingsIconBanner} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.paintbrushIcon} onPress={() => setShowBannerChange(true)}>
          <Ionicons name="color-palette-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={[styles.text, { color: currentTheme.text }]}>
          {user.username ? `Welcome, ${user.username}!` : `Welcome!`}
        </Text>
      </View>

      {/* Graphs Section */}
      <View style={styles.graphsSection}>
        <View style={styles.graphsRow}>
          <View style={[styles.graphContainer, { backgroundColor: currentTheme.card }]}>
            <MostPlayedGraph chartWidth={graphWidth} chartHeight={graphHeight} />
          </View>
          <View style={[styles.graphContainer, { backgroundColor: currentTheme.card }]}>
            <BestScoreGraph chartWidth={graphWidth} chartHeight={graphHeight} />
          </View>
        </View>
        <View style={styles.singleGraphRow}>
          <View style={[styles.graphContainer, { backgroundColor: currentTheme.card, width: singleGraphWidth }]}>
            <MostConsistentGraph chartWidth={singleGraphWidth} chartHeight={graphHeight} />
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />

      {/* Modals */}
      {/* UserSettings now handles all settings logic via direct DB updates and context. */}
      <UserSettings
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />

      <BannerChange
        visible={showBannerChange}
        initialColor={user.bannerColor}
        onCancel={() => setShowBannerChange(false)}
        onConfirm={(color) => {
          // Optionally update Firestore or context here.
          setShowBannerChange(false);
        }}
      />

      <PictureChange
        visible={showPictureChange}
        initialPhotoURL={user.photoURL}
        onCancel={() => setShowPictureChange(false)}
        onConfirm={(newPhotoURL) => {
          // Optionally update Firestore or context here.
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
    position: "relative",
  },
  bannerContainer: {
    width: "100%",
    height: "100%",
  },
  profileImageWrapper: {
    position: "absolute",
    bottom: -40,
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
  graphsSection: {
    marginTop: 20,
  },
  graphsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  graphContainer: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 4,
    padding: 8,
    borderRadius: 10,
  },
  singleGraphRow: {
    alignItems: "center",
  },
});
