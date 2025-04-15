import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

// Initialize the Admin SDK if not already initialized.
if (!admin.apps.length) {
  admin.initializeApp();
}

// Message templates for various events.
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

const friendHighScoreBeatenMessages = [
  "Someone's having a good day! {username} just beat your all-time high in {gameName}!",
  "Big news! {username} has surpassed your top score in {gameName}!",
  "{username} just MOGGED your score in {gameName}... skill issue?",
  "Only in Ohio bro,{username} left your {gameName} score in the dust!",
  "Sheeesh, {username} just hit a new PR in {gameName} and left you lookin like a tutorial level.",
  "Oof... {username} just hard diffed you in {gameName}. Time to lock in?",
  "Breaking news: {username} went sigma mode in {gameName} and shattered your record!",
  "{username} pulled up on {gameName} and said 'watch this' — your score got packed.",
  "Certified edge moment — {username} just gooned on your {gameName} high score!",
  "Your {gameName} score? Gone. Packed. Shipped. Thanks to {username}.",
  "Historic hater moment from {username} — your {gameName} score didn't stand a chance.",
  "Pray for your scoreboard... {username} is farming in {gameName} right now.",
  "'Nah, I'd win' is what {username} said before smoking you in {gameName}."
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

// Helper function to randomly choose a message template.
function getRandomMessage(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Helper to create an activity document in the triggering user's activities feed.
 * The document will include a `recipients` field that specifies which users
 * are allowed to view it.
 */
function createActivity(
  batch: FirebaseFirestore.WriteBatch,
  db: FirebaseFirestore.Firestore,
  ownerUserId: string,
  activityData: any
) {
  const activityRef = db
    .collection("profile")
    .doc(ownerUserId)
    .collection("activities")
    .doc();
  batch.set(activityRef, activityData);
}

/**
 * Triggered when a user's game statistics document is updated.
 * It compares the old and new stats and generates notifications as a single
 * document per event in the user's activities feed. Each notification includes a
 * `recipients` array that lists which users (the user plus specific friends)
 * are allowed to see it.
 *
 * Events:
 * 1. **New High Score:**  
 *    - If only one friend’s all-time high is beaten, a notification is created for that friend (along with the user).
 *    - If more than one friend qualifies, a broadcast notification is created for all friends (and the user).
 *
 * 2. **Friend Daily Best Beaten:**  
 *    For each friend, if the user's updated daily best beats that friend's daily best,
 *    a notification is created with the friend as a recipient along with the user.
 *
 * 3. **Milestone:**  
 *    If total plays reach a multiple of 25, a milestone notification is created for all friends (and the user).
 *
 * Front end: Query activities owned by yourself or your friends, then filter based on whether a given activity's `recipients` array includes your userId.
 */
export const onStatisticsUpdate = onDocumentUpdated(
  {
    document: "Statistics/{userId}/games/{gameId}",
  },
  async (event: any) => {
    // Extract before/after snapshots and their data.
    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;
    const beforeData = beforeSnapshot?.data();
    const afterData = afterSnapshot?.data();
    const { userId, gameId } = event.params;

    // Exit if there's no data to compare.
    if (!beforeData || !afterData) {
      return;
    }

    const db = admin.firestore();

    // Retrieve the user's profile document from the "profile" collection.
    const userDoc = await db.collection("profile").doc(userId).get();
    if (!userDoc.exists) {
      logger.error(`User document for userId ${userId} not found.`);
      return;
    }
    const userData = userDoc.data();

    // Extract username and friends list (using an empty array if none exists).
    const username = userData?.username || "Someone";
    const friendsList: string[] = userData?.friends?.friends || [];
    const gameName = gameId; // Adjust as needed for a friendlier game name.

    // Create a batch to perform writes atomically.
    const batch = db.batch();

    // ----
    // **Event 1: New All-Time High Score**
    if (afterData.bestScoreIndex > (beforeData.bestScoreIndex || 0)) {
      const previousHigh = beforeData.bestScoreIndex || 0;
      const newHigh = afterData.bestScoreIndex;

      // Check each friend's statistics in parallel to see if their all-time high is beaten.
      const qualifyingForHighScore = await Promise.all(
        friendsList.map(async (friendId) => {
          const friendStatsRef = db
            .collection("Statistics")
            .doc(friendId)
            .collection("games")
            .doc(gameId);
          const friendStatsDoc = await friendStatsRef.get();
          if (friendStatsDoc.exists) {
            const friendStats = friendStatsDoc.data();
            if (
              typeof friendStats?.bestScoreIndex === "number" &&
              newHigh > friendStats.bestScoreIndex
            ) {
              return friendId;
            }
          }
          return null;
        })
      );
      const qualifyingFriends = qualifyingForHighScore.filter(
        (fid) => fid !== null
      ) as string[];

      if (qualifyingFriends.length === 1) {
        // One friend's record is beaten.
        const friendId = qualifyingFriends[0];
        const template = getRandomMessage(friendHighScoreBeatenMessages);
        const message = template
          .replace("{username}", username)
          .replace("{gameName}", gameName);
        const activityData = {
          content: {
            // This notification is intended for the triggering user and the specific friend.
            recipients: [userId, friendId],
            type: "friendHighScoreBeaten",
            message,
            data: { relatedGame: gameName, previousHigh, newHigh },
            fromUser: userId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
          reactions: [],
          comments: [],
        };
        createActivity(batch, db, userId, activityData);
      } else if (qualifyingFriends.length > 1) {
        // Broadcast a new high score message to all friends.
        const template = getRandomMessage(newHighScoreMessages);
        const message = template
          .replace("{username}", username)
          .replace("{gameName}", gameName)
          .replace("{previousHigh}", previousHigh.toString())
          .replace("{newHigh}", newHigh.toString());
        const activityData = {
          content: {
            // Visible to the user and all friends.
            recipients: [userId, ...friendsList],
            type: "newHighScore",
            message,
            data: { relatedGame: gameName, previousHigh, newHigh },
            fromUser: userId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
          reactions: [],
          comments: [],
        };
        createActivity(batch, db, userId, activityData);
      }
    }

    // ----
    // **Event 2: Friend Daily Best Beaten**
    if (afterData.dailyBestScoreIndex) {
      const friendDailyPromises = friendsList.map(async (friendId) => {
        const friendStatsRef = db
          .collection("Statistics")
          .doc(friendId)
          .collection("games")
          .doc(gameId);
        const friendStatsDoc = await friendStatsRef.get();
        if (friendStatsDoc.exists) {
          const friendStats = friendStatsDoc.data();
          if (
            typeof friendStats?.dailyBestScoreIndex === "number" &&
            afterData.dailyBestScoreIndex > friendStats.dailyBestScoreIndex
          ) {
            // Calculate the difference.
            const diff =
              afterData.dailyBestScoreIndex - friendStats.dailyBestScoreIndex;
            const template = getRandomMessage(friendDailyBestBeatenMessages);
            const message = template
              .replace("{username}", username)
              .replace("{gameName}", gameName)
              .replace("{diff}", diff.toString())
              .replace("{friendDaily}", friendStats.dailyBestScoreIndex.toString())
              .replace("{userDaily}", afterData.dailyBestScoreIndex.toString());
            const activityData = {
              content: {
                // Visible to the user and the specific friend.
                recipients: [userId, friendId],
                type: "friendDailyBestBeaten",
                message,
                data: {
                  relatedGame: gameName,
                  friendDaily: friendStats.dailyBestScoreIndex,
                  userDaily: afterData.dailyBestScoreIndex,
                  diff,
                },
                fromUser: userId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
              },
              reactions: [],
              comments: [],
            };
            createActivity(batch, db, userId, activityData);
          }
        }
      });
      await Promise.all(friendDailyPromises);
    }

    // ----
    // **Event 3: Milestone Event**
    if (
      afterData.totalPlays % 25 === 0 &&
      afterData.totalPlays !== beforeData.totalPlays
    ) {
      const totalPlays = afterData.totalPlays;
      const template = getRandomMessage(milestoneMessages);
      const message = template
        .replace("{username}", username)
        .replace("{gameName}", gameName)
        .replace("{totalPlays}", totalPlays.toString());
      const activityData = {
        content: {
          // Visible to the user and all friends.
          recipients: [userId, ...friendsList],
          type: "milestone",
          message,
          data: { relatedGame: gameName, totalPlays },
          fromUser: userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
        reactions: [],
        comments: [],
      };
      createActivity(batch, db, userId, activityData);
    }

    // Commit all batched writes atomically.
    return batch.commit();
  }
);
