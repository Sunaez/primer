import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import Swiper from 'react-native-swiper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { Text } from 'react-native';

const slides = [
  {
    title: 'Welcome to Primer',
    description: 'Discover daily challenges, freeplay games, and an amazing community.',
  },
  {
    title: 'Daily Challenges',
    description: 'Push your limits with new challenges every day.',
  },
  {
    title: 'Freeplay Games',
    description: 'Unwind with a variety of fun and engaging games.',
  },
  {
    title: 'Social Connections',
    description: 'Connect, chat, and build your community effortlessly.',
  },
];

type OnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function OnboardingModal({ visible, onClose }: OnboardingModalProps) {
  // Get theme; default to "Dark" if not defined.
  const { themeName } = useThemeContext() || { themeName: 'Dark' };
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  
  // Use primary as the arrow color to improve contrast.
  const arrowColor = currentTheme.primary || '#000';
  
  const swiperRef = useRef<Swiper>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleGetStarted = () => {
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
    } else {
      handleGetStarted();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={() => {}}>
        <View style={styles.centerContainer}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
            {/* Close Button at Top Center */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close Onboarding"
            >
              <Ionicons name="close" size={30} color={currentTheme.text} />
            </TouchableOpacity>
            {/* One-row layout: Left Arrow, Content, Right Arrow */}
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
              {/* Main Content */}
              <View style={styles.contentContainer}>
                <Swiper
                  ref={swiperRef}
                  style={styles.wrapper}
                  loop={false}
                  scrollEnabled={false}
                  onIndexChanged={(index) => setCurrentIndex(index)}
                  showsPagination={false}
                >
                  {slides.map((slide, index) => (
                    <View key={index} style={[styles.slide, { backgroundColor: currentTheme.background }]}>
                      <Text style={[styles.title, { color: currentTheme.primary }]}>{slide.title}</Text>
                      <Text style={[styles.text, { color: currentTheme.text }]}>{slide.description}</Text>
                    </View>
                  ))}
                </Swiper>
              </View>
              {/* Right Arrow */}
              <TouchableOpacity
                onPress={handleNext}
                style={styles.arrowContainer}
                accessibilityLabel={currentIndex === slides.length - 1 ? "Get Started" : "Next Slide"}
              >
                {currentIndex === slides.length - 1 ? (
                  <Text style={[styles.navButtonText, { color: arrowColor }]}>Get Started</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={32} color={arrowColor} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '90%',
    maxHeight: '90%',
  },
  // The modalContainer now fills its parent exactly.
  modalContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 40,
    // Shadows for iOS.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    // Elevation for Android.
    elevation: 8,
  },
  // Close Button positioned at top center.
  closeButton: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -15 }],
    zIndex: 10,
    padding: 6,
  },
  // Row container with explicit height.
  rowContainer: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  // Arrow containers with fixed width and full height.
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
});

export { OnboardingModal };
