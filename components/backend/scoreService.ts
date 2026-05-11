import { auth, db } from "@/components/firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { runActivityNotifications, type StatsData } from "@/components/backend/activityNotifications";

export interface ScoreData {
  [key: string]: any;
}

/**
 * Uploads a score document for a given game at:
 *    Scores / <User ID> / <gameId> / <DocID>
 * 
 * In addition, this function updates the aggregated statistics document for the game,
 * which is stored at:
 *    Statistics / <User ID> / games / <gameId>
 * 
 * Statistics document fields:
 *  - bestScoreIndex: highest score index ever achieved.
 *  - dailyBestScoreIndex: highest score index for the current day.
 *  - lastDailyUpdate: a string ("YYYY-MM-DD") representing the day when the daily best was updated.
 *  - totalPlays: total number of plays.
 *  - updatedAt: timestamp of the latest statistics update.
 * 
 * After updating the statistics, this function calls runActivityNotifications to
 * generate activity notifications based on the current state.
 *
 * @param gameId The game identifier (e.g. "stroop", "snap", etc.)
 * @param data The raw score data; it must include at least `scoreIndex` (number)
 *             and optionally `timestamp` (number). If absent, Date.now() is used.
 * @returns A promise that resolves with the document ID of the uploaded score.
 */
export async function uploadGameScore(
  gameId: string,
  data: ScoreData
): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("No authenticated user. Cannot upload score.");
  }

  const userId = auth.currentUser.uid;
  const scoresRef = collection(db, "Scores", userId, gameId);

  // Upload the raw score document.
  const newDocRef = await addDoc(scoresRef, data);
  console.log("Score document created at:", newDocRef.path);

  // Prepare to update the aggregated statistics.
  const statsDocRef = doc(db, "Statistics", userId, "games", gameId);
  const newScoreIndex = data.scoreIndex || 0;
  const newTimestamp = data.timestamp || Date.now();
  const todayString = new Date(newTimestamp).toISOString().split("T")[0];
  let previousStats: StatsData | null = null;
  let nextStats: StatsData | null = null;

  // Run a transaction to update (or create) the aggregated statistics document.
  await runTransaction(db, async (transaction) => {
    const statsDoc = await transaction.get(statsDocRef);

    if (!statsDoc.exists()) {
      nextStats = {
        bestScoreIndex: newScoreIndex,
        dailyBestScoreIndex: newScoreIndex,
        lastDailyUpdate: todayString,
        totalPlays: 1,
        updatedAt: serverTimestamp()
      };
      // Create a new statistics document if it does not exist.
      transaction.set(statsDocRef, nextStats);
    } else {
      const statsData = statsDoc.data() as StatsData;
      previousStats = statsData;
      const currentBest = statsData.bestScoreIndex || 0;
      const currentDailyBest = statsData.dailyBestScoreIndex || 0;
      const lastDailyUpdate = statsData.lastDailyUpdate || "";
      let updatedDailyBest = currentDailyBest;
      let updatedDailyDate = lastDailyUpdate;

      // Update daily best if today matches; otherwise, reset for a new day.
      if (lastDailyUpdate === todayString) {
        if (newScoreIndex > currentDailyBest) {
          updatedDailyBest = newScoreIndex;
        }
      } else {
        updatedDailyBest = newScoreIndex;
        updatedDailyDate = todayString;
      }

      const updatedBest = newScoreIndex > currentBest ? newScoreIndex : currentBest;
      const updatedTotalPlays = (statsData.totalPlays || 0) + 1;

      const updatedStats = {
        bestScoreIndex: updatedBest,
        dailyBestScoreIndex: updatedDailyBest,
        lastDailyUpdate: updatedDailyDate,
        totalPlays: updatedTotalPlays,
        updatedAt: serverTimestamp()
      };
      nextStats = updatedStats;

      transaction.update(statsDocRef, updatedStats);
    }
  });

  // Generate activity notifications using the client's current statistics.
  if (nextStats) {
    await runActivityNotifications(userId, gameId, previousStats, nextStats);
  }

  return newDocRef.id;
}
