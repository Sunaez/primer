// /components/backend/stroopTestScore.ts
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
 * Calculates the score index for the Stroop test using:
 *   S(T, C) where:
 *     T = average reaction time in ms
 *     C = number of correct answers
 *
 * @param T - Average reaction time in milliseconds.
 * @param C - Number of correct answers.
 * @returns The calculated score index.
 */
function calculateScoreIndex(T: number, C: number): number {
  if (T > 0 && T <= 250) {
    return C * (5 - 5 * Math.cos((Math.PI / 250) * T));
  } else if (T > 250 && T < 10000) {
    const exponent = (Math.log(0.8) / 625) * ((T - 250) / 2);
    return 10 * C * Math.exp(exponent);
  } else {
    return 0;
  }
}

/**
 * Uploads a Stroop test game score, updates aggregated statistics,
 * and creates an activity notification ONLY if one of the following conditions is met:
 *   1. The new score is a new high score.
 *   2. The total plays count is a multiple of 25.
 *
 * Activity documents are stored under:
 *    Activity/{userId}/Activity/{ActivityID}
 *
 * The activity document's `content.recipients` is populated with the user's current friend list
 * (ensuring that new friends do not see old activity).
 *
 * @param datePlayed - ISO date string representing when the game was played.
 * @param totalScore - Total number of correct answers.
 * @param averageReactionTimeMs - Average reaction time in milliseconds.
 * @returns A promise that resolves with the document ID of the saved score.
 */
export async function uploadStroopTestScore(
  datePlayed: string,
  totalScore: number,
  averageReactionTimeMs: number
): Promise<string> {
  const dateObj = new Date(datePlayed);
  const formattedDate = dateObj.toLocaleDateString("en-US");
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Calculate the score index.
  const scoreIndex = calculateScoreIndex(averageReactionTimeMs, totalScore);
  const data = {
    date: formattedDate,
    time: formattedTime,
    averageReactionTime: Math.round(averageReactionTimeMs),
    score: totalScore,
    scoreIndex: parseFloat(scoreIndex.toFixed(3)),
    timestamp: Date.now(),
  };

  // Upload the raw score and update aggregated statistics.
  const scoreDocId = await uploadGameScore("stroop", data);

  // Get the current user's ID.
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("No authenticated user.");
  }

  // Retrieve the aggregated statistics for the Stroop test game.
  const statsDocRef = doc(db, "Statistics", userId, "stroop");
  const statsSnap = await getDoc(statsDocRef);
  if (!statsSnap.exists()) {
    console.error("Aggregated statistics document not found for Stroop.");
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

  // Prepare a batch to write activity notifications.
  const batch = writeBatch(db);
  let activityWritten = false;

  // 1. New High Score Condition: if there's no previous best or if the new score beats it.
  if (statsData.bestScoreIndex === undefined || scoreIndex > statsData.bestScoreIndex) {
    const message = getRandomMessage(newHighScoreMessages)
      .replace("{username}", auth.currentUser?.displayName || "Someone")
      .replace("{gameName}", "Stroop")
      .replace("{previousHigh}", "N/A")
      .replace("{newHigh}", scoreIndex.toString());

    const highScoreActivity = {
      content: {
        recipients: friendRecipients,
        type: "newHighScore",
        message,
        data: { gameName: "Stroop", scoreIndex },
        fromUser: userId,
        timestamp: serverTimestamp(),
      },
      reactions: [],
      comments: []
    };

    // Write to: Activity/{userId}/Activity/{ActivityID}
    const highScoreRef = doc(collection(db, "Activity", userId, "Activity"));
    batch.set(highScoreRef, highScoreActivity);
    activityWritten = true;
  }

  // 2. Milestone Condition: if the total plays is a multiple of 25.
  if (statsData.totalPlays !== undefined && statsData.totalPlays % 25 === 0) {
    const message = getRandomMessage(milestoneMessages)
      .replace("{username}", auth.currentUser?.displayName || "Someone")
      .replace("{gameName}", "Stroop")
      .replace("{totalPlays}", statsData.totalPlays.toString());

    const milestoneActivity = {
      content: {
        recipients: friendRecipients,
        type: "milestone",
        message,
        data: { gameName: "Stroop", totalPlays: statsData.totalPlays },
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

  // Commit the batch only if an activity document was written.
  if (activityWritten) {
    await batch.commit();
  }

  return scoreDocId;
}
