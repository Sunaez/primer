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
    let mounted = true;
    let unsubscribeProfile: (() => void) | undefined;
    let profileTimeout: ReturnType<typeof setTimeout> | undefined;

    const finishLoading = () => {
      if (mounted) {
        setLoading(false);
      }
    };

    const authTimeout = setTimeout(() => {
      console.warn('Firebase auth initialisation timed out; continuing as guest.');
      setUser(null);
      finishLoading();
    }, 8000);

    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(authTimeout);
      if (profileTimeout) {
        clearTimeout(profileTimeout);
        profileTimeout = undefined;
      }
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (firebaseUser) {
        const uid = firebaseUser.uid;
        profileTimeout = setTimeout(() => {
          console.warn('User profile loading timed out; continuing with a fallback profile.');
          setUser({
            uid,
            username: firebaseUser.displayName || firebaseUser.email || 'User',
            photoURL: firebaseUser.photoURL ?? null,
            theme: 'Dark',
            bannerColor: '#333333',
            friends: { friends: [], friendRequests: [], blocked: [] },
          });
          finishLoading();
        }, 8000);

        // Subscribe to user profile changes from Firestore
        unsubscribeProfile = onSnapshot(
          doc(db, 'profile', uid),
          (docSnap) => {
            if (!mounted) return;
            if (profileTimeout) {
              clearTimeout(profileTimeout);
              profileTimeout = undefined;
            }

            if (docSnap.exists()) {
              const data = docSnap.data();
              setUser({
                uid,
                username: data.username ?? 'User',
                photoURL: data.photoURL ?? null,
                theme: THEMES[data.theme as ThemeName] ? data.theme : 'Dark',
                bannerColor: data.bannerColor ?? '#333333',
                friends: data.friends ?? { friends: [], friendRequests: [], blocked: [] },
              });
            } else {
              setUser(null);
            }
            finishLoading();
          },
          (error) => {
            if (profileTimeout) {
              clearTimeout(profileTimeout);
              profileTimeout = undefined;
            }
            console.error('Error loading user profile:', error);
            setUser(null);
            finishLoading();
          }
        );
      } else {
        setUser(null);
        finishLoading();
      }
    }, (error) => {
      clearTimeout(authTimeout);
      console.error('Error initialising auth state:', error);
      setUser(null);
      finishLoading();
    });
    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      if (profileTimeout) {
        clearTimeout(profileTimeout);
      }
      unsubscribeProfile?.();
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
