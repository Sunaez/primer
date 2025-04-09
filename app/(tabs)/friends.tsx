import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "@/components/firebaseConfig";
import { useUserContext } from "@/context/UserContext";
import THEMES from "@/constants/themes";
import FriendsList from "@/components/friends/FriendsList";
import FriendRequests from "@/components/friends/FriendRequests";
import AddFriends from "@/components/friends/AddFriends";

type TabType = "friends" | "requests" | "add";

export default function FriendsTab() {
  const { user } = useUserContext();
  const currentTheme = THEMES[user ? user.theme : "Dark"];

  // Fallback if no user is logged in.
  if (!user) {
    return (
      <View
        style={[styles.fallbackContainer, { backgroundColor: currentTheme.background }]}
      >
        <Image
          source={require("@/assets/images/tear_emoji.png")}
          style={styles.fallbackImage}
          resizeMode="contain"
        />
        <Text style={[styles.fallbackText, { color: currentTheme.text }]}>
          Me trying to add friends but I don't have an account
        </Text>
      </View>
    );
  }

  // Main states and pagination.
  const [currentTab, setCurrentTab] = useState<TabType>("friends");
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const currentUser = auth.currentUser;
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Animate tab content on change.
  const tabAnim = useSharedValue(0);
  useEffect(() => {
    tabAnim.value = 0;
    tabAnim.value = withTiming(1, { duration: 300 });
  }, [currentTab]);
  const animatedTabStyle = useAnimatedStyle(() => ({
    opacity: tabAnim.value,
    transform: [{ translateY: (1 - tabAnim.value) * 20 }],
  }));

  // Real-time subscription to the current user's profile.
  useEffect(() => {
    if (!currentUser) return;
    const profileRef = doc(db, "profile", currentUser.uid);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const friendIds: string[] = data.friends?.friends || [];
        const incomingIds: string[] = data.friends?.friendRequests || [];

        Promise.all(friendIds.map((uid) => fetchUserProfile(uid))).then(
          (results) => {
            setFriends(results.filter((u) => u !== null));
          }
        );
        Promise.all(incomingIds.map((uid) => fetchUserProfile(uid))).then(
          (results) => {
            setFriendRequests(results.filter((u) => u !== null));
          }
        );
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Real-time subscription to all users (for "Add Friends").
  useEffect(() => {
    if (!currentUser) return;
    const usersRef = collection(db, "profile");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersArray: any[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== currentUser.uid) {
          usersArray.push({ uid: docSnap.id, ...docSnap.data() });
        }
      });
      usersArray.sort((a, b) =>
        (a?.username || "").localeCompare(b?.username || "")
      );
      setAllUsers(usersArray);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Real-time subscription for outgoing friend requests.
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "profile"),
      where("friends.friendRequests", "array-contains", currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
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

  // Helper: one-off fetch of a user's profile.
  const fetchUserProfile = async (uid: string) => {
    return new Promise<any>((resolve) => {
      const unsub = onSnapshot(doc(db, "profile", uid), (docSnap) => {
        if (docSnap.exists()) {
          resolve({ uid, ...docSnap.data() });
        } else {
          resolve(null);
        }
        unsub();
      });
    });
  };

  // Filter for the "Add Friends" tab.
  const filteredUsers = allUsers.filter(
    (user) =>
      (user?.username || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      !friends.some((friend) => friend.uid === user.uid) &&
      !friendRequests.some((req) => req.uid === user.uid)
  );
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Firestore update functions.
  const handleRemoveFriend = async (friendUid: string) => {
    if (!currentUser) return;
    try {
      const currentRef = doc(db, "profile", currentUser.uid);
      const friendRef = doc(db, "profile", friendUid);
      await updateDoc(currentRef, { "friends.friends": arrayRemove(friendUid) });
      await updateDoc(friendRef, { "friends.friends": arrayRemove(currentUser.uid) });
      setFriends(friends.filter((u) => u.uid !== friendUid));
      Alert.alert("Friend Removed", "The friend has been removed from both profiles.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not remove friend.");
    }
  };

  const handleBlockFriend = async (friendUid: string) => {
    if (!currentUser) return;
    try {
      const currentRef = doc(db, "profile", currentUser.uid);
      const friendRef = doc(db, "profile", friendUid);
      await updateDoc(currentRef, {
        "friends.friends": arrayRemove(friendUid),
        "friends.blocked": arrayUnion(friendUid),
      });
      await updateDoc(friendRef, {
        "friends.friends": arrayRemove(currentUser.uid),
        "friends.blocked": arrayUnion(currentUser.uid),
      });
      setFriends(friends.filter((u) => u.uid !== friendUid));
      Alert.alert("Friend Blocked", "The friend has been blocked from both profiles.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not block friend.");
    }
  };

  const handleAcceptFriendRequest = async (requestUid: string) => {
    if (!currentUser) return;
    try {
      const currentRef = doc(db, "profile", currentUser.uid);
      const acceptedRef = doc(db, "profile", requestUid);
      await updateDoc(currentRef, {
        "friends.friends": arrayUnion(requestUid),
        "friends.friendRequests": arrayRemove(requestUid),
      });
      await updateDoc(acceptedRef, {
        "friends.friends": arrayUnion(currentUser.uid),
      });
      const acceptedUser = friendRequests.find((u) => u.uid === requestUid);
      setFriendRequests(friendRequests.filter((u) => u.uid !== requestUid));
      if (acceptedUser) {
        setFriends([...friends, acceptedUser]);
      }
      Alert.alert("Friend Request Accepted", "You are now friends.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not accept friend request.");
    }
  };

  const handleRejectFriendRequest = async (requestUid: string) => {
    if (!currentUser) return;
    try {
      const currentRef = doc(db, "profile", currentUser.uid);
      await updateDoc(currentRef, { "friends.friendRequests": arrayRemove(requestUid) });
      setFriendRequests(friendRequests.filter((u) => u.uid !== requestUid));
      Alert.alert("Friend Request Rejected", "The friend request has been rejected.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not reject friend request.");
    }
  };

  const handleCancelFriendRequest = async (targetUid: string) => {
    if (!currentUser) return;
    try {
      const targetRef = doc(db, "profile", targetUid);
      await updateDoc(targetRef, { "friends.friendRequests": arrayRemove(currentUser.uid) });
      setOutgoingRequests(outgoingRequests.filter((req) => req.uid !== targetUid));
      Alert.alert("Request Canceled", "Your friend request has been canceled.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not cancel friend request.");
    }
  };

  const handleSendFriendRequest = async (otherUid: string) => {
    if (!currentUser) return;
    try {
      const otherRef = doc(db, "profile", otherUid);
      await updateDoc(otherRef, { "friends.friendRequests": arrayUnion(currentUser.uid) });
      setSentRequests([...sentRequests, otherUid]);
      Alert.alert("Request Sent", "Your friend request has been sent.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not send friend request.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Friends</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === "friends" && { borderBottomColor: currentTheme.primary }]}
          onPress={() => setCurrentTab("friends")}
        >
          <Text style={[styles.tabText, { color: currentTheme.text }]}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === "requests" && { borderBottomColor: currentTheme.primary }]}
          onPress={() => setCurrentTab("requests")}
        >
          <Text style={[styles.tabText, { color: currentTheme.text }]}>Friend Requests</Text>
          {friendRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === "add" && { borderBottomColor: currentTheme.primary }]}
          onPress={() => setCurrentTab("add")}
        >
          <Text style={[styles.tabText, { color: currentTheme.text }]}>Add Friends</Text>
        </TouchableOpacity>
      </View>

      {/* Animated Tab Content */}
      <Animated.View style={[styles.listContainer, animatedTabStyle]}>
        {currentTab === "friends" && (
          <FriendsList
            friends={friends}
            currentTheme={currentTheme}
            onRemoveFriend={handleRemoveFriend}
            onBlockFriend={handleBlockFriend}
          />
        )}
        {currentTab === "requests" && (
          <FriendRequests
            friendRequests={friendRequests}
            outgoingRequests={outgoingRequests}
            currentTheme={currentTheme}
            onAccept={handleAcceptFriendRequest}
            onReject={handleRejectFriendRequest}
            onBlock={handleBlockFriend}
            onCancel={handleCancelFriendRequest}
          />
        )}
        {currentTab === "add" && (
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
        )}
      </Animated.View>

      {/* Icon Key / Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <Ionicons name="person-remove-outline" size={20} color="red" />
          <Text style={[styles.legendText, { color: currentTheme.text }]}>Remove</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="hand-left-outline" size={20} color="orange" />
          <Text style={[styles.legendText, { color: currentTheme.text }]}>Block</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="checkmark-outline" size={20} color="green" />
          <Text style={[styles.legendText, { color: currentTheme.text }]}>Accept</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="close-outline" size={20} color="red" />
          <Text style={[styles.legendText, { color: currentTheme.text }]}>Reject</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="person-add-outline" size={20} color="green" />
          <Text style={[styles.legendText, { color: currentTheme.text }]}>Add</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="paper-plane-outline" size={20} color="blue" />
          <Text style={[styles.legendText, { color: currentTheme.text }]}>Request Sent</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="close-circle-outline" size={20} color="purple" />
          <Text style={[styles.legendText, { color: currentTheme.text }]}>Cancel Request</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: "row", justifyContent: "center", marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 16 },
  badge: {
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  badgeText: { color: "#fff", fontSize: 12 },
  listContainer: { flex: 1 },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendText: { marginLeft: 4, fontSize: 14 },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fallbackImage: { width: 120, height: 120, marginBottom: 16 },
  fallbackText: { fontSize: 18, textAlign: "center" },
});
