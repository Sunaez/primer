// /components/profile/BannerChange.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import ReanimatedColorPicker, { Panel1, HueSlider } from "reanimated-color-picker";
import { auth, db } from "@/components/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { useThemeContext } from "@/context/UserContext";
import THEMES from "@/constants/themes";

interface BannerChangeProps {
  visible: boolean;
  initialColor: string;
  onCancel: () => void;
  onConfirm: (color: string) => void;
}

export default function BannerChange({
  visible,
  initialColor,
  onCancel,
  onConfirm,
}: BannerChangeProps) {
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  
  // Get current theme from context
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Reset the selected color whenever the modal is shown
  useEffect(() => {
    if (visible) {
      setSelectedColor(initialColor);
    }
  }, [initialColor, visible]);

  // Called whenever the picker's color changes
  const handleColorChange = (colors: { hex: string }) => {
    setSelectedColor(colors.hex);
  };

  // When Confirm is pressed, update the bannerColor field in the database
  const handleConfirm = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const uid = currentUser.uid;
      try {
        await updateDoc(doc(db, "profile", uid), { bannerColor: selectedColor });
        onConfirm(selectedColor);
      } catch (error) {
        console.error("Error updating banner color:", error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === "ios" ? "fade" : "slide"}
      transparent
      presentationStyle="overFullScreen" // This helps prevent crash issues on iOS Expo Go
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            Customize Your Banner
          </Text>

          {/* Preview of the currently selected color */}
          <View
            style={[
              styles.previewBanner,
              { backgroundColor: selectedColor, borderColor: currentTheme.primary },
            ]}
          />

          {/* Custom Hex Code Input */}
          <TextInput
            style={[
              styles.hexInput,
              { color: currentTheme.text, borderColor: currentTheme.primary },
            ]}
            value={selectedColor}
            onChangeText={setSelectedColor}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter Hex Code"
            placeholderTextColor={currentTheme.divider}
          />

          {/* Reanimated color picker with color wheel and hue slider */}
          <ReanimatedColorPicker
            value={selectedColor}
            onChange={handleColorChange}
            style={styles.colorPicker}
          >
            {/* The color wheel */}
            <Panel1 style={styles.panel} />
            {/* A hue slider below the wheel */}
            <HueSlider style={styles.slider} />
          </ReanimatedColorPicker>

          {/* Buttons to cancel or confirm */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={[styles.buttonText, { color: currentTheme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: currentTheme.primary }]}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  previewBanner: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  hexInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  colorPicker: {
    marginBottom: 20,
  },
  panel: {
    width: "100%",
    height: 200,
  },
  slider: {
    marginTop: 16,
    height: 30,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E57373",
  },
  confirmButton: {
    // backgroundColor is overridden inline with currentTheme.primary
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
