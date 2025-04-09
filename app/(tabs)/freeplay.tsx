// /app/(tabs)/freeplay.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Asset } from 'expo-asset';

import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { Game, GAMES } from '@/constants/games';

export default function Freeplay() {
  const router = useRouter();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();

  // State for the currently selected game index.
  const [selectedIndex, setSelectedIndex] = useState(0);
  // State to track whether the video is paused.
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  // --- Reanimated Shared Values for animations ---
  const instructionsX = useSharedValue(0);
  const instructionsOpacity = useSharedValue(1);
  // For each game, create shared values for the square scale, border, and tap text opacity.
  const scaleAndOpacity = GAMES.map(() => useSharedValue(0));
  const borderAnims = GAMES.map(() => useSharedValue(0));
  const tapTextAnims = GAMES.map(() => useSharedValue(0));

  // Create a single VideoPlayer instance for the entire screen.
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true; // Muted by default.
  });
  const currentVideoUri = React.useRef<string | null>(null);

  // Whenever the selected game changes, update the video source (if any)
  useEffect(() => {
    const game = GAMES[selectedIndex];
    if (game.video) {
      let finalUri: string | undefined;
      if (typeof game.video === 'string') {
        finalUri = game.video;
      } else if (typeof game.video === 'number') {
        const asset = Asset.fromModule(game.video);
        finalUri = asset.uri;
      } else if (typeof game.video === 'object' && 'uri' in game.video) {
        finalUri = game.video.uri;
      }
      if (finalUri && finalUri !== currentVideoUri.current) {
        currentVideoUri.current = finalUri;
        player.replace({ uri: finalUri });
        player.play();
        setIsVideoPaused(false);
      }
    }
  }, [selectedIndex]);

  // On mount, animate the selected game square.
  useEffect(() => {
    animateSelected(selectedIndex);
  }, []);

  // Animate the selected square’s values to 1 using ease in-out.
  function animateSelected(index: number) {
    scaleAndOpacity[index].value = withTiming(1, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    borderAnims[index].value = withTiming(1, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    tapTextAnims[index].value = withTiming(1, {
      duration: 150,
      easing: Easing.inOut(Easing.ease),
    });
  }

  // Called when a user selects a game square.
  function selectGame(newIndex: number) {
    if (newIndex === selectedIndex) {
      handlePlay();
      return;
    }

    // Animate deselection of the current square.
    scaleAndOpacity[selectedIndex].value = withTiming(0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    borderAnims[selectedIndex].value = withTiming(0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    tapTextAnims[selectedIndex].value = withTiming(0, {
      duration: 150,
      easing: Easing.inOut(Easing.ease),
    });

    // Determine slide direction.
    const dir = newIndex > selectedIndex ? -300 : 300;
    // Animate instructions sliding out.
    instructionsX.value = withTiming(
      dir,
      { duration: 200, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        if (finished) {
          runOnJS(handleInstructionsReset)(newIndex, dir);
        }
      }
    );
    instructionsOpacity.value = withTiming(0, {
      duration: 150,
      easing: Easing.inOut(Easing.ease),
    });
  }

  // Callback run on the JS thread once the slide-out animation completes.
  function handleInstructionsReset(newIndex: number, dir: number) {
    setSelectedIndex(newIndex);
    instructionsX.value = -dir;
    instructionsOpacity.value = 0;
    animateSelected(newIndex);
    // Slide instructions back in.
    instructionsX.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) });
    instructionsOpacity.value = withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) });
  }

  function handlePlay() {
    router.push(`/games/${GAMES[selectedIndex].id}`);
  }

  // Toggle play/pause state when the video is tapped.
  function handleVideoPress() {
    if (isVideoPaused) {
      player.play();
      setIsVideoPaused(false);
    } else {
      player.pause();
      setIsVideoPaused(true);
    }
  }

  // --- Animated component for each game square ---
  function GameSquareItem({
    game,
    index,
    isSelected,
    onPress,
  }: {
    game: Game;
    index: number;
    isSelected: boolean;
    onPress: (index: number) => void;
  }) {
    // Animated style for the square container.
    const animatedSquareStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 0.95 + 0.05 * scaleAndOpacity[index].value }],
      borderWidth: borderAnims[index].value * 3,
    }));
    // Animated style for the tap text.
    const animatedTextStyle = useAnimatedStyle(() => ({
      opacity: tapTextAnims[index].value,
    }));
    return (
      <Pressable onPress={() => onPress(index)}>
        <Animated.View
          style={[
            styles.gameSquare,
            animatedSquareStyle,
            {
              backgroundColor: isSelected ? currentTheme.primary : currentTheme.surface,
              borderColor: isSelected ? currentTheme.primary : 'transparent',
              opacity: isSelected ? 1 : 0.7,
            },
          ]}
        >
          <Text style={[styles.gameTitle, { color: currentTheme.text }]}>{game.title}</Text>
          <Animated.Text style={[styles.subtitle, { color: currentTheme.text }, animatedTextStyle]}>
            (Tap to play)
          </Animated.Text>
        </Animated.View>
      </Pressable>
    );
  }

  // Render the list of game squares.
  function renderGameList() {
    return (
      <View style={styles.squaresSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.scrollContent}>
          {GAMES.map((game, i) => (
            <GameSquareItem
              key={game.id}
              game={game}
              index={i}
              isSelected={i === selectedIndex}
              onPress={selectGame}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  // Render the instructions and video for the selected game.
  function renderInstructions() {
    const game = GAMES[selectedIndex];
    const animatedInstructionsStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: instructionsX.value }],
      opacity: instructionsOpacity.value,
    }));
    return (
      <Animated.View
        style={[
          styles.instructionsContainer,
          { backgroundColor: currentTheme.surface },
          animatedInstructionsStyle,
        ]}
      >
        <Text style={[styles.instructionsTitle, { color: currentTheme.text }]}>
          {game.title} Instructions
        </Text>
        {game.instructions.map((step, idx) => (
          <Text key={idx} style={[styles.instructionText, { color: currentTheme.text }]}>
            {idx + 1}. {step}
          </Text>
        ))}
        {renderVideo()}
      </Animated.View>
    );
  }

  // Render the video view.
  function renderVideo() {
    const game = GAMES[selectedIndex];
    if (!game.video) {
      return (
        <View style={[styles.videoContainer, { backgroundColor: currentTheme.background }]}>
          <Text style={{ color: currentTheme.text }}>No video available</Text>
        </View>
      );
    }
    return (
      <View style={[styles.videoContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.text }]}>
        <Pressable onPress={handleVideoPress} style={{ flex: 1 }}>
          <VideoView style={styles.video} player={player} />
          {isVideoPaused && (
            <View style={styles.overlay}>
              <Text style={[styles.overlayText, { color: currentTheme.text }]}>
                Tap to play video
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator
    >
      <Text style={[styles.title, { color: currentTheme.text }]}>Freeplay Games</Text>
      {renderGameList()}
      {renderInstructions()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    alignItems: 'center',
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  squaresSection: {
    height: 160,
    marginBottom: 24,
    alignSelf: 'center',
    width: '90%',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  gameSquare: {
    width: 120,
    height: 120,
    marginHorizontal: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.75,
  },
  instructionsContainer: {
    width: '90%',
    borderRadius: 12,
    padding: 18,
    alignSelf: 'center',
    marginBottom: 24,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  videoContainer: {
    width: '90%',
    maxWidth: 600,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 12,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
});
