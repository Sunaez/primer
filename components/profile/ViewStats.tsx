import React, { useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { doc, getDoc } from 'firebase/firestore';

import { useUserContext, useThemeContext } from '@/context/UserContext';
import { db } from '@/components/firebaseConfig';
import { GAMES } from '@/constants/games';
import THEMES from '@/constants/themes';

interface ViewStatsProps {
  visible: boolean;
  onClose: () => void;
}

interface GameStats {
  bestScoreIndex?: number;
  dailyBestScoreIndex?: number;
  totalPlays?: number;
  updatedAt?: any;
}

function StatTile({
  label,
  value,
  currentTheme,
}: {
  label: string;
  value: string;
  currentTheme: any;
}) {
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
      ]}
    >
      <Text style={[styles.statLabel, { color: currentTheme.text }]}>{label}</Text>
      <Text style={[styles.statValue, { color: currentTheme.text }]}>{value}</Text>
    </View>
  );
}

export default function ViewStats({ visible, onClose }: ViewStatsProps) {
  const { user } = useUserContext();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const [selectedGameId, setSelectedGameId] = useState(GAMES[0].id);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        const statsDocRef = doc(db, 'Statistics', user.uid, 'games', selectedGameId);
        const docSnap = await getDoc(statsDocRef);
        setStats(docSnap.exists() ? docSnap.data() : {});
      } catch (error) {
        console.error('Error loading statistics:', error);
        setStats(null);
      }
    }

    loadStats();
  }, [selectedGameId, user]);

  const selectedGame = GAMES.find((game) => game.id === selectedGameId);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View style={styles.overlay} entering={FadeIn} exiting={FadeOut}>
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
            ]}
          >
            <View style={styles.header}>
              <View>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Statistics</Text>
                <Text style={[styles.headerDescription, { color: currentTheme.text }]}>
                  A cleaner read on your results for each game.
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={currentTheme.text} />
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.dropdownTrigger,
                {
                  borderColor: currentTheme.border,
                  backgroundColor: currentTheme.surface,
                },
              ]}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={[styles.dropdownTriggerText, { color: currentTheme.text }]}>
                {selectedGame?.title || 'Select game'}
              </Text>
              <Ionicons
                name={dropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={18}
                color={currentTheme.text}
              />
            </Pressable>

            {dropdownOpen ? (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: currentTheme.surface,
                    borderColor: currentTheme.border,
                  },
                ]}
              >
                {GAMES.map((game) => (
                  <Pressable
                    key={game.id}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedGameId(game.id);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: currentTheme.text }]}>
                      {game.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <ScrollView contentContainerStyle={styles.statsGrid} showsVerticalScrollIndicator={false}>
              <StatTile
                label="Best score"
                value={stats?.bestScoreIndex != null ? String(stats.bestScoreIndex) : 'No data'}
                currentTheme={currentTheme}
              />
              <StatTile
                label="Daily best"
                value={
                  stats?.dailyBestScoreIndex != null
                    ? String(stats.dailyBestScoreIndex)
                    : 'No data'
                }
                currentTheme={currentTheme}
              />
              <StatTile
                label="Total plays"
                value={stats?.totalPlays != null ? String(stats.totalPlays) : 'No data'}
                currentTheme={currentTheme}
              />
              <StatTile
                label="Last updated"
                value={
                  stats?.updatedAt?.toDate
                    ? stats.updatedAt.toDate().toLocaleString()
                    : 'No data'
                }
                currentTheme={currentTheme}
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 16, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 680,
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  headerDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    fontFamily: 'Parkinsans',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTrigger: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dropdownTriggerText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Parkinsans',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownOptionText: {
    fontSize: 15,
    fontFamily: 'Parkinsans',
  },
  statsGrid: {
    gap: 12,
  },
  statTile: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontFamily: 'Parkinsans',
  },
  statValue: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
});
