import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '@/components/firebaseConfig';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';

import { useThemeContext, useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import SignUpIn from '@/components/profile/SignUp-In';
import UserSettings from '@/components/profile/UserSettings';
import BannerChange from '@/components/profile/BannerChange';
import PictureChange from '@/components/profile/PictureChange';
import MostPlayedGraph from '@/components/profile/MostPlayedGraph';
import BestScoreGraph from '@/components/profile/BestScoreGraph';
import MostConsistentGraph from '@/components/profile/MostConsistentGraph';
import ViewStats from '@/components/profile/ViewStats';
import ScreenHeader from '@/components/ui/ScreenHeader';
import MetricPill from '@/components/ui/MetricPill';

export default function Profile() {
  const { user } = useUserContext();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const graphWidth = isWide ? Math.max(260, (width - 140) / 3.2) : width - 84;
  const graphHeight = 100;

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showBannerChange, setShowBannerChange] = useState(false);
  const [showPictureChange, setShowPictureChange] = useState(false);
  const [viewStatsVisible, setViewStatsVisible] = useState(false);

  async function fetchUserProfileData() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const profileDocRef = doc(db, 'profile', uid);
    const snap = await getDoc(profileDocRef);
    if (!snap.exists()) return;

    const data = snap.data();
    let updateNeeded = false;
    const updates: any = {};

    if (!('friends' in data)) {
      updates.friends = {
        friends: [],
        friendRequests: [],
        blocked: [],
      };
      updateNeeded = true;
    }
    if ('stats' in data) {
      updates.stats = deleteField();
      updateNeeded = true;
    }
    if (updateNeeded) {
      await updateDoc(profileDocRef, updates);
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserProfileData();
    }
  }, [user]);

  if (!user) {
    return <SignUpIn onAuthSuccess={() => {}} />;
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[user.bannerColor || currentTheme.primary, currentTheme.primary, currentTheme.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTopRow}>
          <ScreenHeader
            eyebrow="Profile"
            title={user.username ? `${user.username}, this is your control room.` : 'Your control room.'}
            description="Update your look, track your habits, and keep your personal stats close."
            accentColor="#fff"
            textColor="#fff"
            mutedColor="rgba(255,255,255,0.82)"
          />

          <View style={styles.heroActions}>
            <Pressable style={styles.heroIconButton} onPress={() => setSettingsVisible(true)}>
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable style={styles.heroIconButton} onPress={() => setShowBannerChange(true)}>
              <Ionicons name="color-palette-outline" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={[styles.identityCard, { backgroundColor: 'rgba(0,0,0,0.16)' }]}>
          <View style={styles.identityRow}>
            <View>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={38} color="#fff" />
                </View>
              )}
              <Pressable style={styles.avatarEditButton} onPress={() => setShowPictureChange(true)}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.identityCopy}>
              <Text style={styles.username}>{user.username || 'Player'}</Text>
              <Text style={styles.identitySubcopy}>Theme: {user.theme}</Text>
              <Text style={styles.identitySubcopy}>
                Friends: {user.friends?.friends?.length || 0} connected
              </Text>
            </View>
          </View>

          <View style={styles.heroMetrics}>
            <MetricPill
              icon="people-outline"
              label="Friends"
              value={`${user.friends?.friends?.length || 0}`}
              textColor="#fff"
              accentColor="rgba(255,255,255,0.18)"
              backgroundColor="rgba(255,255,255,0.12)"
            />
            <MetricPill
              icon="mail-open-outline"
              label="Pending"
              value={`${user.friends?.friendRequests?.length || 0}`}
              textColor="#fff"
              accentColor="rgba(255,255,255,0.18)"
              backgroundColor="rgba(255,255,255,0.12)"
            />
            <MetricPill
              icon="brush-outline"
              label="Theme"
              value={user.theme}
              textColor="#fff"
              accentColor="rgba(255,255,255,0.18)"
              backgroundColor="rgba(255,255,255,0.12)"
            />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <ScreenHeader
          eyebrow="Stats"
          title="See the shape of your play."
          description="Quick charts keep your strongest patterns visible without making the page feel heavy."
          accentColor={currentTheme.primary}
          textColor={currentTheme.text}
          mutedColor={currentTheme.text}
          rightSlot={
            <Pressable
              style={[styles.statsButton, { backgroundColor: currentTheme.primary }]}
              onPress={() => setViewStatsVisible(true)}
            >
              <Ionicons name="stats-chart-outline" size={18} color="#fff" />
              <Text style={styles.statsButtonText}>View Statistics</Text>
            </Pressable>
          }
        />
      </View>

      <View style={[styles.graphGrid, isWide && styles.graphGridWide]}>
        <View
          style={[
            styles.graphCard,
            { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
          ]}
        >
          <Text style={[styles.graphTitle, { color: currentTheme.text }]}>Most Played</Text>
          <MostPlayedGraph chartWidth={graphWidth} chartHeight={graphHeight} />
        </View>

        <View
          style={[
            styles.graphCard,
            { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
          ]}
        >
          <Text style={[styles.graphTitle, { color: currentTheme.text }]}>Best Score</Text>
          <BestScoreGraph chartWidth={graphWidth} chartHeight={graphHeight} />
        </View>

        <View
          style={[
            styles.graphCard,
            styles.graphCardFull,
            { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
          ]}
        >
          <Text style={[styles.graphTitle, { color: currentTheme.text }]}>Most Consistent</Text>
          <MostConsistentGraph
            chartWidth={isWide ? width - 156 : width - 84}
            chartHeight={graphHeight}
          />
        </View>
      </View>

      <UserSettings visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <BannerChange
        visible={showBannerChange}
        initialColor={user.bannerColor}
        onCancel={() => setShowBannerChange(false)}
        onConfirm={() => setShowBannerChange(false)}
      />
      <PictureChange
        visible={showPictureChange}
        initialPhotoURL={user.photoURL}
        onCancel={() => setShowPictureChange(false)}
        onConfirm={() => setShowPictureChange(false)}
      />
      <ViewStats visible={viewStatsVisible} onClose={() => setViewStatsVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 36,
    gap: 18,
  },
  hero: {
    borderRadius: 32,
    padding: 22,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    borderRadius: 28,
    padding: 18,
    gap: 18,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  identitySubcopy: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontFamily: 'Parkinsans',
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  section: {
    marginTop: 4,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  statsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  graphGrid: {
    gap: 14,
  },
  graphGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  graphCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    minWidth: 0,
    flex: 1,
  },
  graphCardFull: {
    width: '100%',
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'Parkinsans',
  },
});
