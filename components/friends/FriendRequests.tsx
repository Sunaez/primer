// /components/friends/FriendRequests.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import OtherUser from "@/components/OtherUser";

interface FriendRequestsProps {
  friendRequests: any[];
  outgoingRequests: any[];
  currentTheme: any;
  onAccept: (uid: string) => void;
  onReject: (uid: string) => void;
  onBlock: (uid: string) => void;
  onCancel: (uid: string) => void;
}

export default function FriendRequests({
  friendRequests,
  outgoingRequests,
  currentTheme,
  onAccept,
  onReject,
  onBlock,
  onCancel,
}: FriendRequestsProps) {
  // If no incoming and no outgoing requests, render a fallback.
  if (friendRequests.length === 0 && outgoingRequests.length === 0) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={[styles.header, { color: currentTheme.text }]}>Requests</Text>
        <Image
          source={require("@/assets/images/shrug_emoji.png")}
          style={styles.fallbackImage}
          resizeMode="contain"
        />
        <Text style={[styles.fallbackText, { color: currentTheme.text }]}>
          Aint nothing here yet
        </Text>
      </View>
    );
  }

  // Otherwise, show incoming and outgoing requests.
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionHeader, { color: currentTheme.text }]}>
        Incoming Requests
      </Text>
      {friendRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: currentTheme.text }]}>
            No incoming friend requests
          </Text>
        </View>
      ) : (
        friendRequests.map((req, index) => (
          <Animated.View key={req.uid} entering={FadeIn.delay(index * 50)}>
            <OtherUser
              username={req.username}
              bannerColor={req.bannerColor}
              theme={req.theme}
              photoURL={req.photoURL}
              onAccept={() => onAccept(req.uid)}
              onReject={() => onReject(req.uid)}
              onBlock={() => onBlock(req.uid)}
            />
          </Animated.View>
        ))
      )}
      <Text style={[styles.sectionHeader, { color: currentTheme.text }]}>
        Outgoing Requests
      </Text>
      {outgoingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: currentTheme.text }]}>
            No outgoing friend requests
          </Text>
        </View>
      ) : (
        outgoingRequests.map((req, index) => (
          <Animated.View key={req.uid} entering={FadeIn.delay(index * 50)}>
            <OtherUser
              username={req.username}
              bannerColor={req.bannerColor}
              theme={req.theme}
              photoURL={req.photoURL}
              onCancel={() => onCancel(req.uid)}
            />
          </Animated.View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
  },
  emptyContainer: { alignItems: "center", marginTop: 20 },
  emptyText: { fontSize: 16, textAlign: "center" },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fallbackImage: {
    width: 120,
    height: 120,
    marginVertical: 16,
  },
  fallbackText: {
    fontSize: 18,
    textAlign: "center",
  },
});
