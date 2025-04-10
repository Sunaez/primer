// /components/index/Desktop.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { Game, GAMES } from '@/constants/games';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Asset } from 'expo-asset';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/components/firebaseConfig';
import { useRouter } from 'expo-router';

/**
 * Calculates a daily index based on days since epoch.
 * Returns an object with two indices:
 * - primary: used for the daily game.
 * - secondary: the next game in the list (cyclically), ensuring they differ.
 */
const getDailyGameIndices = (gamesLength: number): { primary: number; secondary: number } => {
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const primary = daysSinceEpoch % gamesLength;
  const secondary = (primary + 1) % gamesLength;
  return { primary, secondary };
};

/**
 * Helper component that displays the status icon (check or cross)
 * inside an animated container. When the user hovers over it,
 * the container expands in width to show appended text (either " complete" or " incomplete")
 * with a matching background.
 */
const StatusIconWithHover: React.FC<{ completed: boolean; theme: any }> = ({
  completed,
  theme,
}) => {
  const [hovered, setHovered] = React.useState(false);

  // Shared value for the container width. Initial width fits just the icon.
  const containerWidth = useSharedValue(40);
  React.useEffect(() => {
    containerWidth.value = withTiming(hovered ? 140 : 40, { duration: 300 });
  }, [hovered]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    width: containerWidth.value,
  }));

  // Use the theme values for the background.
  const backgroundColor = completed ? theme.progressBar : theme.error;

  return (
    <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      <Animated.View
        style={[
          styles.statusIconWrapper,
          animatedContainerStyle,
          { backgroundColor },
        ]}
      >
        <Ionicons
          name={completed ? 'checkmark-circle' : 'close-circle'}
          size={32}
          color="#fff"
        />
        {hovered && (
          <Text style={styles.statusText}>
            {completed ? ' complete' : ' incomplete'}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};


const Desktop: React.FC = () => {
  const { width } = useWindowDimensions();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const router = useRouter();

  // Get deterministic indices for today's games.
  const { primary: index1, secondary: index2 } = getDailyGameIndices(GAMES.length);
  const game1: Game = GAMES[index1];
  const game2: Game = GAMES[index2];

  // Get the logged-in user's ID.
  const currentUid = auth.currentUser?.uid || '';

  // State tracking whether each game has been played today.
  const [game1Completed, setGame1Completed] = React.useState(false);
  const [game2Completed, setGame2Completed] = React.useState(false);

  // Generate today's date in MM/DD/YYYY format.
  const dateObj = new Date();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  const today = `${month}/${day}/${year}`;

  // --- Check completion for game1 ---
  React.useEffect(() => {
    async function checkGame1Completion() {
      try {
        const scoresRef = collection(db, 'Scores', currentUid, game1.id);
        const q = query(scoresRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        let completed = false;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.date === today) {
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
  }, [game1.id, currentUid, today]);

  // --- Check completion for game2 ---
  React.useEffect(() => {
    async function checkGame2Completion() {
      try {
        const scoresRef = collection(db, 'Scores', currentUid, game2.id);
        const q = query(scoresRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        let completed = false;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.date === today) {
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
  }, [game2.id, currentUid, today]);

  // Calculate column width.
  const totalHorizontalPadding = 32 + 16;
  const columnWidth = (width - totalHorizontalPadding) / 2;

  //
  // Video player & animation for game1.
  //
  const player1 = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const containerScale1 = useSharedValue(0.95);
  const animatedContainerStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale1.value }],
    opacity: containerScale1.value,
  }));
  React.useEffect(() => {
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

  //
  // Video player & animation for game2.
  //
  const player2 = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const containerScale2 = useSharedValue(0.95);
  const animatedContainerStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale2.value }],
    opacity: containerScale2.value,
  }));
  React.useEffect(() => {
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

  // Navigation handler for playing a game.
  const handlePlayGame = (game: Game) => {
    router.push(`/games/${game.id}`);
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.outerContentContainer}>
        <View style={styles.gridContainer}>
          {/* Column 1: Daily Game */}
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
            <Pressable
              style={[styles.playButton, { backgroundColor: currentTheme.button }]}
              onPress={() => handlePlayGame(game1)}
            >
              <Text style={[styles.playButtonText, { color: currentTheme.buttonText }]}>Play</Text>
            </Pressable>
          </ScrollView>
          {/* Column 2: Second Game */}
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
            <Pressable
              style={[styles.playButton, { backgroundColor: currentTheme.button }]}
              onPress={() => handlePlayGame(game2)}
            >
              <Text style={[styles.playButtonText, { color: currentTheme.buttonText }]}>Play</Text>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default Desktop;

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
    minHeight: 0, // Enforce constant height equal to the icon size
  },
  statusText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#fff',
    lineHeight: 0,    // Force text line height to match icon height
    alignSelf: 'center' // Keep text vertically centered
  },
});
