import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Button,
} from "react-native";
import { useThemeContext } from "@/context/ThemeContext";
import THEMES from "@/constants/themes";
import ReturnFreeplayButton from "@/components/ReturnFreeplayButton";

// Import shape components
import Heart from "./shapes/Heart";
import Triangle from "./shapes/Triangle";
import Hexagon from "./shapes/Hexagon";
import Rhombus from "./shapes/Rhombus";
import Star from "./shapes/Star";

const shapeComponents = {
  Heart,
  Triangle,
  Hexagon,
  Rhombus,
  Star,
};

const shapeColorMap: Record<keyof typeof shapeComponents, string> = {
  Heart: "#CC333F",
  Triangle: "#33FF57",
  Hexagon: "#3B8686",
  Rhombus: "#88A65E",
  Star: "#F8CA00",
};

const shapes = Object.keys(shapeComponents) as (keyof typeof shapeComponents)[];

const ReactionGame: React.FC = () => {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const [leftShape, setLeftShape] = useState<{ shape: keyof typeof shapeComponents; color: string }>({
    shape: "Heart",
    color: shapeColorMap.Heart,
  });
  const [rightShape, setRightShape] = useState<{ shape: keyof typeof shapeComponents; color: string }>({
    shape: "Triangle",
    color: shapeColorMap.Triangle,
  });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [gameState, setGameState] = useState<"start" | "playing" | "waiting" | "finished">("start");

  const numRounds = 5;
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState === "playing") {
      startShapeRandomization();
    }
    return () => clearInterval(intervalRef.current as number);
  }, [gameState]);

  const getRandomShape = (): { shape: keyof typeof shapeComponents; color: string } => {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = shapeColorMap[shape];
    return { shape, color };
  };

  const startShapeRandomization = () => {
    let matchesGenerated = 0;
    intervalRef.current = window.setInterval(() => {
      const newLeft = getRandomShape();
      let newRight: { shape: keyof typeof shapeComponents; color: string };

      if (Math.random() > 0.8 && matchesGenerated < numRounds) {
        newRight = newLeft;
        matchesGenerated++;
        if (!startTime) {
          const now = performance.now();
          setStartTime(now);
          startTimeRef.current = now;
        }
      } else {
        do {
          newRight = getRandomShape();
        } while (newRight.shape === newLeft.shape && newRight.color === newLeft.color);
      }

      setLeftShape(newLeft);
      setRightShape(newRight);
    }, 450);
  };

  const handleScreenPress = () => {
    if (gameState === "start") {
      setGameState("playing");
      setCurrentRound(1);
    } else if (gameState === "playing" && startTimeRef.current) {
      const reactionTime = performance.now() - startTimeRef.current;
      setReactionTimes((prev) => [...prev, reactionTime]);
      setGameState("waiting");
      setStartTime(null);
      startTimeRef.current = null;
    } else if (gameState === "waiting") {
      if (currentRound < numRounds) {
        setCurrentRound((prev) => prev + 1);
        setGameState("playing");
      } else {
        setGameState("finished");
      }
    }
  };

  const calculateAverageTime = () => {
    if (reactionTimes.length === 0) return "0.000";
    return (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(3);
  };

  const renderShape = ({
    shape,
    color,
  }: {
    shape: keyof typeof shapeComponents;
    color: string;
  }) => {
    const ShapeComponent = shapeComponents[shape];
    return ShapeComponent ? <ShapeComponent color={color} size={200} /> : null;
  };

  return (
    <TouchableWithoutFeedback onPress={handleScreenPress}>
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        {gameState === "start" ? (
          <Text style={[styles.text, { color: currentTheme.text }]}>
            Press the screen to start
          </Text>
        ) : gameState === "finished" ? (
          <View style={styles.resultContainer}>
            <Text style={[styles.text, { color: currentTheme.text }]}>Game Over!</Text>
            <View style={styles.table}>
              <Text style={[styles.text, { fontWeight: "bold", color: currentTheme.text }]}>
                Scores
              </Text>
              {reactionTimes.map((time, index) => (
                <Text key={index} style={[styles.text, { color: currentTheme.text }]}>{`Round ${index + 1}: ${time.toFixed(3)} ms`}</Text>
              ))}
              <Text style={[styles.text, { color: currentTheme.text }]}>
                Average Time: {calculateAverageTime()} ms
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <ReturnFreeplayButton />
              <Button title="Play Again" color={currentTheme.primary} onPress={() => {
                setCurrentRound(0);
                setReactionTimes([]);
                setGameState("start");
              }} />
            </View>
          </View>
        ) : gameState === "waiting" ? (
          <View>
            <Text style={[styles.text, { color: currentTheme.text }]}>
              Reaction Time: {reactionTimes[currentRound - 1]?.toFixed(3)} ms
            </Text>
            <Text style={[styles.text, { color: currentTheme.primary }]}>
              Start Next Round
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.text, { color: currentTheme.text }]}>
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
    fontFamily: "Parkinsans",
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
});

export default ReactionGame;
