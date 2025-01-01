import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, Button } from "react-native";
import Colors from "@/constants/Colors";

// Import shapes
import Heart from "./shapes/Heart";
import Triangle from "./shapes/Triangle";
import Hexagon from "./shapes/Hexagon";
import Rhombus from "./shapes/Rhombus";
import Star from "./shapes/Star";

// Map shape names to components
const shapeComponents = {
  Heart,
  Triangle,
  Hexagon,
  Rhombus,
  Star,
};

const shapeColorMap = {
  Heart: "#CC333F",
  Triangle: "#33FF57",
  Hexagon: "#3B8686",
  Rhombus: "#88A65E",
  Star: "#F8CA00",
};

const shapes = Object.keys(shapeComponents) as (keyof typeof shapeComponents)[];

const ReactionGame: React.FC = () => {
  const [leftShape, setLeftShape] = useState({ shape: "", color: "" });
  const [rightShape, setRightShape] = useState({ shape: "", color: "" });
  const [isMatched, setIsMatched] = useState(false);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState<"playing" | "waiting" | "finished">(
    "playing"
  );

  const numRounds = 5;
  const switchRate = 450; // Time between random shape changes (ms)
  let shapeInterval: NodeJS.Timeout;

  useEffect(() => {
    if (gameState === "playing") startNewRound();

    return () => clearInterval(shapeInterval); // Cleanup interval
  }, [gameState]);

  useEffect(() => {
    if (leftShape.shape === rightShape.shape && leftShape.color === rightShape.color) {
      setIsMatched(true);
      setStartTime(performance.now()); // Start timing when a match occurs
      clearInterval(shapeInterval); // Stop shapes from changing on match
    } else {
      setIsMatched(false);
      setStartTime(0); // Reset startTime if not matched
    }
  }, [leftShape, rightShape]);

  const getRandomShape = () => {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = shapeColorMap[shape];
    return { shape, color };
  };

  const startNewRound = () => {
    if (round > numRounds) {
      setGameState("finished");
      return;
    }

    setStartTime(0);
    let count = 0;
    shapeInterval = setInterval(() => {
      const newLeft = getRandomShape();
      const newRight = Math.random() > 0.8 ? newLeft : getRandomShape(); // Rare match
      setLeftShape(newLeft);
      setRightShape(newRight);
      count++;

      if (count >= 10 || gameState !== "playing") {
        clearInterval(shapeInterval);
      }
    }, switchRate);
  };

  const handleReaction = () => {
    if (isMatched && gameState === "playing") {
      const reactionTime = performance.now() - startTime;
      setReactionTimes([...reactionTimes, reactionTime]);
      setGameState("waiting"); // Pause game to show result
    } else if (gameState === "waiting") {
      setRound(round + 1);
      setGameState("playing"); // Start next round
    }
  };

  const calculateAverageTime = () => {
    return (
      reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    ).toFixed(3);
  };

  const renderShape = ({ shape, color }: { shape: string; color: string }) => {
    const ShapeComponent = shapeComponents[shape as keyof typeof shapeComponents];
    return ShapeComponent ? <ShapeComponent color={color} size={200} /> : null;
  };

  return (
    <TouchableWithoutFeedback onPress={handleReaction}>
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        {gameState === "finished" ? (
          <View style={styles.resultContainer}>
            <Text style={[styles.text, { color: Colors.text }]}>Game Over!</Text>
            <View style={styles.table}>
              <Text style={[styles.text, { fontWeight: "bold", color: Colors.text }]}>
                Scores
              </Text>
              {reactionTimes.map((time, index) => (
                <Text
                  key={index}
                  style={[styles.text, { color: Colors.text }]}
                >{`Round ${index + 1}: ${time.toFixed(3)} ms`}</Text>
              ))}
              <Text style={[styles.text, { color: Colors.text }]}>
                Average Time: {calculateAverageTime()} ms
              </Text>
            </View>
            <Button
              title="Play Again"
              color={Colors.primary}
              onPress={() => {
                setRound(1);
                setReactionTimes([]);
                setGameState("playing");
              }}
            />
          </View>
        ) : (
          <>
            <Text style={[styles.text, { color: Colors.text }]}>
              Round {round} of {numRounds}
            </Text>
            <View style={styles.shapesContainer}>
              {renderShape(leftShape)}
              {renderShape(rightShape)}
            </View>
            <Text
              style={[
                styles.bottomText,
                { color: isMatched ? Colors.primary : Colors.text },
              ]}
            >
              {isMatched ? "Matched! Click Now!" : ""}
            </Text>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    marginVertical: 10,
    textAlign: "center",
  },
  bottomText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  shapesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 40,
  },
  resultContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  table: {
    marginVertical: 20,
    alignItems: "center",
  },
});

export default ReactionGame;
