// /components/profile/UserSettings.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import THEMES from "@/constants/themes";
import { useThemeContext } from "@/context/ThemeContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

type UserSettingsProps = {
  visible: boolean;
  initialUsername: string;
  initialTheme: keyof typeof THEMES;
  onUpdateProfile: (newUsername: string, newTheme: keyof typeof THEMES) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onClose: () => void;
};

const UserSettings: React.FC<UserSettingsProps> = ({
  visible,
  initialUsername,
  initialTheme,
  onUpdateProfile,
  onLogout,
  onDeleteAccount,
  onClose,
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);

  // Get the current theme from context.
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const screenHeight = Dimensions.get("window").height;
  // Shared value for slide animation.
  const translateY = useSharedValue(screenHeight);

  // Animated style using reanimated.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // When modal opens/closes, update state and animate.
  useEffect(() => {
    if (visible) {
      setUsername(initialUsername);
      setSelectedTheme(initialTheme);
      translateY.value = withTiming(0, {
        duration: 340,
        easing: Easing.inOut(Easing.quad),
      });
    } else {
      translateY.value = withTiming(screenHeight, {
        duration: 340,
        easing: Easing.inOut(Easing.quad),
      });
    }
  }, [visible, initialUsername, initialTheme, screenHeight, translateY]);

  // When a theme button is pressed, update the theme immediately.
  const handleThemeSelect = (theme: keyof typeof THEMES) => {
    setSelectedTheme(theme);
    onUpdateProfile(username, theme);
  };

  // When the user closes the modal via the X button, update username if changed.
  const handleClose = () => {
    if (username !== initialUsername) {
      onUpdateProfile(username, selectedTheme);
    }
    onClose();
  };

  // When logging out, update username if needed then log out.
  const handleLogout = () => {
    if (username !== initialUsername) {
      onUpdateProfile(username, selectedTheme);
    }
    onLogout();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: currentTheme.background },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: currentTheme.text }]}>
          Settings
        </Text>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={28} color={currentTheme.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
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
          placeholder="Enter username"
          placeholderTextColor={currentTheme.text}
        />

        <Text style={[styles.label, { color: currentTheme.text }]}>Theme:</Text>
        <View style={styles.themeContainer}>
          {Object.keys(THEMES).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.themeOption,
                {
                  borderColor:
                    key === selectedTheme
                      ? THEMES[key as keyof typeof THEMES].primary
                      : "gray",
                  backgroundColor:
                    THEMES[key as keyof typeof THEMES].background,
                },
              ]}
              onPress={() => handleThemeSelect(key as keyof typeof THEMES)}
            >
              <Text
                style={{
                  color: THEMES[key as keyof typeof THEMES].text,
                }}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.actionButton,
              { backgroundColor: currentTheme.primary },
            ]}
          >
            <Text style={styles.actionButtonText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDeleteAccount}
            style={[styles.actionButton, { backgroundColor: "red" }]}
          >
            <Text style={styles.actionButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default UserSettings;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {},
  label: {
    fontSize: 16,
    marginTop: 12,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  themeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
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
  buttonRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
