import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
} from "react-native";

const ArithmeticChallenge = ({ navigation }: any) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{ correct: boolean; time: number }[]>(
    []
  );
  const [startTime, setStartTime] = useState(0);

  const generateQuestion = () => {
    const operators = ["+", "-", "x", "/"];
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let question = `${num1} ${operator} ${num2}`;
    let answer;

    switch (operator) {
      case "+":
        answer = num1 + num2;
        break;
      case "-":
        answer = num1 - num2;
        break;
      case "x":
        answer = num1 * num2;
        break;
      case "/":
        if (num1 % num2 !== 0) {
          return generateQuestion();
        }
        answer = Math.floor(num1 / num2);
        break;
    }

    const choices = generateChoices(answer);
    setCurrentQuestion(question);
    setCorrectAnswer(answer);
    setAnswers(choices);
    setStartTime(Date.now());
  };

  const generateChoices = (correct: number) => {
    const choices = new Set<number>();
    choices.add(correct);
    while (choices.size < 4) {
      const randomChoice =
        correct + Math.floor(Math.random() * 10) - Math.floor(Math.random() * 5);
      if (randomChoice > 0) {
        choices.add(randomChoice);
      }
    }
    return Array.from(choices).sort(() => Math.random() - 0.5);
  };

  const handleAnswer = (selectedAnswer: number) => {
    const timeTaken = (Date.now() - startTime) / 1000;
    setResults([
      ...results,
      {
        correct: selectedAnswer === correctAnswer,
        time: parseFloat(timeTaken.toFixed(1)),
      },
    ]);
    if (selectedAnswer === correctAnswer) {
      setScore(score + 1);
    }
    if (questionIndex < 9) {
      setQuestionIndex(questionIndex + 1);
      generateQuestion();
    } else {
      setQuestionIndex(10); // To signal game over
    }
  };

  useEffect(() => {
    if (questionIndex === 10) {
      Alert.alert("Game Over", "See your results below!");
    }
  }, [questionIndex]);

  const restartGame = () => {
    setScore(0);
    setQuestionIndex(0);
    setResults([]);
    generateQuestion();
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  if (questionIndex > 9) {
    return (
      <View style={styles.container}>
        <Text style={[styles.header, { marginBottom: 10 }]}>Results</Text>
        <FlatList
          data={results}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.resultRow}>
              <Text style={styles.resultText}>
                Question {index + 1}: {item.correct ? "Correct" : "Incorrect"}
              </Text>
              <Text style={styles.resultText}>Time: {item.time}s</Text>
            </View>
          )}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={restartGame}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.homeButton]}
            onPress={() => navigation.navigate("Freeplay")}
          >
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{currentQuestion}</Text>
      <View style={styles.grid}>
        {answers.map((choice, index) => (
          <TouchableOpacity
            key={index}
            style={styles.answerButton}
            onPress={() => handleAnswer(choice)}
          >
            <Text style={styles.answerText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.progress}>
        Question {questionIndex + 1} / 10 | Score: {score}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  question: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  answerButton: {
    backgroundColor: "#1e88e5",
    padding: 20,
    borderRadius: 10,
    margin: 10,
    width: "40%",
    alignItems: "center",
  },
  answerText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  progress: {
    fontSize: 18,
    color: "#ccc",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: "100%",
  },
  resultText: {
    fontSize: 18,
    color: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
  },
  retryButton: {
    backgroundColor: "#4caf50",
  },
  homeButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ArithmeticChallenge;
