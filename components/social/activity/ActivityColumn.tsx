// /components/social/activity/ActivityColumn.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import {
  onSnapshot,
  updateDoc,
  arrayUnion,
  collection,
} from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import { useUserContext } from '@/context/UserContext';
import ActivityCell, { Activity } from './ActivityCell';
// Import your THEMES object to look up the correct theme.
import THEMES from '@/constants/themes';

interface ActivityColumnProps {
  currentTheme: any;
  width: number;
}

const ActivityColumn: React.FC<ActivityColumnProps> = ({ currentTheme, width }) => {
  const { user } = useUserContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Store activities per user UID.
  const activityMapRef = useRef<{ [uid: string]: Activity[] }>({});
  // Track unsubscribe functions to clean up.
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Merge current user's activities and friend activities where the current user is a recipient.
  const updateActivitiesState = (currentUid: string) => {
    const ownActivities = activityMapRef.current[currentUid] || [];
    const friendActivities = Object.entries(activityMapRef.current)
      .filter(([uid]) => uid !== currentUid)
      .flatMap(([, acts]) => acts)
      .filter(act => act.content.recipients.includes(currentUid));

    // Combine all activities and sort them descending by timestamp.
    const merged = [...ownActivities, ...friendActivities].sort((a, b) => {
      const timeA = a.content.timestamp?.toDate
        ? a.content.timestamp.toDate().getTime()
        : 0;
      const timeB = b.content.timestamp?.toDate
        ? b.content.timestamp.toDate().getTime()
        : 0;
      return timeB - timeA;
    });
    setActivities(merged);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const currentUid = user.uid;
    // Get the current user's ID along with any friend IDs.
    const idsToRead = [currentUid, ...(user.friends?.friends || [])];
    console.log('Subscribing to Activity for IDs:', idsToRead);

    idsToRead.forEach(uid => {
      const colRef = collection(db, 'Activity', uid, 'Activity');
      const unsubscribe = onSnapshot(
        colRef,
        snapshot => {
          const acts: Activity[] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ref: docSnap.ref,
            ...docSnap.data(),
          })) as Activity[];
          activityMapRef.current[uid] = acts;
          updateActivitiesState(currentUid);
        },
        error => {
          console.error(`Error fetching activities for uid ${uid}:`, error);
        }
      );
      unsubscribeRefs.current.push(unsubscribe);
    });

    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub());
      unsubscribeRefs.current = [];
      activityMapRef.current = {};
    };
  }, [user]);

  // Handler: Add reaction to an activity.
  const handleAddReaction = async (activity: Activity, emoji: string) => {
    if (!activity.ref) return;
    try {
      await updateDoc(activity.ref, {
        reactions: arrayUnion({ userId: user?.uid, emoji, timestamp: new Date() }),
      });
      console.log('Reaction added for activity', activity.id);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Handler: Send a comment on an activity.
  const handleSendComment = async (activity: Activity, text: string) => {
    if (!activity.ref) return;
    try {
      await updateDoc(activity.ref, {
        comments: arrayUnion({ userId: user?.uid, text, timestamp: new Date() }),
      });
      console.log('Comment added for activity', activity.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <View style={[styles.container, { width, backgroundColor: currentTheme.background }]}>
      <Text style={[styles.header, { color: currentTheme.text }]}>Activity</Text>
      {loading ? (
        <Text style={[styles.message, { color: currentTheme.text }]}>
          Loading activities...
        </Text>
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            // Use a type cast to access the sender property since it's not in the official type.
            const senderObj = (item.content as any)?.sender?.[0];
            const activityThemeKey = senderObj?.theme as keyof typeof THEMES;
            const activityTheme =
              activityThemeKey && THEMES[activityThemeKey]
                ? THEMES[activityThemeKey]
                : currentTheme;

            return (
              <ActivityCell
                activity={item}
                // Pass the theme from the activity if it exists, otherwise use the current theme.
                currentTheme={activityTheme}
                onSendComment={handleSendComment}
                onAddReaction={handleAddReaction}
              />
            );
          }}
        />
      ) : (
        <Text style={[styles.message, { color: currentTheme.text }]}>
          No activities found :(
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#444',
    height: '100%',
  },
  header: {
    fontSize: 20,
    fontFamily: 'Parkinsans',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Parkinsans',
  },
});

export default ActivityColumn;
