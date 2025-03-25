// /components/profile/BannerChange.tsx
import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ColorPicker, fromHsv } from "react-native-color-picker";

type BannerChangeProps = {
  visible: boolean;
  initialColor: string;
  onCancel: () => void;
  onConfirm: (color: string) => void;
};

export default function BannerChange({ visible, initialColor, onCancel, onConfirm }: BannerChangeProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor);

  useEffect(() => {
    setSelectedColor(initialColor);
  }, [initialColor, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Select Banner Color</Text>
          <ColorPicker
            defaultColor={initialColor}
            onColorChange={(color) => setSelectedColor(fromHsv(color))}
            style={styles.colorPicker}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => onConfirm(selectedColor)}>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    height: "70%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  colorPicker: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#007AFF",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
