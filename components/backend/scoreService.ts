// File: services/scoreService.ts (or any location in your project)
import { auth, db } from "@/components/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

interface MathsScoreData {
  difficulty: string;
  score: number;
  timeTaken: number;   // for example, how many seconds the user spent
  // add any other relevant fields for your maths game
}

/**
 * uploadMathsScore
 *
 * Writes a single record to /users/{uid}/scores with the necessary
 * fields for the maths game.
 * 
 * @param {MathsScoreData} data - The user's new maths score data
 * @returns Promise<string> - The new Firestore doc ID
 */
export async function uploadMathsScore(data: MathsScoreData): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("No authenticated user. Cannot upload score.");
  }

  const userId = auth.currentUser.uid;
  const scoresCollection = collection(db, "users", userId, "scores");

  // Build the doc payload
  const payload = {
    gameName: "mathsGame",     // identify the game
    difficulty: data.difficulty,
    score: data.score,
    timeTaken: data.timeTaken,
    timestamp: Date.now(),     // track when user got the score
  };

  const docRef = await addDoc(scoresCollection, payload);
  return docRef.id;  // if you need the new doc ID for something
}