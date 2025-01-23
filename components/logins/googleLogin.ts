import React from "react";
import { Alert } from "react-native";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/components/firebaseConfig";
import * as Google from "expo-auth-session/providers/google";

export const useGoogleLogin = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "109040540523-m5ali9551i5q4i62q53fhq37issf9t8m.apps.googleusercontent.com", // Your Web Client ID
    iosClientId: "109040540523-m5ali9551i5q4i62q53fhq37issf9t8m.apps.googleusercontent.com", // Use same Web Client ID for testing on iOS
    androidClientId: "109040540523-m5ali9551i5q4i62q53fhq37issf9t8m.apps.googleusercontent.com", // Use same Web Client ID for testing on Android
    webClientId: "109040540523-m5ali9551i5q4i62q53fhq37issf9t8m.apps.googleusercontent.com", // Your Web Client ID
    redirectUri: "https://auth.expo.io/@Sunaez/primer420awesome", // Correct redirect URI
  });

  // Handle the response in a reusable function
  const handleGoogleLogin = React.useCallback(() => {
    if (response?.type === "success" && response.params.id_token) {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(() => {
          Alert.alert("Success", "You are logged in with Google!");
        })
        .catch((error) => {
          Alert.alert("Error", error.message);
        });
    }
  }, [response]);

  React.useEffect(() => {
    handleGoogleLogin();
  }, [response]);

  return { request, promptAsync };
};
