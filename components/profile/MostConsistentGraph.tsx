// /components/profile/MostConsistentGraph.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
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

interface MostConsistentGraphProps {
  chartWidth: number;
  chartHeight: number;
}

const MostConsistentGraph: React.FC<MostConsistentGraphProps> = ({ chartWidth, chartHeight }) => {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  
  // State to store the game with the most distinct dates and its scores.
  const [mostConsistentGame, setMostConsistentGame] = useState<Game | null>(null);
  const [mostConsistentScores, setMostConsistentScores] = useState<ScorePair[]>([]);
  
  const currentUid = auth.currentUser?.uid || "";
  const screenWidth = Dimensions.get("window").width;
  
  useEffect(() => {
    async function fetchScoresForAllGames() {
      if (!currentUid) return;
      
      let bestUniqueDatesCount = 0;
      let selectedGame: Game | null = null;
      let selectedGameScores: ScorePair[] = [];
      
      // Iterate over each game
      for (const game of GAMES) {
        try {
          const scoresRef = collection(db, "Scores", currentUid, game.id);
          const q = query(scoresRef, orderBy("timestamp", "asc"));
          const snapshot = await getDocs(q);
          const scorePairs: ScorePair[] = [];
          const uniqueDates = new Set<string>();
          
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const score =
              typeof data.scoreIndex === "number"
                ? data.scoreIndex
                : typeof data.score === "number"
                ? data.score
                : 0;
            const date: string = data.date;
            uniqueDates.add(date);
            scorePairs.push({ date, score });
          });
          
          const countUnique = uniqueDates.size;
          if (countUnique > bestUniqueDatesCount) {
            bestUniqueDatesCount = countUnique;
            selectedGame = game;
            selectedGameScores = scorePairs;
          }
        } catch (error) {
          console.error("Error fetching scores for game", game.id, error);
        }
      }
      
      setMostConsistentGame(selectedGame);
      setMostConsistentScores(selectedGameScores);
    }
    
    fetchScoresForAllGames();
  }, [currentUid]);
  
  // Build seriesMap: group scores by date.
  const seriesMap = mostConsistentGame
    ? [
        {
          friendName: mostConsistentGame.title,
          scoreMap: mostConsistentScores.reduce((acc, pair) => {
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
      <Text style={[styles.header, { color: currentTheme.text }]}>
        Most Consistent Game
      </Text>
      {mostConsistentGame ? (
        <>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            {mostConsistentGame.title}
          </Text>
          <LineChart
            seriesMap={seriesMap}
            width={chartWidth}
            height={chartHeight}
            currentTheme={currentTheme}
            fontFamily="Parkisans"
          />
        </>
      ) : (
        <Text style={[styles.noData, { color: currentTheme.text }]}>
          No data available.
        </Text>
      )}
    </View>
  );
};

export default MostConsistentGraph;

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
