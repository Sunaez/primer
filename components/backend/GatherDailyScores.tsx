import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/components/firebaseConfig";

interface ScoreData {
  userId: string;
  score: number;
  accuracy: number;
  averageTime: number;
  gameName: string;
  date: string; // Format: MM/DD/YYYY
  time: string; // Format: HH:MM:SS (24-hour)
}

const useBestDailyScore = () => {
  const [allScores, setAllScores] = useState<ScoreData[]>([]);
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
        console.log(`Querying collection group "scores" ordered by date descending.`);

        // Query all documents from subcollections named "scores" (i.e. users/{userId}/scores/{scoreID})
        // ordered by date descending.
        const scoresCollectionGroupRef = collectionGroup(db, "scores");
        const q = query(scoresCollectionGroupRef, orderBy("date", "desc"));
        const scoresSnapshot = await getDocs(q);

        if (scoresSnapshot.empty) {
          console.log("No scores found in users subcollections.");
          setAllScores([]);
          setBestScore(null);
          return;
        }

        const scoresList: ScoreData[] = [];
        // Since the query is ordered by date descending, today's scores will be at the top.
        // Iterate until we find a document whose date is less than today's date.
        for (const doc of scoresSnapshot.docs) {
          const data = doc.data() as ScoreData;
          if (data.date === today) {
            scoresList.push(data);
          } else {
            // Once we hit a score that is not from today, we can stop.
            break;
          }
        }

        setAllScores(scoresList);
        console.log(`Found ${scoresList.length} score(s) for today:`);
        console.table(scoresList);

        // Determine the best score (highest numeric value)
        if (scoresList.length > 0) {
          const best = scoresList.reduce((prev, current) =>
            current.score > prev.score ? current : prev
          );
          console.log("Best score for today:", best);
          setBestScore(best);
        } else {
          setBestScore(null);
        }
      } catch (error) {
        console.error("Error fetching scores:", error);
      }
    };

    fetchScores();
  }, []);

  return { allScores, bestScore };
};

export default useBestDailyScore;
