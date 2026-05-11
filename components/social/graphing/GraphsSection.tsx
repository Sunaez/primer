import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from 'firebase/firestore';

import LineChart from './LineChart';
import BarChart from './BarChart';
import { db } from '@/components/firebaseConfig';
import { GAMES } from '@/constants/games';
import EmptyState from '@/components/ui/EmptyState';

interface ScorePair {
  date: string;
  score: number;
}

interface Series {
  friendName: string;
  pairs: ScorePair[];
  color: string;
}

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
    border?: string;
  };
  selectedGame: string;
  graphsColumnWidth: number;
  currentUid: string;
  userBannerColor?: string;
}

const getGameCollection = (selectedGame: string): string => {
  const game = GAMES.find((entry) => entry.id === selectedGame);
  return game ? game.id : selectedGame;
};

export default function GraphsSection({
  currentTheme,
  selectedGame,
  graphsColumnWidth,
  currentUid,
  userBannerColor,
}: GraphsSectionProps) {
  const [userScorePairs, setUserScorePairs] = useState<ScorePair[]>([]);
  const [friendSeries, setFriendSeries] = useState<Series[]>([]);
  const [friendUIDs, setFriendUIDs] = useState<string[]>([]);
  const [userBannerColorLocal, setUserBannerColorLocal] = useState<string | null>(null);

  const gameCollection = useMemo(() => getGameCollection(selectedGame), [selectedGame]);

  useEffect(() => {
    async function fetchUserScores() {
      if (!currentUid) {
        setUserScorePairs([]);
        return;
      }

      try {
        const scoresCol = collection(db, 'Scores', currentUid, gameCollection);
        const scoreQuery = query(scoresCol, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(scoreQuery);
        const pairs: ScorePair[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const score =
            typeof data.scoreIndex === 'number'
              ? data.scoreIndex
              : typeof data.score === 'number'
              ? data.score
              : 0;
          pairs.push({ date: data.date, score });
        });
        setUserScorePairs(pairs);
      } catch (error) {
        console.error('Error fetching user scores:', error);
      }
    }

    fetchUserScores();
  }, [currentUid, gameCollection]);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!currentUid) return;
      try {
        const profileRef = doc(db, 'profile', currentUid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setUserBannerColorLocal(profileSnap.data().bannerColor || null);
        }
      } catch (error) {
        console.error('Error fetching user profile banner color:', error);
      }
    }

    fetchUserProfile();
  }, [currentUid]);

  useEffect(() => {
    async function fetchFriendUIDs() {
      if (!currentUid) {
        setFriendUIDs([]);
        return;
      }
      try {
        const profileRef = doc(db, 'profile', currentUid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setFriendUIDs(data?.friends?.friends || []);
        }
      } catch (error) {
        console.error('Error fetching friend UIDs:', error);
      }
    }

    fetchFriendUIDs();
  }, [currentUid]);

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
          const scoresQuery = query(scoresCol, orderBy('timestamp', 'asc'));
          const snapshot = await getDocs(scoresQuery);
          const pairs: ScorePair[] = [];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const score =
              typeof data.scoreIndex === 'number'
                ? data.scoreIndex
                : typeof data.score === 'number'
                ? data.score
                : 0;
            pairs.push({ date: data.date, score });
          });

          return { friendName, pairs, color: friendColor } as Series;
        });

        const results = await Promise.all(promises);
        setFriendSeries(results.filter((entry): entry is Series => entry !== null));
      } catch (error) {
        console.error('Error fetching friend data:', error);
      }
    }

    fetchFriendData();
  }, [friendUIDs, gameCollection, currentTheme.card]);

  const finalSeries: Series[] = useMemo(() => {
    const bannerColor = userBannerColor || userBannerColorLocal || currentTheme.primary;
    return [{ friendName: 'You', pairs: userScorePairs, color: bannerColor }, ...friendSeries];
  }, [currentTheme.primary, friendSeries, userBannerColor, userBannerColorLocal, userScorePairs]);

  const finalSeriesMap: SeriesMap[] = useMemo(
    () =>
      finalSeries.map((series) => {
        const scoreMap: { [date: string]: number[] } = {};
        series.pairs.forEach((pair) => {
          if (!scoreMap[pair.date]) {
            scoreMap[pair.date] = [];
          }
          scoreMap[pair.date].push(pair.score);
        });
        return { friendName: series.friendName, scoreMap, color: series.color };
      }),
    [finalSeries]
  );

  const today = useMemo(() => new Date().toLocaleDateString('en-US'), []);
  const barChartData = useMemo(
    () =>
      finalSeries.map((series) => {
        const todaysScores = series.pairs
          .filter((pair) => pair.date === today)
          .map((pair) => pair.score);
        return {
          friendName: series.friendName,
          score: todaysScores.length > 0 ? Math.max(...todaysScores) : 0,
          color: series.color,
        };
      }),
    [finalSeries, today]
  );

  const hasAnyData = finalSeries.some((series) => series.pairs.length > 0);

  if (!hasAnyData) {
    return (
      <EmptyState
        title="No score history yet"
        description="Play a few rounds in this game and the comparison charts will populate here."
        theme={{
          surface: currentTheme.surface,
          text: currentTheme.text,
          border: currentTheme.border || currentTheme.card,
        }}
        accentColor={currentTheme.primary}
        icon="analytics-outline"
      />
    );
  }

  return (
    <View style={[styles.container, { width: graphsColumnWidth }]}>
      <View
        style={[
          styles.chartCard,
          { backgroundColor: currentTheme.surface, borderColor: currentTheme.border || currentTheme.card },
        ]}
      >
        <Text style={[styles.chartEyebrow, { color: currentTheme.primary }]}>Trend</Text>
        <Text style={[styles.chartTitle, { color: currentTheme.text }]}>
          All-time scores for {selectedGame.toUpperCase()}
        </Text>
        <LineChart
          seriesMap={finalSeriesMap}
          width={graphsColumnWidth - 64}
          height={220}
          currentTheme={currentTheme}
          fontFamily="Parkinsans"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legendRow}
        >
          {finalSeriesMap.map((series) => (
            <View key={series.friendName} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: series.color }]} />
              <Text style={[styles.legendText, { color: currentTheme.text }]}>
                {series.friendName}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View
        style={[
          styles.chartCard,
          { backgroundColor: currentTheme.surface, borderColor: currentTheme.border || currentTheme.card },
        ]}
      >
        <Text style={[styles.chartEyebrow, { color: currentTheme.primary }]}>Daily snapshot</Text>
        <Text style={[styles.chartTitle, { color: currentTheme.text }]}>Today&apos;s best scores</Text>
        <BarChart
          data={barChartData}
          labels={barChartData.map((entry) => entry.friendName)}
          width={graphsColumnWidth - 64}
          height={220}
          currentTheme={currentTheme}
          fontFamily="Parkinsans"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 16,
  },
  chartEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Parkinsans',
  },
  chartTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  legendRow: {
    gap: 12,
    marginTop: 10,
    paddingRight: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    fontFamily: 'Parkinsans',
  },
});
