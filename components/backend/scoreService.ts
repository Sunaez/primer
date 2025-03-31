// scoreService.ts
import { auth, db } from "@/components/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export interface ScoreData {
  [key: string]: any;
}

/**
 * Universal function for saving any game data to:
 *  Scores / <User ID> / <gameId> / <DocID>
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

  const newDocRef = await addDoc(scoresRef, data);
  console.log("Score document created at:", newDocRef.path);

  return newDocRef.id;
}
