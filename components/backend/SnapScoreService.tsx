import { uploadGameScore } from "./scoreService";

function calculateScoreIndex(t: number): number {
  const T = 273 * 2;
  const n = Math.PI;
  return 100 / (1 + Math.pow(t / T, n));
}

export async function uploadSnapGameScore(
  datePlayed: string,
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

  const scoreIndex = calculateScoreIndex(averageReactionTimeMs);
  return uploadGameScore("snap", {
    date: formattedDate,
    time: formattedTime,
    averageReactionTime: Math.round(averageReactionTimeMs),
    scoreIndex: parseFloat(scoreIndex.toFixed(3)),
    timestamp: Date.now(),
  });
}
