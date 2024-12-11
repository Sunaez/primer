import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import Colors from '@/constants/Colors';

export default function Daily() {
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.text, { color: Colors.text }]}>
            Welcome to the Daily Page
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '90%',
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  text: {
    fontSize: 18,
    color: Colors.text,
  },
});
