import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';

import Colors from '@/constants/Colors';
import ReturnFreeplayButton from '@/components/ReturnFreeplayButton';

interface Result {
  correct: boolean;
  time: number;
}

type Stage = 'playing' | 'results';

/**
 * Arithmetic Challenge Game
 */
export default function ArithmeticChallenge({ difficulty = 'easy' }) {
  const [stage, setStage] = useState<Stage>('playing');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    if (stage === 'playing') {
      generateQuestion();
    }
  }, [stage]);

  function generateQuestion() {
    const operators = ['+', '-', 'x', '/'];
    const range =
      difficulty === 'hard' ? 50 : difficulty === 'medium' ? 20 : 10;

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

    if (questionIndex < 9) {
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
  }

  function renderResults() {
    const totalTime = results.reduce((sum, r) => sum + r.time, 0);
    const averageTime = (totalTime / results.length || 0).toFixed(1);
    const accuracy = ((score / results.length) * 100 || 0).toFixed(1);

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.header}>Game Over</Text>
        <Text style={styles.stats}>Score: {score} / 10</Text>
        <Text style={styles.stats}>Accuracy: {accuracy}%</Text>
        <Text style={styles.stats}>Average Time: {averageTime}s</Text>

        <FlatList
          style={styles.resultsList}
          data={results}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <Text style={styles.resultText}>
              Q{index + 1}: {item.correct ? 'Correct' : 'Wrong'} (
              {item.time.toFixed(1)}s)
            </Text>
          )}
        />

        <View style={styles.buttonRow}>
          <ReturnFreeplayButton />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.button }]}
            onPress={handleTryAgain}
          >
            <Text style={[styles.buttonText, { color: Colors.buttonText }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === 'results') {
    return renderResults();
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Text style={[styles.question, { color: Colors.text }]}>
        {currentQuestion}
      </Text>

      <View style={styles.answerGrid}>
        {answers.map((choice, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.answerButton, { backgroundColor: Colors.button }]}
            onPress={() => handleAnswer(choice)}
          >
            <Text style={[styles.answerText, { color: Colors.buttonText }]}>
              {choice}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.progress, { color: Colors.onSurface }]}>
        Question {questionIndex + 1} / 10
      </Text>
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
  },
  progress: {
    marginTop: 20,
    fontSize: 20,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
  },
  stats: {
    fontSize: 20,
    marginVertical: 6,
    textAlign: 'center',
    color: Colors.text,
  },
  resultsList: {
    marginVertical: 20,
  },
  resultText: {
    fontSize: 18,
    marginVertical: 4,
    textAlign: 'center',
    color: Colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  buttonText: {
    fontSize: 20,
  },
});
