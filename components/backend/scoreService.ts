// file: scoreService.ts

import { auth, db } from "@/components/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

/**
 * Base fields for each game score doc
 */
interface BaseScoreData {
  gameName: string;     // e.g. "reactionGame", "mathsGame", etc.
  datePlayed: string;   // ISO, "2025-03-17T14:00:00.123Z"
  timeTaken: number;    // total time (seconds)
  timestamp: number;    // e.g., Date.now()
}

/**
 * Extended fields specifically for scoring
 */
interface ExtendedScoreData {
  score: number;                // numeric
  accuracy?: number;            // e.g. 95 => 95%
  averageReactionTime?: number; // e.g. 200 ms
  gameMode?: string;            // e.g. "Hard", "Normal"
}

/**
 * Combined shape of data we accept from the game
 */
export type GameScoreData = BaseScoreData & ExtendedScoreData & Record<string, any>;

/**
 * uploadGameScore
 * ----------------
 * 1) Writes the full data to users/{userId}/scores.
 * 2) If data.score is higher, updates dailyScores/{userId_date} doc with { userId, bestScore, ... }.
 * 3) If data.score is higher, updates bestScores/{userId} doc with { userId, bestScore, ... }.
 *
 * We ONLY store userId in daily/best docs so we can fetch latest profile info later.
 */
export async function uploadGameScore(data: GameScoreData): Promise<string> {
  // Must be signed in
  if (!auth.currentUser) {
    throw new Error("No authenticated user. Cannot upload score.");
  }
  const userId = auth.currentUser.uid;

  // (A) Always store the complete attempt in the user's personal scores subcollection
  const scoresRef = collection(db, "users", userId, "scores");
  const newScoreDoc = await addDoc(scoresRef, data);
  console.log(`Created new score doc: ${newScoreDoc.id}`);

  // (B) If we have a numeric score, update daily + best docs
  if (typeof data.score === "number") {
    const dateObj = new Date(data.datePlayed);
    if (!isNaN(dateObj.valueOf())) {
      // 1) dailyScores/{userId_dateString}
      const dateString = dateObj.toISOString().split("T")[0]; // e.g. "2025-03-17"
      const dailyDocId = `${userId}_${dateString}`;
      const dailyRef = doc(db, "dailyScores", dailyDocId);

      await updateIfHigher(dailyRef, data, userId, dateString);

      // 2) bestScores/{userId}
      const bestRef = doc(db, "bestScores", userId);

      await updateIfHigher(bestRef, data, userId);
    } else {
      console.warn("Invalid datePlayed; skipping dailyScores update.");
    }
  } else {
    console.warn("No numeric score found; skipping bestScores update.");
  }

  return newScoreDoc.id;
}

/**
 * updateIfHigher
 * ---------------
 * If data.score > doc's bestScore, overwrites with { userId, bestScore, ... }.
 * We do NOT store username or photo here, so the doc always references the userId
 * (which we can use to fetch the latest profile from `profile/{userId}`).
 */
async function updateIfHigher(
  docRef: ReturnType<typeof doc>,
  data: GameScoreData,
  userId: string,
  date?: string
) {
  const snap = await getDoc(docRef);
  const existing = snap.data() || {};
  const currentBest = existing.bestScore || 0;

  if (!snap.exists() || data.score > currentBest) {
    await setDoc(
      docRef,
      {
        userId,               // So we know whose doc it is
        bestScore: data.score,
        accuracy: data.accuracy ?? 0,
        averageReactionTime: data.averageReactionTime ?? 0,
        gameMode: data.gameMode ?? "",
        updatedAt: Timestamp.now(),
        ...(date ? { date } : {}),
      },
      { merge: true }
    );
    console.log(`Updated bestScore in [${docRef.path}] => ${data.score}`);
  }
}
