import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import THEMES from "@/constants/themes";

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

  // Animated value for the slide-up effect
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;

  // Effect to automatically update profile when username or theme changes
  useEffect(() => {
    // Only update if the values are different from initial values
    if (username !== initialUsername || selectedTheme !== initialTheme) {
      onUpdateProfile(username, selectedTheme);
    }
  }, [username, selectedTheme, initialUsername, initialTheme, onUpdateProfile]);

  useEffect(() => {
    if (visible) {
      // Reset inputs when opened
      setUsername(initialUsername);
      setSelectedTheme(initialTheme);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialUsername, initialTheme, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Username:</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
        />

        <Text style={styles.label}>Theme:</Text>
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
                  backgroundColor: THEMES[key as keyof typeof THEMES].background,
                },
              ]}
              onPress={() => setSelectedTheme(key as keyof typeof THEMES)}
            >
              <Text style={{ color: THEMES[key as keyof typeof THEMES].text }}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Button title="Log Out" onPress={onLogout} />
          <Button title="Delete Account" color="red" onPress={onDeleteAccount} />
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
    backgroundColor: "#fff",
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
    borderColor: "#ccc",
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
});