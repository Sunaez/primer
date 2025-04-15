// /components/backend/pairsGameScore.ts
import { uploadGameScore } from "./scoreService";
import { auth, db } from "@/components/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";

// ---------------------------
// Message Templates for Activity Notifications
// ---------------------------
const newHighScoreMessages = [
  "{username} beat their all-time high score in {gameName}, improving from {previousHigh} to {newHigh}!",
  "Incredible! {username} just raised their game in {gameName}, moving from {previousHigh} to {newHigh}!",
  "{username} is locked in on {gameName} 😳 they went from {previousHigh} to {newHigh}!",
  "Define locked in: {username} just went from {previousHigh} to {newHigh} in {gameName}",
  "The glow-up is real — {username} leveled up their {gameName} score from {previousHigh} to {newHigh}!",
  "W player detected. {username} went from {previousHigh} to {newHigh} in {gameName} like it was nothing.",
  "{username} said 'new score just dropped' and hit {newHigh} in {gameName} (previous was {previousHigh})",
  "{username} upgraded their stats IRL — from {previousHigh} to {newHigh} in {gameName}!"
];

const milestoneMessages = [
  "{username} just reached {totalPlays} plays in {gameName}!",
  "Milestone unlocked! {username} hit {totalPlays} plays in {gameName}!",
  "We might need to nerf {username}... {totalPlays} plays in {gameName} already?",
  "{username} is on demon hours with {totalPlays} plays in {gameName}!",
  "Certified grinder alert: {username} just hit {totalPlays} plays in {gameName}!",
  "Bro thinks they're in an anime — {username} just crossed {totalPlays} plays in {gameName}.",
  "{username} been clocking in like it's a 9 to 5 — {totalPlays} plays in {gameName}.",
  "{username} got that 'one more game' syndrome... {totalPlays} plays in {gameName}!",
  "They said it couldn't be done. {username} said bet. {totalPlays} plays in {gameName}.",
  "Legend says {username} hasn't touched grass since hitting {totalPlays} plays in {gameName}.",
  "Casuals log off... grinders like {username} hit {totalPlays} plays in {gameName}.",
  "At this point {username} might live in {gameName} — {totalPlays} plays deep."
];

// ---------------------------
// Helper Functions
// ---------------------------
function getRandomMessage(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Calculates the score index for the Pairs game using the formula:
 *
 *   y = (105 - b) * e^(-((ln2)/4) * (x - 1))
 *
 * where:
 *   - b is the total number of turns,
 *   - x is the total time in seconds.
 *
 * @param totalTimeMs - The total time in milliseconds.
 * @param totalTurns - The number of turns taken.
 * @returns The score index.
 */
function calculateScoreIndex(totalTimeMs: number, totalTurns: number): number {
  // Cap the score at 100 if total time is under 1 second.
  if (totalTimeMs < 1000) return 100;
  const x = totalTimeMs / 1000;
  const y = (105 - totalTurns) * Math.exp(-((Math.log(2)) / 4) * (x - 1));
  return parseFloat(y.toFixed(3));
}

/**
 * Uploads a Pairs game score, updates the aggregated statistics,
 * and creates an activity notification ONLY if one of the following occurs:
 *   1. The new score is a new high score.
 *   2. The total plays is a multiple of 25.
 *
 * Activity documents are stored under:
 *    Activity/{userId}/Activity/{ActivityID}
 *
 * The `content.recipients` field is populated with the user's current friend list
 * so that only the friends present at activity creation see the notification.
 *
 * @param datePlayed - ISO date string representing when the game was played.
 * @param totalTurns - Total number of turns taken.
 * @param totalTimeMs - Total time taken in milliseconds.
 * @returns A promise that resolves with the document ID of the saved score.
 */
export async function uploadPairsGameScore(
  datePlayed: string,
  totalTurns: number,
  totalTimeMs: number
): Promise<string> {
  const dateObj = new Date(datePlayed);
  const formattedDate = dateObj.toLocaleDateString("en-US");
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const scoreIndex = calculateScoreIndex(totalTimeMs, totalTurns);
  const data = {
    date: formattedDate,
    time: formattedTime,
    totalTurns,
    totalTimeMs,
    scoreIndex,
    timestamp: Date.now(),
  };

  // Upload the score.
  const scoreDocId = await uploadGameScore("pairs", data);

  // Get the current user's ID.
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("No authenticated user.");
  }

  // Retrieve aggregated statistics for the Pairs game.
  const statsDocRef = doc(db, "Statistics", userId, "pairs");
  const statsSnap = await getDoc(statsDocRef);
  if (!statsSnap.exists()) {
    console.error("Aggregated statistics document not found for Pairs.");
    return scoreDocId;
  }
  const statsData = statsSnap.data() as { bestScoreIndex?: number; totalPlays?: number };

  // Retrieve the user's friend list from the profile.
  const profileDocRef = doc(db, "profile", userId);
  const profileSnap = await getDoc(profileDocRef);
  let friendRecipients: string[] = [];
  if (profileSnap.exists()) {
    const profileData = profileSnap.data() as { friends: { friends: string[] } };
    if (profileData.friends && profileData.friends.friends) {
      friendRecipients = profileData.friends.friends;
    }
  }

  // Prepare a batch to write the activity notifications.
  const batch = writeBatch(db);
  let activityWritten = false;

  // 1. New High Score Condition: if there is no previous high or if the new score beats it.
  if (statsData.bestScoreIndex === undefined || scoreIndex > statsData.bestScoreIndex) {
    const message = getRandomMessage(newHighScoreMessages)
      .replace("{username}", auth.currentUser?.displayName || "Someone")
      .replace("{gameName}", "Pairs")
      .replace("{previousHigh}", "N/A")
      .replace("{newHigh}", scoreIndex.toString());

    const highScoreActivity = {
      content: {
        recipients: friendRecipients,
        type: "newHighScore",
        message,
        data: { gameName: "Pairs", scoreIndex },
        fromUser: userId,
        timestamp: serverTimestamp(),
      },
      reactions: [],
      comments: []
    };

    const highScoreRef = doc(collection(db, "Activity", userId, "Activity"));
    batch.set(highScoreRef, highScoreActivity);
    activityWritten = true;
  }

  // 2. Milestone Condition: if total plays is a multiple of 25.
  if (statsData.totalPlays !== undefined && statsData.totalPlays % 25 === 0) {
    const message = getRandomMessage(milestoneMessages)
      .replace("{username}", auth.currentUser?.displayName || "Someone")
      .replace("{gameName}", "Pairs")
      .replace("{totalPlays}", statsData.totalPlays.toString());

    const milestoneActivity = {
      content: {
        recipients: friendRecipients,
        type: "milestone",
        message,
        data: { gameName: "Pairs", totalPlays: statsData.totalPlays },
        fromUser: userId,
        timestamp: serverTimestamp(),
      },
      reactions: [],
      comments: []
    };

    const milestoneRef = doc(collection(db, "Activity", userId, "Activity"));
    batch.set(milestoneRef, milestoneActivity);
    activityWritten = true;
  }

  // Commit the batch only if at least one activity document is being written.
  if (activityWritten) {
    await batch.commit();
  }

  return scoreDocId;
}
