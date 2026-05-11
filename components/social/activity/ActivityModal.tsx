// /components/social/activity/ActivityModal.tsx
import React from 'react';
import { Button, Modal, StyleSheet, useWindowDimensions, View } from 'react-native';

import ActivityColumn from './ActivityColumn';

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ visible, onClose, currentTheme }) => {
  const { width } = useWindowDimensions();

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <ActivityColumn currentTheme={currentTheme} width={Math.max(width - 32, 280)} />
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
});

export default ActivityModal;
