// /components/info/StroopInfo.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const StroopInfo = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Stroop Test</Text>
      <Text style={styles.content}>
        The Stroop test is widely used to train selective attention and cognitive flexibility. In a study involving 71 primary school children (ages 10–11), participants were divided into three groups: a Games Console group, a Brain Gym group, and a Control group.
      </Text>
      <Text style={styles.content}>
        The Games Console group played Dr. Kawashima’s Brain Training Game, which features the Stroop test as one of its challenges. The test requires identifying the font color of words when the text itself may name a different color, thereby training the ability to manage conflicting information.
      </Text>
      <Text style={styles.content}>
        More detailed analysis on the Stroop test’s individual impact will be provided in future updates.
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

export default StroopInfo;
