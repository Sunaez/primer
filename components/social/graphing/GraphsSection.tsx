import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import LineChart, { FriendLine } from './LineChart';
import BarChart from './BarChart';

interface GraphsSectionProps {
  currentTheme: any;
  selectedGame: string;
  graphsColumnWidth: number;
}

const numericOptions = [1, 7, 14, 21, 30] as const;
const unitOptions = ['Day(s)', 'Week(s)', 'Month(s)'] as const;

export default function GraphsSection({
  currentTheme,
  selectedGame,
  graphsColumnWidth,
}: GraphsSectionProps) {
  const today = new Date();
  const rawDates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - i));
    return date;
  });

  const rawLineLabels = rawDates.map(
    (date) => `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
  );

  const friendLines: FriendLine[] = [
    {
      friendName: 'Alice',
      color: '#FF4081',
      scores: Array.from({ length: 30 }, () => Math.round(Math.random() * 100)),
    },
    {
      friendName: 'Bob',
      color: '#7C4DFF',
      scores: Array.from({ length: 30 }, () => Math.round(Math.random() * 100)),
    },
    {
      friendName: 'Charlie',
      scores: Array.from({ length: 30 }, () => Math.round(Math.random() * 100)),
    },
  ];

  const [rangeNumber, setRangeNumber] = useState<number>(30);
  const [rangeUnit, setRangeUnit] = useState<string>('Day(s)');
  const [allTime, setAllTime] = useState<boolean>(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownProgress = useSharedValue(0);
  const MAX_DROPDOWN_HEIGHT = 180;

  const toggleDropdown = () => {
    dropdownProgress.value = withTiming(dropdownOpen ? 0 : 1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    setDropdownOpen(!dropdownOpen);
  };

  const dropdownStyle = useAnimatedStyle(() => ({
    height: dropdownProgress.value * MAX_DROPDOWN_HEIGHT,
    opacity: dropdownProgress.value,
  }));

  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(29);

  const onApply = () => {
    dropdownProgress.value = withTiming(0);
    setDropdownOpen(false);
    setAllTime(false);

    const days =
      rangeUnit === 'Day(s)'
        ? rangeNumber
        : rangeUnit === 'Week(s)'
        ? rangeNumber * 7
        : rangeNumber * 30;

    const fromIndex = Math.max(0, 30 - days);
    setStartIndex(fromIndex);
    setEndIndex(29);
  };

  const onAllTime = () => {
    setAllTime(true);
    setStartIndex(0);
    setEndIndex(29);
    dropdownProgress.value = withTiming(0);
    setDropdownOpen(false);
  };

  const subLabels = rawLineLabels.slice(startIndex, endIndex + 1);
  const subLines = friendLines.map((ln) => ({
    ...ln,
    scores: ln.scores.slice(startIndex, endIndex + 1),
  }));

  return (
    <View style={[styles.container, { width: graphsColumnWidth }]}>
      <View style={styles.chartWrapper}>
        <TouchableOpacity
          style={[styles.changeViewButton, { backgroundColor: currentTheme.card }]}
          onPress={toggleDropdown}
        >
          <Text style={[styles.fontStyle, { color: currentTheme.text }]}>
            Change View
          </Text>
          <Ionicons
            name={dropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={18}
            color={currentTheme.text}
          />
        </TouchableOpacity>

        <Animated.View style={[styles.dropdownContainer, { backgroundColor: currentTheme.surface }, dropdownStyle]}>
          <View style={styles.dropdownRow}>
            {numericOptions.map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.dropdownItem,
                  { backgroundColor: val === rangeNumber ? currentTheme.primary : 'transparent' },
                ]}
                onPress={() => setRangeNumber(val)}
              >
                <Text style={[styles.fontStyle, { color: val === rangeNumber ? currentTheme.background : currentTheme.text }]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dropdownRow}>
            {unitOptions.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.dropdownItem,
                  { backgroundColor: unit === rangeUnit ? currentTheme.primary : 'transparent' },
                ]}
                onPress={() => setRangeUnit(unit)}
              >
                <Text style={[styles.fontStyle, { color: unit === rangeUnit ? currentTheme.background : currentTheme.text }]}>
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.applyButton, { backgroundColor: currentTheme.primary }]} onPress={onApply}>
              <Text style={[styles.fontStyle, { color: currentTheme.background }]}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.applyButton, { backgroundColor: currentTheme.card }]} onPress={onAllTime}>
              <Text style={[styles.fontStyle, { color: currentTheme.text }]}>All Time</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <LineChart
          labels={subLabels}
          lines={subLines}
          width={graphsColumnWidth - 32}
          height={220}
          currentTheme={currentTheme}
          fontFamily="Parkisans"
        />
        <Text style={[styles.chartTitle, styles.fontStyle, { color: currentTheme.text }]}>
          {allTime ? 'All Time' : `From ${subLabels[0]} to ${subLabels[subLabels.length - 1]}`}
        </Text>
      </View>

      <View style={styles.chartWrapper}>
        <BarChart
          data={[
            { friendName: 'Alice', score: 42 },
            { friendName: 'Bob', score: 57 },
            { friendName: 'Charlie', score: 75 },
          ]}
          labels={['Alice', 'Bob', 'Charlie']}
          width={graphsColumnWidth - 32}
          height={200}
          currentTheme={currentTheme}
        />
        <Text style={[styles.chartTitle, styles.fontStyle, { color: currentTheme.text }]}>
          Today's Scores
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  chartWrapper: { marginBottom: 32 },
  chartTitle: { marginTop: 8, fontSize: 16, fontWeight: 'bold' },
  changeViewButton: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderRadius: 6, marginBottom: 8 },
  dropdownContainer: { overflow: 'hidden', borderRadius: 6, marginBottom: 12 },
  dropdownRow: { flexDirection: 'row', padding: 8 },
  dropdownItem: { padding: 8, borderRadius: 6, marginRight: 8 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8 },
  applyButton: { padding: 8, borderRadius: 6, marginLeft: 8 },
  fontStyle: { fontFamily: 'Parkisans', fontSize: 14 },
});
