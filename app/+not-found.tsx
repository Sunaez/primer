import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function NotFound() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.text}>
        This page doesn't exist!
      </Text>
      <Button mode="contained" onPress={() => router.push('/')}>
        Go Back
      </Button>
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
  text: {
    marginBottom: 16,
    textAlign: 'center',
  },
});
