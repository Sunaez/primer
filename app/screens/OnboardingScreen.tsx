import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";

type Props = {
  navigation: StackNavigationProp<any>;
};

export default function OnboardingScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Welcome to the app! This is your Daily page where you'll see your tasks.",
    "You can explore games and challenges in the Games tab.",
    "Check your stats, streaks, and log in from the Profile page!",
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      navigation.replace("(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{steps[currentStep]}</Text>
      <Button title={currentStep === steps.length - 1 ? "Finish" : "Next"} onPress={handleNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
});
