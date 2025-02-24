import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
import AllShapes from '@/components/AllShapes';

const { width, height } = Dimensions.get('window');
const IS_LANDSCAPE = width > height;
const COLUMNS = IS_LANDSCAPE ? 5 : 4;
const ROWS = IS_LANDSCAPE ? 4 : 5;
const CARD_SIZE = Math.min(width / COLUMNS - 12, height / ROWS - 12);

// Function to invert a color for the revealed face
const invertColor = (hex: string) => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff,
    g = (rgb >> 8) & 0xff,
    b = (rgb >> 0) & 0xff;
  return `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
};

const SHAPE_PAIRS = [
  { shape: 'Heart', colors: ['#FF0000', '#FFFF00'] },
  { shape: 'Triangle', colors: ['#00FF00', '#FF69B4'] },
  { shape: 'Hexagon', colors: ['#0000FF', '#FFA500'] },
  { shape: 'Rhombus', colors: ['#800080', '#00FFFF'] },
  { shape: 'Star', colors: ['#FF00FF', '#008080'] },
];

type ShapeName = keyof typeof AllShapes;

type ShapeItem = {
  shape: ShapeName;
  color: string;
  id: number;
};

export default function PairMatch() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const [grid, setGrid] = useState<ShapeItem[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [turns, setTurns] = useState<number>(0);
  const router = useRouter();

  const animations = useRef<Animated.Value[]>([]).current;
  const flippedState = useRef<boolean[]>([]).current;

  const initializeGame = () => {
    const pairs: ShapeItem[] = [];
    SHAPE_PAIRS.forEach(({ shape, colors }) => {
      pairs.push({ shape: shape as ShapeName, color: colors[0], id: pairs.length });
      pairs.push({ shape: shape as ShapeName, color: colors[0], id: pairs.length });
      pairs.push({ shape: shape as ShapeName, color: colors[1], id: pairs.length });
      pairs.push({ shape: shape as ShapeName, color: colors[1], id: pairs.length });
    });

    const shuffled = pairs.sort(() => Math.random() - 0.5);
    setGrid(shuffled);
    setStartTime(Date.now());
    setTurns(0);
    setFlipped([]);
    setMatched([]);
    setGameOver(false);

    animations.length = 0;
    flippedState.length = 0;
    shuffled.forEach(() => {
      animations.push(new Animated.Value(0));
      flippedState.push(false);
    });
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleFlip = (index: number) => {
    if (flipped.length < 2 && !flipped.includes(index) && !matched.includes(index)) {
      flippedState[index] = true;
      animateFlip(index, true);
      setFlipped((prev) => [...prev, index]);
    }
  };

  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      if (
        grid[first].shape === grid[second].shape &&
        grid[first].color === grid[second].color
      ) {
        setTimeout(() => {
          animateFlip(first, true);
          animateFlip(second, true);
          setMatched((prev) => [...prev, first, second]);
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => {
          flippedState[first] = false;
          flippedState[second] = false;
          animateFlip(first, false);
          animateFlip(second, false);
          setFlipped([]);
        }, 1000);
      }
      setTurns((prev) => prev + 1);
    }
  }, [flipped]);

  useEffect(() => {
    if (matched.length === grid.length && grid.length > 0) {
      setGameOver(true);
    }
  }, [matched]);

  const animateFlip = (index: number, flipToFront: boolean) => {
    Animated.timing(animations[index], {
      toValue: flipToFront ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start();
  };

  if (gameOver) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const timePerTurn = turns ? ((Date.now() - startTime) / turns).toFixed(2) : '0';
    return (
      <View style={[styles.endScreen, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.header, { color: currentTheme.text }]}>Game Over!</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>Total Turns: {turns}</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>Time: {totalTime}s</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>Time Per Turn: {timePerTurn}s</Text>
        <TouchableOpacity onPress={initializeGame} style={[styles.button, { backgroundColor: currentTheme.button }]}>
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/freeplay')} style={[styles.button, { backgroundColor: currentTheme.button }]}>
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Back to Freeplay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.header, { color: currentTheme.text }]}>Quick Pair Match</Text>
      <View style={styles.grid}>
        {grid.map((item, index) => {
          const ShapeComponent = AllShapes[item.shape] as React.ElementType;
          const bgColor = flippedState[index] || matched.includes(index)
            ? invertColor(item.color)
            : currentTheme.surface;
          return (
            <TouchableOpacity key={index} style={styles.cardContainer} onPress={() => handleFlip(index)}>
              <View style={[styles.revealedCard, { backgroundColor: bgColor }]}>
                {(flippedState[index] || matched.includes(index)) && (
                  <ShapeComponent color={item.color} size={CARD_SIZE * 0.6} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
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
    margin: 5,
  },
  revealedCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
