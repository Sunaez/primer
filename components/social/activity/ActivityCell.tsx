import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import THEMES from '@/constants/themes';

export interface Sender {
  uid: string;
  username: string;
  theme: string; // e.g., 'Dark', 'Light', etc.
}

export interface Activity {
  id: string;
  ref?: any; // Firestore DocumentReference
  content: {
    recipients: string[];
    type: string;
    message: string;
    data: any;
    fromUser: string;
    fromName?: string;
    timestamp: any;
    // Optionally, a sender array may be present: sender: Sender[];
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

const ActivityCell: React.FC<ActivityCellProps> = ({
  activity,
  currentTheme,
  onSendComment,
  onAddReaction,
}) => {
  const [commentText, setCommentText] = useState('');

  // Extract the sender's display name.
  let fromDisplay = 'Unknown';
  const possibleSender = (activity as any)?.content?.sender?.[0];
  if (possibleSender) {
    fromDisplay = possibleSender.username || 'Unknown';
  } else if (activity.content.fromName) {
    fromDisplay = activity.content.fromName;
  } else {
    fromDisplay = activity.content.fromUser || 'Unknown';
  }

  return (
    <View
      style={[
        styles.activityItem,
        {
          backgroundColor: currentTheme.card,
          borderColor: currentTheme.divider,
        },
      ]}
    >
      {/* Main message */}
      <Text style={[styles.activityMessage, { color: currentTheme.text }]}>
        {activity.content.message}
      </Text>

      {/* Bottom row: Comment input & reaction */}
      <View style={styles.bottomRow}>
        <View
          style={[
            styles.commentContainer,
            {
              backgroundColor: currentTheme.inputBackground,
              borderColor: currentTheme.divider,
            },
          ]}
        >
          <TextInput
            style={[styles.commentInput, { color: currentTheme.text }]}
            placeholder="Add comment..."
            placeholderTextColor={currentTheme.placeholder || '#888'}
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: currentTheme.button }]}
            onPress={async () => {
              if (commentText.trim()) {
                try {
                  await onSendComment(activity, commentText.trim());
                  setCommentText('');
                } catch (err) {
                  console.error('Error sending comment:', err);
                  Alert.alert('Error sending comment.');
                }
              } else {
                Alert.alert('Please enter a comment.');
              }
            }}
          >
            <Ionicons name="send" size={20} color={currentTheme.buttonText} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => onAddReaction(activity, '👍')}
          style={[
            styles.reactionBtn,
            { backgroundColor: currentTheme.secondary },
          ]}
        >
          <Text style={[styles.reactionText, { color: currentTheme.buttonText }]}>
            👍
          </Text>
        </TouchableOpacity>
      </View>

      {/* "From" line using the inputted theme's text color */}
      <Text style={[styles.fromText, { color: currentTheme.text }]}>
        From {fromDisplay}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  activityItem: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android elevation
    elevation: 3,
  },
  activityMessage: {
    fontSize: 16,
    fontFamily: 'Parkinsans',
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  sendButton: {
    padding: 6,
    borderRadius: 4,
  },
  reactionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  reactionText: {
    fontSize: 20,
  },
  fromText: {
    fontSize: 12,
    fontFamily: 'Parkinsans',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ActivityCell;
