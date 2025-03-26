// /components/profile/UserSettings.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import THEMES from "@/constants/themes";
import { useThemeContext } from "@/context/ThemeContext";

type UserSettingsProps = {
  visible: boolean;
  initialUsername: string;
  initialTheme: keyof typeof THEMES;
  onUpdateProfile: (newUsername: string, newTheme: keyof typeof THEMES) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onClose: () => void;
};

export default function UserSettings({
  visible,
  initialUsername,
  initialTheme,
  onUpdateProfile,
  onLogout,
  onDeleteAccount,
  onClose,
}: UserSettingsProps) {
  // Local state for username
  const [username, setUsername] = useState(initialUsername);
  // Keep track of selected theme in state
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof THEMES>(
    initialTheme
  );

  // For styling with current theme
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Reanimated shared value to control pop-up scale/opacity
  const scale = useSharedValue(0);

  // Animate in/out whenever `visible` changes
  useEffect(() => {
    if (visible) {
      // Reset local states to the props
      setUsername(initialUsername);
      setSelectedTheme(initialTheme);

      // Animate in
      scale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      // Animate out
      scale.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Reanimated style for container
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  // Immediately apply theme changes
  const handleSelectTheme = (theme: keyof typeof THEMES) => {
    setSelectedTheme(theme);
    // Immediately update the theme in the profile
    onUpdateProfile(username, theme);
  };

  // Confirm button applies username changes only
  const handleConfirmUsername = () => {
    onUpdateProfile(username, selectedTheme);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none" // We handle animation ourselves
    >
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
              style={[styles.button, styles.logoutButton]}
              onPress={onLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
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

// ----- STYLES -----
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
  logoutButton: {
    backgroundColor: "#007AFF",
  },
  deleteButton: {
    backgroundColor: "red",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    flex: 1,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
});
