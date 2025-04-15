// /components/backend/activityNotifications.tsx
import { auth, db } from "@/components/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  writeBatch,
  serverTimestamp,
  WriteBatch
} from "firebase/firestore";

// ---------------------------
// Message Templates
// ---------------------------
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

const friendDailyBestBeatenMessages = [
  "{username} just beat your daily score in {gameName} by {diff} points!",
  "Heads up! {username}'s new daily score in {gameName} beats yours by {diff} points!",
  "It's looking rough... {username} cooked you by {diff} points today in {gameName}.",
  "Today's scoreboard? {username} owns it. Beat you by {diff} points in {gameName}.",
  "{username} just woke up and decided to drop {diff} points more than you in {gameName}.",
  "You were doing good until {username} dropped {diff} points on your head in {gameName}.",
  "Daily leaderboard check... {username} left you behind by {diff} points in {gameName}.",
  "{username} said 'lemme just slide in first place real quick' — up by {diff} points in {gameName}.",
  "Unlucky... {username} outscored you by {diff} points in {gameName} today. Pack watch?",
  "{username} moving like it's a side quest — beat you by {diff} points in {gameName}.",
  "Another day, another diff... {username} leads by {diff} points in {gameName}."
];

// ---------------------------
// Helper Functions
// ---------------------------
function getRandomMessage(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Helper to create an activity document in the triggering user's activity feed.
 * The activity is stored in the "activities" subcollection under the user's profile document.
 */
function createActivity(batch: WriteBatch, ownerUserId: string, activityData: any) {
  const activityRef = doc(collection(db, "profile", ownerUserId, "activities"));
  batch.set(activityRef, activityData);
}

// ---------------------------
// Types
// ---------------------------
export interface StatsData {
  bestScoreIndex?: number;
  dailyBestScoreIndex?: number;
  totalPlays?: number;
  updatedAt?: any;
}

/**
 * runActivityNotifications runs the client‑side logic to generate activity notifications
 * after a user's game statistics have been updated.
 *
 * It reads the user's aggregated statistics for the given game and then:
 *
 * 1. For each friend, if the user's current daily best score beats the friend's daily best score,
 *    a "friendDailyBestBeaten" notification is generated.
 * 2. If the user's total plays is a multiple of 25, a milestone notification is generated.
 *
 * Each notification is written to the triggering user's "activities" subcollection and includes a
 * `recipients` array that lists the user IDs allowed to view the notification.
 *
 * @param userId The user ID.
 * @param gameId The game identifier.
 */
export async function runActivityNotifications(
  userId: string,
  gameId: string
): Promise<void> {
  // Retrieve the user's aggregated statistics document for this game.
  const statsDocRef = doc(db, "Statistics", userId, "games", gameId);
  const statsDocSnap = await getDoc(statsDocRef);
  if (!statsDocSnap.exists()) {
    console.error(`Aggregated statistics not found for user ${userId} in game ${gameId}.`);
    return;
  }
  const userStats = statsDocSnap.data() as StatsData;
  
  // Retrieve the user's profile document to extract username and friends list.
  const userDocRef = doc(db, "profile", userId);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    console.error(`User document for ${userId} not found.`);
    return;
  }
  const userData = userDocSnap.data();
  const username = userData?.username || "Someone";
  const friendsList: string[] = userData?.friends?.friends || [];
  const gameName = gameId; // Adjust if you have a friendlier display name

  // Create a batch for atomic writes.
  const batch = writeBatch(db);

  // --- Event 1: Friend Daily Best Beaten ---
  // For each friend, if the user's current daily best exceeds the friend's,
  // create a notification.
  if (userStats.dailyBestScoreIndex !== undefined) {
    await Promise.all(
      friendsList.map(async (friendId) => {
        const friendStatsRef = doc(db, "Statistics", friendId, "games", gameId);
        const friendStatsSnap = await getDoc(friendStatsRef);
        if (friendStatsSnap.exists()) {
          const friendStats = friendStatsSnap.data();
          if (
            typeof friendStats?.dailyBestScoreIndex === "number" &&
            (userStats.dailyBestScoreIndex ?? 0) > friendStats.dailyBestScoreIndex
          ) {
            const diff = (userStats.dailyBestScoreIndex ?? 0) - friendStats.dailyBestScoreIndex;
            const template = getRandomMessage(friendDailyBestBeatenMessages);
            const message = template
              .replace("{username}", username)
              .replace("{gameName}", gameName)
              .replace("{diff}", diff.toString())
              .replace("{friendDaily}", friendStats.dailyBestScoreIndex.toString())
              .replace("{userDaily}", (userStats.dailyBestScoreIndex ?? 0).toString());
            const activityData = {
              content: {
                recipients: [userId, friendId],
                type: "friendDailyBestBeaten",
                message,
                data: {
                  relatedGame: gameName,
                  friendDaily: friendStats.dailyBestScoreIndex,
                  userDaily: userStats.dailyBestScoreIndex,
                  diff,
                },
                fromUser: userId,
                timestamp: serverTimestamp(),
              },
              reactions: [],
              comments: [],
            };
            createActivity(batch, userId, activityData);
          }
        }
      })
    );
  }

  // --- Event 2: Milestone ---
  // If the user's total plays is a multiple of 25, generate a milestone notification.
  if (
    userStats.totalPlays !== undefined &&
    userStats.totalPlays % 25 === 0
  ) {
    const totalPlays = userStats.totalPlays;
    const template = getRandomMessage(milestoneMessages);
    const message = template
      .replace("{username}", username)
      .replace("{gameName}", gameName)
      .replace("{totalPlays}", totalPlays.toString());
    const activityData = {
      content: {
        recipients: [userId, ...friendsList],
        type: "milestone",
        message,
        data: { relatedGame: gameName, totalPlays },
        fromUser: userId,
        timestamp: serverTimestamp(),
      },
      reactions: [],
      comments: [],
    };
    createActivity(batch, userId, activityData);
  }

  // Commit all batched writes atomically.
  await batch.commit();
}
