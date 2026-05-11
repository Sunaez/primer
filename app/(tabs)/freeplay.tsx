import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Asset } from 'expo-asset';

import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { Game, GAMES } from '@/constants/games';
import * as InfoModules from '@/components/info';
import ScreenHeader from '@/components/ui/ScreenHeader';
import MetricPill from '@/components/ui/MetricPill';

function resolveVideoUri(video?: Game['video']) {
  if (!video) return null;
  if (typeof video === 'string') return video;
  if (typeof video === 'number') return Asset.fromModule(video).uri;
  if (typeof video === 'object' && 'uri' in video) return video.uri;
  return null;
}

export default function Freeplay() {
  const router = useRouter();
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const selectedGame = useMemo(() => GAMES[selectedIndex], [selectedIndex]);
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    const uri = resolveVideoUri(selectedGame.video);
    if (!uri) return;
    player.replace({ uri });
    player.play();
    setIsVideoPaused(false);
  }, [player, selectedGame.video]);

  function handlePlay() {
    router.push(`/games/${selectedGame.id}`);
  }

  function handleVideoPress() {
    if (isVideoPaused) {
      player.play();
      setIsVideoPaused(false);
    } else {
      player.pause();
      setIsVideoPaused(true);
    }
  }

  function renderInfoContent() {
    const InfoComponent = (InfoModules as any)[selectedGame.id];
    return InfoComponent ? (
      <InfoComponent />
    ) : (
      <Text style={{ color: currentTheme.text }}>No additional information is available yet.</Text>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: currentTheme.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[currentTheme.freeplay, currentTheme.primary, currentTheme.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <ScreenHeader
            eyebrow="Freeplay"
            title="Practice any game whenever you want extra reps."
            description={`You are focused on ${selectedGame.title}. Preview the flow, revisit the rules, and jump straight in when you are ready.`}
            accentColor="#fff"
            textColor="#fff"
            mutedColor="rgba(255,255,255,0.82)"
          />

          <View style={styles.heroMetrics}>
            <MetricPill
              icon="game-controller-outline"
              label="Selected"
              value={selectedGame.title}
              textColor="#fff"
              accentColor="rgba(0,0,0,0.24)"
              backgroundColor="rgba(255,255,255,0.14)"
            />
            <MetricPill
              icon="list-outline"
              label="Instructions"
              value={`${selectedGame.instructions.length} steps`}
              textColor="#fff"
              accentColor="rgba(0,0,0,0.24)"
              backgroundColor="rgba(255,255,255,0.14)"
            />
            <MetricPill
              icon="sparkles-outline"
              label="Mode"
              value="Unlimited runs"
              textColor="#fff"
              accentColor="rgba(0,0,0,0.24)"
              backgroundColor="rgba(255,255,255,0.14)"
            />
          </View>
        </LinearGradient>

        <View
          style={[
            styles.selectorRail,
            { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectorRow}>
              {GAMES.map((game, index) => {
                const active = selectedIndex === index;
                return (
                  <Pressable
                    key={game.id}
                    style={[
                      styles.selectorCard,
                      {
                        backgroundColor: active ? currentTheme.primary : currentTheme.background,
                        borderColor: active ? currentTheme.primary : currentTheme.border,
                      },
                    ]}
                    onPress={() => setSelectedIndex(index)}
                  >
                    <Text
                      style={[
                        styles.selectorTitle,
                        { color: active ? '#fff' : currentTheme.text },
                      ]}
                    >
                      {game.title}
                    </Text>
                    <Text
                      style={[
                        styles.selectorSubtitle,
                        { color: active ? 'rgba(255,255,255,0.84)' : currentTheme.text },
                      ]}
                    >
                      {game.instructions.length} quick steps
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={[styles.detailLayout, isWide && styles.detailLayoutWide]}>
          <View
            style={[
              styles.detailCard,
              { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
            ]}
          >
            <Text style={[styles.detailEyebrow, { color: currentTheme.freeplay }]}>How it works</Text>
            <Text style={[styles.detailTitle, { color: currentTheme.text }]}>
              {selectedGame.title}
            </Text>
            <Text style={[styles.detailDescription, { color: currentTheme.text }]}>
              Freeplay lets you sharpen this specific skill without waiting for the next daily rotation.
            </Text>

            <View style={styles.instructionsList}>
              {selectedGame.instructions.map((step, index) => (
                <View key={`${selectedGame.id}-${index}`} style={styles.instructionRow}>
                  <View
                    style={[styles.instructionNumber, { backgroundColor: currentTheme.primary }]}
                  >
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.instructionText, { color: currentTheme.text }]}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.ctaRow}>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: currentTheme.primary }]}
                onPress={handlePlay}
              >
                <Text style={styles.primaryButtonText}>Play Game</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { borderColor: currentTheme.border }]}
                onPress={() => setInfoModalVisible(true)}
              >
                <Ionicons name="information-circle-outline" size={18} color={currentTheme.text} />
                <Text style={[styles.secondaryButtonText, { color: currentTheme.text }]}>
                  Why it helps
                </Text>
              </Pressable>
            </View>
          </View>

          <View
            style={[
              styles.previewCard,
              { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
            ]}
          >
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: currentTheme.text }]}>Preview</Text>
              <Pressable
                style={[
                  styles.previewToggle,
                  { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
                ]}
                onPress={handleVideoPress}
              >
                <Ionicons
                  name={isVideoPaused ? 'play' : 'pause'}
                  size={16}
                  color={currentTheme.text}
                />
                <Text style={[styles.previewToggleText, { color: currentTheme.text }]}>
                  {isVideoPaused ? 'Play' : 'Pause'}
                </Text>
              </Pressable>
            </View>

            {selectedGame.video ? (
              <Pressable style={styles.videoShell} onPress={handleVideoPress}>
                <VideoView style={styles.video} player={player} />
                {isVideoPaused ? (
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={44} color="#fff" />
                  </View>
                ) : null}
              </Pressable>
            ) : (
              <View
                style={[
                  styles.noVideoCard,
                  { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
                ]}
              >
                <Ionicons name="videocam-off-outline" size={26} color={currentTheme.freeplay} />
                <Text style={[styles.noVideoText, { color: currentTheme.text }]}>
                  This game does not have a preview video yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={infoModalVisible} animationType="fade" transparent onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, { color: currentTheme.primary }]}>Benefits</Text>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  Why {selectedGame.title} is worth replaying
                </Text>
              </View>
              <Pressable onPress={() => setInfoModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={22} color={currentTheme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {renderInfoContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 36,
    gap: 16,
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
  selectorRail: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 10,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
  },
  selectorCard: {
    width: 170,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  selectorSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Parkinsans',
  },
  detailLayout: {
    gap: 16,
  },
  detailLayoutWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  detailCard: {
    flex: 1.1,
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
  },
  previewCard: {
    flex: 0.95,
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
  },
  detailEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Parkinsans',
  },
  detailTitle: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  detailDescription: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.82,
    fontFamily: 'Parkinsans',
  },
  instructionsList: {
    marginTop: 18,
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Parkinsans',
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  previewToggleText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  videoShell: {
    borderRadius: 22,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  noVideoCard: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  noVideoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Parkinsans',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 16, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '84%',
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  modalEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: 'Parkinsans',
  },
  modalTitle: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flexGrow: 0,
  },
});
