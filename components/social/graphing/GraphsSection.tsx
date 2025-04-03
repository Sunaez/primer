// GraphsSection.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import LineChart from './LineChart';
import BarChart from './BarChart';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';

export interface FriendLine {
  friendName: string;
  scores: number[];
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
  selectedGame: string;
  graphsColumnWidth: number;
  currentUid: string;
}

const GraphsSection: React.FC<GraphsSectionProps> = ({
  currentTheme,
  selectedGame,
  graphsColumnWidth,
  currentUid,
}) => {
  const [userScores, setUserScores] = useState<number[]>([]);
  const [friendScoreLines, setFriendScoreLines] = useState<FriendLine[]>([]);
  const [xLabels, setXLabels] = useState<string[]>([]);
  const [friendUIDs, setFriendUIDs] = useState<string[]>([]);

  // --- Fetch current user's scores from Firestore ---
  useEffect(() => {
    const fetchCurrentUserScores = async () => {
      try {
        // Collection path: Scores / {currentUid} / {selectedGame}
        const scoresCol = collection(db, 'Scores', currentUid, selectedGame);
        const q = query(scoresCol); // add filters or ordering if needed
        const querySnapshot = await getDocs(q);
        const scores: number[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          console.log('Current user score doc:', docSnap.id, '=>', data);
          // Try to extract a numeric score from either "scoreIndex" or "score"
          const score =
            typeof data.scoreIndex === 'number'
              ? data.scoreIndex
              : typeof data.score === 'number'
              ? data.score
              : 0;
          scores.push(score);
        });
        // Sort scores if desired (here ascending order)
        scores.sort((a, b) => a - b);
        setUserScores(scores);
      } catch (error) {
        console.error('Error fetching current user scores:', error);
      }
    };

    fetchCurrentUserScores();
  }, [currentUid, selectedGame]);

  // --- Fetch friend UIDs from current user's profile ---
  useEffect(() => {
    const fetchFriendUIDs = async () => {
      try {
        const profileRef = doc(db, 'profile', currentUid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          // Assuming profile document is structured like:
          // { friends: { friends: [uid1, uid2, ...] } }
          const fUIDs: string[] = data?.friends?.friends || [];
          console.log('Friend UIDs:', fUIDs);
          setFriendUIDs(fUIDs);
        } else {
          console.warn('No profile document for currentUid:', currentUid);
        }
      } catch (error) {
        console.error('Error fetching friend UIDs:', error);
      }
    };

    fetchFriendUIDs();
  }, [currentUid]);

  // --- For each friend UID, fetch their profile and scores ---
  useEffect(() => {
    // Loop over friendUIDs array
    friendUIDs.forEach(async (uid) => {
      try {
        // Fetch friend profile for display info
        const friendProfileRef = doc(db, 'profile', uid);
        const friendProfileSnap = await getDoc(friendProfileRef);
        if (friendProfileSnap.exists()) {
          const friendData = friendProfileSnap.data();
          const friendName = friendData?.username || 'Friend';
          const friendColor = friendData?.bannerColor || currentTheme.card;
          // Now fetch friend's scores for the selected game
          const scoresCol = collection(db, 'Scores', uid, selectedGame);
          const q = query(scoresCol);
          const querySnapshot = await getDocs(q);
          const scores: number[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            console.log(`${friendName} score doc:`, docSnap.id, '=>', data);
            const score =
              typeof data.scoreIndex === 'number'
                ? data.scoreIndex
                : typeof data.score === 'number'
                ? data.score
                : 0;
            scores.push(score);
          });
          scores.sort((a, b) => a - b);
          // Update friendScoreLines for this friend
          setFriendScoreLines((prev) => {
            // Remove any existing entry for this friend
            const others = prev.filter((fl) => fl.friendName !== friendName);
            return [...others, { friendName, scores, color: friendColor }];
          });
        } else {
          console.warn('No profile for friend uid:', uid);
        }
      } catch (error) {
        console.error('Error fetching scores for friend uid', uid, error);
      }
    });
  }, [friendUIDs, selectedGame, currentTheme.card]);

  // --- Compute x-axis labels based on longest scores array ---
  useEffect(() => {
    const allLengths = [userScores.length, ...friendScoreLines.map((fl) => fl.scores.length)];
    const targetLength = allLengths.length > 0 ? Math.max(...allLengths) : 0;
    if (targetLength > 0) {
      const labels = Array.from({ length: targetLength }, (_, i) => (i + 1).toString());
      setXLabels(labels);
    } else {
      setXLabels([]);
    }
    console.log('xLabels:', xLabels);
  }, [userScores, friendScoreLines]);

  const hasData = userScores.length > 0 || friendScoreLines.some((fl) => fl.scores.length > 0);

  // --- Combine current user's and friends' scores into one array for charting ---
  const finalFriendLines: FriendLine[] = [
    { friendName: 'You', scores: userScores, color: currentTheme.primary },
    ...friendScoreLines,
  ];

  // --- Compute best scores for the BarChart (e.g., best score from each series) ---
  const bestScoresData = finalFriendLines.map((line) => ({
    friendName: line.friendName,
    score: line.scores.length ? Math.max(...line.scores) : 0,
    color: line.color,
  }));

  return (
    <View style={[styles.container, { width: graphsColumnWidth, backgroundColor: currentTheme.background }]}>
      {/* Line Chart Section */}
      <View style={styles.chartWrapper}>
        {hasData ? (
          <LineChart
            labels={xLabels}
            lines={finalFriendLines}
            width={graphsColumnWidth - 32}
            height={220}
            currentTheme={currentTheme}
            fontFamily="Parkisans"
          />
        ) : (
          <View
            style={{
              width: graphsColumnWidth - 32,
              height: 220,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: currentTheme.background,
            }}
          >
            <Text style={[styles.fontStyle, { color: currentTheme.text }]}>No Data</Text>
          </View>
        )}
        {/* Legend / Key */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendContainer}>
          {finalFriendLines.map((line, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColorBox, { backgroundColor: line.color }]} />
              <Text style={[styles.fontStyle, { color: currentTheme.text }]}>{line.friendName}</Text>
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
          data={bestScoresData}
          labels={bestScoresData.map((d) => d.friendName)}
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
  container: {
    padding: 16,
  },
  chartWrapper: {
    marginBottom: 32,
  },
  chartTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  fontStyle: {
    fontFamily: 'Parkisans',
    fontSize: 14,
  },
  legendContainer: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    marginRight: 4,
    borderRadius: 4,
  },
});
