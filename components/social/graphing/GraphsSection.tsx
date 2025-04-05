// GraphsSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import LineChart from './LineChart';
import BarChart from './BarChart';
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import { GAMES } from '@/constants/games';

//
// Data interfaces
//
interface ScorePair {
  date: string; // e.g. "6/21/2025"
  score: number;
}

interface Series {
  friendName: string;
  pairs: ScorePair[];
  color: string;
}

// Our SeriesMap now maps each date to an array of scores.
export interface SeriesMap {
  friendName: string;
  scoreMap: { [date: string]: number[] };
  color: string;
}

interface GraphsSectionProps {
  currentTheme: {
    background: string;
    text: string;
    primary: string;
    card: string;
    surface: string;
  };
  // selectedGame should be one of the game ids defined in constants/games.ts
  selectedGame: string;
  graphsColumnWidth: number;
  currentUid: string;
  // Optional: A personalized banner color passed from the parent.
  userBannerColor?: string;
}

//
// Helper: Use the canonical game id (which is also used as the Firestore subcollection name)
// from your constants file.
const getGameCollection = (selectedGame: string): string => {
  const game = GAMES.find((g) => g.id === selectedGame);
  return game ? game.id : selectedGame;
};

const GraphsSection: React.FC<GraphsSectionProps> = ({
  currentTheme,
  selectedGame,
  graphsColumnWidth,
  currentUid,
  userBannerColor,
}) => {
  // State to hold the raw data (each series as an array of {date, score} pairs)
  const [userScorePairs, setUserScorePairs] = useState<ScorePair[]>([]);
  const [friendSeries, setFriendSeries] = useState<Series[]>([]);
  const [friendUIDs, setFriendUIDs] = useState<string[]>([]);
  // New: Local state for the user's banner color (fetched from their profile)
  const [userBannerColorLocal, setUserBannerColorLocal] = useState<string | null>(null);

  // Compute the Firestore subcollection name (e.g., "maths", "pairs", "snap", etc.)
  const gameCollection = useMemo(() => getGameCollection(selectedGame), [selectedGame]);

  // --- Fetch the current user's score pairs ---
  useEffect(() => {
    async function fetchUserScores() {
      try {
        const scoresCol = collection(db, 'Scores', currentUid, gameCollection);
        const q = query(scoresCol, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        const pairs: ScorePair[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const date: string = data.date;
          const score: number =
            typeof data.scoreIndex === 'number'
              ? data.scoreIndex
              : typeof data.score === 'number'
              ? data.score
              : 0;
          pairs.push({ date, score });
        });
        setUserScorePairs(pairs);
      } catch (error) {
        console.error('Error fetching user scores:', error);
      }
    }
    fetchUserScores();
  }, [currentUid, gameCollection]);

  // --- Fetch the user's profile banner color ---
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const profileRef = doc(db, 'profile', currentUid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setUserBannerColorLocal(data.bannerColor || null);
        }
      } catch (error) {
        console.error('Error fetching user profile banner color:', error);
      }
    }
    fetchUserProfile();
  }, [currentUid]);

  // --- Fetch friend UIDs from the current user's profile ---
  useEffect(() => {
    async function fetchFriendUIDs() {
      try {
        const profileRef = doc(db, 'profile', currentUid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          const uids: string[] = data?.friends?.friends || [];
          setFriendUIDs(uids);
        } else {
          console.warn('No profile document for currentUid:', currentUid);
        }
      } catch (error) {
        console.error('Error fetching friend UIDs:', error);
      }
    }
    fetchFriendUIDs();
  }, [currentUid]);

  // --- Fetch each friend's score pairs ---
  useEffect(() => {
    async function fetchFriendData() {
      if (friendUIDs.length === 0) {
        setFriendSeries([]);
        return;
      }
      try {
        const promises = friendUIDs.map(async (uid) => {
          const profileRef = doc(db, 'profile', uid);
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) return null;
          const profileData = profileSnap.data();
          const friendName = profileData?.username || 'Friend';
          const friendColor = profileData?.bannerColor || currentTheme.card;
          const scoresCol = collection(db, 'Scores', uid, gameCollection);
          const q = query(scoresCol, orderBy('timestamp', 'asc'));
          const snapshot = await getDocs(q);
          const pairs: ScorePair[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const date: string = data.date;
            const score: number =
              typeof data.scoreIndex === 'number'
                ? data.scoreIndex
                : typeof data.score === 'number'
                ? data.score
                : 0;
            pairs.push({ date, score });
          });
          return { friendName, pairs, color: friendColor } as Series;
        });
        const results = await Promise.all(promises);
        setFriendSeries(results.filter((res): res is Series => res !== null));
      } catch (error) {
        console.error('Error fetching friend data:', error);
      }
    }
    fetchFriendData();
  }, [friendUIDs, gameCollection, currentTheme.card]);

  // --- Combine the current user's series with friend series ---
  const finalSeries: Series[] = useMemo(() => {
    // Determine the color for "You": use the prop, then fetched banner color, then fallback.
    const bannerColor = userBannerColor || userBannerColorLocal || currentTheme.primary;
    const userSeries = { friendName: 'You', pairs: userScorePairs, color: bannerColor };
    return [userSeries, ...friendSeries];
  }, [userScorePairs, friendSeries, currentTheme.primary, userBannerColor, userBannerColorLocal]);

  // Convert each series into a hashmap: each date maps to an array of scores.
  const finalSeriesMap: SeriesMap[] = useMemo(() => {
    return finalSeries.map((series) => {
      const scoreMap: { [date: string]: number[] } = {};
      series.pairs.forEach((pair) => {
        if (scoreMap[pair.date]) {
          scoreMap[pair.date].push(pair.score);
        } else {
          scoreMap[pair.date] = [pair.score];
        }
      });
      return { friendName: series.friendName, scoreMap, color: series.color };
    });
  }, [finalSeries]);

  // For the Bar Chart: Filter today's data and pick the highest score.
  const today = useMemo(() => new Date().toLocaleDateString('en-US'), []);
  const barChartData = useMemo(() => {
    return finalSeries.map((series) => {
      const todaysScores = series.pairs.filter((pair) => pair.date === today).map((pair) => pair.score);
      const bestScore = todaysScores.length > 0 ? Math.max(...todaysScores) : 0;
      return { friendName: series.friendName, score: bestScore, color: series.color };
    });
  }, [finalSeries, today]);

  return (
    <View style={[styles.container, { width: graphsColumnWidth, backgroundColor: currentTheme.background }]}>
      {/* Line Chart Section */}
      <View style={styles.chartWrapper}>
        {finalSeriesMap.length > 0 ? (
          <LineChart
            seriesMap={finalSeriesMap}
            width={graphsColumnWidth - 32}
            height={220}
            currentTheme={currentTheme}
            fontFamily="Parkisans"
          />
        ) : (
          <View style={{ width: graphsColumnWidth - 32, height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: currentTheme.background }}>
            <Text style={[styles.fontStyle, { color: currentTheme.text }]}>No Data</Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendContainer}>
          {finalSeriesMap.map((series, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColorBox, { backgroundColor: series.color }]} />
              <Text style={[styles.fontStyle, { color: currentTheme.text }]}>{series.friendName}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={[styles.chartTitle, styles.fontStyle, { color: currentTheme.text }]}>
          All Time Scores for {selectedGame.toUpperCase()}
        </Text>
      </View>

      {/* Bar Chart Section */}
      <View style={styles.chartWrapper}>
        <BarChart
          data={barChartData}
          labels={barChartData.map((d) => d.friendName)}
          width={graphsColumnWidth - 32}
          height={200}
          currentTheme={currentTheme}
          fontFamily="Parkisans"
        />
        <Text style={[styles.chartTitle, styles.fontStyle, { color: currentTheme.text }]}>
          Today's Best Scores
        </Text>
      </View>
    </View>
  );
};

export default GraphsSection;

const styles = StyleSheet.create({
  container: { padding: 16 },
  chartWrapper: { marginBottom: 32 },
  chartTitle: { marginTop: 8, fontSize: 16, fontWeight: 'bold' },
  fontStyle: { fontFamily: 'Parkisans', fontSize: 14 },
  legendContainer: { marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  legendColorBox: { width: 16, height: 16, marginRight: 4, borderRadius: 4 },
});
