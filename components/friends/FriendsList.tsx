import React from "react";
import { View, Text, Image, StyleSheet, Alert } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import OtherUser from "@/components/OtherUser";

interface FriendsListProps {
  friends: any[];
  currentTheme: any;
  onRemoveFriend: (uid: string) => void;
  onBlockFriend: (uid: string) => void;
}

export default function FriendsList({
  friends,
  currentTheme,
  onRemoveFriend,
  onBlockFriend,
}: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("@/assets/images/shrug_emoji.png")}
          style={styles.emptyImage}
        />
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>
          No friends in 2025 is crazy btw
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {friends.map((friend, index) => (
        <Animated.View key={friend.uid} entering={FadeIn.delay(index * 50)}>
          <OtherUser
            username={friend.username}
            bannerColor={friend.bannerColor}
            theme={friend.theme}
            photoURL={friend.photoURL}
            onRemove={() => onRemoveFriend(friend.uid)}
            onBlock={() => onBlockFriend(friend.uid)}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: { flex: 1 },
  emptyContainer: { alignItems: "center", marginTop: 20 },
  emptyImage: { width: 100, height: 100, marginBottom: 10 },
  emptyText: { fontSize: 16, textAlign: "center" },
});
