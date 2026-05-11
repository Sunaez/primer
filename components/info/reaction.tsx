// /components/info/ReactionInfo.tsx
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

const ReactionInfo = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reaction Time</Text>
      <Text style={styles.content}>
        Reaction games measure how quickly you respond to a changing stimulus.
        More detailed research notes can be added here when the reaction game is
        finalised.
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
    lineHeight: 20,
  },
});

export default ReactionInfo;
