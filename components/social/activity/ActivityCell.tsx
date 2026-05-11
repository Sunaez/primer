import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export interface Activity {
  id: string;
  ref?: any;
  content: {
    recipients: string[];
    type: string;
    message: string;
    data: any;
    fromUser: string;
    fromName?: string;
    timestamp: any;
  };
  reactions: any[];
  comments: any[];
}

export interface ActivityCellProps {
  activity: Activity;
  currentTheme: any;
  onSendComment: (activity: Activity, text: string) => Promise<void>;
  onAddReaction: (activity: Activity, emoji: string) => Promise<void>;
}

export default function ActivityCell({
  activity,
  currentTheme,
  onSendComment,
  onAddReaction,
}: ActivityCellProps) {
  const [commentText, setCommentText] = useState('');

  const possibleSender = (activity as any)?.content?.sender?.[0];
  const fromDisplay =
    possibleSender?.username ||
    activity.content.fromName ||
    activity.content.fromUser ||
    'Unknown';

  const timestamp =
    activity.content.timestamp?.toDate?.().toLocaleString() || 'Just now';

  async function submitComment() {
    if (!commentText.trim()) {
      Alert.alert('Comment required', 'Write a short comment before sending.');
      return;
    }

    try {
      await onSendComment(activity, commentText.trim());
      setCommentText('');
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Error', 'Could not send that comment.');
    }
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border || currentTheme.divider,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={[styles.fromLabel, { color: currentTheme.text }]}>From {fromDisplay}</Text>
          <Text style={[styles.timestamp, { color: currentTheme.text }]}>{timestamp}</Text>
        </View>
        <View
          style={[
            styles.typePill,
            { backgroundColor: currentTheme.card || currentTheme.primary },
          ]}
        >
          <Text style={[styles.typePillText, { color: currentTheme.text }]}>
            {activity.content.type}
          </Text>
        </View>
      </View>

      <Text style={[styles.message, { color: currentTheme.text }]}>
        {activity.content.message}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={currentTheme.text} />
          <Text style={[styles.metaText, { color: currentTheme.text }]}>
            {activity.comments?.length || 0} comments
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="heart-outline" size={16} color={currentTheme.text} />
          <Text style={[styles.metaText, { color: currentTheme.text }]}>
            {activity.reactions?.length || 0} reactions
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <View
          style={[
            styles.commentInputShell,
            {
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border || currentTheme.divider,
            },
          ]}
        >
          <TextInput
            style={[styles.commentInput, { color: currentTheme.text }]}
            placeholder="Add a comment"
            placeholderTextColor={currentTheme.text}
            value={commentText}
            onChangeText={setCommentText}
          />
          <Pressable
            style={[styles.sendButton, { backgroundColor: currentTheme.primary }]}
            onPress={submitComment}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </Pressable>
        </View>

        <Pressable
          style={[styles.reactButton, { backgroundColor: currentTheme.secondary }]}
          onPress={() => onAddReaction(activity, 'like')}
        >
          <Ionicons name="heart" size={16} color="#fff" />
          <Text style={styles.reactButtonText}>React</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  fromLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  timestamp: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.72,
    fontFamily: 'Parkinsans',
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  typePillText: {
    fontSize: 11,
    textTransform: 'capitalize',
    fontFamily: 'Parkinsans',
  },
  message: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Parkinsans',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.8,
    fontFamily: 'Parkinsans',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  commentInputShell: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Parkinsans',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactButton: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reactButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
});
