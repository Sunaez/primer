import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Text,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Swiper from 'react-native-swiper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';

type OnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
};

type SlideData = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  statLabel: string;
  statValue: string;
  accentColor: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  image?: any;
};

export default function OnboardingModal({ visible, onClose }: OnboardingModalProps) {
  const { themeName } = useThemeContext() || { themeName: 'Dark' };
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const router = useRouter();
  const swiperRef = useRef<Swiper>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { width, height } = useWindowDimensions();
  const isCompact = width < 820;

  const slides: SlideData[] = useMemo(
    () => [
      {
        eyebrow: 'Welcome',
        title: 'Primer keeps your daily training compact and repeatable.',
        description:
          'This is not a giant productivity app. It is a tight routine: show up, play two focused rounds, and leave sharper than you arrived.',
        points: [
          'Finish your daily set in minutes, not hours.',
          'Use freeplay when you want extra reps without pressure.',
          'Track momentum, not noise.',
        ],
        statLabel: 'Session style',
        statValue: 'Short and sharp',
        accentColor: currentTheme.primary,
        image: require('@/assets/images/logo.png'),
      },
      {
        eyebrow: 'Daily',
        title: 'Your onboarding starts with the habit loop.',
        description:
          'Every day surfaces two games for you. Complete both to keep your streak intact and build a rhythm that actually sticks.',
        points: [
          'See today’s pair immediately on the home screen.',
          'Know what is complete before you even tap in.',
          'Come back tomorrow for a fresh combination.',
        ],
        statLabel: 'Daily goal',
        statValue: '2 games',
        accentColor: currentTheme.daily,
        iconName: 'calendar-outline',
      },
      {
        eyebrow: 'Freeplay',
        title: 'Practice without waiting for tomorrow.',
        description:
          'Freeplay is where you revisit games, replay favorites, and learn the mechanics with quick previews before you commit to a run.',
        points: [
          'Switch games fast from one clean rail.',
          'Read the rules without leaving the screen.',
          'Use video previews when you want context first.',
        ],
        statLabel: 'Mode',
        statValue: 'Unlimited reps',
        accentColor: currentTheme.freeplay,
        iconName: 'game-controller-outline',
      },
      {
        eyebrow: 'Social',
        title: 'Progress matters more when you can compare it.',
        description:
          'The social tab turns isolated scores into a shared timeline of streaks, charts, and activity from the people you care about.',
        points: [
          'Open score trends for every game.',
          'Watch daily highs move in real time.',
          'React to activity instead of checking blindly.',
        ],
        statLabel: 'What you get',
        statValue: 'Shared momentum',
        accentColor: currentTheme.social,
        iconName: 'pulse-outline',
      },
      {
        eyebrow: 'Friends',
        title: 'Build a tighter circle, not a crowded feed.',
        description:
          'Add friends, accept requests, and keep the list curated so the competitive side of the app stays useful instead of noisy.',
        points: [
          'Search people quickly from one place.',
          'Handle requests without jumping between screens.',
          'Remove or block when you need a cleaner list.',
        ],
        statLabel: 'Network',
        statValue: 'Invite only',
        accentColor: currentTheme.friends,
        iconName: 'people-outline',
      },
      {
        eyebrow: 'Profile',
        title: 'Your stats, theme, and identity all live in one place.',
        description:
          'Profile is where you customize the app’s look, keep your banner and avatar current, and review the numbers behind your play history.',
        points: [
          'Change your look without leaving the app.',
          'Open deeper stats whenever you want detail.',
          'Keep a cleaner read on your own progress.',
        ],
        statLabel: 'Control',
        statValue: 'All in one panel',
        accentColor: currentTheme.text,
        iconName: 'person-circle-outline',
      },
      {
        eyebrow: 'Ready',
        title: 'Use guest mode now, or create an account and keep everything.',
        description:
          'Guest mode lets you start immediately. An account unlocks streaks, social progress, profile customization, and friend activity.',
        points: [
          'Create an account when you want persistent progress.',
          'Continue as guest if you just want to try the experience.',
          'You can always sign up later from Profile.',
        ],
        statLabel: 'Best path',
        statValue: 'Account recommended',
        accentColor: currentTheme.secondary,
        image: require('@/assets/images/okay_emoji.png'),
      },
    ],
    [currentTheme]
  );

  const activeSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  function goToNext() {
    if (isLastSlide) return;
    swiperRef.current?.scrollBy(1, true);
  }

  function goToPrevious() {
    if (currentIndex === 0) return;
    swiperRef.current?.scrollBy(-1, true);
  }

  function handleCreateAccount() {
    onClose();
    setTimeout(() => {
      router.push('/(tabs)/profile');
    }, 200);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" presentationStyle="overFullScreen">
      <View style={styles.overlay} />

      <View style={[styles.wrapper, isCompact && styles.wrapperCompact]}>
        <View
          style={[
            styles.container,
            {
              width: isCompact ? width : Math.min(width * 0.86, 1040),
              height: isCompact ? height : Math.min(height * 0.88, 760),
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border,
            },
          ]}
        >
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.brand, { color: currentTheme.text }]}>Primer</Text>
              <Text style={[styles.progressText, { color: currentTheme.text }]}>
                Step {currentIndex + 1} of {slides.length}
              </Text>
            </View>
            <Pressable
              style={[styles.skipButton, { borderColor: currentTheme.border }]}
              onPress={onClose}
            >
              <Text style={[styles.skipText, { color: currentTheme.text }]}>Skip</Text>
            </Pressable>
          </View>

          <Swiper
            ref={swiperRef}
            loop={false}
            index={currentIndex}
            showsPagination={false}
            onIndexChanged={setCurrentIndex}
            scrollEnabled={isCompact}
          >
            {slides.map((slide, index) => (
              <View key={`${slide.eyebrow}-${index}`} style={styles.slide}>
                <ScrollView
                  contentContainerStyle={[
                    styles.slideContent,
                    isCompact ? styles.slideContentCompact : styles.slideContentWide,
                  ]}
                  showsVerticalScrollIndicator={false}
                >
                  <LinearGradient
                    colors={[slide.accentColor, currentTheme.primary, currentTheme.surface]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroPanel}
                  >
                    <View style={styles.heroMeta}>
                      <Text style={styles.heroEyebrow}>{slide.eyebrow}</Text>
                      <Text style={styles.heroStatLabel}>{slide.statLabel}</Text>
                      <Text style={styles.heroStatValue}>{slide.statValue}</Text>
                    </View>

                    <View style={styles.heroVisual}>
                      {slide.image ? (
                        <Image source={slide.image} style={styles.heroImage} resizeMode="contain" />
                      ) : slide.iconName ? (
                        <View style={styles.heroIconWrap}>
                          <Ionicons name={slide.iconName} size={72} color="#fff" />
                        </View>
                      ) : null}
                    </View>
                  </LinearGradient>

                  <View style={styles.copyPanel}>
                    <Text style={[styles.slideEyebrow, { color: slide.accentColor }]}>
                      {slide.eyebrow}
                    </Text>
                    <Text style={[styles.slideTitle, { color: currentTheme.text }]}>
                      {slide.title}
                    </Text>
                    <Text style={[styles.slideDescription, { color: currentTheme.text }]}>
                      {slide.description}
                    </Text>

                    <View style={styles.pointsList}>
                      {slide.points.map((point) => (
                        <View key={point} style={styles.pointRow}>
                          <View
                            style={[styles.pointDot, { backgroundColor: slide.accentColor }]}
                          />
                          <Text style={[styles.pointText, { color: currentTheme.text }]}>
                            {point}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </View>
            ))}
          </Swiper>

          <View style={styles.footer}>
            <View style={styles.pagination}>
              {slides.map((slide, index) => (
                <View
                  key={`${slide.title}-${index}`}
                  style={[
                    styles.paginationDot,
                    {
                      width: currentIndex === index ? 28 : 8,
                      backgroundColor:
                        currentIndex === index ? activeSlide.accentColor : currentTheme.border,
                    },
                  ]}
                />
              ))}
            </View>

            {isLastSlide ? (
              <View style={[styles.footerButtons, isCompact && styles.footerButtonsCompact]}>
                <Pressable
                  style={[styles.secondaryButton, { borderColor: currentTheme.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.secondaryButtonText, { color: currentTheme.text }]}>
                    Continue as Guest
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: activeSlide.accentColor }]}
                  onPress={handleCreateAccount}
                >
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.footerButtons}>
                <Pressable
                  style={[styles.secondaryButton, { borderColor: currentTheme.border }]}
                  onPress={goToPrevious}
                  disabled={currentIndex === 0}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: currentTheme.text, opacity: currentIndex === 0 ? 0.4 : 1 },
                    ]}
                  >
                    Back
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: activeSlide.accentColor }]}
                  onPress={goToNext}
                >
                  <Text style={styles.primaryButtonText}>Next</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 10, 16, 0.7)',
  },
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  wrapperCompact: {
    padding: 0,
  },
  container: {
    borderWidth: 1,
    borderRadius: 34,
    overflow: 'hidden',
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  progressText: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.72,
    fontFamily: 'Parkinsans',
  },
  skipButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  slide: {
    flex: 1,
  },
  slideContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 20,
  },
  slideContentCompact: {
    flexDirection: 'column',
  },
  slideContentWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  heroPanel: {
    flex: 1,
    minHeight: 280,
    borderRadius: 28,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroMeta: {
    gap: 8,
  },
  heroEyebrow: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Parkinsans',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontFamily: 'Parkinsans',
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  heroVisual: {
    alignItems: 'flex-start',
  },
  heroImage: {
    width: 116,
    height: 116,
  },
  heroIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyPanel: {
    flex: 1.1,
    justifyContent: 'center',
  },
  slideEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: 'Parkinsans',
  },
  slideTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  slideDescription: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.86,
    fontFamily: 'Parkinsans',
  },
  pointsList: {
    marginTop: 22,
    gap: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  pointText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Parkinsans',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 18,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 999,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButtonsCompact: {
    flexDirection: 'column-reverse',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
});
