// /components/index/Mobile.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
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
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { Game, GAMES } from '@/constants/games';
import { db, auth } from '@/components/firebaseConfig';
import { useRouter } from 'expo-router';

const getDailyGame = (): Game => {
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const index = daysSinceEpoch % GAMES.length;
  return GAMES[index];
};

const MobileStatusIndicator: React.FC<{ completed: boolean; theme: any }> = ({ completed, theme }) => {
  const containerWidth = useSharedValue(50);
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-expand on mount.
    containerWidth.value = withTiming(200, { duration: 300 });
    setExpanded(true);
    timerRef.current = setTimeout(() => {
      containerWidth.value = withTiming(50, { duration: 300 });
      setExpanded(false);
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toggleExpanded = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (expanded) {
      containerWidth.value = withTiming(50, { duration: 300 });
      setExpanded(false);
    } else {
      containerWidth.value = withTiming(200, { duration: 300 });
      setExpanded(true);
      timerRef.current = setTimeout(() => {
        containerWidth.value = withTiming(50, { duration: 300 });
        setExpanded(false);
      }, 1000);
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

  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const dailyGame = getDailyGame();
  const secondGame = GAMES[1];

  const currentUid = auth.currentUser?.uid || '';
  const [game1Completed, setGame1Completed] = useState(false);
  const [game2Completed, setGame2Completed] = useState(false);

  const dateObj = new Date();
  const today = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;

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

  const currentGame: Game = selectedGameIndex === 0 ? dailyGame : secondGame;
  const currentPlayer = selectedGameIndex === 0 ? player1 : player2;
  const currentAnimatedStyle = selectedGameIndex === 0 ? animatedContainerStyle1 : animatedContainerStyle2;
  const currentGameCompleted = selectedGameIndex === 0 ? game1Completed : game2Completed;

  const handlePlayGame = (game: Game) => {
    router.push(`/games/${game.id}`);
  };

  const [toggleContainerWidth, setToggleContainerWidth] = useState(0);
  const indicatorOffset = useSharedValue(0);
  useEffect(() => {
    if (toggleContainerWidth > 0) {
      indicatorOffset.value = withTiming(selectedGameIndex * (toggleContainerWidth / 2), { duration: 300 });
    }
  }, [selectedGameIndex, toggleContainerWidth]);
  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorOffset.value,
    width: toggleContainerWidth / 2,
  }));

  return (
    <View style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Animated.View
          key={selectedGameIndex}
          style={styles.gameContainer}
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
            <Animated.View style={[styles.videoContainer, currentAnimatedStyle]}>
              <VideoView style={styles.video} player={currentPlayer} />
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
        <MobileStatusIndicator key={`indicator-${selectedGameIndex}`} completed={currentGameCompleted} theme={currentTheme} />
      </ScrollView>
      <View
        style={[styles.toggleContainer, { backgroundColor: currentTheme.surface }]}
        onLayout={(e) => setToggleContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.indicator, indicatorStyle, { backgroundColor: currentTheme.primary }]} />
        <Pressable onPress={() => setSelectedGameIndex(0)} style={styles.toggleButton}>
          <Text style={[styles.toggleText, { color: currentTheme.text }]}>{dailyGame.title}</Text>
        </Pressable>
        <Pressable onPress={() => setSelectedGameIndex(1)} style={styles.toggleButton}>
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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 25,
    height: 50,
    width: 50,
    marginVertical: 8,
  },
  statusIndicatorText: {
    marginLeft: 8,
    fontSize: 18,
    lineHeight: 50,
    color: '#fff',
  },
});
