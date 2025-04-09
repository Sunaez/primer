// /components/profile/UserSettings.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/components/firebaseConfig";
import { useUserContext } from "@/context/UserContext";
import THEMES from "@/constants/themes";

type UserSettingsProps = {
  visible: boolean;
  onClose: () => void;
};

export default function UserSettings({ visible, onClose }: UserSettingsProps) {
  const { user, setUser, logout } = useUserContext();

  // Return null if no user is available.
  if (!user) return null;

  // Local state for username and theme selection.
  const [username, setUsername] = useState(user.username);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof THEMES>(user.theme);

  // Retrieve the current theme from the user profile.
  const currentTheme = THEMES[user.theme] || THEMES.Dark;

  // Shared value for modal animation.
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset local states to match current user.
      setUsername(user.username);
      setSelectedTheme(user.theme);
      scale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      scale.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      });
    }
  }, [visible, user, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  // Update profile in Firestore.
  async function handleUpdateProfile(newUsername: string, newTheme: keyof typeof THEMES) {
    if (!user) return;
    try {
      await updateDoc(doc(db, "profile", user.uid), {
        username: newUsername,
        theme: newTheme,
      });
      setUser({ ...user, username: newUsername, theme: newTheme });
      Alert.alert("Profile Updated", "Your profile has been updated!");
    } catch (error: any) {
      Alert.alert("Update Error", error.message || "An error occurred while updating your profile.");
    }
  }

  // Called when a new theme is selected.
  const handleSelectTheme = (theme: keyof typeof THEMES) => {
    setSelectedTheme(theme);
    handleUpdateProfile(username, theme);
  };

  // Confirm changes for username.
  const handleConfirmUsername = async () => {
    await handleUpdateProfile(username, selectedTheme);
    onClose();
  };

  // Logout using context helper.
  const handleLogout = async () => {
    if (!user) return;
    try {
      await logout();
      onClose();
    } catch (error: any) {
      Alert.alert("Logout Error", error.message || "An error occurred during logout.");
    }
  };

  // Delete account (remove Firestore document and delete Firebase Auth user).
  const handleDeleteAccount = async () => {
    if (!user) return;
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "profile", user.uid));
              if (auth.currentUser) {
                await auth.currentUser.delete();
              }
              setUser(null);
              Alert.alert("Deleted", "Your profile and account have been deleted.");
              onClose();
            } catch (error: any) {
              Alert.alert("Error Deleting Account", error.message || "Could not delete account.");
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: currentTheme.background },
            animatedStyle,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>
              Settings
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text style={[styles.label, { color: currentTheme.text }]}>
            Username:
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.primary,
              },
            ]}
            value={username}
            onChangeText={setUsername}
          />

          <Text style={[styles.label, { color: currentTheme.text }]}>
            Theme:
          </Text>
          <View style={styles.themeOptions}>
            {Object.keys(THEMES).map((key) => {
              const themeKey = key as keyof typeof THEMES;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themeOption,
                    {
                      borderColor:
                        themeKey === selectedTheme
                          ? currentTheme.primary
                          : "#999",
                      backgroundColor: THEMES[themeKey].background,
                    },
                  ]}
                  onPress={() => handleSelectTheme(themeKey)}
                >
                  <Text style={{ color: THEMES[themeKey].text }}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: currentTheme.primary }, // Logout
              ]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: currentTheme.error }, // Delete account uses error color.
              ]}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: currentTheme.confirmButton, // Unique confirm button color.
                  flex: 1,
                  justifyContent: "center",
                },
              ]}
              onPress={handleConfirmUsername}
            >
              <Ionicons name="checkmark-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  label: {
    marginTop: 12,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 6,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  themeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  themeOption: {
    width: 80,
    height: 40,
    margin: 4,
    borderWidth: 2,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
});
