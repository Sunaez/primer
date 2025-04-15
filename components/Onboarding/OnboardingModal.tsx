// /components/Onboarding/OnboardingModal.tsx
import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Image,
  useWindowDimensions,
} from 'react-native';
import Swiper from 'react-native-swiper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { useRouter } from 'expo-router';

type OnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
};

type SlideData = {
  title: string;
  bulletPoints: string[];
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  image?: any;
};

export default function OnboardingModal({ visible, onClose }: OnboardingModalProps) {
  // Use the user context to find the theme. Default to 'Dark' if none is found.
  const { themeName } = useThemeContext() || { themeName: 'Dark' };
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // We define the slides AFTER we have currentTheme.
  const slides: SlideData[] = [
    {
      title: 'Welcome to Primer',
      bulletPoints: [
        'Welcome to primer, the daily brain training game focused on keeping you away from brain rot (no 🧢).',
        "With all the screen time you spend, ain't no way your brain isn't cooked.",
        'Primer is best used a little each day! A little each day is always better than a lot in one go.',
      ],
      image: require('assets/images/logo.png'),
    },
    {
      title: 'Daily Challenges',
      bulletPoints: [
        'Each day you get two games which must be completed for the day to count as completed.',
        'Your scores are saved and you can track which activities you completed.',
        'Try not to get tired of winning! (I know some people are 💀).',
      ],
      iconName: 'home-sharp',
      iconColor: currentTheme.daily,
    },
    {
      title: 'Freeplay Games',
      bulletPoints: [
        'Choose literally any game to play as much as you like.',
        'Refine your score for that day and try your best to beat your scores.',
        'Each game has an explanation of how to play and a short video.',
      ],
      iconName: 'game-controller',
      iconColor: currentTheme.freeplay,
    },
    {
      title: 'Social Connections',
      bulletPoints: [
        'Life is better with friends (bro is not the quiet kid at the back).',
        'After completing tasks you get to compete against your friends.',
        'Get alerted when your friends beat your score.',
      ],
      iconName: 'chatbubbles',
      iconColor: currentTheme.social,
    },
    {
      title: 'Friends',
      bulletPoints: [
        '"Wait a second, I don’t have any friends yet" – that’s why this is here!',
        'Search and add friends to compete against them.',
        'Block anyone you feel is moving a bit sus.',
      ],
      iconName: 'people-circle',
      iconColor: currentTheme.friends,
    },
    {
      title: 'Profile',
      bulletPoints: [
        'Your app is you, so why can’t you customize it like your own?',
        'Pick from loads of different themes so you can choose what you like.',
        '(And if not, we can arrange more!)',
      ],
      iconName: 'person',
      iconColor: currentTheme.text,
    },
    {
      title: "That's it",
      bulletPoints: [
        'Okay, enough yapping. Make an account for all the features and get playing.',
        'You can be a guest, but it’s not as cool as having an account.',
        '(No really, make an account – it’s just way better.)',
      ],
      image: require('assets/images/okay_emoji.png'),
    },
  ];

  // Internal state / references
  const [currentIndex, setCurrentIndex] = useState(0);
  const swiperRef = useRef<Swiper>(null);
  const router = useRouter();

  // For arrow color, use the theme’s primary or a fallback.
  const arrowColor = currentTheme.primary || '#000';

  // We'll grab the window width to decide if it's "mobile" or not.
  const { width: screenWidth } = useWindowDimensions();
  // You can adjust this breakpoint to whatever you consider "mobile".
  const isMobile = screenWidth < 600;

  // Handlers
  const handleCreateAccount = () => {
    onClose();
    setTimeout(() => {
      router.push('/(tabs)/profile');
    }, 200);
  };

  const handleContinueAsGuest = () => {
    onClose();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      swiperRef.current?.scrollBy(-1);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      swiperRef.current?.scrollBy(1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalWrapper}>
        {/* Background overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        {/* Modal content */}
        <View style={styles.centerContainer}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
            {/* Row for left arrow, swiper content, and right arrow */}
            <View style={styles.rowContainer}>
              {/* Left Arrow */}
              <TouchableOpacity
                onPress={handlePrev}
                disabled={currentIndex === 0}
                style={[
                  styles.arrowContainer,
                  { opacity: currentIndex === 0 ? 0.5 : 1 },
                ]}
                accessibilityLabel="Previous Slide"
              >
                <Ionicons name="chevron-back" size={32} color={arrowColor} />
              </TouchableOpacity>

              {/* Swiper / Slides */}
              <View style={styles.contentContainer}>
                <Swiper
                  ref={swiperRef}
                  style={styles.wrapper}
                  loop={false}
                  scrollEnabled={false}
                  showsPagination={false}
                  onIndexChanged={setCurrentIndex}
                >
                  {slides.map((slide, idx) => {
                    const isLastSlide = idx === slides.length - 1;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.slide,
                          { backgroundColor: currentTheme.background },
                        ]}
                      >
                        {/* Icon or Image */}
                        {slide.image ? (
                          <Image
                            source={slide.image}
                            style={styles.slideImage}
                          />
                        ) : slide.iconName ? (
                          <Ionicons
                            name={slide.iconName}
                            size={64}
                            color={slide.iconColor || currentTheme.text}
                            style={styles.slideIcon}
                          />
                        ) : null}

                        {/* Title */}
                        <Text style={[styles.title, { color: currentTheme.primary }]}>
                          {slide.title}
                        </Text>

                        {/* Bullet points */}
                        {slide.bulletPoints.map((point, i) => (
                          <Text key={i} style={[styles.bulletText, { color: currentTheme.text }]}>
                            • {point}
                          </Text>
                        ))}

                        {/* Final slide buttons */}
                        {isLastSlide && (
                          <View
                            style={[
                              styles.buttonRow,
                              // On mobile, switch to a column layout.
                              isMobile ? styles.buttonRowMobile : null,
                            ]}
                          >
                            <TouchableOpacity
                              onPress={handleCreateAccount}
                              style={[
                                styles.finalButton,
                                { backgroundColor: currentTheme.primary },
                                isMobile ? { marginBottom: 12 } : null,
                              ]}
                            >
                              <Text style={styles.buttonText}>Create Account</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={handleContinueAsGuest}
                              style={[
                                styles.finalButton,
                                { backgroundColor: currentTheme.secondary || '#888' },
                              ]}
                            >
                              <Text style={styles.buttonText}>Continue as Guest</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </Swiper>
              </View>

              {/* Right Arrow */}
              <TouchableOpacity
                onPress={handleNext}
                style={styles.arrowContainer}
                accessibilityLabel={
                  currentIndex === slides.length - 1 ? 'Final Slide' : 'Next Slide'
                }
              >
                <Ionicons name="chevron-forward" size={32} color={arrowColor} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centerContainer: {
    width: '90%',
    maxHeight: '90%',
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  arrowContainer: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  slide: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slideIcon: {
    marginBottom: 20,
  },
  slideImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  bulletText: {
    fontSize: 18,
    textAlign: 'left',
    marginBottom: 8,
    width: '95%',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
    width: '100%',
  },
  buttonRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  finalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

