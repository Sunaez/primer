import { auth, db } from "@/components/firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";

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
 * @param gameId The game identifier (e.g. "stroop", "snap", etc.)
 * @param data The raw score data; it must include at least `scoreIndex` (number)
 *             and optionally `timestamp` (number). If `timestamp` is absent, Date.now() is used.
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

  // Ensure we have a scoreIndex and timestamp; use current time if not provided.
  const newScoreIndex = data.scoreIndex || 0;
  const newTimestamp = data.timestamp || Date.now();
  const todayString = new Date(newTimestamp).toISOString().split("T")[0];

  // Run a transaction to update (or create) the aggregated statistics document.
  await runTransaction(db, async (transaction) => {
    const statsDoc = await transaction.get(statsDocRef);

    if (!statsDoc.exists()) {
      // If no statistics document exists for this game, create one.
      transaction.set(statsDocRef, {
        bestScoreIndex: newScoreIndex,
        dailyBestScoreIndex: newScoreIndex,
        lastDailyUpdate: todayString,
        totalPlays: 1,
        updatedAt: serverTimestamp()
      });
    } else {
      const statsData = statsDoc.data();
      const currentBest = statsData.bestScoreIndex || 0;
      const currentDailyBest = statsData.dailyBestScoreIndex || 0;
      const lastDailyUpdate = statsData.lastDailyUpdate || "";
      let updatedDailyBest = currentDailyBest;
      let updatedDailyDate = lastDailyUpdate;

      // Check if the stored daily update corresponds to today.
      if (lastDailyUpdate === todayString) {
        if (newScoreIndex > currentDailyBest) {
          updatedDailyBest = newScoreIndex;
        }
      } else {
        // New day — reset the daily best to the new score.
        updatedDailyBest = newScoreIndex;
        updatedDailyDate = todayString;
      }
      const updatedBest = newScoreIndex > currentBest ? newScoreIndex : currentBest;
      const updatedTotalPlays = (statsData.totalPlays || 0) + 1;

      transaction.update(statsDocRef, {
        bestScoreIndex: updatedBest,
        dailyBestScoreIndex: updatedDailyBest,
        lastDailyUpdate: updatedDailyDate,
        totalPlays: updatedTotalPlays,
        updatedAt: serverTimestamp()
      });
    }
  });

  return newDocRef.id;
}
