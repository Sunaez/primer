import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
import ReturnFreeplayButton from '@/components/ReturnFreeplayButton';
import { uploadGameScore } from '@/components/backend/scoreService';

interface Result {
  correct: boolean;
  time: number;
}

type Stage = 'playing' | 'results';

const TOTAL_QUESTIONS = 10;

export default function MathsGame({ difficulty = 'easy' }) {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Game State Variables
  const [stage, setStage] = useState<Stage>('playing');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [datePlayed, setDatePlayed] = useState('');

  useEffect(() => {
    if (stage === 'playing') {
      setDatePlayed(new Date().toISOString()); // Store when the game started
      generateQuestion();
    }
  }, [stage]);

  function generateQuestion() {
    const operators = ['+', '-', 'x', '/'];
    const range = difficulty === 'hard' ? 50 : difficulty === 'medium' ? 20 : 10;

    const num1 = Math.floor(Math.random() * range) + 1;
    const num2 = Math.floor(Math.random() * range) + 1;
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let question = `${num1} ${operator} ${num2}`;
    let answer: number;

    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case 'x':
        answer = num1 * num2;
        break;
      case '/':
        if (num2 === 0 || num1 % num2 !== 0) {
          return generateQuestion();
        }
        answer = Math.floor(num1 / num2);
        break;
      default:
        answer = 0;
    }

    setCurrentQuestion(question);
    setCorrectAnswer(answer);
    setAnswers(generateChoices(answer));
    setStartTime(Date.now());
  }

  function generateChoices(correct: number) {
    const choices = new Set<number>();
    choices.add(correct);

    while (choices.size < 4) {
      const offset = Math.floor(Math.random() * 5) - 2;
      choices.add(correct + offset);
    }

    return Array.from(choices).sort(() => Math.random() - 0.5);
  }

  function handleAnswer(selected: number) {
    if (correctAnswer == null) return;
    const timeTaken = (Date.now() - startTime) / 1000;
    const wasCorrect = selected === correctAnswer;

    setResults((prev) => [...prev, { correct: wasCorrect, time: timeTaken }]);
    if (wasCorrect) setScore((prev) => prev + 1);

    if (questionIndex < TOTAL_QUESTIONS - 1) {
      setQuestionIndex((prev) => prev + 1);
      generateQuestion();
    } else {
      setStage('results');
    }
  }

  function handleTryAgain() {
    setStage('playing');
    setQuestionIndex(0);
    setScore(0);
    setResults([]);
    setHasUploaded(false);
  }

  async function handleUploadScore() {
    try {
      const totalTime = results.reduce((sum, r) => sum + r.time, 0);
      const accuracy = (score / TOTAL_QUESTIONS) * 100;
      const averageTime = totalTime / TOTAL_QUESTIONS;

      await uploadGameScore({
        gameName: "mathsGame",  // Identifies this game
        datePlayed: datePlayed, // When the game was played
        timeTaken: parseFloat(totalTime.toFixed(2)), // Total duration in seconds
        timestamp: Date.now(), // Unix timestamp

        // Game-specific fields:
        difficulty,
        score,                 // Number of correct answers
        totalQuestions: TOTAL_QUESTIONS, // Total number of questions
        accuracy: parseFloat(accuracy.toFixed(1)), // Percentage of correct answers
        averageTime: parseFloat(averageTime.toFixed(2)), // Average response time per question
      });

      Alert.alert('Success', 'Your score has been uploaded!');
      setHasUploaded(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload score.');
    }
  }

  function renderResults() {
    const totalTime = results.reduce((sum, r) => sum + r.time, 0);
    const accuracy = (score / TOTAL_QUESTIONS) * 100;
    const averageTime = totalTime / TOTAL_QUESTIONS;

    return (
      <View style={[styles.resultsContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.header, { color: currentTheme.text }]}>Game Over</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>Score: {score} / {TOTAL_QUESTIONS}</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>Accuracy: {accuracy.toFixed(1)}%</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>Avg. Time per Question: {averageTime.toFixed(2)}s</Text>
        <Text style={[styles.stats, { color: currentTheme.text }]}>Played On: {new Date(datePlayed).toLocaleString()}</Text>

        <View style={styles.buttonRow}>
          <ReturnFreeplayButton />
          <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.button }]} onPress={handleTryAgain}>
            <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Try Again</Text>
          </TouchableOpacity>
          {hasUploaded ? (
            <Text style={[styles.uploadedLabel, { color: currentTheme.text }]}>Uploaded!</Text>
          ) : (
            <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.button }]} onPress={handleUploadScore}>
              <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Upload Score</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (stage === 'results') {
    return renderResults();
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.question, { color: currentTheme.text }]}>{currentQuestion}</Text>
      <View style={styles.answerGrid}>
        {answers.map((choice, i) => (
          <TouchableOpacity key={i} style={[styles.answerButton, { backgroundColor: currentTheme.button }]} onPress={() => handleAnswer(choice)}>
            <Text style={[styles.answerText, { color: currentTheme.buttonText }]}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.progress, { color: currentTheme.onSurface }]}>Question {questionIndex + 1} / {TOTAL_QUESTIONS}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    fontSize: 32,
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
    padding: 24,
    borderRadius: 8,
    margin: 12,
    width: '45%',
    alignItems: 'center',
  },
  answerText: {
    fontSize: 24,
    fontFamily: 'Parkinsans',
  },
  progress: {
    marginTop: 20,
    fontSize: 20,
    fontFamily: 'Parkinsans',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  resultsList: {
    marginVertical: 20,
  },
  resultText: {
    fontSize: 18,
    marginVertical: 4,
    textAlign: 'center',
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
    fontSize: 18,
    marginHorizontal: 12,
    fontFamily: 'Parkinsans',
  },
});
