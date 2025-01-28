import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

const games = [
  { id: 'snap', title: 'Snap' },
  { id: 'reaction', title: 'Reaction Game' },
  { id: 'maths', title: 'Maths Challenge' },
  { id: 'PairMatch', title: 'Quick Pair Match' }, // Added Pair Match
];

export default function Freeplay() {
  const router = useRouter();

  const renderItem = ({ item }: { item: { id: string; title: string } }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: Colors.surface }]}
      onPress={() => router.push(`/games/${item.id}`)}
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
    fontFamily: 'Parkinsans', // Apply correct font
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  text: {
    fontSize: 18,
    fontFamily: 'Parkinsans', // Apply correct font
  },
});
