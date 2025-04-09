import React from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import OtherUser from "@/components/OtherUser";

interface AddFriendsProps {
  filteredUsers: any[];
  searchTerm: string;
  onChangeSearch: (text: string) => void;
  currentTheme: any;
  onSendRequest: (uid: string) => void;
  requestSent: string[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function AddFriends({
  filteredUsers,
  searchTerm,
  onChangeSearch,
  currentTheme,
  onSendRequest,
  requestSent,
  currentPage,
  totalPages,
  onPageChange,
}: AddFriendsProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.searchInput, { borderColor: currentTheme.text, color: currentTheme.text }]}
        placeholder="Search users..."
        placeholderTextColor={currentTheme.text}
        value={searchTerm}
        onChangeText={onChangeSearch}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeIn.delay(index * 50)}>
            <OtherUser
              username={item.username}
              bannerColor={item.bannerColor}
              theme={item.theme}
              photoURL={item.photoURL}
              onAdd={() => onSendRequest(item.uid)}
              requestSent={requestSent.includes(item.uid)}
            />
          </Animated.View>
        )}
      />
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <TouchableOpacity
              key={page}
              style={[
                styles.pageButton,
                page === currentPage && { backgroundColor: currentTheme.primary },
              ]}
              onPress={() => onPageChange(page)}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  { color: page === currentPage ? currentTheme.buttonText : currentTheme.text },
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  pageButtonText: {
    fontSize: 14,
  },
});
