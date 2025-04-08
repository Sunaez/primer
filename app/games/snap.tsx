import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Svg } from "react-native-svg";
import { useRouter } from "expo-router";
import { useThemeContext } from "@/context/UserContext";
import THEMES from "@/constants/themes";

// Import the score service for Snap game.
import { uploadSnapGameScore } from "@/components/backend/SnapScoreService";

// Import shape components.
import Heart from "./shapes/Heart";
import Triangle from "./shapes/Triangle";
import Hexagon from "./shapes/Hexagon";
import Rhombus from "./shapes/Rhombus";
import Star from "./shapes/Star";

// -------------------------
// Shape Configuration
// -------------------------
const shapeComponents = { Heart, Triangle, Hexagon, Rhombus, Star };
type ShapeKey = keyof typeof shapeComponents;
const shapes = Object.keys(shapeComponents) as ShapeKey[];
const shapeColorMap: Record<ShapeKey, string> = {
  Heart: "#CC333F",
  Triangle: "#33FF57",
  Hexagon: "#3B8686",
  Rhombus: "#88A65E",
  Star: "#F8CA00",
};

// -------------------------
// Game Constants & Layout
// -------------------------
const MAX_ROUNDS = 5;
const MAX_ATTEMPTS = 20;
const SHAPE_INTERVAL = 700; // ms between shape updates
const COOLDOWN_MS = 1500;   // ms valid reaction window
const BREAK_MS = 1000;      // break after a valid snap
const COUNTDOWN_VALUES = ["3", "2", "1", "Go!"];

const { width } = Dimensions.get("window");
const SHAPE_SIZE = width * 0.3; // shapes take up 30% of window width

// -------------------------
// Helper: getRandomShape
// -------------------------
function getRandomShape(): { shape: ShapeKey; color: string } {
  const index = Math.floor(Math.random() * shapes.length);
  const shape = shapes[index] as ShapeKey;
  return { shape, color: shapeColorMap[shape] };
}

// -------------------------
// CountdownText Component
// -------------------------
// Animates the countdown text upward and fades it out.
const CountdownText: React.FC<{ text: string }> = ({ text }) => {
  const { themeName } = useThemeContext();
  const theme = THEMES[themeName] || THEMES.Dark;
  const anim = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: anim.value }],
    opacity: 1 - anim.value / 70,
  }));
  useEffect(() => {
    anim.value = withTiming(70, { duration: 800, easing: Easing.inOut(Easing.ease) });
  }, [text]);
  return (
    <Animated.Text style={[styles.countdownText, animatedStyle, { color: theme.text }]}>
      {text}
    </Animated.Text>
  );
};

// -------------------------
// AnimatedScore Component
// -------------------------
// Animates score text upward when displayed.
const AnimatedScore: React.FC<{ text: string }> = ({ text }) => {
  const { themeName } = useThemeContext();
  const theme = THEMES[themeName] || THEMES.Dark;
  const scoreAnim = useSharedValue(50);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scoreAnim.value }],
    opacity: 1 - scoreAnim.value / 50,
  }));
  useEffect(() => {
    scoreAnim.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });
  }, [text]);
  return (
    <Animated.Text style={[styles.scoreText, animatedStyle, { color: theme.text }]}>
      {text}
    </Animated.Text>
  );
};

// -------------------------
// Helper: renderShape
// -------------------------
function renderShape(shapeData: { shape: ShapeKey; color: string }) {
  const ShapeComponent = shapeComponents[shapeData.shape];
  return (
    <View style={{ width: SHAPE_SIZE, height: SHAPE_SIZE }}>
      <Svg width="100%" height="100%">
        <ShapeComponent color={shapeData.color} size={SHAPE_SIZE} />
      </Svg>
    </View>
  );
}

// -------------------------
// Main Component: SnapGame
// -------------------------
type Phase = "initial" | "roundStart" | "roundEnd" | "gameEnd" | "failed";

const SnapGame: React.FC = () => {
  const { themeName } = useThemeContext();
  const theme = THEMES[themeName] || THEMES.Dark;
  const router = useRouter();

  // Phase state.
  const [phase, setPhase] = useState<Phase>("initial");
  const [readyMessage, setReadyMessage] = useState("Click here to get started!");

  // Round and reaction times.
  const [round, setRound] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [snapPressCount, setSnapPressCount] = useState<number>(0);

  // New state: datePlayed for score upload.
  const [datePlayed, setDatePlayed] = useState<string>("");
  // Upload status (for auto-upload feedback)
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Shape states.
  const [leftShape, setLeftShape] = useState<{ shape: ShapeKey; color: string }>(getRandomShape());
  const [rightShape, setRightShape] = useState<{ shape: ShapeKey; color: string }>(getRandomShape());

  // Flag: valid matching pair is on screen.
  const [waitingForSnap, setWaitingForSnap] = useState<boolean>(false);

  // Countdown state.
  const [countdownIndex, setCountdownIndex] = useState<number>(0);
  const countdownAnim = useSharedValue(0);

  // Refs for intervals and timers.
  const shapeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // ----- INITIAL PHASE -----
  const handleReadyPress = () => {
    setReadyMessage("Let's go!");
    // Set the game start date.
    setDatePlayed(new Date().toISOString());
    setTimeout(() => {
      setPhase("roundStart");
      setRound(1);
      startShapeLoop();
    }, 500);
  };

  // ----- ROUNDSTART PHASE: Shape Loop -----
  const startShapeLoop = useCallback(() => {
    if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);
    shapeIntervalRef.current = setInterval(() => {
      const left = getRandomShape();
      let right = getRandomShape();
      const shouldMatch = Math.random() > 0.7; // 30% chance for valid match.
      if (shouldMatch) {
        right = left;
        setWaitingForSnap(true);
        startTimeRef.current = performance.now();
        fallbackTimeoutRef.current = setTimeout(() => {
          setWaitingForSnap(false);
        }, COOLDOWN_MS);
      } else {
        while (right.shape === left.shape && right.color === left.color) {
          right = getRandomShape();
        }
        setWaitingForSnap(false);
      }
      setLeftShape(left);
      setRightShape(right);
      startTimeRef.current = performance.now();
    }, SHAPE_INTERVAL);
  }, []);

  // Ensure startTime is set when shapes are rendered.
  const onShapesLayout = () => {
    if (phase === "roundStart" && waitingForSnap && !startTimeRef.current) {
      startTimeRef.current = performance.now();
    }
  };

  // ----- Handle Tap in RoundStart Phase -----
  const handleRoundStartTap = () => {
    setSnapPressCount((prev) => {
      const newCount = prev + 1;
      if (newCount > MAX_ATTEMPTS) {
        setPhase("failed");
        if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);
      }
      return newCount;
    });
    if (!waitingForSnap || !startTimeRef.current) return;
    const reactionTime = performance.now() - startTimeRef.current;
    setReactionTimes((prev) => [...prev, reactionTime]);
    setWaitingForSnap(false);
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);
    setPhase("roundEnd");
  };

  // ----- RoundEnd Phase: Display current round score and rolling average -----
  const renderRoundEnd = () => {
    const lastScore = reactionTimes[reactionTimes.length - 1] || 0;
    const avg =
      reactionTimes.length > 0
        ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(2)
        : "0.00";
    return (
      <View style={styles.centered}>
        <AnimatedScore text={`Round ${round} Complete!`} />
        <AnimatedScore text={`Reaction: ${lastScore.toFixed(2)} ms`} />
        <AnimatedScore text={`Average: ${avg} ms`} />
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          onPress={handleNextPress}
        >
          <Text style={[styles.nextButtonText, { color: theme.text }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ----- Next Button Handler -----
  const handleNextPress = () => {
    if (round >= MAX_ROUNDS) {
      setPhase("gameEnd");
      if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);
    } else {
      setRound((prev) => prev + 1);
      setPhase("roundStart");
      startShapeLoop();
    }
  };

  // ----- Auto-Upload Score on GameEnd -----
  useEffect(() => {
    if (phase === "gameEnd") {
      if (reactionTimes.length > 0) {
        const avgReactionTimeMs =
          reactionTimes.reduce((sum, t) => sum + t, 0) / reactionTimes.length;
        uploadSnapGameScore(datePlayed, avgReactionTimeMs)
          .then((docId: string) => {
            console.log("Score uploaded, docId:", docId);
            setUploadStatus("Score Uploaded!");
          })
          .catch((err: any) => {
            console.error("Score upload failed:", err);
            setUploadStatus("Score Upload Failed.");
          });
      } else {
        setUploadStatus("No reaction times recorded.");
      }
    }
  }, [phase, datePlayed, reactionTimes]);

  // ----- GameEnd Phase: Display final results with animated scores -----
  const renderGameEnd = () => {
    const avg =
      reactionTimes.length > 0
        ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(2)
        : "0.00";
    return (
      <View style={styles.centered}>
        <AnimatedScore text={`Game Over`} />
        {reactionTimes.map((t, i) => (
          <AnimatedScore key={i} text={`Round ${i + 1}: ${t.toFixed(2)} ms`} />
        ))}
        {reactionTimes.length > 0 && <AnimatedScore text={`Avg: ${avg} ms`} />}
        {snapPressCount > MAX_ATTEMPTS && (
          <Text style={[styles.text, { color: theme.error ? theme.error : "red" }]}>
            Score invalidated due to excessive snapping.
          </Text>
        )}
        {uploadStatus !== "" && (
          <Text style={[styles.uploadedLabel, { color: theme.text }]}>{uploadStatus}</Text>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={resetGame}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/freeplay")}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ----- RESET GAME -----
  const resetGame = () => {
    setPhase("initial");
    setLeftShape(getRandomShape());
    setRightShape(getRandomShape());
    setRound(0);
    setReactionTimes([]);
    setSnapPressCount(0);
    setWaitingForSnap(false);
    startTimeRef.current = null;
    setDatePlayed("");
    setUploadStatus("");
  };

  // ----- Render UI -----
  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={phase === "roundStart" ? handleRoundStartTap : undefined}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {phase === "initial" && (
          <View style={styles.centered}>
            <TouchableOpacity onPress={handleReadyPress}>
              <Text style={[styles.readyText, { color: theme.text }]}>{readyMessage}</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "roundStart" && (
          <>
            <Text style={[styles.header, { color: theme.text }]}>
              Round {round} / {MAX_ROUNDS}
            </Text>
            <View style={styles.shapesRow} onLayout={onShapesLayout}>
              {renderShape(leftShape)}
              {renderShape(rightShape)}
            </View>
            <Text style={[styles.subText, { color: theme.text }]}>
              Tap the box to SNAP!
            </Text>
          </>
        )}

        {phase === "roundEnd" && renderRoundEnd()}

        {phase === "gameEnd" && renderGameEnd()}

        {phase === "failed" && (
          <View style={styles.centered}>
            <Text style={[styles.header, { color: theme.text }]}>Game Failed</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={resetGame}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  centered: { alignItems: "center" },
  shapesRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginVertical: 20,
  },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 20, fontFamily: "Parkinsans" },
  text: { fontSize: 18, marginVertical: 6, textAlign: "center", fontFamily: "Parkinsans" },
  subText: { fontSize: 20, marginTop: 10, fontFamily: "Parkinsans" },
  readyText: { fontSize: 24, fontFamily: "Parkinsans" },
  countdownText: { fontSize: 48, fontWeight: "bold", fontFamily: "Parkinsans", marginTop: 10 },
  scoreText: { fontSize: 18, marginVertical: 4, textAlign: "center", fontFamily: "Parkinsans" },
  buttonRow: { flexDirection: "row", marginTop: 20 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  buttonText: { fontSize: 16, fontFamily: "Parkinsans" },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 20,
  },
  nextButtonText: { fontSize: 22, fontWeight: "bold", fontFamily: "Parkinsans" },
  uploadedLabel: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: "Parkinsans",
  },
});

export default SnapGame;
