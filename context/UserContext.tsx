// /context/UserContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '@/components/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import THEMES from '@/constants/themes';

export type ThemeName = keyof typeof THEMES;

// Define the structure for the friends object.
export interface Friends {
  friends: string[];
  friendRequests: string[];
  blocked: string[];
}

// Define the complete user profile.
export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string | null;
  theme: ThemeName;
  bannerColor: string;
  friends: Friends;
}

// The context’s shape.
interface UserContextValue {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  // Optional: a logout helper that also clears the user context.
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  logout: async () => {},
});

// UserProvider listens to auth state and, when logged in, listens to the user's Firestore profile.
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        // Subscribe to the user's profile document.
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
            // Profile not set up yet.
            setUser(null);
          }
        });
        return () => {
          unsubscribeProfile();
        };
      } else {
        // No authenticated user.
        setUser(null);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // A helper function for logging out that also clears the context.
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to access the unified user context.
export function useUserContext() {
  return useContext(UserContext);
}

// Backward compatibility: provide a theme hook that only returns the theme.
export function useThemeContext() {
  const { user } = useUserContext();
  return {
    themeName: user ? user.theme : 'Dark',
  };
}
