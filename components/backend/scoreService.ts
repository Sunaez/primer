import { auth, db } from "@/components/firebaseConfig";
import { collection, doc, addDoc, setDoc } from "firebase/firestore";

interface BaseScoreData {
  gameName: string;    
  datePlayed: string;  // ISO string: "2025-03-17T14:00:00.123Z"
  timeTaken: number;   
  timestamp: number;   // e.g. Date.now()
}

interface ExtendedScoreData {
  score: number;                
  accuracy?: number;            
  averageReactionTime?: number;
}

export type GameScoreData = BaseScoreData & ExtendedScoreData & Record<string, any>;

export async function uploadGameScore(data: GameScoreData): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("No authenticated user. Cannot upload score.");
  }
  const userId = auth.currentUser.uid;

  // (A) Save the full game attempt in user's personal scores
  const userScoresRef = collection(db, "users", userId, "scores");
  const newScoreDoc = await addDoc(userScoresRef, data);
  console.log(`Created new user score doc: ${newScoreDoc.id}`);

  // (B) If we have a numeric score, update daily & best
  if (typeof data.score === "number") {
    const dateObj = new Date(data.datePlayed);
    if (!isNaN(dateObj.valueOf())) {
      // Format date as MM/DD/YYYY and time as HH:MM:SS (24-hour clock)
      const dateString = dateObj.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      const timeString = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // dailyScores/{gameName}/scores/{userId_date}
      const dailyScoresCollectionRef = collection(db, "dailyScores", data.gameName, "scores");
      // Replace slashes in dateString if necessary for doc id; using dashes here.
      const dailyDocId = `${userId}_${dateString.replace(/\//g, "-")}`;
      await addScoreToCollection(
        doc(dailyScoresCollectionRef, dailyDocId),
        data,
        userId,
        dateString,
        timeString
      );

      // bestScores/{gameName}/scores/{userId}
      const bestScoresCollectionRef = collection(db, "bestScores", data.gameName, "scores");
      await addScoreToCollection(
        doc(bestScoresCollectionRef, userId),
        data,
        userId,
        dateString,
        timeString
      );
    } else {
      console.warn("Invalid datePlayed; skipping leaderboard update.");
    }
  } else {
    console.warn("No numeric score found; skipping leaderboard update.");
  }

  return newScoreDoc.id;
}

async function addScoreToCollection(
  docRef: ReturnType<typeof doc>,
  data: GameScoreData,
  userId: string,
  dateString: string,
  timeString: string
) {
  await setDoc(
    docRef,
    {
      userId,
      score: data.score,
      bestScore: data.score,
      accuracy: data.accuracy ?? 0,
      averageTime: data.averageReactionTime ? data.averageReactionTime * 1000 : 0,
      gameName: data.gameName,
      date: dateString,
      time: timeString,
    },
    { merge: true }
  );
  console.log(`Leaderboard doc [${docRef.path}] updated with score: ${data.score}`);
}
