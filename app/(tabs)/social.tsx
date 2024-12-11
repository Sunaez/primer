import { View, Text, StyleSheet } from 'react-native';

export default function SocialScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Social Page!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
