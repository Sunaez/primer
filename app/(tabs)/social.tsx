import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeContext, useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { GAMES } from '@/constants/games';
import ActivityModal from '@/components/social/activity/ActivityModal';
import ActivityColumn from '@/components/social/activity/ActivityColumn';
import GraphsSection from '@/components/social/graphing/GraphsSection';
import { auth } from '@/components/firebaseConfig';
import ScreenHeader from '@/components/ui/ScreenHeader';
import MetricPill from '@/components/ui/MetricPill';
import EmptyState from '@/components/ui/EmptyState';

export default function Social() {
  const { themeName } = useThemeContext();
  const { user } = useUserContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>(GAMES[0].id);

  if (!user) {
    return (
      <View style={[styles.fallbackShell, { backgroundColor: currentTheme.background }]}>
        <EmptyState
          title="Social unlocks after sign-in"
          description="Create an account to compare scores, see streak activity, and track daily highs with friends."
          theme={currentTheme}
          accentColor={currentTheme.social}
          imageSource={require('@/assets/images/shrug_emoji.png')}
        />
      </View>
    );
  }

  const selectedGameTitle =
    GAMES.find((game) => game.id === selectedGame)?.title || 'Selected game';

  return (
    <View style={[styles.screen, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.social, currentTheme.primary, currentTheme.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <ScreenHeader
          eyebrow="Social"
          title="Turn your scores into something you can actually compare."
          description={`You are currently viewing ${selectedGameTitle}. Switch games below to update the chart set and activity context.`}
          accentColor="#fff"
          textColor="#fff"
          mutedColor="rgba(255,255,255,0.82)"
          rightSlot={
            !isDesktop ? (
              <Pressable
                style={styles.activityButton}
                onPress={() => setActivityModalVisible(true)}
              >
                <Ionicons name="notifications-outline" size={18} color="#fff" />
                <Text style={styles.activityButtonText}>Activity</Text>
              </Pressable>
            ) : null
          }
        />

        <View style={styles.heroMetrics}>
          <MetricPill
            icon="analytics-outline"
            label="Charts"
            value="Trends + daily highs"
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
          <MetricPill
            icon="people-outline"
            label="Friends"
            value={`${user.friends?.friends?.length || 0} tracked`}
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
          <MetricPill
            icon="pulse-outline"
            label="Focus"
            value={selectedGameTitle}
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
        </View>

        <View style={styles.gameSelector}>
          {GAMES.map((game) => {
            const active = game.id === selectedGame;
            return (
              <Pressable
                key={game.id}
                style={[
                  styles.gameChip,
                  {
                    backgroundColor: active ? '#111827' : 'rgba(255,255,255,0.16)',
                  },
                ]}
                onPress={() => setSelectedGame(game.id)}
              >
                <Text style={styles.gameChipText}>{game.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      {isDesktop ? (
        <View style={styles.desktopLayout}>
          <View
            style={[
              styles.activityPane,
              { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
            ]}
          >
            <ActivityColumn currentTheme={currentTheme} width={Math.max(width * 0.32, 320)} />
          </View>

          <View
            style={[
              styles.chartsPane,
              { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
            ]}
          >
            <GraphsSection
              currentTheme={currentTheme}
              selectedGame={selectedGame}
              graphsColumnWidth={Math.max(width * 0.58, 440)}
              currentUid={auth.currentUser?.uid || ''}
              userBannerColor={user.bannerColor}
            />
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.mobileChartsPane,
            { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
          ]}
        >
          <GraphsSection
            currentTheme={currentTheme}
            selectedGame={selectedGame}
            graphsColumnWidth={width - 36}
            currentUid={auth.currentUser?.uid || ''}
            userBannerColor={user.bannerColor}
          />
        </View>
      )}

      <ActivityModal
        visible={activityModalVisible}
        onClose={() => setActivityModalVisible(false)}
        currentTheme={currentTheme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 18,
    gap: 16,
  },
  fallbackShell: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  hero: {
    borderRadius: 32,
    padding: 22,
    gap: 18,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  activityButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  gameSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gameChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  gameChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  activityPane: {
    width: '34%',
    borderWidth: 1,
    borderRadius: 28,
    padding: 16,
  },
  chartsPane: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 28,
    padding: 16,
  },
  mobileChartsPane: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 28,
    padding: 10,
  },
});
