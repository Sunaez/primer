// file: constants/games.ts

import { AVPlaybackSource } from 'expo-av';

/**
 * Game structure:
 * - `id`: Unique identifier for navigation
 * - `title`: Game name
 * - `instructions`: Step-by-step guide
 * - `video`: Optional (local file or URL)
 */
export interface Game {
  id: string;
  title: string;
  instructions: string[];
  video?: AVPlaybackSource | string;
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
    video: undefined, // No video yet
  },
  {
    id: 'reaction',
    title: 'Reaction Game',
    instructions: [
      'Wait for the screen to change color.',
      'Tap as quickly as possible when it does.',
      'Compare your reaction time with your friends!',
    ],
    video: undefined, // No video yet
  },
  {
    id: 'maths',
    title: 'Maths Challenge',
    instructions: [
      'Answer as many math questions as you can within the time limit.',
      'Watch out for negative numbers and tricky fractions.',
      'Collect your final score at the end!',
    ],
    video: require('@/assets/videos/maths.mp4'), // ✅ This game has a video
  },
  {
    id: 'pairs',
    title: 'Quick Pair Match',
    instructions: [
      'Flip two cards at a time.',
      'Remember their positions to make matches.',
      'Clear the board in the fewest moves!',
    ],
    video: 'undefined', // No video yet
  },
];
