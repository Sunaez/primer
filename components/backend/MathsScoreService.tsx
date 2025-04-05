import { uploadGameScore } from "./scoreService"

/**
 * S(T, C):
 *   - T: reactionTime in ms
 *   - C: number of correct answers
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
 * Upload a math game score
 *  - datePlayed: ISO date string of the session
 *  - totalScore: number of correct answers (C)
 *  - averageReactionTimeMs: average reaction time in ms (T)
 */
export async function uploadMathsGameScore(
  datePlayed: string,
  totalScore: number,
  averageReactionTimeMs: number
) {
  // Format the date/time nicely
  const dateObj = new Date(datePlayed);
  const formattedDate = dateObj.toLocaleDateString("en-US");
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Apply the new scoring formula
  const scoreIndex = calculateScoreIndex(averageReactionTimeMs, totalScore);

  // Build the payload for Firestore
  const data = {
    date: formattedDate,
    time: formattedTime,
    averageReactionTime: Math.round(averageReactionTimeMs),
    score: totalScore,
    scoreIndex: parseFloat(scoreIndex.toFixed(3)), // store to 3 decimal places
    timestamp: Date.now(),
  };

  // Now upload using the game id from games.ts ("maths")
  return await uploadGameScore("maths", data);
}
