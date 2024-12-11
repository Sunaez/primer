import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/app/_layout';

export default function ProfileScreen() {
  const { colorScheme, setColorScheme, customColors, setCustomColors } = useTheme();

  const handleColorChange = (color: string, key: keyof typeof customColors) => {
    setCustomColors((prev) => ({ ...prev, [key]: color }));
  };

  return (
    <View style={[styles.container, { backgroundColor: customColors.background || '#2E3440' }]}>
      <Text style={[styles.text, { color: customColors.text || '#D8DEE9' }]}>Profile Settings</Text>

      {/* Theme Selector */}
      <Text style={styles.label}>Theme:</Text>
      <Picker
        selectedValue={colorScheme}
        onValueChange={(value: 'light' | 'dark') => setColorScheme(value)}
        style={styles.picker}
      >
        <Picker.Item label="Light Mode" value="light" />
        <Picker.Item label="Dark Mode" value="dark" />
      </Picker>

      {/* Color Customization */}
      <Text style={styles.label}>Customize Colors:</Text>
      <TextInput
        placeholder="Primary Color"
        style={styles.input}
        onChangeText={(text) => handleColorChange(text, 'primary')}
        value={customColors.primary || ''}
      />
      <TextInput
        placeholder="Background Color"
        style={styles.input}
        onChangeText={(text) => handleColorChange(text, 'background')}
        value={customColors.background || ''}
      />
      <TextInput
        placeholder="Text Color"
        style={styles.input}
        onChangeText={(text) => handleColorChange(text, 'text')}
        value={customColors.text || ''}
      />

      <Button title="Reset to Default" onPress={() => setCustomColors({})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    marginVertical: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
