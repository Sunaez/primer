// /components/OtherUser.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import THEMES from "@/constants/themes";

export interface OtherUserProps {
  username: string;
  bannerColor: string;
  theme: keyof typeof THEMES;
  photoURL: string | null;
  onRemove?: () => void;
  onBlock?: () => void;
  onAdd?: () => void; // For adding a friend
  onAccept?: () => void; // For accepting an incoming friend request
  onReject?: () => void; // For rejecting an incoming friend request
  onCancel?: () => void; // For canceling an outgoing friend request
  requestSent?: boolean; // When showing Add Friends, indicates if a request was sent
}

const OtherUser: React.FC<OtherUserProps> = ({
  username,
  bannerColor,
  theme,
  photoURL,
  onRemove,
  onBlock,
  onAdd,
  onAccept,
  onReject,
  onCancel,
  requestSent,
}) => {
  const userTheme = THEMES[theme] || THEMES.Dark;
  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: userTheme.text }]}>
        <View style={[styles.topHalf, { backgroundColor: bannerColor }]} />
        <View style={[styles.bottomHalf, { backgroundColor: userTheme.background }]}>
          <Image
            source={
              photoURL
                ? { uri: photoURL }
                : require("@/assets/images/default.jpg")
            }
            style={styles.profileImage}
          />
          <Text style={[styles.username, { color: userTheme.text }]}>
            {username}
          </Text>
        </View>
        <View style={styles.iconContainer}>
          {onRemove && (
            <TouchableOpacity style={styles.iconButton} onPress={onRemove}>
              <Ionicons name="person-remove-outline" size={20} color="red" />
            </TouchableOpacity>
          )}
          {onBlock && (
            <TouchableOpacity style={styles.iconButton} onPress={onBlock}>
              <Ionicons name="hand-left-outline" size={20} color="orange" />
            </TouchableOpacity>
          )}
          {onAccept && (
            <TouchableOpacity style={styles.iconButton} onPress={onAccept}>
              <Ionicons name="checkmark-outline" size={20} color="green" />
            </TouchableOpacity>
          )}
          {onReject && (
            <TouchableOpacity style={styles.iconButton} onPress={onReject}>
              <Ionicons name="close-outline" size={20} color="red" />
            </TouchableOpacity>
          )}
          {onAdd && !requestSent && (
            <TouchableOpacity style={styles.iconButton} onPress={onAdd}>
              <Ionicons name="person-add-outline" size={20} color="green" />
            </TouchableOpacity>
          )}
          {onAdd && requestSent && (
            <View style={styles.iconButton}>
              <Ionicons name="paper-plane-outline" size={20} color="blue" />
            </View>
          )}
          {onCancel && (
            <TouchableOpacity style={styles.iconButton} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={20} color="purple" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {requestSent && (
        <Text style={[styles.requestSentText, { color: userTheme.text }]}>
          Request Sent
        </Text>
      )}
    </View>
  );
};

export default OtherUser;

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    alignItems: "center",
  },
  card: {
    width: "90%",
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  topHalf: {
    flex: 1,
  },
  bottomHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 60,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: "absolute",
    left: 10,
    top: "50%",
    transform: [{ translateY: -25 }],
    borderWidth: 2,
    borderColor: "#fff",
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  iconContainer: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 4,
  },
  requestSentText: {
    marginTop: 4,
    fontSize: 14,
  },
});
