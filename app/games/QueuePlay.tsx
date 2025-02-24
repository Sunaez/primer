import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { View } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import THEMES from '@/constants/themes';

interface Game {
  id: string;
  difficulty?: string;
}

interface QueuePlayContextProps {
  currentGame: Game | null;
  gameQueue: Game[];
  currentGameIndex: number;
  startGameQueue: (queue: Game[]) => void;
  nextGame: () => void;
  resetQueue: () => void;
}

const QueuePlayContext = createContext<QueuePlayContextProps | null>(null);

export function QueuePlayProvider({ children }: { children: ReactNode }) {
  const { themeName } = useThemeContext();
  const currentTheme = THEMES[themeName] || THEMES.Dark;

  const [gameQueue, setGameQueue] = useState<Game[]>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  // Use React Navigation to handle navigation when queue finishes.
  const navigation = useNavigation<NavigationProp<any>>();

  function startGameQueue(queue: Game[]) {
    setGameQueue(queue);
    setCurrentGameIndex(0);
  }

  function nextGame() {
    if (currentGameIndex < gameQueue.length - 1) {
      setCurrentGameIndex((prev) => prev + 1);
    } else {
      navigation.navigate('Freeplay');
    }
  }

  function resetQueue() {
    setGameQueue([]);
    setCurrentGameIndex(0);
  }

  const currentGame = gameQueue[currentGameIndex] || null;

  return (
    <QueuePlayContext.Provider
      value={{
        currentGame,
        gameQueue,
        currentGameIndex,
        startGameQueue,
        nextGame,
        resetQueue,
      }}
    >
      <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
        {children}
      </View>
    </QueuePlayContext.Provider>
  );
}

export function useQueuePlay(): QueuePlayContextProps {
  const context = useContext(QueuePlayContext);
  if (!context) {
    throw new Error('useQueuePlay must be used within a QueuePlayProvider');
  }
  return context;
}
