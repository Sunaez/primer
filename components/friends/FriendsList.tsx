import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import OtherUser from '@/components/OtherUser';
import EmptyState from '@/components/ui/EmptyState';

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
      <EmptyState
        title="Your circle is still empty"
        description="Add a few people to make score comparisons and activity updates worth checking."
        theme={currentTheme}
        accentColor={currentTheme.friends}
        imageSource={require('@/assets/images/shrug_emoji.png')}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {friends.map((friend, index) => (
        <Animated.View key={friend.uid} entering={FadeIn.delay(index * 60)}>
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
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 8,
  },
  spacer: {
    height: 8,
  },
});
