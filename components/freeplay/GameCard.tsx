import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@styles/colors';

const GameCard: React.FC<{ title: string }> = ({ title }) => {
  return (
    <View style={styles.gameCard}>
    </View>
  );
};
const styles = StyleSheet.create({
  gameCard: {
    borderRadius: 20,
    width: '40%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent500,
    borderColor: colors.accent300,
    borderWidth: 2,
},
gameCardText: {
    fontSize: 18,
    color: colors.text300,
}
})
export default GameCard;
