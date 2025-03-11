import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig'; // Same import path used in Profile.tsx
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

interface LeaderboardEntry {
  id: string;
  username: string;
  dailyScore: number;
  totalScore: number;
}

export default function Social() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const [bestPlayersToday, setBestPlayersToday] = useState<LeaderboardEntry[]>([]);
  const [topPlayersAllTime, setTopPlayersAllTime] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  async function fetchLeaderboardData() {
    try {
      setLoading(true);

      // 1. Query the best players of the day (descending order by dailyScore)
      const dailyRef = collection(db, 'leaderboard');
      const dailyQuery = query(dailyRef, orderBy('dailyScore', 'desc'), limit(10));
      const dailySnapshot = await getDocs(dailyQuery);
      const dailyData: LeaderboardEntry[] = dailySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        username: docSnap.data().username || 'Unknown',
        dailyScore: docSnap.data().dailyScore || 0,
        totalScore: docSnap.data().totalScore || 0,
      }));

      // 2. Query the top players all-time (descending order by totalScore)
      const totalRef = collection(db, 'leaderboard');
      const totalQuery = query(totalRef, orderBy('totalScore', 'desc'), limit(10));
      const totalSnapshot = await getDocs(totalQuery);
      const totalData: LeaderboardEntry[] = totalSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        username: docSnap.data().username || 'Unknown',
        dailyScore: docSnap.data().dailyScore || 0,
        totalScore: docSnap.data().totalScore || 0,
      }));

      setBestPlayersToday(dailyData);
      setTopPlayersAllTime(totalData);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const renderPlayerItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={[styles.playerCard, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.playerText, { color: currentTheme.text }]}>
        {item.username}
      </Text>
      <Text style={[styles.scoreText, { color: currentTheme.text }]}>
        Daily: {item.dailyScore} | Total: {item.totalScore}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Best Players of the Day */}
      <Text style={[styles.header, { color: currentTheme.text }]}>Best Players Today</Text>
      {bestPlayersToday.length === 0 ? (
        <Text style={[styles.noDataText, { color: currentTheme.text }]}>
          No data available.
        </Text>
      ) : (
        <FlatList
          data={bestPlayersToday}
          renderItem={renderPlayerItem}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Top Players All-Time */}
      <Text style={[styles.header, { color: currentTheme.text }]}>Top Players All-Time</Text>
      {topPlayersAllTime.length === 0 ? (
        <Text style={[styles.noDataText, { color: currentTheme.text }]}>
          No data available.
        </Text>
      ) : (
        <FlatList
          data={topPlayersAllTime}
          renderItem={renderPlayerItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontFamily: 'Parkinsans',
    fontSize: 20,
    marginBottom: 8,
  },
  noDataText: {
    fontFamily: 'Parkinsans',
    fontSize: 16,
    marginBottom: 16,
  },
  playerCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  playerText: {
    fontFamily: 'Parkinsans',
    fontSize: 16,
    marginBottom: 4,
  },
  scoreText: {
    fontFamily: 'Parkinsans',
    fontSize: 14,
  },
});
