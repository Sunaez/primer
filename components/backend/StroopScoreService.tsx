import { uploadGameScore } from "./scoreService";

function calculateScoreIndex(T: number, C: number): number {
  if (T > 0 && T <= 250) {
    return C * (5 - 5 * Math.cos((Math.PI / 250) * T));
  }
  if (T > 250 && T < 10000) {
    const exponent = (Math.log(0.8) / 625) * ((T - 250) / 2);
    return 10 * C * Math.exp(exponent);
  }
  return 0;
}

export async function uploadStroopTestScore(
  datePlayed: string,
  totalScore: number,
  averageReactionTimeMs: number
): Promise<string> {
  const dateObj = new Date(datePlayed);
  const formattedDate = dateObj.toLocaleDateString("en-US");
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const scoreIndex = calculateScoreIndex(averageReactionTimeMs, totalScore);
  return uploadGameScore("stroop", {
    date: formattedDate,
    time: formattedTime,
    averageReactionTime: Math.round(averageReactionTimeMs),
    score: totalScore,
    scoreIndex: parseFloat(scoreIndex.toFixed(3)),
    timestamp: Date.now(),
  });
}
