// /context/UserContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '@/components/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  logout: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
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
        });
        return () => {
          unsubscribeProfile();
        };
      } else {
        setUser(null);
      }
    });
    return () => {
      unsubscribeAuth();
    };
  }, []);

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

export function useUserContext() {
  return useContext(UserContext);
}

// Backward compatibility: a hook exposing theme-only values.
export function useThemeContext() {
  const { user, setUser } = useUserContext();

  // Define setThemeName so that components can call it.
  const setThemeName = (theme: ThemeName) => {
    if (user) {
      // Optionally, you could update Firestore here as well.
      setUser({ ...user, theme });
    }
  };

  return {
    themeName: user ? user.theme : 'Dark',
    setThemeName,
  };
}
