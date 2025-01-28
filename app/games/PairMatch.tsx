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
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import AllShapes from '@/components/AllShapes';

const { width } = Dimensions.get('window');
const CARD_SIZE = width / 5 - 12; // Ensures 5x4 layout (adjusted for spacing)

// Define 10 shape pairs (each shape appears four times, forming two pairs)
const SHAPE_PAIRS = [
  { shape: 'Heart', colors: ['#FF0000', '#FFFF00'] }, // Red & Yellow
  { shape: 'Triangle', colors: ['#00FF00', '#FF69B4'] }, // Green & Pink
  { shape: 'Hexagon', colors: ['#0000FF', '#FFA500'] }, // Blue & Orange
  { shape: 'Rhombus', colors: ['#800080', '#00FFFF'] }, // Purple & Cyan
  { shape: 'Star', colors: ['#FF00FF', '#008080'] }, // Magenta & Teal
];

type ShapeItem = {
  shape: keyof typeof AllShapes;
  color: string;
  id: number;
};

export default function PairMatch() {
  const [grid, setGrid] = useState<ShapeItem[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [turns, setTurns] = useState<number>(0);
  const router = useRouter();

  // Store animations for each card
  const animations = useRef<Animated.Value[]>([]).current;

  // Initialize the grid and animations
  useEffect(() => {
    const pairs: ShapeItem[] = [];

    SHAPE_PAIRS.forEach(({ shape, colors }) => {
      pairs.push({ shape: shape as keyof typeof AllShapes, color: colors[0], id: pairs.length });
      pairs.push({ shape: shape as keyof typeof AllShapes, color: colors[0], id: pairs.length });
      pairs.push({ shape: shape as keyof typeof AllShapes, color: colors[1], id: pairs.length });
      pairs.push({ shape: shape as keyof typeof AllShapes, color: colors[1], id: pairs.length });
    });

    const shuffled = pairs.sort(() => Math.random() - 0.5);
    setGrid(shuffled);
    setStartTime(Date.now());

    animations.length = 0;
    shuffled.forEach(() => animations.push(new Animated.Value(0)));
  }, []);

  const handleFlip = (index: number) => {
    if (flipped.length < 2 && !flipped.includes(index) && !matched.includes(index)) {
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
          animateMatch(first);
          animateMatch(second);
          setMatched((prev) => [...prev, first, second]);
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => {
          animateFlip(first, false);
          animateFlip(second, false);
          setFlipped([]);
        }, 1000);
      }
      setTurns((prev) => prev + 1);
    }
  }, [flipped]);

  useEffect(() => {
    if (matched.length === grid.length) {
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

  const animateMatch = (index: number) => {
    Animated.timing(animations[index], {
      toValue: 2,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  };

  const renderCard = (item: ShapeItem, index: number) => {
    const interpolation = animations[index].interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['0deg', '180deg', '180deg'], // Rotate along X-axis
    });

    const scaleInterpolation = animations[index].interpolate({
      inputRange: [0, 1, 2],
      outputRange: [1, 1, 0],
    });

    const ShapeComponent = AllShapes[item.shape];

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handleFlip(index)}
        disabled={flipped.includes(index) || matched.includes(index)}
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ rotateX: interpolation }, { scale: scaleInterpolation }] },
          ]}
        >
          {flipped.includes(index) || matched.includes(index) ? (
            <View style={styles.revealedCard}>
              <ShapeComponent color={item.color} size={CARD_SIZE * 0.6} />
            </View>
          ) : (
            <View style={styles.hiddenCard} />
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {gameOver ? (
        <View style={styles.endScreen}>
          <Text style={styles.header}>Game Over!</Text>
          <Text style={styles.stats}>Turns: {turns}</Text>
          <Text style={styles.stats}>Time: {((Date.now() - startTime) / 1000).toFixed(2)}s</Text>
          <TouchableOpacity onPress={() => router.push('/freeplay')}>
            <Text style={styles.button}>Back to Freeplay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.header}>Quick Pair Match</Text>
          <View style={styles.grid}>
            {grid.map((item, index) => renderCard(item, index))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  cardContainer: { width: CARD_SIZE, height: CARD_SIZE, margin: 5 },
  card: { width: '100%', height: '100%', borderRadius: 8, backfaceVisibility: 'hidden' },
  hiddenCard: { backgroundColor: Colors.surface, flex: 1, borderRadius: 8 },
  revealedCard: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  endScreen: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  button: { fontSize: 20, color: 'white', backgroundColor: 'blue', padding: 10, borderRadius: 8 },
  stats: { fontSize: 18, color: Colors.text, marginVertical: 5 },
});
