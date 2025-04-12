import { uploadGameScore } from "./scoreService";

/**
 * Calculate the Stroop test score index using:
 *   S(T, C) where:
 *     T = average reaction time in ms
 *     C = number of correct answers
 */
function calculateScoreIndex(T: number, C: number): number {
  if (T > 0 && T <= 250) {
    // f(T, C) = C * (5 - 5 * cos((π / 250) * T))
    return C * (5 - 5 * Math.cos((Math.PI / 250) * T));
  } else if (T > 250 && T < 10000) {
    // f(T, C) = 10 * C * exp((ln(0.8) / 625) * (T - 250) / 2)
    const exponent = (Math.log(0.8) / 625) * ((T - 250) / 2);
    return 10 * C * Math.exp(exponent);
  } else {
    return 0;
  }
}

/**
 * Upload a Stroop test game score.
 *
 * @param datePlayed - ISO date string representing when the game was played.
 * @param totalScore - Total number of correct answers (C).
 * @param averageReactionTimeMs - Average reaction time in milliseconds (T).
 * @returns A promise that resolves with the document ID of the saved score.
 */
export async function uploadStroopTestScore(
  datePlayed: string,
  totalScore: number,
  averageReactionTimeMs: number
) {
  const dateObj = new Date(datePlayed);
  const formattedDate = dateObj.toLocaleDateString("en-US");
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const scoreIndex = calculateScoreIndex(averageReactionTimeMs, totalScore);

  const data = {
    date: formattedDate,
    time: formattedTime,
    averageReactionTime: Math.round(averageReactionTimeMs),
    score: totalScore,
    scoreIndex: parseFloat(scoreIndex.toFixed(3)),
    timestamp: Date.now(),
  };

  // This call uploads the raw score and updates the aggregated statistics.
  return await uploadGameScore("stroop", data);
}
