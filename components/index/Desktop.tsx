// /components/index/Desktop.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { Game, GAMES } from '@/constants/games';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Asset } from 'expo-asset';
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/components/firebaseConfig';
import { useRouter } from 'expo-router';

// *********************************************************************
// Daily Streak Message Templates
// *********************************************************************
const dailyStreakMessages = [
  "{username} is blazing with a {streak}-day streak!",
  "{username} just increased their streak to {streak} days—keep it up!",
  "{username}'s daily streak is now {streak} days strong!",
  "Epic! {username} has a {streak}-day streak now!",
  "{username} hasn't missed a single day — {streak} days and still going 🔥",
  "Daily streak check: {username} is on {streak} days of straight grinding 💪",
  "Someone's committed... {username} just hit a {streak}-day streak. Respect.",
  "Not even a power outage could stop {username} — {streak} days strong ⚡",
  "{username} got that no-days-off energy — {streak} day streak activated 💯",
  "W player alert 🚨 {username} is on a clean {streak}-day streak!",
  "{streak} days straight? {username} might be the chosen one 🧙‍♂️",
  "{username} is deep in the consistency arc... {streak} days no misses 📆",
  "They say legends never rest. {username} on a {streak}-day streak proves it 😤",
  "Okay but who’s gonna stop {username}? {streak} days of pure dedication 👑",
  "{username} pulled up daily like taxes — {streak} days running strong 💸"
];


// *********************************************************************
// Helper: Upload Daily Streak Activity
// *********************************************************************
async function uploadDailyStreakActivity(currentUid: string, streak: number) {
  // Retrieve profile to get friend recipients.
  const profileDocRef = doc(db, "profile", currentUid);
  const profileSnap = await getDoc(profileDocRef);
  let friendRecipients: string[] = [];
  if (profileSnap.exists()) {
    const profileData = profileSnap.data() as { friends: { friends: string[] } };
    if (profileData.friends?.friends) {
      friendRecipients = profileData.friends.friends;
    }
  }
  // Randomly select a template and replace the variables.
  const messageTemplate = dailyStreakMessages[Math.floor(Math.random() * dailyStreakMessages.length)];
  const message = messageTemplate
    .replace("{username}", auth.currentUser?.displayName || "Someone")
    .replace("{streak}", streak.toString());

  // Build the activity object.
  const activity = {
    content: {
      recipients: friendRecipients,
      type: "dailyStreak",
      message,
      data: { dailyStreak: streak },
      fromUser: currentUid,
      timestamp: serverTimestamp(),
    },
    reactions: [],
    comments: [],
  };
  // Create a new document in the Activity subcollection.
  const activityRef = doc(collection(db, "Activity", currentUid, "Activity"));
  await setDoc(activityRef, activity);
}

// *********************************************************************
// Helper: Daily Game Indices (deterministic for today)
// *********************************************************************
const getDailyGameIndices = (gamesLength: number): { primary: number; secondary: number } => {
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const primary = daysSinceEpoch % gamesLength;
  const secondary = (primary + 1) % gamesLength;
  return { primary, secondary };
};

// *********************************************************************
// Component: Daily Streak Indicator
// *********************************************************************
interface DailyStreakIndicatorProps {
  streak: number;
  complete: boolean;
  theme: any;
}

const DailyStreakIndicator: React.FC<DailyStreakIndicatorProps> = ({ streak, complete, theme }) => {
  const fireSource = complete
    ? require('@/assets/images/fire.gif')
    : require('@/assets/images/fire.png');

  const fireStyle = Platform.OS === 'web'
    ? complete
      ? { width: 40, height: 40 }
      : { width: 40, height: 40, filter: 'grayscale(100%)' }
    : { width: 40, height: 40 };

  return (
    <View style={styles.streakIndicatorContainer}>
      <Image source={fireSource} style={fireStyle} />
      <Text style={[styles.streakText, { color: theme.text }]}>{streak}</Text>
    </View>
  );
};

// *********************************************************************
// Component: Status Icon with Hover
// *********************************************************************
const StatusIconWithHover: React.FC<{ completed: boolean; theme: any }> = ({ completed, theme }) => {
  const [hovered, setHovered] = useState(false);
  const containerWidth = useSharedValue(40);

  useEffect(() => {
    containerWidth.value = withTiming(hovered ? 140 : 40, { duration: 300 });
  }, [hovered]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    width: containerWidth.value,
  }));

  const backgroundColor = completed ? theme.progressBar : theme.error;

  return (
    <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      <Animated.View style={[styles.statusIconWrapper, animatedContainerStyle, { backgroundColor }]}>
        <Ionicons name={completed ? 'checkmark-circle' : 'close-circle'} size={32} color="#fff" />
        {hovered && (
          <Text style={styles.statusText}>
            {completed ? ' complete' : ' incomplete'}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

// *********************************************************************
// Main Desktop Component
// *********************************************************************
const Desktop: React.FC = () => {
  const { width } = useWindowDimensions();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const router = useRouter();

  // Calculate today's game indices
  const { primary: index1, secondary: index2 } = getDailyGameIndices(GAMES.length);
  const game1: Game = GAMES[index1];
  const game2: Game = GAMES[index2];

  const currentUid = auth.currentUser?.uid || '';

  // State variables for game completions and daily streak.
  const [game1Completed, setGame1Completed] = useState(false);
  const [game2Completed, setGame2Completed] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);

  // Today's date formats.
  const dateObj = new Date();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  const todayScore = `${month}/${day}/${year}`;
  const todayISO = dateObj.toISOString().split('T')[0];

  // *********************************************************************
  // Update/Create Daily Streak Document and Upload Activity if Needed
  // *********************************************************************
  useEffect(() => {
    async function updateDailyStreak() {
      if (!currentUid) return;
      const dailyGamesComplete = game1Completed && game2Completed;
      const dailyStreakDocRef = doc(db, "Statistics", currentUid, "DailyStreak", "data");
      try {
        const docSnap = await getDoc(dailyStreakDocRef);
        if (!docSnap.exists()) {
          const initialStreak = dailyGamesComplete ? 1 : 0;
          await setDoc(dailyStreakDocRef, { dailyStreak: initialStreak, lastUpdated: todayISO });
          setDailyStreak(initialStreak);
          if (dailyGamesComplete) {
            await uploadDailyStreakActivity(currentUid, initialStreak);
          }
        } else {
          const data = docSnap.data();
          if (data.lastUpdated !== todayISO && dailyGamesComplete) {
            const newStreak = (data.dailyStreak || 0) + 1;
            await updateDoc(dailyStreakDocRef, { dailyStreak: newStreak, lastUpdated: todayISO });
            setDailyStreak(newStreak);
            await uploadDailyStreakActivity(currentUid, newStreak);
          } else {
            setDailyStreak(data.dailyStreak || 0);
          }
        }
      } catch (error) {
        console.error("Error updating daily streak:", error);
      }
    }
    updateDailyStreak();
  }, [currentUid, game1Completed, game2Completed, todayISO]);

  // *********************************************************************
  // Check Game 1 Completion
  // *********************************************************************
  useEffect(() => {
    async function checkGame1Completion() {
      try {
        const scoresRef = collection(db, 'Scores', currentUid, game1.id);
        const q = query(scoresRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        let completed = false;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.date === todayScore) {
            completed = true;
          }
        });
        setGame1Completed(completed);
      } catch (error) {
        console.error('Error checking game1 completion:', error);
        setGame1Completed(false);
      }
    }
    if (currentUid) checkGame1Completion();
  }, [game1.id, currentUid, todayScore]);

  // *********************************************************************
  // Check Game 2 Completion
  // *********************************************************************
  useEffect(() => {
    async function checkGame2Completion() {
      try {
        const scoresRef = collection(db, 'Scores', currentUid, game2.id);
        const q = query(scoresRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        let completed = false;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.date === todayScore) {
            completed = true;
          }
        });
        setGame2Completed(completed);
      } catch (error) {
        console.error('Error checking game2 completion:', error);
        setGame2Completed(false);
      }
    }
    if (currentUid) checkGame2Completion();
  }, [game2.id, currentUid, todayScore]);

  // *********************************************************************
  // Setup Video Player & Animations for Game 1
  // *********************************************************************
  const player1 = useVideoPlayer(null, p => {
    p.loop = true;
    p.muted = true;
  });
  const containerScale1 = useSharedValue(0.95);
  const animatedContainerStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale1.value }],
    opacity: containerScale1.value,
  }));
  useEffect(() => {
    containerScale1.value = withTiming(1, { duration: 300 });
    if (game1.video) {
      let finalUri: string | undefined;
      if (typeof game1.video === 'string') {
        finalUri = game1.video;
      } else if (typeof game1.video === 'number') {
        finalUri = Asset.fromModule(game1.video).uri;
      } else if (typeof game1.video === 'object' && 'uri' in game1.video) {
        finalUri = game1.video.uri;
      }
      if (finalUri) {
        player1.replace({ uri: finalUri });
        player1.play();
      }
    }
  }, [game1.video, player1, containerScale1]);

  // *********************************************************************
  // Setup Video Player & Animations for Game 2
  // *********************************************************************
  const player2 = useVideoPlayer(null, p => {
    p.loop = true;
    p.muted = true;
  });
  const containerScale2 = useSharedValue(0.95);
  const animatedContainerStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale2.value }],
    opacity: containerScale2.value,
  }));
  useEffect(() => {
    containerScale2.value = withTiming(1, { duration: 300 });
    if (game2.video) {
      let finalUri: string | undefined;
      if (typeof game2.video === 'string') {
        finalUri = game2.video;
      } else if (typeof game2.video === 'number') {
        finalUri = Asset.fromModule(game2.video).uri;
      } else if (typeof game2.video === 'object' && 'uri' in game2.video) {
        finalUri = game2.video.uri;
      }
      if (finalUri) {
        player2.replace({ uri: finalUri });
        player2.play();
      }
    }
  }, [game2.video, player2, containerScale2]);

  // *********************************************************************
  // Navigation Handler for Playing a Game
  // *********************************************************************
  const handlePlayGame = (game: Game) => {
    router.push(`/games/${game.id}`);
  };

  // *********************************************************************
  // Compute Layout Settings
  // *********************************************************************
  const totalHorizontalPadding = 32 + 16;
  const columnWidth = (width - totalHorizontalPadding) / 2;

  return (
    <View style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}>
      {/* Daily Streak Indicator */}
      <DailyStreakIndicator streak={dailyStreak} complete={game1Completed && game2Completed} theme={currentTheme} />
      <ScrollView contentContainerStyle={styles.outerContentContainer}>
        <View style={styles.gridContainer}>
          {/* Column 1: Game 1 */}
          <ScrollView
            style={[styles.columnScroll, { width: columnWidth, backgroundColor: currentTheme.surface }]}
            contentContainerStyle={styles.columnContent}
          >
            <View style={styles.statusIconContainer}>
              <StatusIconWithHover completed={game1Completed} theme={currentTheme} />
            </View>
            <Text style={[styles.titleText, { color: currentTheme.text }]}>{game1.title}</Text>
            <Text style={[styles.instructionsHeader, { color: currentTheme.text }]}>How it works:</Text>
            {game1.instructions.map((instruction, index) => (
              <Text key={index} style={[styles.instructionText, { color: currentTheme.text }]}>
                • {instruction}
              </Text>
            ))}
            {game1.video ? (
              <Animated.View style={[styles.videoContainer, animatedContainerStyle1]}>
                <VideoView style={styles.video} player={player1} />
              </Animated.View>
            ) : (
              <View style={[styles.videoContainer, { backgroundColor: currentTheme.card }]}>
                <Text style={{ color: currentTheme.text }}>No video available</Text>
              </View>
            )}
            <Pressable style={[styles.playButton, { backgroundColor: currentTheme.button }]} onPress={() => handlePlayGame(game1)}>
              <Text style={[styles.playButtonText, { color: currentTheme.buttonText }]}>Play</Text>
            </Pressable>
          </ScrollView>
          {/* Column 2: Game 2 */}
          <ScrollView
            style={[styles.columnScroll, { width: columnWidth, backgroundColor: currentTheme.surface }]}
            contentContainerStyle={styles.columnContent}
          >
            <View style={styles.statusIconContainer}>
              <StatusIconWithHover completed={game2Completed} theme={currentTheme} />
            </View>
            <Text style={[styles.titleText, { color: currentTheme.text }]}>{game2.title}</Text>
            <Text style={[styles.instructionsHeader, { color: currentTheme.text }]}>How it works:</Text>
            {game2.instructions.map((instruction, index) => (
              <Text key={index} style={[styles.instructionText, { color: currentTheme.text }]}>
                • {instruction}
              </Text>
            ))}
            {game2.video ? (
              <Animated.View style={[styles.videoContainer, animatedContainerStyle2]}>
                <VideoView style={styles.video} player={player2} />
              </Animated.View>
            ) : (
              <View style={[styles.videoContainer, { backgroundColor: currentTheme.card }]}>
                <Text style={{ color: currentTheme.text }}>No video available</Text>
              </View>
            )}
            <Pressable style={[styles.playButton, { backgroundColor: currentTheme.button }]} onPress={() => handlePlayGame(game2)}>
              <Text style={[styles.playButtonText, { color: currentTheme.buttonText }]}>Play</Text>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default Desktop;

// *********************************************************************
// Styles
// *********************************************************************
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  outerContentContainer: {
    flexGrow: 1,
    padding: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  columnScroll: {
    marginHorizontal: 4,
  },
  columnContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'relative',
  },
  statusIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 40,
  },
  instructionsHeader: {
    fontSize: 18,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 2,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 12,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  statusText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#fff',
    alignSelf: 'center',
    lineHeight: 0,
  },
  streakIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    justifyContent: 'center',
  },
  streakText: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
