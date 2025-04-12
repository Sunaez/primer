import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import ReturnFreeplayButton from '@/components/ReturnFreeplayButton';
import { uploadStroopTestScore } from '@/components/backend/StroopScoreService';
import { notLoggedInComments } from '@/constants/NotLoggedInComments';

interface StroopColor {
  name: string;
  value: string;
}

// Hardcoded Stroop colors.
const STROOP_COLORS: StroopColor[] = [
  { name: 'Red', value: '#FF5252' },
  { name: 'Green', value: '#00E676' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Purple', value: '#800080' },
];

const TOTAL_TRIALS = 10;

type Stage = 'ready' | 'playing' | 'results';

interface Result {
  correct: boolean;
  time: number; // in seconds
}

export default function Stroop() {
  const { themeName } = useThemeContext();
  const theme = THEMES[themeName] || THEMES.Dark;

  // Dummy flag for logged in status – replace with your auth check.
  const isLoggedIn = false;

  const [stage, setStage] = useState<Stage>('ready');
  const [trialIndex, setTrialIndex] = useState(0);
  const [word, setWord] = useState<StroopColor | null>(null);
  const [ink, setInk] = useState<StroopColor | null>(null);
  const [previousWord, setPreviousWord] = useState<string>('');
  const [previousInk, setPreviousInk] = useState<string>('');
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [datePlayed, setDatePlayed] = useState('');
  const [hasUploaded, setHasUploaded] = useState(false);
  const [loginComment, setLoginComment] = useState('');

  // Animated value refs.
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const totalTimeAnim = useRef(new Animated.Value(0)).current;
  const avgTimeAnim = useRef(new Animated.Value(0)).current;
  const scoreIndexAnim = useRef(new Animated.Value(0)).current;

  // Local state for displaying animated numbers.
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedTotalTime, setAnimatedTotalTime] = useState(0);
  const [animatedAvgTime, setAnimatedAvgTime] = useState(0);
  const [animatedScoreIndex, setAnimatedScoreIndex] = useState(0);

  // Start the first trial when the game begins.
  useEffect(() => {
    if (stage === 'playing' && trialIndex === 0) {
      setDatePlayed(new Date().toISOString());
      generateTrial();
    }
  }, [stage, trialIndex]);

  // When the game is over, animate the numbers.
  useEffect(() => {
    if (stage === 'results') {
      // If the user isn’t logged in, pick a random comment.
      if (!isLoggedIn) {
        setLoginComment(notLoggedInComments[Math.floor(Math.random() * notLoggedInComments.length)]);
      }
      const totalTime = results.reduce((sum, r) => sum + r.time, 0);
      const avgTime = totalTime / TOTAL_TRIALS;
      const scoreIndexValue = calculateScoreIndex(avgTime * 1000, score);

      // Reset animated values to zero.
      scoreAnim.setValue(0);
      totalTimeAnim.setValue(0);
      avgTimeAnim.setValue(0);
      scoreIndexAnim.setValue(0);

      const scoreListener = scoreAnim.addListener(({ value }) => setAnimatedScore(value));
      const totalTimeListener = totalTimeAnim.addListener(({ value }) => setAnimatedTotalTime(value));
      const avgTimeListener = avgTimeAnim.addListener(({ value }) => setAnimatedAvgTime(value));
      const scoreIndexListener = scoreIndexAnim.addListener(({ value }) => setAnimatedScoreIndex(value));

      Animated.parallel([
        Animated.timing(scoreAnim, { toValue: score, duration: 1000, useNativeDriver: false }),
        Animated.timing(totalTimeAnim, { toValue: totalTime, duration: 1000, useNativeDriver: false }),
        Animated.timing(avgTimeAnim, { toValue: avgTime, duration: 1000, useNativeDriver: false }),
        Animated.timing(scoreIndexAnim, { toValue: scoreIndexValue, duration: 1000, useNativeDriver: false }),
      ]).start();

      // If logged in, try to upload the score.
      if (isLoggedIn) {
        uploadScore();
      }

      return () => {
        scoreAnim.removeListener(scoreListener);
        totalTimeAnim.removeListener(totalTimeListener);
        avgTimeAnim.removeListener(avgTimeListener);
        scoreIndexAnim.removeListener(scoreIndexListener);
      };
    }
  }, [stage]);

  const startGame = () => {
    // Reset any animated numbers to 0.
    scoreAnim.setValue(0);
    totalTimeAnim.setValue(0);
    avgTimeAnim.setValue(0);
    scoreIndexAnim.setValue(0);
    setAnimatedScore(0);
    setAnimatedTotalTime(0);
    setAnimatedAvgTime(0);
    setAnimatedScoreIndex(0);

    setScore(0);
    setResults([]);
    setTrialIndex(0);
    setHasUploaded(false);
    setStage('playing');
  };

  const generateTrial = () => {
    let newWord: StroopColor;
    let newInk: StroopColor;
    let attempts = 0;
    do {
      newWord = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
      newInk = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
      attempts++;
      if (attempts > 10) break;
    } while (
      newWord.name === newInk.name ||
      (newWord.name === previousWord && newInk.name === previousInk)
    );

    setWord(newWord);
    setInk(newInk);
    setPreviousWord(newWord.name);
    setPreviousInk(newInk.name);
    setStartTime(Date.now());
  };

  const handleColorPress = (selected: StroopColor) => {
    const timeTaken = (Date.now() - startTime) / 1000;
    const isCorrect = selected.name === ink?.name;

    setResults((prev) => [...prev, { correct: isCorrect, time: timeTaken }]);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (trialIndex < TOTAL_TRIALS - 1) {
      setTrialIndex((prev) => prev + 1);
      generateTrial();
    } else {
      setStage('results');
    }
  };

  const uploadScore = async () => {
    try {
      const totalTime = results.reduce((sum, r) => sum + r.time, 0);
      const averageTimeMs = (totalTime / TOTAL_TRIALS) * 1000;
      await uploadStroopTestScore(datePlayed, score, averageTimeMs);
      setHasUploaded(true);
      Alert.alert("Score Uploaded", "Your score has been uploaded successfully.");
    } catch (error) {
      console.error('Error uploading score:', error);
      Alert.alert("Upload Error", "Failed to upload your score. Please try again later.");
    }
  };

  const formatSeconds = (seconds: number): string => {
    return `${seconds.toFixed(2)}s`;
  };

  const renderReady = () => (
    <View style={styles.centered}>
      <Text style={[styles.title, { color: theme.text }]}>Stroop</Text>
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: theme.button }]}
        onPress={startGame}
        accessibilityLabel="Start Game"
      >
        <Text style={[styles.startButtonText, { fontFamily: 'Parkinsans' }]}>Start Game</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlaying = () => (
    <View style={styles.centered}>
      <View style={[styles.wordContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.wordDisplay, { color: ink?.value || theme.text }]}>
          {word?.name}
        </Text>
      </View>
      <View style={styles.buttonsContainer}>
        {STROOP_COLORS.map((color) => (
          <TouchableOpacity
            key={color.name}
            onPress={() => handleColorPress(color)}
            accessibilityLabel={`Select ${color.name}`}
            style={[styles.colorButton, { backgroundColor: color.value }]}
          >
            <Text style={[styles.buttonLabel, { fontFamily: 'Parkinsans' }]}>{color.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderResults = () => {
    return (
      <View style={styles.centered}>
        <Text style={[styles.resultText, { fontFamily: 'Parkinsans', color: theme.text }]}>
          Correct: {Math.floor(animatedScore)} / {TOTAL_TRIALS}
        </Text>
        <Text style={[styles.resultText, { fontFamily: 'Parkinsans', color: theme.text }]}>
          Total Time: {formatSeconds(animatedTotalTime)}
        </Text>
        <Text style={[styles.resultText, { fontFamily: 'Parkinsans', color: theme.text }]}>
          Avg Time/Turn: {formatSeconds(animatedAvgTime)}
        </Text>
        <Text style={[styles.resultText, { fontFamily: 'Parkinsans', color: theme.text }]}>
          Score Index: {animatedScoreIndex.toFixed(2)}
        </Text>
        {!isLoggedIn && (
          <Text style={[styles.loginComment, { fontFamily: 'Parkinsans', color: theme.text }]}>
            {loginComment}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.button }]}
          onPress={startGame}
          accessibilityLabel="Play Again"
        >
          <Text style={[styles.startButtonText, { fontFamily: 'Parkinsans' }]}>Play Again</Text>
        </TouchableOpacity>
        <ReturnFreeplayButton />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {stage === 'ready' && renderReady()}
      {stage === 'playing' && renderPlaying()}
      {stage === 'results' && renderResults()}
    </View>
  );
}

function calculateScoreIndex(T: number, C: number): number {
  if (T > 0 && T <= 250) {
    return C * (5 - 5 * Math.cos((Math.PI / 250) * T));
  } else if (T > 250 && T < 10000) {
    const exponent = (Math.log(0.8) / 625) * ((T - 250) / 2);
    return 10 * C * Math.exp(exponent);
  } else {
    return 0;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 20,
  },
  wordContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  wordDisplay: {
    fontSize: 48,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 40,
  },
  colorButton: {
    width: 90,
    height: 90,
    borderRadius: 12,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    color: '#fff',
  },
  startButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 20,
  },
  startButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  resultText: {
    fontSize: 20,
    marginBottom: 10,
  },
  loginComment: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    marginVertical: 10,
  },
});
