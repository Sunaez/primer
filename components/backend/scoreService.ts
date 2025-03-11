import { auth, db } from "@/components/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

// Base structure for all game scores (Required fields for every game)
interface BaseScoreData {
  gameName: string;    // e.g., "mathsGame", "pairMatch", "reactionGame", etc.
  datePlayed: string;  // ISO timestamp ("2025-03-11T14:30:15.123Z")
  timeTaken: number;   // Total time spent playing (in seconds)
  timestamp: number;   // Unix timestamp (milliseconds)
}

// Extendable structure for any game (Optional fields)
type GameScoreData = BaseScoreData & Record<string, any>; // Allows extra fields dynamically

/**
 * uploadGameScore
 *
 * Uploads a game score to Firestore.
 * 
 * @param {GameScoreData} data - The game score data.
 * @returns {Promise<string>} - Returns the new Firestore doc ID.
 */
export async function uploadGameScore(data: GameScoreData): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("No authenticated user. Cannot upload score.");
  }

  const userId = auth.currentUser.uid;
  const scoresCollection = collection(db, "users", userId, "scores");

  // Upload to Firestore
  const docRef = await addDoc(scoresCollection, data);
  return docRef.id;  // Return Firestore document ID
}
