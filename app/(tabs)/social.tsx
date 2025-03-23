import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  documentId,
  where,
} from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
import useDailyScores from '@/components/backend/GatherDailyScores';
import useBestScores from '@/components/backend/GatherBestScores';

const games = [
  { id: 'snap', title: 'Snap' },
  { id: 'reaction', title: 'Reaction Game' },
  { id: 'maths', title: 'Maths Challenge' },
  { id: 'PairMatch', title: 'Quick Pair Match' },
];

interface ScoreDoc {
  userId: string;
  score: number;
  bestScore: number;
  gameName?: string;
  accuracy?: number;
  averageTime?: number;
  updatedAt?: any;
  date?: string;
}

interface ProfileDoc {
  username?: string;
  photoURL?: string;
  bannerColor?: string;
}

interface LeaderboardItem {
  userId: string;
  bestScore: number;
  accuracy: number;
  averageTime: number;
  gameName: string;
  updatedAt: string;
  username: string;
  photoURL: string;
  bannerColor: string;
  noScore?: boolean;
}

interface CombinedRow {
  daily?: LeaderboardItem;
  allTime?: LeaderboardItem;
}

export default function Social() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const [rows, setRows] = useState<CombinedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState('maths'); // default

  const dailyScores = useDailyScores(selectedGame);
  const bestScores = useBestScores(selectedGame);

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedGame, dailyScores, bestScores]);

  async function fetchLeaderboards() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      let dailyItems = await attachProfiles(dailyScores);
      if (dailyItems.length === 0) {
        dailyItems = [createNoScoreItem()];
      }

      let allTimeItems = await attachProfiles(bestScores);
      if (allTimeItems.length === 0) {
        allTimeItems = [createNoScoreItem()];
      }

      // Align the lists
      const maxLen = Math.max(dailyItems.length, allTimeItems.length);
      while (dailyItems.length < maxLen) {
        dailyItems.push(createNoScoreItem());
      }
      while (allTimeItems.length < maxLen) {
        allTimeItems.push(createNoScoreItem());
      }

      // Combine
      const combined: CombinedRow[] = [];
      for (let i = 0; i < maxLen; i++) {
        combined.push({ daily: dailyItems[i], allTime: allTimeItems[i] });
      }

      setRows(combined);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  function createNoScoreItem(): LeaderboardItem {
    return {
      userId: '',
      bestScore: 0,
      accuracy: 0,
      averageTime: 0,
      gameName: selectedGame,
      updatedAt: '',
      username: 'No score yet',
      photoURL: '',
      bannerColor: '#666',
      noScore: true,
    };
  }

  async function attachProfiles(scoreDocs: any[]): Promise<LeaderboardItem[]> {
    if (scoreDocs.length === 0) return [];

    const realDocs = scoreDocs.filter((d) => d.userId && d.userId.trim() !== '');
    const userIds = realDocs.map((doc) => doc.userId);
    let profileMap: Record<string, ProfileDoc> = {};

    if (userIds.length > 0) {
      for (let i = 0; i < userIds.length; i += 10) {
        const batchIds = userIds.slice(i, i + 10);
        const pQ = query(collection(db, 'profile'), where(documentId(), 'in', batchIds));
        const snap = await getDocs(pQ);
        snap.docs.forEach((pDoc) => {
          profileMap[pDoc.id] = pDoc.data() as ProfileDoc;
        });
      }
    }

    return realDocs.map((d) => {
      const p = profileMap[d.userId] || {};
      return {
        userId: d.userId,
        bestScore: d.score ?? d.bestScore ?? 0,
        accuracy: d.accuracy ?? 0,
        averageTime: d.averageTime ?? 0,
        gameName: d.gameName || selectedGame,
        updatedAt: d.updatedAt || 'N/A',
        username: p.username || 'Unknown Player',
        photoURL: p.photoURL || '',
        bannerColor: p.bannerColor || '#666',
      };
    });
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Only one picker for the game */}
      <View style={styles.pickerContainer}>
        <Text style={[styles.pickerLabel, { color: currentTheme.text }]}>Game:</Text>
        <Picker
          selectedValue={selectedGame}
          onValueChange={(val) => setSelectedGame(val)}
          style={[styles.pickerStyle, { color: currentTheme.text }]}
        >
          {games.map((g) => (
            <Picker.Item key={g.id} label={g.title} value={g.id} />
          ))}
        </Picker>
      </View>

      {/* Headers */}
      <View style={styles.labelRow}>
        <Text style={[styles.headerLabel, { color: currentTheme.text }]}>
          Today's Best
        </Text>
        <Text style={[styles.headerLabel, { color: currentTheme.text }]}>
          All-Time Best
        </Text>
      </View>

      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(_, i) => String(i)}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: currentTheme.text }]}>
            No scores found
          </Text>
        }
      />
    </View>
  );

  function renderRow({ item, index }: { item: CombinedRow; index: number }) {
    const rankColor = index === 0 ? 'gold'
                    : index === 1 ? 'silver'
                    : index === 2 ? 'bronze'
                    : '#fff';
    const rankLabel = index === 0 ? '1.'
                     : index === 1 ? '2.'
                     : index === 2 ? '3.'
                     : `${index + 1}.`;

    return (
      <View style={styles.rowWrapper}>
        {/* Daily Leaderboard */}
        <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>{rankLabel}</Text>
          {item.daily ? renderLeaderboardCell(item.daily) : renderNoScoreCell()}
        </View>

        {/* All-Time Leaderboard */}
        <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>{rankLabel}</Text>
          {item.allTime ? renderLeaderboardCell(item.allTime) : renderNoScoreCell()}
        </View>
      </View>
    );
  }

  function renderLeaderboardCell(lbi: LeaderboardItem) {
    if (lbi.noScore) return renderNoScoreCell();

    return (
      <View style={styles.cellContainer}>
        <View style={[styles.leftHalf, { backgroundColor: lbi.bannerColor }]}>
          {lbi.photoURL ? (
            <Image source={{ uri: lbi.photoURL }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#444' }]} />
          )}
          <Text
            style={[styles.username, { color: '#fff' }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {lbi.username}
          </Text>
        </View>
        <View style={styles.rightHalf}>
          <Text style={[styles.scoreText, { color: currentTheme.text }]}>
            Score: {lbi.bestScore}
          </Text>
        </View>
      </View>
    );
  }

  function renderNoScoreCell() {
    return (
      <View style={styles.cellContainer}>
        <Text style={[styles.scoreText, { color: currentTheme.text }]}>
          No score yet
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  pickerLabel: {
    fontSize: 16,
    marginRight: 8,
    marginLeft: 8,
    fontFamily: 'Parkinsans',
  },
  pickerStyle: {
    flex: 1,
    fontFamily: 'Parkinsans',
    height: 40,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLabel: {
    fontFamily: 'Parkinsans',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    padding: 8,
    borderRadius: 8,
  },
  rankText: {
    fontFamily: 'Parkinsans',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
    alignSelf: 'center',
  },
  cellContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 80,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftHalf: {
    width: '50%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  rightHalf: {
    width: '50%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  username: {
    fontFamily: 'Parkinsans',
    fontSize: 14,
    fontWeight: 'bold',
    maxWidth: '90%',
  },
  scoreText: {
    fontFamily: 'Parkinsans',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Parkinsans',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});
