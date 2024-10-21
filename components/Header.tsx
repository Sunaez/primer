import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '@styles/colors';

const Header: React.FC = () => {
  return (
    <View style={styles.header}>
      <Image source={require('../assets/logo/pi.png')} style={styles.appIcon} />
      <View style={styles.stats}>
        <Text style={styles.statItem}>Coins: 100</Text>
        <Text style={styles.statItem}>Streak: 5</Text>
        <Text style={styles.statItem}>Credits: 50</Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  
  header: {
    backgroundColor: colors.background900,
    padding: 15,
    height: '10%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent300,
},
appIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
},
stats: {
    flexDirection: 'row',
    marginLeft: 15,
},
statItem: {
    color: colors.text300,
    fontSize: 16,
    marginLeft: 15,
}
})
export default Header;
