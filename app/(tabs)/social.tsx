import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useThemeContext, useUserContext } from '@/context/UserContext';
import THEMES from '@/constants/themes';
import { GAMES } from '@/constants/games'; // your array of games
import Ionicons from '@expo/vector-icons/Ionicons';
import ActivityModal from '../../components/social/activity/ActivityModal';
import ActivityColumn from '../../components/social/activity/ActivityColumn';
import GraphsSection from '../../components/social/graphing/GraphsSection';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { auth } from '@/components/firebaseConfig';
import { PanGestureHandler } from 'react-native-gesture-handler';

const Social = () => {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;
  const { user } = useUserContext();

  // Fallback UI if no user is logged in.
  if (!user) {
    return (
      <View
        style={[
          styles.fallbackContainer,
          {
            backgroundColor: currentTheme.background,
            borderColor: currentTheme.border,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/shrug_emoji.png")}
          style={styles.fallbackImage}
          resizeMode="contain"
        />
        <Text style={[styles.fallbackText, { color: currentTheme.text }]}>
          You gotta be logged in for this one bro
        </Text>
      </View>
    );
  }

  // Window-based layout
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const navWidth = 256;
  const desktopAvailableWidth = windowWidth - navWidth;

  // Collapsible Activity Column State (Desktop)
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const handleWidth = 32;
  const leftColumnWidth = activityCollapsed ? 0 : desktopAvailableWidth / 3;
  const rightColumnWidth = desktopAvailableWidth - leftColumnWidth - handleWidth;

  // Rotate an Ionicon based on whether the activity column is collapsed.
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

  // Mobile Activity Modal
  const [activityModalVisible, setActivityModalVisible] = useState(false);
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

  // Game Selection Dropdown (Animated)
  const [selectedGame, setSelectedGame] = useState<string>('snap');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownProgress = useSharedValue(0);
  const MAX_DROPDOWN_HEIGHT = 200;
  const toggleDropdown = () => {
    if (!dropdownOpen) {
      dropdownProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      setDropdownOpen(true);
    } else {
      dropdownProgress.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      setDropdownOpen(false);
    }
  };
  const dropdownStyle = useAnimatedStyle(() => {
    const h = dropdownProgress.value * MAX_DROPDOWN_HEIGHT;
    return { height: h, opacity: dropdownProgress.value };
  });
  const onSelectGame = (id: string) => {
    setSelectedGame(id);
    dropdownProgress.value = withTiming(0);
    setDropdownOpen(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {isMobile ? (
        <>
          <ActivityIcon />
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.selectedGameButton,
                {
                  backgroundColor: currentTheme.card,
                  borderColor: currentTheme.border,
                  borderWidth: 1,
                },
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
                  style={[
                    styles.dropdownItem,
                    { borderBottomWidth: 1, borderBottomColor: currentTheme.divider },
                  ]}
                  onPress={() => onSelectGame(game.id)}
                >
                  <Text style={{ color: game.id === selectedGame ? currentTheme.primary : currentTheme.text }}>
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
        <View style={styles.desktopContainer}>
          <View
            style={[
              styles.activityColumn,
              { width: leftColumnWidth, borderRightWidth: 1, borderRightColor: currentTheme.divider },
            ]}
          >
            {!activityCollapsed && (
              <ActivityColumn currentTheme={currentTheme} width={leftColumnWidth} />
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.handleArea,
              {
                width: handleWidth,
                backgroundColor: currentTheme.card,
                borderLeftWidth: 1,
                borderLeftColor: currentTheme.divider,
              },
            ]}
            onPress={() => setActivityCollapsed(!activityCollapsed)}
            activeOpacity={0.7}
          >
            <Animated.View style={iconStyle}>
              <Ionicons name="chevron-back-outline" size={22} color={currentTheme.text} />
            </Animated.View>
          </TouchableOpacity>
          <View style={{ width: rightColumnWidth }}>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.selectedGameButton,
                  {
                    backgroundColor: currentTheme.card,
                    borderColor: currentTheme.border,
                    borderWidth: 1,
                  },
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
                    style={[
                      styles.dropdownItem,
                      { borderBottomWidth: 1, borderBottomColor: currentTheme.divider },
                    ]}
                    onPress={() => onSelectGame(game.id)}
                  >
                    <Text style={{ color: game.id === selectedGame ? currentTheme.primary : currentTheme.text }}>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
  },
  fallbackImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  fallbackText: {
    fontSize: 18,
    textAlign: 'center',
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

export default Social;
