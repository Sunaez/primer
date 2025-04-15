import { AVPlaybackSource } from 'expo-av';
import ArithmeticChallenge from '@/games/maths';
import ReactionGame from '@/app/games/snap';
import PairsGame from '@/app/games/pairs';
import StroopTest from '@/app/games/stroop';

/**
 * Game structure:
 * - `id`: Unique identifier for navigation
 * - `title`: Game name
 * - `instructions`: Step-by-step guide
 * - `video`: Optional (local file or URL)
 * - `component`: The React component that implements the game
 */
export interface Game {
  id: string;
  title: string;
  instructions: string[];
  video?: AVPlaybackSource | string;
  component: React.ComponentType<any>;
}

export const GAMES: Game[] = [
  {
    id: 'snap',
    title: 'Snap',
    instructions: [
      'Shapes are randomly and constantly changing.',
      'Wait until the shapes match.',
      'Click as soon as you see them match, the faster the better !!',
    ],
    video: require('@/assets/videos/snap.mp4'),
    component: ReactionGame,
  },
  {
    id: 'maths',
    title: 'Maths Challenge',
    instructions: [
      'Answer 10 questions as fast as possible.',
      'Avoid pressing without thinking (you will lose out on score).',
      'Collect your final score at the end!',
    ],
    video: require('@/assets/videos/maths.mp4'),
    component: ArithmeticChallenge,
  },
  {
    id: 'pairs',
    title: 'Quick Pair Match',
    instructions: [
      'Flip two cards at a time.',
      'Remember their positions to make matches.',
      'Clear the board in the fewest moves!',
    ],
    video: require('@/assets/videos/pairs.mp4'),
    component: PairsGame,
  },
  {
    id: 'stroop',
    title: 'Stroop',
    instructions: [
      'A color word is displayed in a color that may differ from the word itself.',
      'Tap the button that corresponds to the actual color of the text.',
      'Try to be both fast and accurate.',
    ],
    video: undefined,
    component: StroopTest,
  },
];
