// functions/src/resetDailyScores.ts
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
 
// Make sure the Admin SDK is initialized in your index.ts (or you can initialize here too)
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Scheduled function to reset the dailyBestScoreIndex in every games document under Statistics.
 *
 * This function uses a collection group query to get all subcollection documents
 * in "games" and updates each document's dailyBestScoreIndex to 0.
 */
export const resetDailyScores = onSchedule(
  {
    // Runs every day at 00:00 UTC (midnight GMT)
    schedule: "0 0 * * *",  
    timeZone: "Etc/UTC",  // midnight UTC
  },
  async (event) => {
    logger.info("Starting daily score reset...");

    try {
      // Use a collection group query to fetch every "games" document across all users.
      const snapshot = await admin.firestore().collectionGroup("games").get();

      if (snapshot.empty) {
        logger.info("No game documents found to reset.");
        return;
      }

      // Batch update each document so that dailyBestScoreIndex is set to 0.
      const db = admin.firestore();
      const batch = db.batch();

      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { dailyBestScoreIndex: 0 });
      });

      await batch.commit();
      logger.info(`Successfully reset daily scores for ${snapshot.size} document(s).`);
    } catch (error) {
      logger.error("Error resetting daily scores:", error);
    }
  }
);
