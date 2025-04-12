// /components/info/ArithmeticInfo.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ArithmeticInfo = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Arithmetic Calculations</Text>
      <Text style={styles.content}>
        As part of the cognitive training study, the arithmetic component was designed to improve mental calculation skills. In this study, the Games Console group—playing Dr. Kawashima’s Brain Training Game—showed significant improvement in mathematical performance.
      </Text>
      <Text style={styles.content}>
        Their number challenge scores increased from an average of 76.19 (±21.04) to 86.38 (±10.14), and task completion times were reduced by almost 4 minutes compared to the other groups.
      </Text>
      <Text style={styles.content}>
        Additional research details and further metrics will be provided as more data becomes available.
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

export default ArithmeticInfo;
