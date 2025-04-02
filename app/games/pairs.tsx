import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
import AllShapes from '@/components/AllShapes';
// Ensure the import path matches your project structure.
import { uploadPairsGameScore } from '@/components/backend/PairsScoreService';

// Determine layout based on window width
const { width } = Dimensions.get('window');
const isDesktop = width >= 600;
const columns = isDesktop ? 5 : 2; // Desktop: 5 columns, Mobile: 2 columns
const rows = isDesktop ? 2 : 5;    // Desktop: 2 rows, Mobile: 5 rows
const CARD_MARGIN = 10;
// Make cards smaller by dividing by 1.2
const CARD_SIZE = ((width - (columns + 1) * CARD_MARGIN) / columns) / 1.2;

// Total preview duration (in milliseconds)
const PREVIEW_TIME = 3000;
// Cooldown duration when no match is found (in milliseconds)
const COOLDOWN = 1000;

type ShapeName = keyof typeof AllShapes;

// Each card has a shape, a color, an id, a flipped property, and a matched property.
type CardItem = {
  shape: ShapeName;
  color: string;
  id: number;
  flipped: boolean;
  matched: boolean;
};

//////////////////////////
// AnimatedCounter Component
//////////////////////////
const AnimatedCounter = ({
  target,
  duration,
  style,
  formatter,
}: {
  target: number;
  duration: number;
  style?: any;
  formatter?: (n: number) => string;
}) => {
  const animatedValue = React.useRef(new RNAnimated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const animation = RNAnimated.timing(animatedValue, {
      toValue: target,
      duration: duration,
      useNativeDriver: false,
    });
    animation.start();
    const id = animatedValue.addListener(({ value }) => {
      setDisplayValue(value);
    });
    return () => {
      animatedValue.removeListener(id);
    };
  }, [target, duration, animatedValue]);

  return (
    <Text style={style}>
      {formatter ? formatter(displayValue) : Math.floor(displayValue)}
    </Text>
  );
};

//////////////////////////
// Main Component: PairMatch
//////////////////////////
export default function PairMatch() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const router = useRouter();

  // Grid state: an array of 10 cards (one pair per shape)
  const [grid, setGrid] = useState<CardItem[]>([]);
  // Countdown overlay text (e.g., "3", "2", "1", "go!")
  const [countdown, setCountdown] = useState<string>('3');
  // When true, the preview is done and user can interact
  const [previewDone, setPreviewDone] = useState<boolean>(false);
  // Disable input during cooldown
  const [disabled, setDisabled] = useState<boolean>(false);
  // Selected card indices (that the user has flipped during play)
  const [selected, setSelected] = useState<number[]>([]);
  // Game state for turns, startTime, etc.
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [turns, setTurns] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  // Upload status message (empty until a result is available)
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // List of shapes and their colors (using only one color per shape for simplicity)
  const SHAPES = [
    { shape: 'Heart', color: '#FF0000' },
    { shape: 'Triangle', color: '#00FF00' },
    { shape: 'Hexagon', color: '#0000FF' },
    { shape: 'Rhombus', color: '#800080' },
    { shape: 'Star', color: '#FF00FF' },
  ];

  // Helper: invert a hex color (for card front background)
  const invertColor = (hex: string): string => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
  };

  // Initialize the game: create 10 cards (2 per shape), all start flipped (face up) for preview.
  const initializeGame = () => {
    const cards: CardItem[] = [];
    SHAPES.forEach(({ shape, color }) => {
      cards.push({ shape: shape as ShapeName, color, id: cards.length, flipped: true, matched: false });
      cards.push({ shape: shape as ShapeName, color, id: cards.length, flipped: true, matched: false });
    });
    // Shuffle cards
    const shuffled = cards.sort(() => Math.random() - 0.5);
    setGrid(shuffled);
    setCountdown('3');
    setPreviewDone(false);
    setSelected([]);
    setDisabled(false);
    setGameOver(false);
    setTurns(0);
    setStartTime(Date.now());
    setUploadStatus('');
  };

  useEffect(() => {
    initializeGame();

    // Start countdown sequence:
    const timer1 = setTimeout(() => setCountdown('2'), 1000);
    const timer2 = setTimeout(() => setCountdown('1'), 2000);
    const timer3 = setTimeout(() => {
      setCountdown('go!');
      // Flip all cards face down.
      setGrid(prev => prev.map(card => ({ ...card, flipped: false })));
    }, PREVIEW_TIME);
    const timer4 = setTimeout(() => {
      // Remove countdown overlay and allow gameplay.
      setCountdown('');
      setPreviewDone(true);
    }, PREVIEW_TIME + 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Auto-upload score when game is over.
  useEffect(() => {
    if (gameOver) {
      const totalTimeMs = Date.now() - startTime;
      uploadPairsGameScore(new Date(startTime).toISOString(), turns, totalTimeMs)
        .then((docId: string) => {
          console.log("Score uploaded, docId:", docId);
          setUploadStatus("Score Uploaded!");
        })
        .catch((err: any) => {
          console.error("Score upload failed:", err);
          setUploadStatus("Score Upload Failed.");
        });
    }
  }, [gameOver, startTime, turns]);

  // When a card is tapped (only if preview is done and input is not disabled)
  const handleCardPress = (index: number) => {
    if (!previewDone || disabled) return;
    // If already flipped or matched, do nothing.
    if (grid[index].flipped || grid[index].matched) return;
    // Flip this card face up.
    setGrid(prev =>
      prev.map((card, idx) => (idx === index ? { ...card, flipped: true } : card))
    );
    setSelected(prev => [...prev, index]);
  };

  // When two cards are selected, check for a match.
  useEffect(() => {
    if (selected.length === 2) {
      const [first, second] = selected;
      if (
        grid[first].shape === grid[second].shape &&
        grid[first].color === grid[second].color
      ) {
        // They match: mark them as matched immediately.
        setGrid(prev =>
          prev.map((card, idx) =>
            idx === first || idx === second ? { ...card, matched: true } : card
          )
        );
        setSelected([]);
      } else {
        // They do NOT match: disable input, wait for COOLDOWN, then flip them back.
        setDisabled(true);
        setTimeout(() => {
          setGrid(prev =>
            prev.map((card, idx) =>
              idx === first || idx === second ? { ...card, flipped: false } : card
            )
          );
          setSelected([]);
          setDisabled(false);
        }, COOLDOWN);
      }
      setTurns(prev => prev + 1);
    }
  }, [selected, grid]);

  // Check if all cards are matched.
  useEffect(() => {
    if (grid.length > 0 && grid.every(card => card.matched)) {
      setGameOver(true);
    }
  }, [grid]);

  // --- Card Component ---
  // Each card displays a green tick overlay if matched.
  const Card = ({ card, index }: { card: CardItem; index: number }) => {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handleCardPress(index)}
        style={styles.cardContainer}
      >
        <View style={[styles.card, { borderColor: currentTheme.border }]}>
          {card.flipped || card.matched ? (
            <View style={[styles.cardContent, { backgroundColor: invertColor(card.color) }]}>
              {(() => {
                const ShapeComponent = AllShapes[card.shape] as React.ElementType;
                return <ShapeComponent color={card.color} size={CARD_SIZE * 0.6} />;
              })()}
              {card.matched && (
                <View style={styles.tickOverlay}>
                  <Text style={styles.tickText}>✓</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.cardContent, { backgroundColor: currentTheme.surface }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (gameOver) {
    const totalTime = (Date.now() - startTime) / 1000;
    const timePerTurn = turns ? (Date.now() - startTime) / turns : 0;
    return (
      <View style={[styles.endScreen, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.header, { color: currentTheme.text }]}>Game Over!</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>
          Total Turns: <AnimatedCounter target={turns} duration={1000} />
        </Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>
          Time: <AnimatedCounter target={totalTime} duration={1000} formatter={(n) => n.toFixed(2)} />s
        </Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>
          Time Per Turn: <AnimatedCounter target={timePerTurn} duration={1000} formatter={(n) => n.toFixed(2)} />s
        </Text>
        {uploadStatus !== '' && (
          <Text style={[styles.uploadedLabel, { color: currentTheme.text }]}>{uploadStatus}</Text>
        )}
        <TouchableOpacity
          onPress={initializeGame}
          style={[styles.button, { backgroundColor: currentTheme.button }]}
        >
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>
            Play Again
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/freeplay')}
          style={[styles.button, { backgroundColor: currentTheme.button }]}
        >
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>
            Back to Freeplay
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.header, { color: currentTheme.text }]}>Quick Pair Match</Text>
      {/* Countdown Overlay */}
      {countdown !== '' && (
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownText, { color: currentTheme.text }]}>{countdown}</Text>
        </View>
      )}
      <View style={styles.grid}>
        {grid.map((card, index) => (
          <Card key={card.id} card={card} index={index} />
        ))}
      </View>
    </View>
  );
}
  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Parkinsans',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  cardContainer: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: CARD_MARGIN / 2,
  },
  card: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,255,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickText: {
    fontSize: 48,
    color: 'green',
    fontWeight: 'bold',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  endScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  uploadedLabel: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Parkinsans',
  },
  button: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Parkinsans',
  },
  stats: {
    fontSize: 18,
    marginVertical: 5,
    fontFamily: 'Parkinsans',
  },
});
