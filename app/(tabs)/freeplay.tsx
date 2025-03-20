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
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
import { Game, GAMES } from '@/constants/games';

export default function Freeplay() {
  const router = useRouter();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Check screen width to decide mobile vs. desktop layout
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Track which game is selected
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);

  // Animations for instructions: horizontal slide (instructionsX) + fade (instructionsOpacity)
  const instructionsX = useRef(new Animated.Value(0)).current;
  const instructionsOpacity = useRef(new Animated.Value(1)).current;

  // For each game, we keep 3 Animated.Values:
  //   1) scaleAndOpacity[i]: 0 => small+light, 1 => bigger+fully opaque
  //   2) borderAnim[i]: 0 => no border, 1 => 2px border
  //   3) tapTextAnim[i]: 0 => hidden, 1 => fully visible
  const scaleAndOpacity = useRef(GAMES.map(() => new Animated.Value(0))).current;
  const borderAnims = useRef(GAMES.map(() => new Animated.Value(0))).current;
  const tapTextAnims = useRef(GAMES.map(() => new Animated.Value(0))).current;

  // On first mount, set the initially selected game to “selected” state
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAndOpacity[selectedIndex], {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnims[selectedIndex], {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(tapTextAnims[selectedIndex], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** If the user taps a new game, animate out old instructions, squares -> unselected, etc. */
  function selectGame(newIndex: number) {
    if (newIndex === selectedIndex) {
      // Already selected => “tap to play”
      handlePlay();
      return;
    }
    setPrevIndex(selectedIndex);

    // Animate old selected squares => unselected
    Animated.parallel([
      Animated.timing(scaleAndOpacity[selectedIndex], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnims[selectedIndex], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(tapTextAnims[selectedIndex], {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Slide instructions out
    const dir = newIndex > selectedIndex ? -300 : 300;
    Animated.parallel([
      Animated.timing(instructionsX, {
        toValue: dir,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(instructionsOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Switch selected index
      setSelectedIndex(newIndex);

      // Jump instructions to opposite side, invisible
      instructionsX.setValue(-dir);
      instructionsOpacity.setValue(0);

      // Animate new squares => selected
      Animated.parallel([
        Animated.timing(scaleAndOpacity[newIndex], {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnims[newIndex], {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(tapTextAnims[newIndex], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Slide instructions in
      Animated.parallel([
        Animated.timing(instructionsX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(instructionsOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  /** Tapping the selected square => push the route */
  function handlePlay() {
    const game = GAMES[selectedIndex];
    router.push(`/games/${game.id}`);
  }

  // The currently selected game
  const selectedGame = GAMES[selectedIndex];

  // -------------- Renders --------------
  function renderSquares() {
    return (
      <View style={styles.squaresSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.scrollContent}
        >
          {GAMES.map((game, i) => {
            // scale from scaleAndOpacity[i]: 0 => 0.9, 1 => 1.0
            const scale = scaleAndOpacity[i].interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            });
            // lighten the background => an “opacity” approach or color interpolation
            // We'll do an “opacity” approach. 0 => 0.6, 1 => 1
            const sqOpacity = scaleAndOpacity[i].interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 1],
            });
            // border width: 0 -> 2
            const animatedBorderWidth = borderAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 2],
            }) as unknown as number; // TS cast
            // “tap to play” text fade
            const tapText = tapTextAnims[i];

            return (
              <Pressable
                key={game.id}
                onPress={() => selectGame(i)}
                style={[
                  styles.gameSquare,
                  {
                    backgroundColor: currentTheme.surface,
                    borderColor: currentTheme.primary,
                    borderWidth: animatedBorderWidth,
                    transform: [{ scale }],
                    opacity: sqOpacity,
                  },
                ]}
              >
                <Text style={[styles.gameTitle, { color: currentTheme.text }]}>
                  {game.title}
                </Text>
                <Animated.Text
                  style={[
                    styles.subtitle,
                    { color: currentTheme.text, opacity: tapText },
                  ]}
                >
                  (Tap to play)
                </Animated.Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  function renderInstructionsAndVideo() {
    return (
      <Animated.View
        style={[
          styles.instructionsContainer,
          {
            backgroundColor: currentTheme.surface,
            transform: [{ translateX: instructionsX }],
            opacity: instructionsOpacity,
          },
        ]}
      >
        {/**
         * On mobile, show video FIRST, then instructions
         * On desktop, show instructions THEN video
         */}
        {isMobile && (
          <View style={[styles.videoPlaceholder, { backgroundColor: currentTheme.background }]}>
            <Text style={{ color: currentTheme.text }}>
              Video: {selectedGame.video || 'N/A'}
            </Text>
          </View>
        )}

        <Text style={[styles.instructionsTitle, { color: currentTheme.text }]}>
          {selectedGame.title} Instructions
        </Text>
        {selectedGame.instructions.map((step, idx) => (
          <Text key={idx} style={[styles.instructionText, { color: currentTheme.text }]}>
            {idx + 1}. {step}
          </Text>
        ))}

        {!isMobile && (
          <View style={[styles.videoPlaceholder, { backgroundColor: currentTheme.background }]}>
            <Text style={{ color: currentTheme.text }}>
              Video: {selectedGame.video || 'N/A'}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }

  // -------------- Layout --------------
  // On mobile => instructions + video at top, squares pinned at bottom
  // We'll wrap them in a flex layout that places squares at the bottom.
  if (isMobile) {
    return (
      <View style={[styles.mobileContainer, { backgroundColor: currentTheme.surface }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Freeplay Games</Text>

        {/* This flex:1 area for instructions at top, squares at bottom */}
        <View style={styles.mobileContent}>
          {renderInstructionsAndVideo()}
          {renderSquares()}
        </View>
      </View>
    );
  }

  // Desktop => squares at top, instructions below
  return (
    <View style={[styles.desktopContainer, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Freeplay Games</Text>
      {renderSquares()}
      {renderInstructionsAndVideo()}
    </View>
  );
}

// ------------------ Styles ------------------
const styles = StyleSheet.create({
  // MOBILE & DESKTOP containers
  mobileContainer: {
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
  },
  mobileContent: {
    // Fill the screen, put squares at bottom
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    paddingBottom: 20, // a bit of bottom padding
  },
  desktopContainer: {
    // no flex:1 => smaller height if you prefer
    paddingTop: 20,
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    marginBottom: 10,
    fontFamily: 'Parkinsans',
  },

  // The squares row
  squaresSection: {
    height: 150,
    marginBottom: 16,
    // center horizontally on desktop
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 15,
    fontFamily: 'Parkinsans',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Parkinsans',
  },

  // Instructions & video
  instructionsContainer: {
    width: '90%',
    borderRadius: 8,
    padding: 16,
    alignSelf: 'center',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Parkinsans',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Parkinsans',
    marginBottom: 4,
  },
  videoPlaceholder: {
    marginVertical: 12,
    height: 100,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
