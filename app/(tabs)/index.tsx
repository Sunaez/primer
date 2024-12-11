import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function DailyScreen() {
  const router = useRouter();

  // Example daily challenge (can be dynamically updated in the future)
  const dailyChallenge = { id: 'memory', name: "Today's Challenge: Memory Game" };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Challenge</Text>
      <View style={styles.challengeCard}>
        <Text style={styles.challengeTitle}>{dailyChallenge.name}</Text>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => router.push(`../games/${dailyChallenge.id}`)}
        >
          <Text style={styles.playButtonText}>Play Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  challengeCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
