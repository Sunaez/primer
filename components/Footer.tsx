import React from 'react';
import { View, Image, TouchableOpacity,StyleSheet,Text, Pressable } from 'react-native';
import { colors } from '@styles/colors';

const Footer: React.FC = () => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.footerIcon}>
        <Image
        style={styles.image}
        source={require('../assets/logo/pi.png')}/>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerIcon}>
        <Image  style={styles.image} source={require('../assets/logo/pi.png')} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerIcon}>
        <Image style={styles.image} source={require('../assets/logo/pi.png')} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerIcon}>
        <Image style={styles.image} source={require('../assets/logo/pi.png')} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    height: 50,
    width: 50,
  },
      footer: {
    backgroundColor: colors.background900,
    height: '10%',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.accent300,
},
footerIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}
})

export default Footer;
