// /components/UserSettings.tsx
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

  // State for the delete confirmation modal and confirmation text.
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

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

  // Logout using the updated context helper that clears AsyncStorage.
  const handleLogout = async () => {
    if (!user) return;
    try {
      await logout();
      onClose();
    } catch (error: any) {
      Alert.alert("Logout Error", error.message || "An error occurred during logout.");
    }
  };

  // Delete account - deletes all of the user's data.
  const handleConfirmDeletion = async () => {
    if (!user) return;
    try {
      // Delete user profile and statistics documents from Firestore.
      await deleteDoc(doc(db, "profile", user.uid));
      await deleteDoc(doc(db, "Statistics", user.uid));
      // Optionally, delete other data like user scores via Cloud Functions or recursive deletion.
      
      // Delete the Firebase Auth user.
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      setUser(null);
      Alert.alert("Deleted", "Your account and all your data have been deleted.");
      setDeleteModalVisible(false);
      onClose();
    } catch (error: any) {
      Alert.alert("Error Deleting Account", error.message || "Could not delete account.");
    }
  };

  return (
    <>
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
                  { backgroundColor: currentTheme.primary },
                ]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: currentTheme.error },
                ]}
                onPress={() => setDeleteModalVisible(true)}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: currentTheme.confirmButton,
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

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={[styles.deleteModalContainer, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.deleteWarningText, { color: currentTheme.text }]}>
              Deleting your account is a non-reversable process. Are you sure you want to delete your account? Type CONFIRM below and press the confirm button.
            </Text>
            <TextInput
              style={[
                styles.confirmInput,
                {
                  borderColor: currentTheme.primary,
                  color: currentTheme.text,
                },
              ]}
              placeholder="Type CONFIRM here"
              placeholderTextColor={currentTheme.text}
              value={confirmationText}
              onChangeText={setConfirmationText}
              autoCapitalize="characters"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: confirmationText === "CONFIRM"
                      ? currentTheme.error
                      : "#666",
                    flex: 1,
                    justifyContent: "center",
                  },
                ]}
                disabled={confirmationText !== "CONFIRM"}
                onPress={handleConfirmDeletion}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Delete Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: currentTheme.primary, flex: 1, justifyContent: "center" },
                ]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setConfirmationText("");
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  deleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalContainer: {
    width: "85%",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  deleteWarningText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  confirmInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
});
