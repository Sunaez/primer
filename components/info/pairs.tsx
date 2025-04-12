// /components/info/QuickPairInfo.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const QuickPairInfo = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quick Pair Match</Text>
      <Text style={styles.content}>
        This activity is inspired by research focusing on a group of 126 older individuals, aged between 62 and 94 years (average age 76). The study involved 79 females and 47 males, all physically fit to participate.
      </Text>
      <Text style={styles.content}>
        The participants were split equally into two groups. One group received basic internet training (acting as the control), while the other underwent Speed of Processing training. The training used a variety of tasks—both central and peripheral—to enhance reaction speed.
      </Text>
      <Text style={styles.content}>
        Training sessions consisted of 10 one‑hour sessions over a 5‑week period. Notably, the Speed Training group improved their reaction time from 1093 ms (±218 ms) to 669 ms (±213 ms), approximately a 38% improvement. A key training feature was reducing the display time (from 500 ms down to as low as 17 ms) once a 75% accuracy was attained.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  content: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
});

export default QuickPairInfo;
