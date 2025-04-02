import { uploadGameScore } from "./scoreService";

/**
 * Calculate the score index for the Pairs game using the formula:
 *
 *   y = (95 + b) * e^(-((ln2)/12) * (x - 1))
 *
 * where:
 *   - b is the total number of turns,
 *   - x is the total time in seconds.
 *
 * @param totalTimeMs - The total time in milliseconds.
 * @param totalTurns - The number of turns (b).
 * @returns The score index.
 */
function calculateScoreIndex(totalTimeMs: number, totalTurns: number): number {
    // If the total time is under 1 second, cap the score at 100.
    if (totalTimeMs < 1000) return 100;
  
    // Convert total time from milliseconds to seconds.
    const x = totalTimeMs / 1000;
    const y = (95 + totalTurns) * Math.exp(-((Math.log(2)) / 4) * (x - 1));
    return parseFloat(y.toFixed(3));
  }
  

/**
 * Upload a pairs game score.
 *
 * @param datePlayed - ISO date string representing when the game was played.
 * @param totalTurns - Total number of turns taken.
 * @param totalTimeMs - Total time taken in milliseconds.
 * @returns A promise that resolves with the document ID of the saved score.
 */
export async function uploadPairsGameScore(
  datePlayed: string,
  totalTurns: number,
  totalTimeMs: number
): Promise<string> {
  // Format date/time nicely.
  const dateObj = new Date(datePlayed);
  const formattedDate = dateObj.toLocaleDateString("en-US");
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Calculate the score index using our formula.
  const scoreIndex = calculateScoreIndex(totalTimeMs, totalTurns);

  // Build the data payload.
  const data = {
    date: formattedDate,
    time: formattedTime,
    totalTurns,
    totalTimeMs,
    scoreIndex,
    timestamp: Date.now(),
  };

  // Upload the score using the generic score service.
  return await uploadGameScore("pairsGame", data);
}
