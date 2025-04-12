// /components/index/Mobile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Image,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Asset } from 'expo-asset';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { Game, GAMES } from '@/constants/games';
import { db, auth } from '@/components/firebaseConfig';
import { useRouter } from 'expo-router';

/**
 * Returns the daily game for today based on days since epoch.
 */
const getDailyGame = (): Game => {
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const index = daysSinceEpoch % GAMES.length;
  return GAMES[index];
};

/**
 * MobileDailyStreakIndicator displays a fire icon with the current daily streak.
 * - If both daily games are complete, uses the animated fire (fire.gif).
 * - Otherwise uses a static (greyed-out) icon (fire.png). On web, the incomplete icon is forced to grayscale.
 */
const MobileDailyStreakIndicator: React.FC<{ streak: number; complete: boolean; theme: any }> = ({ streak, complete, theme }) => {
  const fireSource = complete
    ? require('@/assets/images/fire.gif')
    : require('@/assets/images/fire.png');
  const fireStyle =
    Platform.OS === 'web' && !complete
      ? { width: 40, height: 40, filter: 'grayscale(100%)' }
      : { width: 40, height: 40 };
  return (
    <View style={styles.streakIndicatorContainer}>
      <Image source={fireSource} style={fireStyle} />
      <Text style={[styles.streakText, { color: theme.text }]}>{streak}</Text>
    </View>
  );
};

/**
 * MobileStatusIndicator displays a status icon that toggles its expansion on press.
 * When pressed, it expands to show the text "complete" (if completed) or "incomplete"; 
 * when pressed again, it collapses to only display the icon.
 */
const MobileStatusIndicator: React.FC<{ completed: boolean; theme: any }> = ({ completed, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const containerWidth = useSharedValue(50);

  const toggleExpanded = () => {
    if (expanded) {
      containerWidth.value = withTiming(50, { duration: 300 });
      setExpanded(false);
    } else {
      containerWidth.value = withTiming(200, { duration: 300 });
      setExpanded(true);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    width: containerWidth.value,
  }));

  const backgroundColor = completed ? theme.progressBar : theme.error;

  return (
    <Pressable onPress={toggleExpanded}>
      <Animated.View style={[styles.statusIndicator, animatedStyle, { backgroundColor }]}>
        <Ionicons name={completed ? 'checkmark-circle' : 'close-circle'} size={32} color="#fff" />
        {expanded && (
          <Text style={styles.statusIndicatorText}>
            {completed ? ' complete' : ' incomplete'}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const Mobile: React.FC = () => {
  const { width } = useWindowDimensions();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const router = useRouter();

  const dailyGame = getDailyGame();
  const secondGame = GAMES[1]; // You can adjust the second game selection logic as needed.

  const currentUid = auth.currentUser?.uid || '';
  const [game1Completed, setGame1Completed] = useState(false);
  const [game2Completed, setGame2Completed] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);

  // Prepare today's date in two formats:
  // one for score documents (MM/DD/YYYY) and one as ISO (YYYY-MM-DD) for streak updates.
  const dateObj = new Date();
  const todayScore = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
  const todayISO = dateObj.toISOString().split('T')[0];

  // *********************************************************************
  // Daily Streak Document Creation/Update in Firestore
  // *********************************************************************
  useEffect(() => {
    async function updateDailyStreak() {
      if (!currentUid) return;
      const dailyStreakDocRef = doc(db, "Statistics", currentUid, "DailyStreak", "data");
      try {
        const docSnap = await getDoc(dailyStreakDocRef);
        const dailyGamesComplete = game1Completed && game2Completed;
        if (!docSnap.exists()) {
          // Create with initial streak: 1 if complete, otherwise 0.
          await setDoc(dailyStreakDocRef, { dailyStreak: dailyGamesComplete ? 1 : 0, lastUpdated: todayISO });
          setDailyStreak(dailyGamesComplete ? 1 : 0);
        } else {
          const data = docSnap.data();
          if (data.lastUpdated !== todayISO && dailyGamesComplete) {
            const newStreak = (data.dailyStreak || 0) + 1;
            await updateDoc(dailyStreakDocRef, { dailyStreak: newStreak, lastUpdated: todayISO });
            setDailyStreak(newStreak);
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
  // Check completion for dailyGame (game1)
  // *********************************************************************
  useEffect(() => {
    async function checkGame1Completion() {
      try {
        const scoresRef = collection(db, 'Scores', currentUid, dailyGame.id);
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
    if (currentUid) {
      checkGame1Completion();
    }
  }, [dailyGame.id, currentUid, todayScore]);

  // *********************************************************************
  // Check completion for secondGame
  // *********************************************************************
  useEffect(() => {
    async function checkGame2Completion() {
      try {
        const scoresRef = collection(db, 'Scores', currentUid, secondGame.id);
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
    if (currentUid) {
      checkGame2Completion();
    }
  }, [secondGame.id, currentUid, todayScore]);

  // For toggling between games on mobile.
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentGame: Game = selectedIndex === 0 ? dailyGame : secondGame;
  const currentGameCompleted = selectedIndex === 0 ? game1Completed : game2Completed;

  // *********************************************************************
  // Video player & animations for dailyGame (game1)
  // *********************************************************************
  const player1 = useVideoPlayer(null, p => { p.loop = true; p.muted = true; });
  const containerScale1 = useSharedValue(0.95);
  const animatedContainerStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale1.value }],
    opacity: containerScale1.value,
  }));
  useEffect(() => {
    containerScale1.value = withTiming(1, { duration: 300 });
    if (dailyGame.video) {
      let finalUri: string | undefined;
      if (typeof dailyGame.video === 'string') {
        finalUri = dailyGame.video;
      } else if (typeof dailyGame.video === 'number') {
        finalUri = Asset.fromModule(dailyGame.video).uri;
      } else if (typeof dailyGame.video === 'object' && 'uri' in dailyGame.video) {
        finalUri = dailyGame.video.uri;
      }
      if (finalUri) {
        player1.replace({ uri: finalUri });
        player1.play();
      }
    }
  }, [dailyGame.video, player1, containerScale1]);

  // *********************************************************************
  // Video player & animations for secondGame
  // *********************************************************************
  const player2 = useVideoPlayer(null, p => { p.loop = true; p.muted = true; });
  const containerScale2 = useSharedValue(0.95);
  const animatedContainerStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale2.value }],
    opacity: containerScale2.value,
  }));
  useEffect(() => {
    containerScale2.value = withTiming(1, { duration: 300 });
    if (secondGame.video) {
      let finalUri: string | undefined;
      if (typeof secondGame.video === 'string') {
        finalUri = secondGame.video;
      } else if (typeof secondGame.video === 'number') {
        finalUri = Asset.fromModule(secondGame.video).uri;
      } else if (typeof secondGame.video === 'object' && 'uri' in secondGame.video) {
        finalUri = secondGame.video.uri;
      }
      if (finalUri) {
        player2.replace({ uri: finalUri });
        player2.play();
      }
    }
  }, [secondGame.video, player2, containerScale2]);

  const handlePlayGame = (game: Game) => {
    router.push(`/games/${game.id}`);
  };

  // Toggle navigation for games.
  const [toggleContainerWidth, setToggleContainerWidth] = useState(0);
  const indicatorOffset = useSharedValue(0);
  useEffect(() => {
    if (toggleContainerWidth > 0) {
      indicatorOffset.value = withTiming(selectedIndex * (toggleContainerWidth / 2), { duration: 300 });
    }
  }, [selectedIndex, toggleContainerWidth]);
  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorOffset.value,
    width: toggleContainerWidth / 2,
  }));

  return (
    <View style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}>
      {/* Daily Streak Indicator at top */}
      <MobileDailyStreakIndicator streak={dailyStreak} complete={(game1Completed && game2Completed)} theme={currentTheme} />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Animated.View
          key={selectedIndex}
          style={[styles.gameContainer, { width: width - 32 }]}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <Text style={[styles.titleText, { color: currentTheme.text }]}>{currentGame.title}</Text>
          <Text style={[styles.instructionsHeader, { color: currentTheme.text }]}>How it works:</Text>
          {currentGame.instructions.map((instruction, index) => (
            <Text key={index} style={[styles.instructionText, { color: currentTheme.text }]}>
              • {instruction}
            </Text>
          ))}
          {currentGame.video ? (
            <Animated.View style={[styles.videoContainer, selectedIndex === 0 ? animatedContainerStyle1 : animatedContainerStyle2]}>
              <VideoView style={styles.video} player={selectedIndex === 0 ? player1 : player2} />
            </Animated.View>
          ) : (
            <View style={[styles.videoContainer, { backgroundColor: currentTheme.card }]}>
              <Text style={{ color: currentTheme.text }}>No video available</Text>
            </View>
          )}
          <Pressable
            style={[styles.playButton, { backgroundColor: currentTheme.button }]}
            onPress={() => handlePlayGame(currentGame)}
          >
            <Text style={[styles.playButtonText, { color: currentTheme.buttonText }]}>Play</Text>
          </Pressable>
        </Animated.View>
        {/* Status Indicator toggles on press */}
        <MobileStatusIndicator completed={selectedIndex === 0 ? game1Completed : game2Completed} theme={currentTheme} />
      </ScrollView>
      <View
        style={[styles.toggleContainer, { backgroundColor: currentTheme.surface }]}
        onLayout={(e) => setToggleContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.indicator, indicatorStyle, { backgroundColor: currentTheme.primary }]} />
        <Pressable onPress={() => setSelectedIndex(0)} style={styles.toggleButton}>
          <Text style={[styles.toggleText, { color: currentTheme.text }]}>{dailyGame.title}</Text>
        </Pressable>
        <Pressable onPress={() => setSelectedIndex(1)} style={styles.toggleButton}>
          <Text style={[styles.toggleText, { color: currentTheme.text }]}>{secondGame.title}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Mobile;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    marginBottom: 80,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
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
  toggleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  indicator: {
    position: 'absolute',
    bottom: 19,
    height: 40,
    borderRadius: 100,
  },
  toggleButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Mobile status indicator styling.
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 25,
    height: 50,
    marginVertical: 8,
  },
  statusIndicatorText: {
    marginLeft: 8,
    fontSize: 18,
    lineHeight: 0,
    color: '#fff',
  },
  // Daily Streak Indicator styling.
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
