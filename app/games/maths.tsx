import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import { uploadMathsGameScore } from '@/components/backend/MathsScoreService';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
import ReturnFreeplayButton from '@/components/ReturnFreeplayButton';

interface Result {
  correct: boolean;
  time: number; // in seconds
}

const TOTAL_QUESTIONS = 10;

//////////////////////////
// AnimatedCounter Component
//////////////////////////
// This component uses React Native's built-in Animated API (aliased as RNAnimated)
// to animate a value from 0 to the target over the specified duration.
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
      duration,
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

export default function MathsGame() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const [stage, setStage] = useState<'playing' | 'results'>('playing');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [datePlayed, setDatePlayed] = useState('');
  const [hasUploaded, setHasUploaded] = useState(false);

  useEffect(() => {
    if (stage === 'playing') {
      setDatePlayed(new Date().toISOString());
      generateQuestion();
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'results' && !hasUploaded) {
      handleAutoUploadScore();
    }
  }, [stage]);

  function generateQuestion() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;

    setCurrentQuestion(`${num1} + ${num2}`);
    setCorrectAnswer(answer);
    setChoices(generateRandomChoices(answer));
    setStartTime(Date.now());
  }

  function generateRandomChoices(correct: number) {
    const choiceSet = new Set<number>();
    choiceSet.add(correct);

    while (choiceSet.size < 4) {
      const offset = Math.floor(Math.random() * 11) - 5; // -5 to +5 range
      const fakeAnswer = correct + offset;
      if (fakeAnswer >= 0) choiceSet.add(fakeAnswer);
    }

    // Shuffle choices
    return Array.from(choiceSet).sort(() => Math.random() - 0.5);
  }

  function handleAnswer(selected: number) {
    if (correctAnswer === null) return;

    const timeTakenMs = Date.now() - startTime;
    const isCorrect = selected === correctAnswer;

    setResults((prev) => [...prev, { correct: isCorrect, time: timeTakenMs / 1000 }]);
    if (isCorrect) setScore((prev) => prev + 1);

    if (questionIndex < TOTAL_QUESTIONS - 1) {
      setQuestionIndex((prev) => prev + 1);
      generateQuestion();
    } else {
      setStage('results');
    }
  }

  async function handleAutoUploadScore() {
    try {
      const totalTimeSec = results.reduce((sum, r) => sum + r.time, 0);
      const averageTimeMs = (totalTimeSec / TOTAL_QUESTIONS) * 1000;

      await uploadMathsGameScore(datePlayed, score, averageTimeMs);

      setHasUploaded(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload score.');
    }
  }

  function handlePlayAgain() {
    setQuestionIndex(0);
    setScore(0);
    setResults([]);
    setHasUploaded(false);
    setStage('playing');
  }

  if (stage === 'results') {
    const totalTimeSec = results.reduce((sum, r) => sum + r.time, 0);
    const averageTimeMs = (totalTimeSec / TOTAL_QUESTIONS) * 1000;
    const averageTimeSec = totalTimeSec / TOTAL_QUESTIONS;

    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.header, { color: currentTheme.text }]}>Game Over</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>
          Score: <AnimatedCounter target={score} duration={1000} /> / {TOTAL_QUESTIONS}
        </Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>
          Avg. Reaction Time: <AnimatedCounter target={averageTimeMs} duration={1000} formatter={(n) => n.toFixed(0)} />ms
        </Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>
          Avg. Time per Question: <AnimatedCounter target={averageTimeSec} duration={1000} formatter={(n) => n.toFixed(2)} /> s
        </Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>
          Played On: {new Date(datePlayed).toLocaleString()}
        </Text>

        <Text style={[styles.uploadedLabel, { color: currentTheme.text }]}>Score Uploaded!</Text>

        <View style={styles.buttonRow}>
          <ReturnFreeplayButton />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: currentTheme.button }]}
            onPress={handlePlayAgain}
          >
            <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>
              Play Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.question, { color: currentTheme.text }]}>
        Question {questionIndex + 1} of {TOTAL_QUESTIONS}
      </Text>
      <Text style={[styles.problem, { color: currentTheme.text }]}>{currentQuestion}</Text>
      <View style={styles.answerGrid}>
        {choices.map((choice, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.answerButton, { backgroundColor: currentTheme.button }]}
            onPress={() => handleAnswer(choice)}
          >
            <Text style={[styles.answerText, { color: currentTheme.buttonText }]}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Parkinsans',
  },
  stats: {
    fontSize: 20,
    marginVertical: 6,
    textAlign: 'center',
    fontFamily: 'Parkinsans',
  },
  question: {
    fontSize: 24,
    marginBottom: 8,
    fontFamily: 'Parkinsans',
  },
  problem: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 24,
    fontFamily: 'Parkinsans',
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  answerButton: {
    padding: 20,
    borderRadius: 10,
    margin: 10,
    width: '40%',
    alignItems: 'center',
  },
  answerText: {
    fontSize: 24,
    fontFamily: 'Parkinsans',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: 'Parkinsans',
  },
  uploadedLabel: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Parkinsans',
  },
});
