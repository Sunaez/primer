// file: constants/games.ts
// Reusable list of Game objects.

export interface Game {
    id: string;
    title: string;
    instructions: string[];
    video?: string; // path to your /assets/videos/*.mp4
  }
  
  export const GAMES: Game[] = [
    {
      id: 'snap',
      title: 'Snap',
      instructions: [
        'Shuffle the deck thoroughly.',
        'Split the deck between two players.',
        'Players flip cards in turn, calling “Snap!” when matching cards appear.',
      ],
      video: '/assets/videos/snap.mp4',
    },
    {
      id: 'reaction',
      title: 'Reaction Game',
      instructions: [
        'Wait for the screen to change color.',
        'Tap as quickly as possible when it does.',
        'Compare your reaction time with your friends!',
      ],
      video: '/assets/videos/reaction.mp4',
    },
    {
      id: 'maths',
      title: 'Maths Challenge',
      instructions: [
        'Answer as many math questions as you can within the time limit.',
        'Watch out for negative numbers and tricky fractions.',
        'Collect your final score at the end!',
      ],
      video: '/assets/videos/maths.mp4',
    },
    {
      id: 'PairMatch',
      title: 'Quick Pair Match',
      instructions: [
        'Flip two cards at a time.',
        'Remember their positions to make matches.',
        'Clear the board in the fewest moves!',
      ],
      video: '/assets/videos/pairmatch.mp4',
    },
  ];
  