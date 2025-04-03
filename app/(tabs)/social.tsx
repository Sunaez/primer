// app/(tabs)/social.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';
import { GAMES } from '@/constants/games'; // your array of games
import Ionicons from '@expo/vector-icons/Ionicons';
import { auth } from '@/components/firebaseConfig';

import ActivityModal from '../../components/social/activity/ActivityModal';
import ActivityColumn from '../../components/social/activity/ActivityColumn';
import GraphsSection from '../../components/social/graphing/GraphsSection';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import { PanGestureHandler } from 'react-native-gesture-handler';

export default function Social() {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  // Window-based layout
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const navWidth = 256;
  const desktopAvailableWidth = windowWidth - navWidth;

  // ========== Collapsible Activity Column State ==========
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const handleWidth = 32; // the pressable bar
  const leftColumnWidth = activityCollapsed ? 0 : desktopAvailableWidth / 3;
  const rightColumnWidth = desktopAvailableWidth - leftColumnWidth - handleWidth;

  // We'll rotate an Ionicon from 0 -> 180 deg based on collapsed
  const iconRotation = useSharedValue(activityCollapsed ? 180 : 0);

  useEffect(() => {
    iconRotation.value = withTiming(activityCollapsed ? 180 : 0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [activityCollapsed]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  // ========== Mobile Activity Modal ==========
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  // Mobile-only icon
  const ActivityIcon = () => (
    <View style={styles.activityIcon}>
      <Ionicons
        name="notifications-outline"
        size={28}
        color={currentTheme.primary}
        onPress={() => setActivityModalVisible(true)}
      />
    </View>
  );

  // ========== Game Selection (Animated Dropdown) ==========
  const [selectedGame, setSelectedGame] = useState<string>('snap'); // default
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownProgress = useSharedValue(0);
  const MAX_DROPDOWN_HEIGHT = 200;

  const toggleDropdown = () => {
    if (!dropdownOpen) {
      // open
      dropdownProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      setDropdownOpen(true);
    } else {
      // close
      dropdownProgress.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      setDropdownOpen(false);
    }
  };

  const dropdownStyle = useAnimatedStyle(() => {
    const h = dropdownProgress.value * MAX_DROPDOWN_HEIGHT;
    return {
      height: h,
      opacity: dropdownProgress.value,
    };
  });

  const onSelectGame = (id: string) => {
    setSelectedGame(id);
    // close the dropdown
    dropdownProgress.value = withTiming(0);
    setDropdownOpen(false);
  };

  // ========== Render ==========

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {isMobile ? (
        // =============== MOBILE LAYOUT ===============
        <>
          <ActivityIcon />

          {/* Animated game selection dropdown */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.selectedGameButton,
                { backgroundColor: currentTheme.card },
              ]}
              onPress={toggleDropdown}
            >
              <Text style={{ color: currentTheme.text }}>
                {GAMES.find((g) => g.id === selectedGame)?.title || 'Select Game'}
              </Text>
              <Ionicons
                name={dropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={18}
                color={currentTheme.text}
              />
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.dropdownList,
                { backgroundColor: currentTheme.surface },
                dropdownStyle,
              ]}
            >
              {GAMES.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={styles.dropdownItem}
                  onPress={() => onSelectGame(game.id)}
                >
                  <Text
                    style={{
                      color:
                        game.id === selectedGame
                          ? currentTheme.primary
                          : currentTheme.text,
                    }}
                  >
                    {game.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>

          <GraphsSection
            currentTheme={currentTheme}
            selectedGame={selectedGame}
            graphsColumnWidth={windowWidth}
            currentUid={auth.currentUser?.uid || ''}
          />

          <ActivityModal
            visible={activityModalVisible}
            onClose={() => setActivityModalVisible(false)}
            currentTheme={currentTheme}
          />
        </>
      ) : (
        // =============== DESKTOP LAYOUT ===============
        <View style={styles.desktopContainer}>
          {/* Left column: Activity */}
          <View style={[styles.activityColumn, { width: leftColumnWidth }]}>
            {/* Only render if not collapsed */}
            {!activityCollapsed && (
              <ActivityColumn currentTheme={currentTheme} width={leftColumnWidth} />
            )}
          </View>

          {/* Pressable bar to collapse/expand the Activity */}
          <TouchableOpacity
            style={[
              styles.handleArea,
              { width: handleWidth, backgroundColor: currentTheme.card },
            ]}
            onPress={() => setActivityCollapsed(!activityCollapsed)}
            activeOpacity={0.7}
          >
            <Animated.View style={iconStyle}>
              <Ionicons name="chevron-back-outline" size={22} color={currentTheme.text} />
            </Animated.View>
          </TouchableOpacity>

          {/* Right column => dropdown + graphs */}
          <View style={{ width: rightColumnWidth }}>
            {/* Dropdown for game selection */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.selectedGameButton,
                  { backgroundColor: currentTheme.card },
                ]}
                onPress={toggleDropdown}
              >
                <Text style={{ color: currentTheme.text }}>
                  {GAMES.find((g) => g.id === selectedGame)?.title || 'Select Game'}
                </Text>
                <Ionicons
                  name={dropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                  color={currentTheme.text}
                />
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.dropdownList,
                  { backgroundColor: currentTheme.surface },
                  dropdownStyle,
                ]}
              >
                {GAMES.map((game) => (
                  <TouchableOpacity
                    key={game.id}
                    style={styles.dropdownItem}
                    onPress={() => onSelectGame(game.id)}
                  >
                    <Text
                      style={{
                        color:
                          game.id === selectedGame
                            ? currentTheme.primary
                            : currentTheme.text,
                      }}
                    >
                      {game.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>

            <GraphsSection
              currentTheme={currentTheme}
              selectedGame={selectedGame}
              graphsColumnWidth={rightColumnWidth}
              currentUid={auth.currentUser?.uid || ''}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ========== Styles ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  activityColumn: {
    height: '100%',
    overflow: 'hidden',
  },
  handleArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  dropdownContainer: {
    margin: 16,
    zIndex: 100,
  },
  selectedGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  dropdownList: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
