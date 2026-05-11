import React from 'react';
import { Modal, StyleSheet, useWindowDimensions, View, Pressable, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import ActivityColumn from './ActivityColumn';

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
}

export default function ActivityModal({
  visible,
  onClose,
  currentTheme,
}: ActivityModalProps) {
  const { width } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              width: Math.min(width - 24, 720),
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border || currentTheme.divider,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Activity</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={currentTheme.text} />
            </Pressable>
          </View>
          <ActivityColumn currentTheme={currentTheme} width={Math.max(width - 64, 280)} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 16, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  sheet: {
    maxHeight: '88%',
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
