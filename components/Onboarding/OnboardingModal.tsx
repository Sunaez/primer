// /components/Onboarding/OnboardingModal.tsx
import React, { useState, useRef } from 'react';
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
  const { themeName } = useThemeContext() || { themeName: 'Dark' };
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Slide Data
  const slides: SlideData[] = [
    {
      title: 'Welcome to Primer',
      bulletPoints: [
        'Welcome to Primer, the daily brain training game to keep you sharp.',
        "Don't let too much screen time fry your brain.",
        'Small daily sessions are the key!',
      ],
      image: require('assets/images/logo.png'),
    },
    {
      title: 'Daily Challenges',
      bulletPoints: [
        'Complete two games every day to mark your progress.',
        'Your scores are tracked automatically.',
        'Keep your momentum going!',
      ],
      iconName: 'home-sharp',
      iconColor: currentTheme.daily,
    },
    {
      title: 'Freeplay Games',
      bulletPoints: [
        'Play any game to your heart’s content.',
        'Try to beat your best scores.',
        'Learn with quick videos and instructions.',
      ],
      iconName: 'game-controller',
      iconColor: currentTheme.freeplay,
    },
    {
      title: 'Social Connections',
      bulletPoints: [
        'Connect with friends and challenge them.',
        'Receive alerts when your friends beat your scores.',
      ],
      iconName: 'chatbubbles',
      iconColor: currentTheme.social,
    },
    {
      title: 'Friends',
      bulletPoints: [
        'Build your social circle – add and compete with friends.',
        'Block users who aren’t a good fit.',
      ],
      iconName: 'people-circle',
      iconColor: currentTheme.friends,
    },
    {
      title: 'Profile',
      bulletPoints: [
        'Customize your profile with your favorite themes.',
        'Express yourself with various theme options.',
      ],
      iconName: 'person',
      iconColor: currentTheme.text,
    },
    {
      title: "That's it",
      bulletPoints: [
        'Create an account to unlock full features.',
        'Guest mode is available, but an account is best!',
      ],
      image: require('assets/images/okay_emoji.png'),
    },
  ];

  // State & Refs
  const [currentIndex, setCurrentIndex] = useState(0);
  const swiperRef = useRef<Swiper>(null);
  const router = useRouter();

  // Layout Settings
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isMobile = screenWidth < 600;
  const modalWidth = isMobile ? screenWidth : screenWidth * 0.9;
  // On mobile, fill the screen vertically; on desktop, use maxHeight constraint.
  const modalHeight = isMobile ? screenHeight : undefined;
  const arrowWidth = isMobile ? 0 : 50;
  const swiperWidth = modalWidth - arrowWidth * 2;

  // Handlers
  const handleCreateAccount = () => {
    console.log('Create Account Pressed');
    onClose();
    setTimeout(() => {
      router.push('/(tabs)/profile');
    }, 200);
  };

  const handleContinueAsGuest = () => {
    console.log('Continue as Guest Pressed');
    onClose();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      console.log('Prev Pressed, currentIndex:', currentIndex);
      swiperRef.current?.scrollBy(-1, true);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      console.log('Next Pressed, currentIndex:', currentIndex);
      swiperRef.current?.scrollBy(1, true);
    } else {
      console.log('Already at the last slide.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
    >
      {/* Background overlay */}
      <Pressable onPress={onClose} style={styles.overlay} />

      {/* Modal Wrapper */}
      <View style={[styles.modalWrapper, isMobile && { padding: 0 }]}>
        <View
          style={[
            styles.modalContainer,
            { width: modalWidth, backgroundColor: currentTheme.background },
            modalHeight ? { height: modalHeight } : {},
          ]}
        >
          <View style={styles.contentWrapper}>
            {/* Left Arrow for desktop */}
            {!isMobile && (
              <Pressable
                onPress={handlePrev}
                disabled={currentIndex === 0}
                style={({ pressed }) => [
                  styles.arrowContainer,
                  { width: arrowWidth, opacity: currentIndex === 0 ? 0.5 : 1 },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Previous Slide"
              >
                <Ionicons name="chevron-back" size={32} color={currentTheme.primary || '#000'} />
              </Pressable>
            )}
            {/* Swiper Container */}
            <View style={[styles.swiperContainer, { width: isMobile ? modalWidth : swiperWidth }]}>
              <Swiper
                ref={swiperRef}
                index={currentIndex}
                loop={false}
                showsPagination={!isMobile}
                scrollEnabled={isMobile}
                containerStyle={{ width: isMobile ? modalWidth : swiperWidth }}
                onIndexChanged={(index) => {
                  console.log('onIndexChanged:', index);
                  setCurrentIndex(index);
                }}
              >
                {slides.map((slide, idx) => {
                  const isLastSlide = idx === slides.length - 1;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.slide,
                        {
                          width: isMobile ? modalWidth : swiperWidth,
                          backgroundColor: currentTheme.background,
                        },
                      ]}
                    >
                      {/*
                        On desktop, wrap the content in a ScrollView so that the vertical content
                        is contained within the modal’s constraints.
                      */}
                      {!isMobile ? (
                        <ScrollView contentContainerStyle={styles.slideContent}>
                          {slide.image ? (
                            <Image source={slide.image} style={styles.slideImage} />
                          ) : slide.iconName ? (
                            <Ionicons
                              name={slide.iconName}
                              size={64}
                              color={slide.iconColor || currentTheme.text}
                              style={styles.slideIcon}
                            />
                          ) : null}
                          <Text style={[styles.title, { color: currentTheme.primary }]}>{slide.title}</Text>
                          {slide.bulletPoints.map((point, i) => (
                            <Text key={i} style={[styles.bulletText, { color: currentTheme.text }]}>
                              • {point}
                            </Text>
                          ))}
                          {/* For desktop, no swipe instruction */}
                        </ScrollView>
                      ) : (
                        <>
                          {slide.image ? (
                            <Image source={slide.image} style={styles.slideImage} />
                          ) : slide.iconName ? (
                            <Ionicons
                              name={slide.iconName}
                              size={64}
                              color={slide.iconColor || currentTheme.text}
                              style={styles.slideIcon}
                            />
                          ) : null}
                          <Text style={[styles.title, { color: currentTheme.primary }]}>{slide.title}</Text>
                          {slide.bulletPoints.map((point, i) => (
                            <Text key={i} style={[styles.bulletText, { color: currentTheme.text }]}>
                              • {point}
                            </Text>
                          ))}
                          {/* Swipe Instruction on Mobile */}
                          {isMobile && !isLastSlide && (
                            <View style={styles.swipeInstruction}>
                              <Image source={require('assets/images/swipe.gif')} style={styles.swipeImage} />
                              <Text style={styles.swipeText}>Swipe to Continue</Text>
                            </View>
                          )}
                        </>
                      )}

                      {/* Final Slide Buttons */}
                      {isLastSlide && (
                        <View style={[styles.buttonRow, isMobile && styles.buttonRowMobile]}>
                          <Pressable
                            onPress={handleCreateAccount}
                            style={({ pressed }) => [
                              styles.finalButton,
                              { backgroundColor: currentTheme.primary },
                              pressed && styles.pressed,
                            ]}
                            accessibilityLabel="Create Account"
                          >
                            <Text style={styles.buttonText}>Create Account</Text>
                          </Pressable>
                          <Pressable
                            onPress={handleContinueAsGuest}
                            style={({ pressed }) => [
                              styles.finalButton,
                              { backgroundColor: currentTheme.secondary || '#888' },
                              pressed && styles.pressed,
                            ]}
                            accessibilityLabel="Continue as Guest"
                          >
                            <Text style={styles.buttonText}>Continue as Guest</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </Swiper>
            </View>
            {/* Right Arrow for desktop */}
            {!isMobile && (
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [
                  styles.arrowContainer,
                  { width: arrowWidth },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Next Slide"
              >
                <Ionicons name="chevron-forward" size={32} color={currentTheme.primary || '#000'} />
              </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 15,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: '#fff',
    maxHeight: '90%',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // For desktop slides, the ScrollView content container
  slideContent: {
    flexGrow: 1,
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
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  bulletText: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  swipeInstruction: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  swipeText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
    width: '100%',
  },
  buttonRowMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  finalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
