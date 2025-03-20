import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackSource  } from 'expo-av';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
import { Game, GAMES } from '@/constants/games';

export default function Freeplay() {
  const router = useRouter();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const instructionsX = useRef(new Animated.Value(0)).current;
  const instructionsOpacity = useRef(new Animated.Value(1)).current;
  const scaleAndOpacity = useRef(GAMES.map(() => new Animated.Value(0))).current;
  const borderAnims = useRef(GAMES.map(() => new Animated.Value(0))).current;
  const tapTextAnims = useRef(GAMES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    animateSelected(selectedIndex);
  }, []);

  function animateSelected(index: number) {
    Animated.parallel([
      Animated.timing(scaleAndOpacity[index], { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(borderAnims[index], { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(tapTextAnims[index], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  function selectGame(newIndex: number) {
    if (newIndex === selectedIndex) {
      handlePlay();
      return;
    }

    Animated.parallel([
      Animated.timing(scaleAndOpacity[selectedIndex], { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(borderAnims[selectedIndex], { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(tapTextAnims[selectedIndex], { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();

    const dir = newIndex > selectedIndex ? -300 : 300;
    Animated.parallel([
      Animated.timing(instructionsX, { toValue: dir, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(instructionsOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setSelectedIndex(newIndex);
      instructionsX.setValue(-dir);
      instructionsOpacity.setValue(0);
      animateSelected(newIndex);

      Animated.parallel([
        Animated.timing(instructionsX, { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(instructionsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  }

  function handlePlay() {
    router.push(`/games/${GAMES[selectedIndex].id}`);
  }

  function renderGameList() {
    return (
      <View style={styles.squaresSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.scrollContent}>
          {GAMES.map((game, i) => {
            const scale = scaleAndOpacity[i].interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
            const sqOpacity = scaleAndOpacity[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
            const borderWidth = borderAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) as unknown as number;
            const isSelected = i === selectedIndex;
  
            return (
              <Pressable
                key={game.id}
                onPress={() => selectGame(i)}
                style={[
                  styles.gameSquare,
                  {
                    backgroundColor: isSelected ? currentTheme.primary : currentTheme.surface, // More saturated color for selected
                    borderColor: isSelected ? currentTheme.primary : 'transparent', // Border only for selected
                    borderWidth,
                    transform: [{ scale }],
                    opacity: isSelected ? 1 : 0.7, // Make unselected items softer
                  },
                ]}
              >
                <Text style={[styles.gameTitle, { color: currentTheme.text }]}>{game.title}</Text>
                <Animated.Text style={[styles.subtitle, { color: currentTheme.text, opacity: tapTextAnims[i] }]}>
                  (Tap to play)
                </Animated.Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }
  
  
  

  function renderInstructions() {
    const game = GAMES[selectedIndex];
  
    return (
      <Animated.View style={[styles.instructionsContainer, { backgroundColor: currentTheme.surface, transform: [{ translateX: instructionsX }], opacity: instructionsOpacity }]}>
        <Text style={[styles.instructionsTitle, { color: currentTheme.text }]}>{game.title} Instructions</Text>
        {game.instructions.map((step, idx) => (
          <Text key={idx} style={[styles.instructionText, { color: currentTheme.text }]}>{idx + 1}. {step}</Text>
        ))}
  
        {/* Move video BELOW instructions */}
        {renderVideo(game.video)}
      </Animated.View>
    );
  }
  

  function renderVideo(videoSrc?: string | AVPlaybackSource) {
    if (!videoSrc) {
      return (
        <View style={[styles.videoContainer, { backgroundColor: currentTheme.background }]}>
          <Text style={{ color: currentTheme.text }}>No video available</Text>
        </View>
      );
    }
  
    return (
      <View style={[styles.videoContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.text }]}>
        <Video
          source={typeof videoSrc === 'string' ? { uri: videoSrc } : videoSrc}
          style={styles.video}
          isLooping
          shouldPlay
          resizeMode={ResizeMode.CONTAIN}
        />
      </View>
    );
  }
  

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Freeplay Games</Text>
      {renderGameList()}
      {renderInstructions()}
    </View>
  );
}

const styles = StyleSheet.create({
  /** ===========================
   *  Main Layout
   =========================== **/
  container: {
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
  },

  // Page Title
  title: {
    fontSize: 22,
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  /** ===========================
   *  Game Selection Squares
   =========================== **/
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
    borderWidth: 2, // Default border for unselected
  },
  selectedGameSquare: {
    borderWidth: 3, // Thicker border for selected
    transform: [{ scale: 1.05 }], // Slight enlargement
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

  /** ===========================
   *  Instructions Section
   =========================== **/
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

  /** ===========================
   *  Video Container & Scaling
   =========================== **/
  videoContainer: {
    width: '90%',
    maxWidth: 600,
    height: 250,
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
  videoPlaceholder: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
    opacity: 0.8,
  },
});
