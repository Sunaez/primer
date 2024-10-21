import React from 'react';
import { StyleSheet, View } from 'react-native';
import Header from '@components/Header';
import GameCard from '@components/freeplay/GameCard';
import Footer from '@components/Footer';

export default function Page() {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.main}>
        <GameCard title="Game 1" />
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c313a',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
