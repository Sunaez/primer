import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

import { auth, db } from '@/components/firebaseConfig';
import { useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import FriendsList from '@/components/friends/FriendsList';
import FriendRequests from '@/components/friends/FriendRequests';
import AddFriends from '@/components/friends/AddFriends';
import ScreenHeader from '@/components/ui/ScreenHeader';
import MetricPill from '@/components/ui/MetricPill';
import EmptyState from '@/components/ui/EmptyState';

type TabType = 'friends' | 'requests' | 'add';

const TAB_META: Record<
  TabType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; description: string }
> = {
  friends: {
    label: 'Friends',
    icon: 'people-outline',
    description: 'Your current circle and quick actions.',
  },
  requests: {
    label: 'Requests',
    icon: 'mail-outline',
    description: 'Incoming approvals and outgoing invites.',
  },
  add: {
    label: 'Discover',
    icon: 'person-add-outline',
    description: 'Search and invite new people.',
  },
};

export default function FriendsTab() {
  const { user } = useUserContext();
  const currentTheme = THEMES[user ? user.theme : 'Dark'];

  if (!user) {
    return (
      <View style={[styles.fallbackShell, { backgroundColor: currentTheme.background }]}>
        <EmptyState
          title="Friends need an account"
          description="Sign in from the Profile tab to add people, accept requests, and compare progress."
          theme={currentTheme}
          accentColor={currentTheme.friends}
          imageSource={require('@/assets/images/tear_emoji.png')}
        />
      </View>
    );
  }

  const [currentTab, setCurrentTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const currentUser = auth.currentUser;
  const pageSize = 5;

  const tabAnim = useSharedValue(1);
  useEffect(() => {
    tabAnim.value = 0.9;
    tabAnim.value = withTiming(1, { duration: 240 });
  }, [currentTab, tabAnim]);

  const animatedTabStyle = useAnimatedStyle(() => ({
    opacity: tabAnim.value,
    transform: [{ translateY: (1 - tabAnim.value) * 18 }],
  }));

  useEffect(() => {
    if (!currentUser) return;
    const profileRef = doc(db, 'profile', currentUser.uid);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const friendIds: string[] = data.friends?.friends || [];
      const incomingIds: string[] = data.friends?.friendRequests || [];

      Promise.all(friendIds.map((uid) => fetchUserProfile(uid))).then((results) => {
        setFriends(results.filter((entry) => entry !== null));
      });
      Promise.all(incomingIds.map((uid) => fetchUserProfile(uid))).then((results) => {
        setFriendRequests(results.filter((entry) => entry !== null));
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const usersRef = collection(db, 'profile');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersArray: any[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== currentUser.uid) {
          usersArray.push({ uid: docSnap.id, ...docSnap.data() });
        }
      });
      usersArray.sort((a, b) => (a?.username || '').localeCompare(b?.username || ''));
      setAllUsers(usersArray);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const outgoingQuery = query(
      collection(db, 'profile'),
      where('friends.friendRequests', 'array-contains', currentUser.uid)
    );
    const unsubscribe = onSnapshot(outgoingQuery, (snapshot) => {
      const outgoing: any[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== currentUser.uid) {
          outgoing.push({ uid: docSnap.id, ...docSnap.data() });
        }
      });
      setOutgoingRequests(outgoing);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const fetchUserProfile = async (uid: string) => {
    return new Promise<any>((resolve) => {
      const unsubscribe = onSnapshot(doc(db, 'profile', uid), (docSnap) => {
        if (docSnap.exists()) {
          resolve({ uid, ...docSnap.data() });
        } else {
          resolve(null);
        }
        unsubscribe();
      });
    });
  };

  const filteredUsers = allUsers.filter(
    (entry) =>
      (entry?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
      !friends.some((friend) => friend.uid === entry.uid) &&
      !friendRequests.some((request) => request.uid === entry.uid)
  );

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleRemoveFriend = async (friendUid: string) => {
    if (!currentUser) return;
    try {
      const currentRef = doc(db, 'profile', currentUser.uid);
      const friendRef = doc(db, 'profile', friendUid);
      await updateDoc(currentRef, { 'friends.friends': arrayRemove(friendUid) });
      await updateDoc(friendRef, { 'friends.friends': arrayRemove(currentUser.uid) });
      setFriends(friends.filter((entry) => entry.uid !== friendUid));
      Alert.alert('Friend removed', 'That person has been removed from your circle.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not remove friend.');
    }
  };

  const handleBlockFriend = async (friendUid: string) => {
    if (!currentUser) return;
    try {
      const currentRef = doc(db, 'profile', currentUser.uid);
      const friendRef = doc(db, 'profile', friendUid);
      await updateDoc(currentRef, {
        'friends.friends': arrayRemove(friendUid),
        'friends.blocked': arrayUnion(friendUid),
      });
      await updateDoc(friendRef, {
        'friends.friends': arrayRemove(currentUser.uid),
        'friends.blocked': arrayUnion(currentUser.uid),
      });
      setFriends(friends.filter((entry) => entry.uid !== friendUid));
      Alert.alert('Friend blocked', 'That user has been removed and blocked.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not block friend.');
    }
  };

  const handleAcceptFriendRequest = async (requestUid: string) => {
    if (!currentUser) return;
    try {
      const currentRef = doc(db, 'profile', currentUser.uid);
      const acceptedRef = doc(db, 'profile', requestUid);
      await updateDoc(currentRef, {
        'friends.friends': arrayUnion(requestUid),
        'friends.friendRequests': arrayRemove(requestUid),
      });
      await updateDoc(acceptedRef, {
        'friends.friends': arrayUnion(currentUser.uid),
      });
      const acceptedUser = friendRequests.find((entry) => entry.uid === requestUid);
      setFriendRequests(friendRequests.filter((entry) => entry.uid !== requestUid));
      if (acceptedUser) {
        setFriends([...friends, acceptedUser]);
      }
      Alert.alert('Request accepted', 'You are now connected.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not accept friend request.');
    }
  };

  const handleRejectFriendRequest = async (requestUid: string) => {
    if (!currentUser) return;
    try {
      const currentRef = doc(db, 'profile', currentUser.uid);
      await updateDoc(currentRef, { 'friends.friendRequests': arrayRemove(requestUid) });
      setFriendRequests(friendRequests.filter((entry) => entry.uid !== requestUid));
      Alert.alert('Request rejected', 'The invitation has been removed.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not reject friend request.');
    }
  };

  const handleCancelFriendRequest = async (targetUid: string) => {
    if (!currentUser) return;
    try {
      const targetRef = doc(db, 'profile', targetUid);
      await updateDoc(targetRef, {
        'friends.friendRequests': arrayRemove(currentUser.uid),
      });
      setOutgoingRequests(outgoingRequests.filter((entry) => entry.uid !== targetUid));
      Alert.alert('Request canceled', 'Your invitation has been canceled.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not cancel friend request.');
    }
  };

  const handleSendFriendRequest = async (otherUid: string) => {
    if (!currentUser) return;
    try {
      const otherRef = doc(db, 'profile', otherUid);
      await updateDoc(otherRef, {
        'friends.friendRequests': arrayUnion(currentUser.uid),
      });
      setSentRequests([...sentRequests, otherUid]);
      Alert.alert('Request sent', 'Your invite is on the way.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not send friend request.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.friends, currentTheme.primary, currentTheme.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <ScreenHeader
          eyebrow="Friends"
          title="Keep your circle competitive, clean, and easy to manage."
          description={TAB_META[currentTab].description}
          accentColor="#fff"
          textColor="#fff"
          mutedColor="rgba(255,255,255,0.82)"
        />

        <View style={styles.heroMetrics}>
          <MetricPill
            icon="people-outline"
            label="Friends"
            value={friends.length.toString()}
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
          <MetricPill
            icon="mail-open-outline"
            label="Incoming"
            value={friendRequests.length.toString()}
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
          <MetricPill
            icon="paper-plane-outline"
            label="Outgoing"
            value={outgoingRequests.length.toString()}
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
        </View>
      </LinearGradient>

      <View
        style={[
          styles.tabRail,
          { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
        ]}
      >
        {(Object.keys(TAB_META) as TabType[]).map((tabKey) => {
          const active = currentTab === tabKey;
          return (
            <Pressable
              key={tabKey}
              style={[
                styles.tabButton,
                {
                  backgroundColor: active ? currentTheme.friends : 'transparent',
                },
              ]}
              onPress={() => setCurrentTab(tabKey)}
            >
              <Ionicons
                name={TAB_META[tabKey].icon}
                size={16}
                color={active ? '#fff' : currentTheme.text}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? '#fff' : currentTheme.text },
                ]}
              >
                {TAB_META[tabKey].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View
        style={[
          styles.contentCard,
          {
            backgroundColor: currentTheme.background,
            borderColor: currentTheme.border,
          },
          animatedTabStyle,
        ]}
      >
        {currentTab === 'friends' ? (
          <FriendsList
            friends={friends}
            currentTheme={currentTheme}
            onRemoveFriend={handleRemoveFriend}
            onBlockFriend={handleBlockFriend}
          />
        ) : null}

        {currentTab === 'requests' ? (
          <FriendRequests
            friendRequests={friendRequests}
            outgoingRequests={outgoingRequests}
            currentTheme={currentTheme}
            onAccept={handleAcceptFriendRequest}
            onReject={handleRejectFriendRequest}
            onBlock={handleBlockFriend}
            onCancel={handleCancelFriendRequest}
          />
        ) : null}

        {currentTab === 'add' ? (
          <AddFriends
            filteredUsers={paginatedUsers}
            searchTerm={searchTerm}
            onChangeSearch={(text) => {
              setSearchTerm(text);
              setCurrentPage(1);
            }}
            currentTheme={currentTheme}
            onSendRequest={handleSendFriendRequest}
            requestSent={sentRequests}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 18,
    gap: 16,
  },
  fallbackShell: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  hero: {
    borderRadius: 30,
    padding: 22,
    gap: 18,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tabRail: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 22,
    padding: 6,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  contentCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 28,
    padding: 16,
  },
});
