import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/components/firebaseConfig";

interface ScoreData {
  userId: string;
  score: number;
  accuracy: number;
  averageTime: number;
  gameName: string;
  date: string;
}

const useDailyScores = (gameName: string) => {
  const [scores, setScores] = useState<ScoreData[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const scoresCollectionRef = collection(db, "dailyScores");
        const q = query(scoresCollectionRef, where("gameName", "==", gameName));
        const scoresSnapshot = await getDocs(q);
        const scoresList: ScoreData[] = scoresSnapshot.docs.map(doc => doc.data() as ScoreData);
        setScores(scoresList);
      } catch (error) {
        console.error("Error fetching scores:", error);
      }
    };

    fetchScores();
  }, [gameName]); // React to changes in gameName

  return scores;
};

export default useDailyScores;