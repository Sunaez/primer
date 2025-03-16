import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ImageSourcePropType,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  documentId,
} from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

/**
 * GAMES array
 */
const games = [
  { id: 'snap', title: 'Snap' },
  { id: 'reaction', title: 'Reaction Game' },
  { id: 'maths', title: 'Maths Challenge' },
  { id: 'PairMatch', title: 'Quick Pair Match' },
];

/**
 * LOCAL placeholders
 */
const placeholderImages: ImageSourcePropType[] = [
  require('../../assets/images/placeholder/1.jpg'),
  require('../../assets/images/placeholder/2.jpg'),
  require('../../assets/images/placeholder/3.jpg'),
  require('../../assets/images/placeholder/4.jpg'),
  require('../../assets/images/placeholder/5.jpg'),
  require('../../assets/images/placeholder/6.jpg'),
  require('../../assets/images/placeholder/7.jpg'),
  require('../../assets/images/placeholder/8.jpg'),
];

/** Firestore doc shapes */
interface ScoreDoc {
  userId: string;
  bestScore: number;
  gameName?: string;
  accuracy?: number;
  averageReactionTime?: number;
  updatedAt?: any;
  date?: string;
}

interface ProfileDoc {
  username?: string;
  photoURL?: string;
  bannerColor?: string;
}

/** Merged scoreboard item */
interface LeaderboardItem {
  userId: string;
  bestScore: number;
  accuracy: number;
  averageReactionTime: number;
  gameName: string;
  updatedAt: string;
  username: string;
  photoURL: string;
  bannerColor: string;
}

interface CombinedRow {
  daily?: LeaderboardItem;
  allTime?: LeaderboardItem;
}

export default function SocialTwoColumns() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Combined scoreboard rows
  const [rows, setRows] = useState<CombinedRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter by game
  const [selectedGame, setSelectedGame] = useState('maths'); // default

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedGame]);

  /** Main fetch logic */
  async function fetchLeaderboards() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // (A) Daily top 10 for date + game
      const dailyQ = query(
        collection(db, 'dailyScores'),
        where('date', '==', today),
        where('gameName', '==', selectedGame),
        orderBy('bestScore', 'desc'),
        limit(10)
      );
      const dailySnap = await getDocs(dailyQ);
      let dailyDocs: ScoreDoc[] = dailySnap.docs.map((ds) => {
        const d = ds.data() as ScoreDoc;
        return {
          ...d,
          updatedAt: d.updatedAt
            ? new Date(d.updatedAt.toDate()).toLocaleString()
            : 'N/A',
        };
      });
      if (dailyDocs.length === 0) {
        // fill with 5 placeholders
        dailyDocs = generateFillerScoreDocs(5, selectedGame, today);
      }

      // (B) All-time top 10 for game
      const bestQ = query(
        collection(db, 'bestScores'),
        where('gameName', '==', selectedGame),
        orderBy('bestScore', 'desc'),
        limit(10)
      );
      const bestSnap = await getDocs(bestQ);
      let bestDocs: ScoreDoc[] = bestSnap.docs.map((ds) => {
        const d = ds.data() as ScoreDoc;
        return {
          ...d,
          updatedAt: d.updatedAt
            ? new Date(d.updatedAt.toDate()).toLocaleString()
            : 'N/A',
        };
      });
      if (bestDocs.length === 0) {
        // fill with 5 placeholders
        bestDocs = generateFillerScoreDocs(5, selectedGame);
      }

      // attach profiles
      const dailyItems = await attachProfiles(dailyDocs);
      const allTimeItems = await attachProfiles(bestDocs);

      // combine => row by row
      const maxLen = Math.max(dailyItems.length, allTimeItems.length);
      let combined: CombinedRow[] = [];
      for (let i = 0; i < maxLen; i++) {
        combined.push({
          daily: dailyItems[i],
          allTime: allTimeItems[i],
        });
      }

      // If STILL no rows, create final fallback
      if (combined.length === 0) {
        combined = createFinalFallback();
      }

      setRows(combined);
    } catch (err) {
      console.error('Error fetching scoreboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  /** generate filler doc with bestScore=0, userId = "fake_user_x" */
  function generateFillerScoreDocs(count: number, gameName: string, date?: string): ScoreDoc[] {
    const docs: ScoreDoc[] = [];
    for (let i = 0; i < count; i++) {
      docs.push({
        userId: `fake_user_${Math.random().toString(36).substr(2, 5)}`,
        bestScore: 0,
        accuracy: 0,
        averageReactionTime: 0,
        gameName,
        updatedAt: null,
        date,
      });
    }
    return docs;
  }

  /** final fallback if somehow both daily + all-time had zero. */
  function createFinalFallback(): CombinedRow[] {
    // create 5 "rows" of filler
    const fillerDaily = generateFillerScoreDocs(5, selectedGame, new Date().toISOString().split('T')[0]);
    const fillerAllTime = generateFillerScoreDocs(5, selectedGame);
    const dailyItems = fillerDaily.map((d, i) => convertDocToItem(d, i));
    const allTimeItems = fillerAllTime.map((d, i) => convertDocToItem(d, i + 100));

    const result: CombinedRow[] = [];
    for (let i = 0; i < 5; i++) {
      result.push({
        daily: dailyItems[i],
        allTime: allTimeItems[i],
      });
    }
    return result;
  }

  /** Attach real or filler profiles */
  async function attachProfiles(scoreDocs: ScoreDoc[]): Promise<LeaderboardItem[]> {
    if (scoreDocs.length === 0) return [];

    // separate real vs. filler
    const realDocs = scoreDocs.filter((d) => !d.userId.startsWith('fake_user_'));
    const userIds = realDocs.map((doc) => doc.userId);

    // fetch real
    let profileMap: Record<string, ProfileDoc> = {};
    if (userIds.length > 0) {
      const pQ = query(collection(db, 'profile'), where(documentId(), 'in', userIds));
      const snap = await getDocs(pQ);
      snap.docs.forEach((pDoc) => {
        profileMap[pDoc.id] = pDoc.data() as ProfileDoc;
      });
    }

    // convert
    const items: LeaderboardItem[] = scoreDocs.map((d, idx) => {
      if (d.userId.startsWith('fake_user_')) {
        return convertDocToItem(d, idx);
      } else {
        // real doc
        const p = profileMap[d.userId] || {};
        return {
          userId: d.userId,
          bestScore: d.bestScore,
          accuracy: d.accuracy ?? 0,
          averageReactionTime: d.averageReactionTime ?? 0,
          gameName: d.gameName || '',
          updatedAt: d.updatedAt || 'N/A',
          username: p.username || 'Unknown',
          photoURL: p.photoURL || '',
          bannerColor: p.bannerColor || '#666',
        };
      }
    });

    return items;
  }

  /** Convert filler doc to a filler item with random pastel color, random name. */
  function convertDocToItem(doc: ScoreDoc, idx: number): LeaderboardItem {
    if (!doc.userId.startsWith('fake_user_')) {
      // shouldn't happen here, but just in case
      return {
        userId: doc.userId,
        bestScore: doc.bestScore,
        accuracy: doc.accuracy ?? 0,
        averageReactionTime: doc.averageReactionTime ?? 0,
        gameName: doc.gameName || '',
        updatedAt: doc.updatedAt || 'N/A',
        username: 'Unknown',
        photoURL: '',
        bannerColor: '#666',
      };
    }

    const fillerNames = ['Candice','Ravi','Lila','Mo','Bryn','Sasha','Avery','Kai','Jude','Tori','Mika'];
    const pastelColors = ['#FFD2DD','#D2F1FF','#FFF2CC','#CCFFE5','#E6CCFF','#FCE5D2','#E5FCD2'];
    const name = fillerNames[Math.floor(Math.random() * fillerNames.length)];
    const color = pastelColors[Math.floor(Math.random() * pastelColors.length)];

    return {
      userId: doc.userId,
      bestScore: 0,
      accuracy: 0,
      averageReactionTime: 0,
      gameName: doc.gameName || '',
      updatedAt: 'N/A',
      username: `${name} (Filler)`,
      photoURL: '', // so we pick a placeholder
      bannerColor: color,
    };
  }

  /** pick random placeholder image from local array */
  function getRandomPlaceholder(): ImageSourcePropType {
    return placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
  }

  // RENDER
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* GAME PICKER */}
      <View style={styles.pickerContainer}>
        <Text style={[styles.pickerLabel, { color: currentTheme.text }]}>Choose Game:</Text>
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

      {/* HEADERS */}
      <View style={styles.labelRow}>
        <Text style={[styles.headerLabel, { color: currentTheme.text }]}>
          Daily Leaderboard
        </Text>
        <Text style={[styles.headerLabel, { color: currentTheme.text }]}>
          All-Time Leaderboard
        </Text>
      </View>

      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(_, i) => String(i)}
      />
    </View>
  );

  function renderRow({ item, index }: { item: CombinedRow; index: number }) {
    return (
      <View style={styles.rowWrapper}>
        {/* daily */}
        <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.rankText, { color: currentTheme.text }]}>
            {getRankLabel(index)}
          </Text>
          {item.daily ? renderLeaderboardCell(item.daily) : renderPlaceholder()}
        </View>

        {/* allTime */}
        <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.rankText, { color: currentTheme.text }]}>
            {getRankLabel(index)}
          </Text>
          {item.allTime ? renderLeaderboardCell(item.allTime) : renderPlaceholder()}
        </View>
      </View>
    );
  }

  function renderLeaderboardCell(lbi: LeaderboardItem) {
    return (
      <View style={styles.cellContainer}>
        {/* left half => banner */}
        <View style={[styles.leftHalf, { backgroundColor: lbi.bannerColor }]}>
          <Image
            source={lbi.photoURL ? { uri: lbi.photoURL } : getRandomPlaceholder()}
            style={styles.avatar}
            resizeMode="cover"
          />
          <Text style={[styles.username, { color: '#fff' }]}>{lbi.username}</Text>
        </View>
        {/* right half => transparent */}
        <View style={styles.rightHalf}>
          <Text style={[styles.scoreText, { color: currentTheme.text }]}>
            Score: {lbi.bestScore}
          </Text>
        </View>
      </View>
    );
  }

  function renderPlaceholder() {
    const randomPH = getRandomPlaceholder();
    return (
      <View style={styles.cellContainer}>
        <View style={[styles.leftHalf, { backgroundColor: '#666' }]}>
          <Image source={randomPH} style={styles.avatar} resizeMode="cover" />
          <Text style={[styles.username, { color: '#fff' }]}>...</Text>
        </View>
        <View style={styles.rightHalf}>
          <Text style={[styles.scoreText, { color: currentTheme.text }]}>...</Text>
        </View>
      </View>
    );
  }

  function getRankLabel(i: number) {
    if (i === 0) return 'First';
    if (i === 1) return 'Second';
    if (i === 2) return 'Third';
    return `${i + 1}th`;
  }
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 16,
    marginRight: 8,
    fontFamily: 'Parkinsans',
  },
  pickerStyle: {
    flex: 1,
    fontFamily: 'Parkinsans',
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
    overflow: 'hidden',
  },
  leftHalf: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightHalf: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  username: {
    fontFamily: 'Parkinsans',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreText: {
    fontFamily: 'Parkinsans',
    fontSize: 14,
    textAlign: 'center',
  },
});
