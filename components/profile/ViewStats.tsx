// /components/profile/ViewStats.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUserContext, useThemeContext } from '@/context/UserContext';
import { db } from '@/components/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
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

const ViewStats: React.FC<ViewStatsProps> = ({ visible, onClose }) => {
  const { user } = useUserContext();
  // Obtain the current theme name via useThemeContext.
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const [selectedGameId, setSelectedGameId] = useState(GAMES[0].id);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Whenever the selected game or user changes, load its statistics.
  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      setLoading(true);
      try {
        const statsDocRef = doc(db, "Statistics", user.uid, "games", selectedGameId);
        const docSnap = await getDoc(statsDocRef);
        if (docSnap.exists()) {
          setStats(docSnap.data());
        } else {
          setStats({});
        }
      } catch (error) {
        console.error("Error loading statistics:", error);
        setStats(null);
      }
      setLoading(false);
    }
    loadStats();
  }, [selectedGameId, user]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
        entering={FadeIn}
        exiting={FadeOut}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
              Your Statistics
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          {/* Custom Dropdown */}
          <Text style={[styles.label, { color: currentTheme.text }]}>Select Game:</Text>
          <TouchableOpacity
            style={[
              styles.dropdownContainer,
              {
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.inputBackground,
              },
            ]}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <Text style={[styles.dropdownText, { color: currentTheme.text }]}>
              {GAMES.find((game) => game.id === selectedGameId)?.title || "Select Game"}
            </Text>
            <Ionicons
              name={dropdownOpen ? "chevron-up-outline" : "chevron-down-outline"}
              size={20}
              color={currentTheme.text}
            />
          </TouchableOpacity>

          {/* Dropdown Options */}
          {dropdownOpen && (
            <View
              style={[
                styles.dropdownOptions,
                {
                  backgroundColor: currentTheme.surface,
                  borderColor: currentTheme.border,
                },
              ]}
            >
              {GAMES.map((game) => (
                <TouchableOpacity
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
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Statistics Display */}
          <View style={styles.statsContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={currentTheme.primary} />
            ) : stats ? (
              <ScrollView>
                <Text style={[styles.statText, { color: currentTheme.text }]}>
                  Best Score Index: {stats.bestScoreIndex ?? 'N/A'}
                </Text>
                <Text style={[styles.statText, { color: currentTheme.text }]}>
                  Daily Best Score Index: {stats.dailyBestScoreIndex ?? 'N/A'}
                </Text>
                <Text style={[styles.statText, { color: currentTheme.text }]}>
                  Total Plays: {stats.totalPlays ?? 'N/A'}
                </Text>
                <Text style={[styles.statText, { color: currentTheme.text }]}>
                  Last Updated: {stats.updatedAt ? stats.updatedAt.toDate().toLocaleString() : 'N/A'}
                </Text>
              </ScrollView>
            ) : (
              <Text style={[styles.statText, { color: currentTheme.text }]}>
                No statistics available for this game.
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default ViewStats;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  dropdownContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownOptions: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  statsContainer: {
    flex: 1,
  },
  statText: {
    fontSize: 16,
    marginBottom: 8,
  },
});
