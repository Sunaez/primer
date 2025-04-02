// SnapScoreService.ts
import { uploadGameScore } from "./scoreService";

/**
 * Calculates the score index for the Snap game using a sigmoid function.
 *
 * @param t - Reaction time in milliseconds.
 * @returns The calculated score index.
 */
function calculateScoreIndex(t: number): number {
  const T = 273*2; // Fixed characteristic time constant
  const n = Math.PI; // Fixed exponent for steepness of decay

  const score = 100 / (1 + Math.pow(t / T, n));
  return score;
}

/**
 * Upload a Snap game score.
 *
 * @param datePlayed - ISO date string representing when the game was played.
 * @param averageReactionTimeMs - Average reaction time in milliseconds.
 * @returns A promise that resolves with the document ID of the saved score.
 */
export async function uploadSnapGameScore(
  datePlayed: string,
  averageReactionTimeMs: number
): Promise<string> {
  // Format the date/time nicely.
  const dateObj = new Date(datePlayed);
  const formattedDate = dateObj.toLocaleDateString("en-US");
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Calculate the score index using the provided sigmoid function.
  const scoreIndex = calculateScoreIndex(averageReactionTimeMs);

  // Build the payload for the score.
  const data = {
    date: formattedDate,
    time: formattedTime,
    averageReactionTime: Math.round(averageReactionTimeMs),
    scoreIndex: parseFloat(scoreIndex.toFixed(3)),
    timestamp: Date.now(),
  };

  // Upload the score via the generic score service.
  return await uploadGameScore("snapGame", data);
}
