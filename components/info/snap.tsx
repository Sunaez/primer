// /components/info/SnapInfo.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SnapInfo = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>There is no information available yet.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default SnapInfo;
