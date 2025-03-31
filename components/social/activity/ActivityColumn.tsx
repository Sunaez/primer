// /components/social/activity/ActivityColumn.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const dummyActivities = [
  { id: 'a1', text: 'Alice achieved a new high score in Maths!', isRead: false, reactions: { like: 3 } },
  { id: 'a2', text: 'Bob just beat his personal record in Reaction Game.', isRead: true, reactions: { like: 1 } },
  { id: 'a3', text: 'Charlie set a new record in Pair Match.', isRead: false, reactions: { like: 2 } },
];

interface ActivityColumnProps {
  currentTheme: any;
  width: number;
}

const ActivityColumn: React.FC<ActivityColumnProps> = ({ currentTheme, width }) => {
  return (
    <View style={[styles.container, { width, backgroundColor: currentTheme.background }]}>
      <Text style={[styles.header, { color: currentTheme.text }]}>Activity</Text>
      <FlatList
        data={dummyActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: currentTheme.surface }]}>
            <View style={[styles.readIndicator, { backgroundColor: item.isRead ? currentTheme.divider : currentTheme.selection }]} />
            <Text style={[styles.itemText, { color: currentTheme.text }]}>{item.text}</Text>
            <Text style={[styles.reactions, { color: currentTheme.secondary }]}>👍 {item.reactions.like}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: currentTheme.text }}>No recent activity.</Text>}
      />
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
    borderRadius: 6,
  },
  readIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Parkinsans',
  },
  reactions: {
    fontSize: 12,
    fontFamily: 'Parkinsans',
    marginLeft: 8,
  },
});

export default ActivityColumn;
