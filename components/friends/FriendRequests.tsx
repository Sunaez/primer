import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import OtherUser from '@/components/OtherUser';
import EmptyState from '@/components/ui/EmptyState';

interface FriendRequestsProps {
  friendRequests: any[];
  outgoingRequests: any[];
  currentTheme: any;
  onAccept: (uid: string) => void;
  onReject: (uid: string) => void;
  onBlock: (uid: string) => void;
  onCancel: (uid: string) => void;
}

function SectionTitle({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      <View style={styles.sectionCountPill}>
        <Text style={styles.sectionCountText}>{count}</Text>
      </View>
    </View>
  );
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
  if (friendRequests.length === 0 && outgoingRequests.length === 0) {
    return (
      <EmptyState
        title="No pending requests"
        description="When someone reaches out, incoming and outgoing requests will land here so you can sort them quickly."
        theme={currentTheme}
        accentColor={currentTheme.social}
        icon="mail-open-outline"
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SectionTitle title="Incoming" count={friendRequests.length} color={currentTheme.text} />
      {friendRequests.length === 0 ? (
        <View
          style={[
            styles.inlineEmpty,
            { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
          ]}
        >
          <Text style={[styles.inlineEmptyText, { color: currentTheme.text }]}>
            Nothing to approve right now.
          </Text>
        </View>
      ) : (
        friendRequests.map((request, index) => (
          <Animated.View key={request.uid} entering={FadeIn.delay(index * 60)}>
            <OtherUser
              username={request.username}
              bannerColor={request.bannerColor}
              theme={request.theme}
              photoURL={request.photoURL}
              onAccept={() => onAccept(request.uid)}
              onReject={() => onReject(request.uid)}
              onBlock={() => onBlock(request.uid)}
            />
          </Animated.View>
        ))
      )}

      <SectionTitle title="Outgoing" count={outgoingRequests.length} color={currentTheme.text} />
      {outgoingRequests.length === 0 ? (
        <View
          style={[
            styles.inlineEmpty,
            { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
          ]}
        >
          <Text style={[styles.inlineEmptyText, { color: currentTheme.text }]}>
            No active invitations.
          </Text>
        </View>
      ) : (
        outgoingRequests.map((request, index) => (
          <Animated.View key={request.uid} entering={FadeIn.delay(index * 60)}>
            <OtherUser
              username={request.username}
              bannerColor={request.bannerColor}
              theme={request.theme}
              photoURL={request.photoURL}
              onCancel={() => onCancel(request.uid)}
            />
          </Animated.View>
        ))
      )}
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  sectionCountPill: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  sectionCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  inlineEmpty: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 18,
  },
  inlineEmptyText: {
    fontSize: 14,
    opacity: 0.8,
    fontFamily: 'Parkinsans',
  },
});
