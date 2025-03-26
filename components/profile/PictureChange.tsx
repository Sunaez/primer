// /ProfileChange.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Modal, View, StyleSheet, Text, TouchableOpacity, TextInput } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { auth, db } from "@/components/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import Cropper from "react-easy-crop";

interface PictureChangeProps {
  visible: boolean;
  initialPhotoURL: string | null;
  onCancel: () => void;
  onConfirm: (photoURL: string) => void;
}

// Helper to load an image from a URL for cropping
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.crossOrigin = "anonymous";
    image.src = url;
  });

// Helper to crop image using a canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");

  ctx?.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return canvas.toDataURL("image/jpeg");
}

const PictureChange: React.FC<PictureChangeProps> = ({
  visible,
  initialPhotoURL,
  onCancel,
  onConfirm,
}) => {
  // Steps: "choose" or "crop"
  const [step, setStep] = useState<"choose" | "crop">("choose");
  // The raw image source (base64 or URL)
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  // react-easy-crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Reset everything when the modal opens
  useEffect(() => {
    if (visible) {
      setStep("choose");
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [visible]);

  // Called when cropping is complete
  const onCropComplete = useCallback((croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // ----- Step 1: Choose from local file or external link -----
  const handleLocalFile = () => {
    document.getElementById("fileInput")?.click();
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setStep("crop");
      };
      reader.readAsDataURL(file);
    }
  };

  const [externalURL, setExternalURL] = useState("");
  const handleUseExternalLink = () => {
    if (externalURL.trim() === "") return;
    setImageSrc(externalURL.trim());
    setStep("crop");
  };

  // ----- Step 2: Crop & Save -----
  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, "profile", currentUser.uid), {
          photoURL: croppedImage,
        });
        onConfirm(croppedImage);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Change Profile Picture</Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Step 1: Choose Source */}
          {step === "choose" && (
            <View style={{ width: "100%", alignItems: "center" }}>
              <TouchableOpacity style={styles.sourceButton} onPress={handleLocalFile}>
                <Text style={styles.sourceButtonText}>Upload from Computer</Text>
              </TouchableOpacity>
              <View style={styles.orRow}>
                <View style={styles.hr} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.hr} />
              </View>
              <TextInput
                style={styles.externalInput}
                placeholder="Paste external image URL"
                placeholderTextColor="#888"
                value={externalURL}
                onChangeText={setExternalURL}
              />
              <TouchableOpacity style={styles.sourceButton} onPress={handleUseExternalLink}>
                <Text style={styles.sourceButtonText}>Use External Link</Text>
              </TouchableOpacity>
              {/* Hidden file input */}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
            </View>
          )}

          {/* Step 2: Crop */}
          {step === "crop" && imageSrc && (
            <>
              <View style={styles.cropperContainer}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
                {/* Simple zoom slider */}
                <View style={styles.zoomSliderContainer}>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={styles.zoomSlider}
                  />
                </View>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PictureChange;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
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
    color: "#333",
  },
  sourceButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  sourceButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  hr: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  orText: {
    marginHorizontal: 8,
    color: "#888",
    fontWeight: "500",
  },
  externalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    color: "#333",
  },
  cropperContainer: {
    position: "relative",
    width: "100%",
    height: 300,
    backgroundColor: "#000",
    marginBottom: 16,
  },
  zoomSliderContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  zoomSlider: {
    width: "100%",
    height: 30,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E57373",
  },
  confirmButton: {
    backgroundColor: "#81C784",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
