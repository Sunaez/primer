import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Asset } from 'expo-asset';
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';

import { useThemeContext, useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { GAMES, Game } from '@/constants/games';
import { db } from '@/components/firebaseConfig';
import ScreenHeader from '@/components/ui/ScreenHeader';
import MetricPill from '@/components/ui/MetricPill';

const dailyStreakMessages = [
  '{username} is blazing with a {streak}-day streak.',
  '{username} just pushed the streak to {streak} days.',
  '{username} is now {streak} days deep into the daily routine.',
  '{username} has gone {streak} straight days without missing.',
  '{username} is stacking focused days: {streak} in a row.',
];

const getDailyGameIndices = (gamesLength: number): { primary: number; secondary: number } => {
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const primary = daysSinceEpoch % gamesLength;
  const secondary = (primary + 1) % gamesLength;
  return { primary, secondary };
};

async function uploadDailyStreakActivity(currentUid: string, streak: number, username: string) {
  const profileDocRef = doc(db, 'profile', currentUid);
  const profileSnap = await getDoc(profileDocRef);
  let friendRecipients: string[] = [];
  if (profileSnap.exists()) {
    const profileData = profileSnap.data() as { friends?: { friends?: string[] } };
    friendRecipients = profileData.friends?.friends || [];
  }

  const messageTemplate =
    dailyStreakMessages[Math.floor(Math.random() * dailyStreakMessages.length)];
  const message = messageTemplate
    .replace('{username}', username || 'Someone')
    .replace('{streak}', streak.toString());

  const activity = {
    content: {
      recipients: friendRecipients,
      type: 'dailyStreak',
      message,
      data: { dailyStreak: streak },
      fromUser: currentUid,
      fromName: username || 'Someone',
      timestamp: serverTimestamp(),
    },
    reactions: [],
    comments: [],
  };

  const activityRef = doc(collection(db, 'Activity', currentUid, 'Activity'));
  await setDoc(activityRef, activity);
}

function resolveVideoUri(video?: Game['video']) {
  if (!video) return null;
  if (typeof video === 'string') return video;
  if (typeof video === 'number') return Asset.fromModule(video).uri;
  if (typeof video === 'object' && 'uri' in video) return video.uri;
  return null;
}

function DailyGameCard({
  game,
  completed,
  accentColor,
  currentTheme,
  onPlay,
}: {
  game: Game;
  completed: boolean;
  accentColor: string;
  currentTheme: typeof THEMES[keyof typeof THEMES];
  onPlay: () => void;
}) {
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    const uri = resolveVideoUri(game.video);
    if (!uri) return;
    player.replace({ uri });
    player.play();
  }, [game.video, player]);

  return (
    <View
      style={[
        styles.gameCard,
        {
          backgroundColor: currentTheme.surface,
          borderColor: completed ? accentColor : currentTheme.border,
        },
      ]}
    >
      <View style={styles.cardTopRow}>
        <View
          style={[
            styles.cardBadge,
            {
              backgroundColor: completed ? accentColor : currentTheme.card,
            },
          ]}
        >
          <Ionicons
            name={completed ? 'checkmark-circle' : 'timer-outline'}
            size={16}
            color={completed ? '#fff' : currentTheme.text}
          />
          <Text
            style={[
              styles.cardBadgeText,
              { color: completed ? '#fff' : currentTheme.text },
            ]}
          >
            {completed ? 'Completed today' : 'Ready to play'}
          </Text>
        </View>
        <Text style={[styles.stepCount, { color: currentTheme.text }]}>
          {game.instructions.length} steps
        </Text>
      </View>

      <Text style={[styles.gameTitle, { color: currentTheme.text }]}>{game.title}</Text>
      <Text style={[styles.gameSubtitle, { color: currentTheme.text }]}>
        A short focus round built for your daily reset.
      </Text>

      {game.instructions.map((instruction, index) => (
        <View key={`${game.id}-${index}`} style={styles.instructionRow}>
          <View style={[styles.instructionDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.instructionText, { color: currentTheme.text }]}>
            {instruction}
          </Text>
        </View>
      ))}

      {game.video ? (
        <View style={styles.videoShell}>
          <VideoView style={styles.video} player={player} />
        </View>
      ) : (
        <View
          style={[
            styles.noVideoShell,
            { backgroundColor: currentTheme.card, borderColor: currentTheme.border },
          ]}
        >
          <Ionicons name="sparkles-outline" size={22} color={accentColor} />
          <Text style={[styles.noVideoText, { color: currentTheme.text }]}>
            No preview yet, but the session is live.
          </Text>
        </View>
      )}

      <Pressable
        style={[
          styles.playButton,
          { backgroundColor: completed ? currentTheme.card : accentColor },
        ]}
        onPress={onPlay}
      >
        <Text style={[styles.playButtonText, { color: currentTheme.buttonText || '#fff' }]}>
          {completed ? 'Play Again' : 'Start Session'}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={currentTheme.buttonText || '#fff'}
        />
      </Pressable>
    </View>
  );
}

export default function DailyScreen() {
  const { width } = useWindowDimensions();
  const { themeName } = useThemeContext();
  const { user } = useUserContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const router = useRouter();

  const isWide = width >= 980;
  const { primary, secondary } = useMemo(() => getDailyGameIndices(GAMES.length), []);
  const dailyGames = useMemo(() => [GAMES[primary], GAMES[secondary]], [primary, secondary]);

  const [completedGames, setCompletedGames] = useState<Record<string, boolean>>({});
  const [dailyStreak, setDailyStreak] = useState(0);

  const currentUid = user?.uid || '';
  const today = new Date();
  const todayScore = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  const todayISO = today.toISOString().split('T')[0];
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    async function loadCompletionState() {
      if (!currentUid) {
        setCompletedGames({});
        return;
      }

      try {
        const entries = await Promise.all(
          dailyGames.map(async (game) => {
            const scoresRef = collection(db, 'Scores', currentUid, game.id);
            const scoresQuery = query(scoresRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(scoresQuery);
            let completed = false;
            snapshot.forEach((docSnap) => {
              if (docSnap.data().date === todayScore) {
                completed = true;
              }
            });
            return [game.id, completed] as const;
          })
        );

        setCompletedGames(Object.fromEntries(entries));
      } catch (error) {
        console.error('Error checking daily completion:', error);
      }
    }

    loadCompletionState();
  }, [currentUid, dailyGames, todayScore]);

  useEffect(() => {
    async function updateDailyStreak() {
      if (!currentUid) {
        setDailyStreak(0);
        return;
      }

      const allComplete = dailyGames.every((game) => completedGames[game.id]);
      const dailyStreakDocRef = doc(db, 'Statistics', currentUid, 'DailyStreak', 'data');

      try {
        const docSnap = await getDoc(dailyStreakDocRef);
        if (!docSnap.exists()) {
          const initialStreak = allComplete ? 1 : 0;
          await setDoc(dailyStreakDocRef, {
            dailyStreak: initialStreak,
            lastUpdated: todayISO,
          });
          setDailyStreak(initialStreak);
          if (allComplete) {
            await uploadDailyStreakActivity(currentUid, initialStreak, user?.username || 'Someone');
          }
          return;
        }

        const data = docSnap.data();
        if (data.lastUpdated !== todayISO && allComplete) {
          const newStreak = (data.dailyStreak || 0) + 1;
          await updateDoc(dailyStreakDocRef, { dailyStreak: newStreak, lastUpdated: todayISO });
          setDailyStreak(newStreak);
          await uploadDailyStreakActivity(currentUid, newStreak, user?.username || 'Someone');
        } else {
          setDailyStreak(data.dailyStreak || 0);
        }
      } catch (error) {
        console.error('Error updating daily streak:', error);
      }
    }

    updateDailyStreak();
  }, [completedGames, currentUid, dailyGames, todayISO, user?.username]);

  const completedCount = dailyGames.filter((game) => completedGames[game.id]).length;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[currentTheme.daily, currentTheme.primary, currentTheme.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <ScreenHeader
          eyebrow="Daily Focus"
          title="Two fast rounds. One stronger routine."
          description={`Today's set for ${formattedDate}. Finish both games to protect your streak and keep your stats moving.`}
          accentColor="#fff"
          textColor="#fff"
          mutedColor="rgba(255,255,255,0.82)"
          rightSlot={
            <MetricPill
              icon="flame"
              label="Current streak"
              value={`${dailyStreak} day${dailyStreak === 1 ? '' : 's'}`}
              textColor="#fff"
              accentColor="rgba(0,0,0,0.24)"
              backgroundColor="rgba(255,255,255,0.14)"
            />
          }
        />

        <View style={styles.metricsRow}>
          <MetricPill
            icon="checkmark-done"
            label="Progress"
            value={`${completedCount}/2 complete`}
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
          <MetricPill
            icon="calendar-outline"
            label="Cadence"
            value="Daily reset"
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
          <MetricPill
            icon="sparkles-outline"
            label="Session size"
            value="Short and sharp"
            textColor="#fff"
            accentColor="rgba(0,0,0,0.24)"
            backgroundColor="rgba(255,255,255,0.14)"
          />
        </View>

        {!user ? (
          <View style={styles.guestBanner}>
            <Ionicons name="person-circle-outline" size={20} color="#fff" />
            <Text style={styles.guestBannerText}>
              Play as a guest, or sign in from Profile to track streaks and compare results.
            </Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={[styles.cardsWrap, isWide && styles.cardsWrapWide]}>
        {dailyGames.map((game, index) => (
          <DailyGameCard
            key={game.id}
            game={game}
            completed={!!completedGames[game.id]}
            accentColor={index === 0 ? currentTheme.daily : currentTheme.freeplay}
            currentTheme={currentTheme}
            onPlay={() => router.push(`/games/${game.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    padding: 18,
    paddingBottom: 36,
    gap: 18,
  },
  hero: {
    borderRadius: 32,
    padding: 24,
    gap: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  guestBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Parkinsans',
  },
  cardsWrap: {
    gap: 16,
  },
  cardsWrapWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gameCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  cardBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  stepCount: {
    fontSize: 12,
    opacity: 0.72,
    fontFamily: 'Parkinsans',
  },
  gameTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  gameSubtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.82,
    fontFamily: 'Parkinsans',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  instructionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Parkinsans',
  },
  videoShell: {
    marginTop: 14,
    borderRadius: 20,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  noVideoShell: {
    marginTop: 14,
    minHeight: 140,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  noVideoText: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Parkinsans',
  },
  playButton: {
    marginTop: 18,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
});
