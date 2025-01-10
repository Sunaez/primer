import React, { useState, useEffect, useRef } from "react";
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
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState(0); // Current round (starts at 0)
  const [gameState, setGameState] = useState<"start" | "playing" | "waiting" | "finished">(
    "start"
  );

  const numRounds = 5; // Total rounds
  const switchRate = 450; // Time between shape switches (ms)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameState === "playing") {
      startShapeRandomization();
    }
    return () => clearInterval(intervalRef.current as NodeJS.Timeout); // Cleanup interval
  }, [gameState]);

  useEffect(() => {
    // Check for matches
    if (leftShape.shape === rightShape.shape && leftShape.color === rightShape.color) {
      if (!startTime) {
        setStartTime(performance.now()); // Start timer on match
      }
      clearInterval(intervalRef.current as NodeJS.Timeout); // Stop randomization
    }
  }, [leftShape, rightShape]);

  const getRandomShape = () => {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = shapeColorMap[shape];
    return { shape, color };
  };

  const startShapeRandomization = () => {
    let count = 0;
    intervalRef.current = setInterval(() => {
      const newLeft = getRandomShape();
      const newRight = Math.random() > 0.8 ? newLeft : getRandomShape(); // Rare match
      setLeftShape(newLeft);
      setRightShape(newRight);
      count++;

      if (count >= 50) clearInterval(intervalRef.current as NodeJS.Timeout); // Limit randomization
    }, switchRate);
  };

  const handleScreenPress = () => {
    if (gameState === "start") {
      setGameState("playing"); // Start the game
      setCurrentRound(1); // First round
    } else if (gameState === "playing" && startTime) {
      const reactionTime = performance.now() - startTime;
      setReactionTimes((prev) => [...prev, reactionTime]);
      setGameState("waiting"); // Round ends, wait for next round
    } else if (gameState === "waiting") {
      if (currentRound < numRounds) {
        setCurrentRound((prev) => prev + 1);
        setGameState("playing"); // Start next round
        setStartTime(null); // Reset timer
      } else {
        setGameState("finished"); // End game
      }
    }
  };

  const calculateAverageTime = () => {
    if (reactionTimes.length === 0) return "0.000";
    return (
      reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    ).toFixed(3);
  };

  const renderShape = ({ shape, color }: { shape: string; color: string }) => {
    const ShapeComponent = shapeComponents[shape as keyof typeof shapeComponents];
    return ShapeComponent ? <ShapeComponent color={color} size={200} /> : null;
  };

  return (
    <TouchableWithoutFeedback onPress={handleScreenPress}>
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        {gameState === "start" ? (
          <Text style={[styles.text, { color: Colors.text }]}>Press the screen to start</Text>
        ) : gameState === "finished" ? (
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
                setCurrentRound(0);
                setReactionTimes([]);
                setGameState("start");
              }}
            />
          </View>
        ) : gameState === "waiting" ? (
          <View>
            <Text style={[styles.text, { color: Colors.text }]}>
              Reaction Time: {reactionTimes[currentRound - 1]?.toFixed(3)} ms
            </Text>
            <Text style={[styles.text, { color: Colors.primary }]}>Start Next Round</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.text, { color: Colors.text }]}>
              Round {currentRound} of {numRounds}
            </Text>
            <View style={styles.shapesContainer}>
              {renderShape(leftShape)}
              {renderShape(rightShape)}
            </View>
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
