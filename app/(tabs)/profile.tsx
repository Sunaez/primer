import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import Colors from '@/constants/Colors';

export default function Profile() {
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Card style={styles.card}>
        <Image
          source={require('@/assets/images/shrug_emoji.png')}
          style={styles.image}
        />
        <Card.Content>
          <Text style={[styles.text, { color: Colors.text }]}>
            Nothing here yet :/
          </Text>
        </Card.Content>
      </Card>
      <IconButton icon="cog" size={24} onPress={() => {}} />
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
    fontFamily: 'Parkinsans', // Apply correct font
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
});
