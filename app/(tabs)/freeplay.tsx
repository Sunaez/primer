// app/(tabs)/freeplay.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
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

// Import all info components from the /components/info folder.
import * as InfoModules from '@/components/info';

/**
 * InfoIconWithTooltip
 * This component uses the Ionicons "information-circle-outline".
 * On hover (web) it expands to reveal the text "Benefits".
 */
const InfoIconWithTooltip: React.FC<{ theme: any; onPress: () => void }> = ({ theme, onPress }) => {
  const [hovered, setHovered] = useState(false);
  // Shared value for container width: starts just wide enough for the icon.
  const containerWidth = useSharedValue(40);
  useEffect(() => {
    containerWidth.value = withTiming(hovered ? 140 : 40, { duration: 300 });
  }, [hovered]);
  const animatedContainerStyle = useAnimatedStyle(() => ({
    width: containerWidth.value,
  }));
  const backgroundColor = theme.focus || '#3498db';

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
    >
      <Animated.View style={[styles.infoIconWrapper, animatedContainerStyle, { backgroundColor }]}>
        <Ionicons name="information-circle-outline" size={32} color="#fff" />
        {hovered && <Text style={styles.infoTooltipText}> Benefits</Text>}
      </Animated.View>
    </Pressable>
  );
};

export default function Freeplay() {
  const router = useRouter();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();

  // State management
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedGameForInfo, setSelectedGameForInfo] = useState<Game | null>(null);

  // Reanimated shared values for animations.
  const instructionsX = useSharedValue(0);
  const instructionsOpacity = useSharedValue(1);
  const scaleAndOpacity = GAMES.map(() => useSharedValue(0));
  const borderAnims = GAMES.map(() => useSharedValue(0));
  const tapTextAnims = GAMES.map(() => useSharedValue(0));

  // Create a single VideoPlayer instance.
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const currentVideoUri = React.useRef<string | null>(null);

  // Update video source when the selected game changes.
  useEffect(() => {
    const game = GAMES[selectedIndex];
    if (game.video) {
      let finalUri: string | undefined;
      if (typeof game.video === 'string') {
        finalUri = game.video;
      } else if (typeof game.video === 'number') {
        finalUri = Asset.fromModule(game.video).uri;
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

  // Animate the selected game square on mount.
  useEffect(() => {
    animateSelected(selectedIndex);
  }, []);

  function animateSelected(index: number) {
    scaleAndOpacity[index].value = withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) });
    borderAnims[index].value = withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) });
    tapTextAnims[index].value = withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) });
  }

  // Called when a game square is pressed.
  function selectGame(newIndex: number) {
    if (newIndex === selectedIndex) {
      handlePlay();
      return;
    }
    scaleAndOpacity[selectedIndex].value = withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) });
    borderAnims[selectedIndex].value = withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) });
    tapTextAnims[selectedIndex].value = withTiming(0, { duration: 150, easing: Easing.inOut(Easing.ease) });
    const dir = newIndex > selectedIndex ? -300 : 300;
    instructionsX.value = withTiming(dir, { duration: 200, easing: Easing.inOut(Easing.ease) }, (finished) => {
      if (finished) runOnJS(handleInstructionsReset)(newIndex, dir);
    });
    instructionsOpacity.value = withTiming(0, { duration: 150, easing: Easing.inOut(Easing.ease) });
  }

  function handleInstructionsReset(newIndex: number, dir: number) {
    setSelectedIndex(newIndex);
    instructionsX.value = -dir;
    instructionsOpacity.value = 0;
    animateSelected(newIndex);
    instructionsX.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) });
    instructionsOpacity.value = withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) });
  }

  function handlePlay() {
    router.push(`/games/${GAMES[selectedIndex].id}`);
  }

  function handleVideoPress() {
    if (isVideoPaused) {
      player.play();
      setIsVideoPaused(false);
    } else {
      player.pause();
      setIsVideoPaused(true);
    }
  }

  // Info Modal functions.
  function openInfoModal(index: number) {
    setSelectedGameForInfo(GAMES[index]);
    setInfoModalVisible(true);
  }

  function closeInfoModal() {
    setInfoModalVisible(false);
    setSelectedGameForInfo(null);
  }

  /**
   * Renders the info component by checking for a component in the InfoModules
   * object that matches the selected game id. If not found, it displays a fallback.
   */
  function renderInfoContent() {
    if (!selectedGameForInfo) return null;
    // Look up the info component based on the current game id.
    const InfoComponent = (InfoModules as any)[selectedGameForInfo.id];
    return InfoComponent ? (
      <InfoComponent />
    ) : (
      <Text style={{ color: currentTheme.text }}>No file found</Text>
    );
  }

  // ----------------------------------------------------
  // Game Square Item Component
  // ----------------------------------------------------
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
    const animatedSquareStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 0.95 + 0.05 * scaleAndOpacity[index].value }],
      borderWidth: borderAnims[index].value * 3,
    }));
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

  function renderGameList() {
    return (
      <View style={styles.squaresSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.scrollContent}>
          {GAMES.map((game, i) => (
            <GameSquareItem key={game.id} game={game} index={i} isSelected={i === selectedIndex} onPress={selectGame} />
          ))}
        </ScrollView>
      </View>
    );
  }

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
              <Text style={[styles.overlayText, { color: currentTheme.text }]}>Tap to play video</Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  }

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
        <Text style={[styles.instructionsTitle, { color: currentTheme.text }]}>{game.title} Instructions</Text>
        {game.instructions.map((step, idx) => (
          <Text key={idx} style={[styles.instructionText, { color: currentTheme.text }]}>
            {idx + 1}. {step}
          </Text>
        ))}
        {renderVideo()}
        {/* Info icon placed below the video */}
        <View style={styles.infoIconArea}>
          <InfoIconWithTooltip theme={currentTheme} onPress={() => openInfoModal(selectedIndex)} />
        </View>
      </Animated.View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: currentTheme.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator
      >
        <Text style={[styles.title, { color: currentTheme.text }]}>Freeplay Games</Text>
        {renderGameList()}
        {renderInstructions()}
      </ScrollView>

      {/* Info Modal */}
      {infoModalVisible && (
        <Modal visible={infoModalVisible} animationType="slide" transparent onRequestClose={closeInfoModal}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: currentTheme.surface }]}>
              <ScrollView style={styles.modalContent}>{renderInfoContent()}</ScrollView>
              <Pressable onPress={closeInfoModal} style={styles.modalCloseButton}>
                <Text style={[styles.modalCloseText, { color: currentTheme.text }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
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
  infoIconArea: {
    marginTop: 12,
    alignSelf: 'center',
  },
  infoIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  infoTooltipText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#fff',
    lineHeight: 0,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 12,
    padding: 20,
  },
  modalContent: {
    maxHeight: 300,
    marginBottom: 20,
  },
  modalCloseButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
