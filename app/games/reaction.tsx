import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { WebView } from "react-native-webview";

const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const ranks = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];

const ReactionGame = () => {
  const [bottomCard, setBottomCard] = useState({ suit: "", rank: "" });
  const [upperCard, setUpperCard] = useState({ suit: "", rank: "" });
  const [isMatched, setIsMatched] = useState(false);
  const [round, setRound] = useState(1);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    if (upperCard.rank === bottomCard.rank) {
      setIsMatched(true);
    }
  }, [upperCard]);

  const getRandomCard = () => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    return { suit, rank };
  };

  const startNewGame = () => {
    const newBottomCard = getRandomCard();
    setBottomCard(newBottomCard);
    setUpperCard(getRandomCard());
    setIsMatched(false);
    setStartTime(0);
  };

  const startRound = () => {
    setStartTime(Date.now());
    setIsMatched(false);
    const interval = setInterval(() => {
      const newUpperCard = getRandomCard();
      setUpperCard(newUpperCard);
      if (newUpperCard.rank === bottomCard.rank) {
        clearInterval(interval);
        setStartTime(Date.now());
      }
    }, 300);
  };

  const handleReaction = () => {
    if (isMatched && startTime > 0) {
      const reactionTime = Date.now() - startTime;
      setReactionTimes([...reactionTimes, reactionTime]);
      if (round < 5) {
        setRound(round + 1);
        startNewGame();
      } else {
        calculateAverageTime();
      }
    } else {
      Alert.alert("Wait!", "You need to match the card first!");
    }
  };

  const calculateAverageTime = () => {
    const averageTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    Alert.alert(
      "Game Over",
      `Your average reaction time is ${averageTime.toFixed(2)} ms`,
      [{ text: "Restart", onPress: resetGame }]
    );
  };

  const resetGame = () => {
    setRound(1);
    setReactionTimes([]);
    startNewGame();
  };

  const renderCard = (card: { suit: string; rank: string }) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="./assets/js/elements.cardmeister.full.js"></script>
        <style>
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <playing-card suit="${card.suit}" rank="${card.rank}"></playing-card>
      </body>
      </html>
    `;

    return (
      <WebView
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={{ width: 150, height: 200 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reaction Game</Text>

      {/* Bottom Card */}
      <View style={styles.cardContainer}>
        <Text style={styles.label}>Bottom Card:</Text>
        {renderCard(bottomCard)}
      </View>

      {/* Upper Card */}
      <View style={styles.cardContainer}>
        <Text style={styles.label}>Upper Card:</Text>
        {renderCard(upperCard)}
      </View>

      {/* Round and Reaction */}
      <Text style={styles.roundText}>Round: {round} / 5</Text>
      <Button title={isMatched ? "REACT" : "WAIT..."} onPress={handleReaction} disabled={!isMatched} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212", // Use your app's color scheme
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  cardContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 10,
  },
  roundText: {
    fontSize: 16,
    color: "#ccc",
    marginVertical: 20,
  },
});

export default ReactionGame;
