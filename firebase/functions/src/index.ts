/**
 * File: src/index.ts
 * -----------------------------------------------------------
 * Complete Cloud Function using Firebase Functions v2 in TS
 */

import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Initialize the Firebase Admin SDK once
admin.initializeApp();
const db = admin.firestore();

/**
 * onScoreCreated:
 * Triggered whenever a new doc is created at:
 *   leaderboard/{userId}/scores/{scoreId}
 *
 * Each new score doc is expected to have a field `score`.
 * This function:
 *   1) Increments 'totalScore' in 'leaderboard/{userId}'
 *   2) Updates 'dailyScore' by resetting or incrementing
 */
export const onScoreCreated = onDocumentCreated(
  'leaderboard/{userId}/scores/{scoreId}',
  async (
    event: FirestoreEvent<
      QueryDocumentSnapshot | undefined,
      { userId: string; scoreId: string }
    >
  ) => {
    // event.data is the newly created QueryDocumentSnapshot, or undefined
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No snapshot data found. Exiting.');
      return;
    }

    // Extract path params from event.params
    const { userId, scoreId } = event.params;
    console.log(`New score document! userId=${userId}, scoreId=${scoreId}`);

    // The doc's fields (score, etc.)
    const newScoreData = snapshot.data() || {};
    const newScore = newScoreData.score ?? 0;

    // Reference to the user's main doc in `leaderboard`
    const userRef = db.collection('leaderboard').doc(userId);

    // 1) Increment totalScore
    await userRef.set(
      {
        totalScore: admin.firestore.FieldValue.increment(newScore),
      },
      { merge: true }
    );

    // 2) Daily Score logic
    const todayString = new Date().toDateString();
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    if (userData.lastScoreDate === todayString) {
      // Same day => increment
      await userRef.update({
        dailyScore: admin.firestore.FieldValue.increment(newScore),
      });
    } else {
      // New day => reset
      await userRef.update({
        dailyScore: newScore,
        lastScoreDate: todayString,
      });
    }

    console.log(`Score +${newScore} processed for user ${userId}.`);
  }
);
