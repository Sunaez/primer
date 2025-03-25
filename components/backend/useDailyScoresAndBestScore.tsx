import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/components/firebaseConfig";

export interface ScoreData {
  userId: string;
  score: number;
  accuracy: number;
  averageTime: number;
  gameName: string;
  date: string; // e.g., "03/24/2025"
  time: string; // e.g., "15:31:00"
}

const useDailyScoresAndBestScore = (selectedGame: string) => {
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [bestScore, setBestScore] = useState<ScoreData | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        // Compute today's date in MM/DD/YYYY format.
        const today = new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });
        console.log(
          `Querying collection group "scores" ordered by date descending for game "${selectedGame}" and today's date: ${today}`
        );

        // Query all documents in subcollections named "scores" (e.g. users/{userId}/scores/{scoreId})
        // for the selected game, ordered by "date" descending.
        const scoresCollectionGroupRef = collectionGroup(db, "scores");
        const q = query(
          scoresCollectionGroupRef,
          where("gameName", "==", selectedGame),
          orderBy("date", "desc")
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.log("No scores found in users subcollections.");
          setScores([]);
          setBestScore(null);
          return;
        }

        const scoresList: ScoreData[] = [];
        // Because the query is ordered descending by date,
        // today's scores will be at the top.
        // Stop processing as soon as we hit a document not from today.
        for (const doc of snapshot.docs) {
          const data = doc.data() as ScoreData;
          if (data.date === today) {
            scoresList.push(data);
          } else {
            break;
          }
        }

        setScores(scoresList);
        console.log(`Found ${scoresList.length} score(s) for today:`);
        console.table(scoresList);

        if (scoresList.length > 0) {
          const best = scoresList.reduce((prev, curr) =>
            curr.score > prev.score ? curr : prev,
            scoresList[0]
          );
          console.log("Best score for today:", best);
          setBestScore(best);
        } else {
          setBestScore(null);
        }
      } catch (error) {
        console.error("Error fetching daily scores:", error);
      }
    };

    fetchScores();
  }, [selectedGame]);

  return { scores, bestScore };
};

export default useDailyScoresAndBestScore;
