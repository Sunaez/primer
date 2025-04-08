// /components/profile/MostPlayedGraph.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
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

interface MostPlayedGraphProps {
  chartWidth: number;
  chartHeight: number;
}

const MostPlayedGraph: React.FC<MostPlayedGraphProps> = ({ chartWidth, chartHeight }) => {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const [mostPlayedGame, setMostPlayedGame] = useState<Game | null>(null);
  const [mostPlayedScores, setMostPlayedScores] = useState<ScorePair[]>([]);
  const currentUid = auth.currentUser?.uid || "";

  useEffect(() => {
    async function fetchScoresForAllGames() {
      if (!currentUid) return;
      let highestCount = 0;
      let selectedGame: Game | null = null;
      let selectedGameScores: ScorePair[] = [];
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
          const count = snapshot.size;
          if (count > highestCount) {
            highestCount = count;
            selectedGame = game;
            selectedGameScores = scorePairs;
          }
        } catch (error) {
          console.error("Error fetching scores for game", game.id, error);
        }
      }
      setMostPlayedGame(selectedGame);
      setMostPlayedScores(selectedGameScores);
    }
    fetchScoresForAllGames();
  }, [currentUid]);

  // Build a series map grouping scores by date.
  const seriesMap = mostPlayedGame
    ? [
        {
          friendName: mostPlayedGame.title,
          scoreMap: mostPlayedScores.reduce((acc, pair) => {
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

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.header, { color: currentTheme.text }]}>Most Played Game</Text>
      {mostPlayedGame ? (
        <>
          <Text style={[styles.title, { color: currentTheme.text }]}>{mostPlayedGame.title}</Text>
          <LineChart
            seriesMap={seriesMap}
            width={chartWidth}
            height={chartHeight}
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

export default MostPlayedGraph;

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: "center",
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
