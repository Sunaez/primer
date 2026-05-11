import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import OtherUser from '@/components/OtherUser';
import EmptyState from '@/components/ui/EmptyState';

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
      <View
        style={[
          styles.searchShell,
          { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={currentTheme.text} />
        <TextInput
          style={[styles.searchInput, { color: currentTheme.text }]}
          placeholder="Search usernames"
          placeholderTextColor={currentTheme.text}
          value={searchTerm}
          onChangeText={onChangeSearch}
        />
      </View>

      {filteredUsers.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No matches found' : 'No one new to add'}
          description={
            searchTerm
              ? 'Try a different username or shorten the search.'
              : 'You have already reached everyone currently available to add.'
          }
          theme={currentTheme}
          accentColor={currentTheme.primary}
          icon="search-outline"
        />
      ) : (
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {totalPages > 1 ? (
        <View style={styles.paginationContainer}>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <Pressable
              key={page}
              style={[
                styles.pageButton,
                {
                  backgroundColor:
                    page === currentPage ? currentTheme.primary : currentTheme.surface,
                  borderColor: currentTheme.border,
                },
              ]}
              onPress={() => onPageChange(page)}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  {
                    color: page === currentPage ? '#fff' : currentTheme.text,
                  },
                ]}
              >
                {page}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Parkinsans',
  },
  listContent: {
    paddingBottom: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  pageButton: {
    minWidth: 42,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
});
