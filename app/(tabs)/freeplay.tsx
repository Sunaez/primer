// File: app/(tabs)/freeplay.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

const games = [
  { id: 'snap', title: 'Snap' },
  { id: 'reaction', title: 'Reaction Game' },
  { id: 'maths', title: 'Arithmetic Challenge' }, // Added the Maths game
];

export default function Freeplay() {
  const router = useRouter();

  const renderItem = ({ item }: { item: { id: string; title: string } }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: Colors.surface }]}
      onPress={() => router.push(`../games/${item.id}`)} // Navigate to the game's page
    >
      <Text style={[styles.text, { color: Colors.text }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Text style={[styles.header, { color: Colors.text }]}>Freeplay Games</Text>
      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
