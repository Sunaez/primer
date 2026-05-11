import { uploadGameScore } from "./scoreService";

function calculateScoreIndex(totalTimeMs: number, totalTurns: number): number {
  if (totalTimeMs < 1000) {
    return 100;
  }

  const seconds = totalTimeMs / 1000;
  const score = (105 - totalTurns) * Math.exp(-((Math.log(2)) / 4) * (seconds - 1));
  return parseFloat(score.toFixed(3));
}

export async function uploadPairsGameScore(
  datePlayed: string,
  totalTurns: number,
  totalTimeMs: number
): Promise<string> {
  const dateObj = new Date(datePlayed);
  const formattedDate = dateObj.toLocaleDateString("en-US");
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return uploadGameScore("pairs", {
    date: formattedDate,
    time: formattedTime,
    totalTurns,
    totalTimeMs,
    scoreIndex: calculateScoreIndex(totalTimeMs, totalTurns),
    timestamp: Date.now(),
  });
}
