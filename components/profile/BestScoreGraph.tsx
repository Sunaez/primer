// /components/profile/BestScoreGraph.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { useThemeContext } from "@/context/UserContext";
import THEMES from "@/constants/themes";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "@/components/firebaseConfig";
import { Game, GAMES } from "@/constants/games";
import LineChart from "@/components/social/graphing/LineChart";

interface ScorePair {
  date: string; // e.g., "4/5/2025"
  score: number;
}

interface BestScoreGraphProps {
  chartWidth?: number;
  chartHeight?: number;
}

const BestScoreGraph: React.FC<BestScoreGraphProps> = ({ chartWidth, chartHeight }) => {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const [bestScoringGame, setBestScoringGame] = useState<Game | null>(null);
  const [bestScoringScores, setBestScoringScores] = useState<ScorePair[]>([]);
  const currentUid = auth.currentUser?.uid || "";
  
  // Local state for container dimensions if props are not provided.
  const [containerWidth, setContainerWidth] = useState<number>(chartWidth || 0);
  const [containerHeight, setContainerHeight] = useState<number>(chartHeight || 0);

  useEffect(() => {
    async function fetchScoresForAllGames() {
      if (!currentUid) return;
      let highestScoreOverall = 0;
      let selectedGame: Game | null = null;
      let selectedGameScores: ScorePair[] = [];
      
      // Loop over all games.
      for (const game of GAMES) {
        try {
          const scoresRef = collection(db, "Scores", currentUid, game.id);
          const q = query(scoresRef, orderBy("timestamp", "asc"));
          const snapshot = await getDocs(q);
          const scorePairs: ScorePair[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const score =
              typeof data.scoreIndex === "number"
                ? data.scoreIndex
                : typeof data.score === "number"
                ? data.score
                : 0;
            scorePairs.push({ date: data.date, score });
          });
          const maxScoreForGame = scorePairs.reduce(
            (acc, pair) => Math.max(acc, pair.score),
            0
          );
          if (maxScoreForGame > highestScoreOverall) {
            highestScoreOverall = maxScoreForGame;
            selectedGame = game;
            selectedGameScores = scorePairs;
          }
        } catch (error) {
          console.error("Error fetching scores for game", game.id, error);
        }
      }
      setBestScoringGame(selectedGame);
      setBestScoringScores(selectedGameScores);
    }
    fetchScoresForAllGames();
  }, [currentUid]);

  // Build seriesMap: group scores by date.
  const seriesMap = bestScoringGame
    ? [
        {
          friendName: bestScoringGame.title,
          scoreMap: bestScoringScores.reduce((acc, pair) => {
            if (acc[pair.date]) {
              acc[pair.date].push(pair.score);
            } else {
              acc[pair.date] = [pair.score];
            }
            return acc;
          }, {} as { [date: string]: number[] }),
          color: currentTheme.primary,
        },
      ]
    : [];

  // Measure container if width/height not provided.
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!chartWidth) setContainerWidth(width);
    if (!chartHeight) setContainerHeight(height);
  };

  const effectiveWidth = chartWidth || containerWidth;
  const effectiveHeight = chartHeight || containerHeight;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]} onLayout={onLayout}>
      <Text style={[styles.header, { color: currentTheme.text }]}>Best Scoring Game</Text>
      {bestScoringGame ? (
        <>
          <Text style={[styles.title, { color: currentTheme.text }]}>{bestScoringGame.title}</Text>
          <LineChart
            seriesMap={seriesMap}
            width={effectiveWidth}
            height={effectiveHeight}
            currentTheme={currentTheme}
            fontFamily="Parkisans"
          />
        </>
      ) : (
        <Text style={[styles.noData, { color: currentTheme.text }]}>No data available.</Text>
      )}
    </View>
  );
};

export default BestScoreGraph;

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: "center",
    minWidth: 200,
    minHeight: 100,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  noData: {
    fontSize: 16,
    marginBottom: 8,
  },
});
