// /context/UserContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '@/components/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import THEMES from '@/constants/themes';

export type ThemeName = keyof typeof THEMES;

export interface Friends {
  friends: string[];
  friendRequests: string[];
  blocked: string[];
}

export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string | null;
  theme: ThemeName;
  bannerColor: string;
  friends: Friends;
}

interface UserContextValue {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  logout: async () => {},
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        // Subscribe to user profile changes from Firestore
        const unsubscribeProfile = onSnapshot(doc(db, 'profile', uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              uid,
              username: data.username,
              photoURL: data.photoURL,
              theme: data.theme,
              bannerColor: data.bannerColor,
              friends: data.friends,
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        });
        return () => {
          unsubscribeProfile();
        };
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Updated logout function that clears AsyncStorage
  const logout = async () => {
    try {
      await signOut(auth);
      // Clear all cached data from AsyncStorage.
      await AsyncStorage.clear();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}

// Backward compatibility for the theme hook
export function useThemeContext() {
  const { user } = useUserContext();
  return {
    themeName: user ? user.theme : 'Dark',
  };
}
