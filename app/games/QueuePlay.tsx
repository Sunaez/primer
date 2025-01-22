// File: app/games/QueuePlay.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';

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

/**
 * Context for the multi‐game queue
 */
const QueuePlayContext = createContext<QueuePlayContextProps | null>(null);

/**
 * Provider that manages a queue of games.
 * Call `startGameQueue()` with an array of games, then render `currentGame`.
 * Call `nextGame()` when a game ends to advance.
 */
export function QueuePlayProvider({ children }: { children: ReactNode }) {
  const [gameQueue, setGameQueue] = useState<Game[]>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  // If using React Navigation, you can use `useNavigation`.
  // Or omit if you handle finishing differently.
  const navigation = useNavigation<NavigationProp<any>>();

  function startGameQueue(queue: Game[]) {
    setGameQueue(queue);
    setCurrentGameIndex(0);
  }

  function nextGame() {
    if (currentGameIndex < gameQueue.length - 1) {
      setCurrentGameIndex((prev) => prev + 1);
    } else {
      // Reached the end of the queue
      // Example: go back to a home screen
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
      {children}
    </QueuePlayContext.Provider>
  );
}

/**
 * Custom hook to use the queue context
 */
export function useQueuePlay(): QueuePlayContextProps {
  const context = useContext(QueuePlayContext);
  if (!context) {
    throw new Error('useQueuePlay must be used within a QueuePlayProvider');
  }
  return context;
}
