import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import {
  onSnapshot,
  updateDoc,
  arrayUnion,
  collection,
} from 'firebase/firestore';

import { db } from '@/components/firebaseConfig';
import { useUserContext } from '@/context/UserContext';
import ActivityCell, { Activity } from './ActivityCell';
import THEMES from '@/constants/themes';
import EmptyState from '@/components/ui/EmptyState';

interface ActivityColumnProps {
  currentTheme: any;
  width: number;
}

export default function ActivityColumn({ currentTheme, width }: ActivityColumnProps) {
  const { user } = useUserContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const activityMapRef = useRef<{ [uid: string]: Activity[] }>({});
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  const updateActivitiesState = (currentUid: string) => {
    const ownActivities = activityMapRef.current[currentUid] || [];
    const friendActivities = Object.entries(activityMapRef.current)
      .filter(([uid]) => uid !== currentUid)
      .flatMap(([, entries]) => entries)
      .filter((entry) => entry.content.recipients.includes(currentUid));

    const merged = [...ownActivities, ...friendActivities].sort((a, b) => {
      const timeA = a.content.timestamp?.toDate ? a.content.timestamp.toDate().getTime() : 0;
      const timeB = b.content.timestamp?.toDate ? b.content.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    });

    setActivities(merged);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const currentUid = user.uid;
    const idsToRead = [currentUid, ...(user.friends?.friends || [])];

    idsToRead.forEach((uid) => {
      const colRef = collection(db, 'Activity', uid, 'Activity');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const entries: Activity[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ref: docSnap.ref,
            ...docSnap.data(),
          })) as Activity[];
          activityMapRef.current[uid] = entries;
          updateActivitiesState(currentUid);
        },
        (error) => {
          console.error(`Error fetching activities for uid ${uid}:`, error);
        }
      );

      unsubscribeRefs.current.push(unsubscribe);
    });

    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
      activityMapRef.current = {};
    };
  }, [user]);

  const handleAddReaction = async (activity: Activity, emoji: string) => {
    if (!activity.ref) return;
    try {
      await updateDoc(activity.ref, {
        reactions: arrayUnion({ userId: user?.uid, emoji, timestamp: new Date() }),
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleSendComment = async (activity: Activity, text: string) => {
    if (!activity.ref) return;
    try {
      await updateDoc(activity.ref, {
        comments: arrayUnion({ userId: user?.uid, text, timestamp: new Date() }),
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Activity feed</Text>
        <Text style={[styles.headerDescription, { color: currentTheme.text }]}>
          Streaks, score pushes, and moments worth reacting to.
        </Text>
      </View>

      {loading ? (
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: currentTheme.surface, borderColor: currentTheme.border || currentTheme.divider },
          ]}
        >
          <Text style={[styles.loadingText, { color: currentTheme.text }]}>Loading activity...</Text>
        </View>
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const senderObj = (item.content as any)?.sender?.[0];
            const activityThemeKey = senderObj?.theme as keyof typeof THEMES;
            const activityTheme =
              activityThemeKey && THEMES[activityThemeKey] ? THEMES[activityThemeKey] : currentTheme;

            return (
              <ActivityCell
                activity={item}
                currentTheme={activityTheme}
                onSendComment={handleSendComment}
                onAddReaction={handleAddReaction}
              />
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          title="No activity yet"
          description="When you and your friends post streaks or fresh scores, the feed will start to fill up here."
          theme={{
            surface: currentTheme.surface,
            text: currentTheme.text,
            border: currentTheme.border || currentTheme.divider,
          }}
          accentColor={currentTheme.primary}
          icon="notifications-outline"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  headerDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.78,
    fontFamily: 'Parkinsans',
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Parkinsans',
  },
});
