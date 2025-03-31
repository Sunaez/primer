// /components/social/activity/ActivityModal.tsx
import React from 'react';
import { View, Text, FlatList, Modal, Button, StyleSheet } from 'react-native';

const dummyActivities = [
  { id: 'a1', text: 'Alice achieved a new high score in Maths!', isRead: false, reactions: { like: 3 } },
  { id: 'a2', text: 'Bob just beat his personal record in Reaction Game.', isRead: true, reactions: { like: 1 } },
  { id: 'a3', text: 'Charlie set a new record in Pair Match.', isRead: false, reactions: { like: 2 } },
];

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ visible, onClose, currentTheme }) => {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
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
        <Button title="Close" onPress={onClose} color={currentTheme.primary} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    fontFamily: 'Parkinsans',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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

export default ActivityModal;
