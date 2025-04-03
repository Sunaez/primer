// /components/social/activity/ActivityColumn.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ActivityColumnProps {
  currentTheme: any;
  width: number;
}

const ActivityColumn: React.FC<ActivityColumnProps> = ({ currentTheme, width }) => {
  return (
    <View style={[styles.container, { width, backgroundColor: currentTheme.background }]}>
      <Text style={[styles.header, { color: currentTheme.text }]}>
        Activity (Work In Progress)
      </Text>
      <Text style={[styles.message, { color: currentTheme.text }]}>
        This page is under construction. In the final version, you’ll see:
        {'\n'}• Updates on friends’ new scores
        {'\n'}• Alerts for incoming friend requests
        {'\n'}• Notifications when a friend beats your score in a game
        {'\n'}• Play milestones, such as number of plays
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#444',
  },
  header: {
    fontSize: 20,
    fontFamily: 'Parkinsans',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Parkinsans',
  },
});

export default ActivityColumn;
