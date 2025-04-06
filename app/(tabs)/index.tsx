import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import { GAMES } from '@/constants/games';
import BarChart from '@/components/social/graphing/BarChart'; // Assumes you have a BarChart component
import THEMES from '@/constants/themes';

interface ScorePair {
  date: string; // e.g. "6/21/2025"
  score: number;
}

interface Series {
  friendName: string;
  pairs: ScorePair[];
  color: string;
}

interface BarChartsSectionProps {
  currentTheme?: {
    background: string;
    text: string;
    primary: string;
    card: string;
    surface: string;
  };
  // The selected game id (from your games.ts list)
  selectedGame?: string;
  graphsColumnWidth: number;
  currentUid: string;
  userBannerColor?: string;
}

const getGameCollection = (selectedGame: string | undefined): string => {
  if (!selectedGame) return '';
  const game = GAMES.find((g) => g.id === selectedGame);
  return game ? game.id : selectedGame;
};

const BarChartsSection: React.FC<BarChartsSectionProps> = (props) => {
  const { currentTheme, selectedGame, graphsColumnWidth, currentUid, userBannerColor } = props;
  const effectiveTheme = currentTheme || THEMES.Dark;

  const [userScorePairs, setUserScorePairs] = useState<ScorePair[]>([]);
  const [friendSeries, setFriendSeries] = useState<Series[]>([]);
  const [friendUIDs, setFriendUIDs] = useState<string[]>([]);
  const [userBannerColorLocal, setUserBannerColorLocal] = useState<string | null>(null);

  const gameCollection = useMemo(() => getGameCollection(selectedGame), [selectedGame]);

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
    if (gameCollection) {
      fetchUserScores();
    }
  }, [currentUid, gameCollection]);

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
          const friendColor = profileData?.bannerColor || effectiveTheme.card;
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
    if (gameCollection) {
      fetchFriendData();
    }
  }, [friendUIDs, gameCollection, effectiveTheme.card]);

  const finalSeries: Series[] = useMemo(() => {
    const bannerColor = userBannerColor || userBannerColorLocal || effectiveTheme.primary;
    const userSeries = { friendName: 'You', pairs: userScorePairs, color: bannerColor };
    return [userSeries, ...friendSeries];
  }, [userScorePairs, friendSeries, effectiveTheme.primary, userBannerColor, userBannerColorLocal]);

  const today = useMemo(() => new Date().toLocaleDateString('en-US'), []);
  const barChartData = useMemo(() => {
    return finalSeries.map((series) => {
      const todaysScores = series.pairs
        .filter((pair) => pair.date === today)
        .map((pair) => pair.score);
      const bestScore = todaysScores.length > 0 ? Math.max(...todaysScores) : 0;
      return { friendName: series.friendName, score: bestScore, color: series.color };
    });
  }, [finalSeries, today]);

  return (
    <View
      style={[
        styles.container,
        { width: props.graphsColumnWidth, backgroundColor: effectiveTheme.background },
      ]}
    >
      <BarChart
        data={barChartData}
        labels={barChartData.map((d) => d.friendName)}
        width={props.graphsColumnWidth - 32}
        height={200}
        currentTheme={effectiveTheme}
        fontFamily="Parkisans"
      />
      <Text style={[styles.chartTitle, styles.fontStyle, { color: effectiveTheme.text }]}>
        Today's Best Scores for {(selectedGame || '').toUpperCase()}
      </Text>
    </View>
  );
};

export default BarChartsSection;

const styles = StyleSheet.create({
  container: { padding: 16 },
  chartTitle: { marginTop: 8, fontSize: 16, fontWeight: 'bold' },
  fontStyle: { fontFamily: 'Parkisans', fontSize: 14 },
});
