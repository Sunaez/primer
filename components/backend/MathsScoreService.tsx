// /components/backend/mathGameScore.ts
import { uploadGameScore } from "./scoreService";
import { auth, db } from "@/components/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
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
 * Calculates the score index for the Maths game using the formula:
 *   S(T, C) where:
 *     T = reactionTime in ms
 *     C = number of correct answers
 *
 * @param T Reaction time in ms.
 * @param C Number of correct answers.
 * @returns Score index.
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
 * Uploads a Maths game score, updates aggregated statistics, and creates an activity
 * notification if one of these conditions is met:
 *  1. New High Score: new score is equal to or higher than the previous best.
 *  2. Milestone: total plays is a multiple of 25.
 *
 * Aggregated stats are stored in a dedicated document at:
 *    Statistics/{userId}/maths/data
 *
 * Activity documents are stored under:
 *    /Activity/{userId}/Activity/{ActivityID}
 *
 * The activity document includes:
 *  - content.recipients: friend list from the user's profile.
 *  - sender: an array containing an object with { uid, username, theme }.
 *
 * @param datePlayed ISO date string representing when the game was played.
 * @param totalScore Total number of correct answers.
 * @param averageReactionTimeMs Average reaction time in ms.
 * @returns A promise that resolves with the document ID of the saved score.
 */
export async function uploadMathsGameScore(
  datePlayed: string,
  totalScore: number,
  averageReactionTimeMs: number
): Promise<string> {
  try {
    // Format date and time.
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

    // Upload the raw score.
    const scoreDocId = await uploadGameScore("maths", data);
    console.log("Score document uploaded:", scoreDocId);

    // Ensure the current user is authenticated.
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("No authenticated user.");
    }
    console.log("User ID:", userId);

    // Retrieve aggregated statistics.
    // Fix: Use a document ID at the end so the reference has an even number of segments.
    const statsDocRef = doc(db, "Statistics", userId, "maths", "data");
    let statsData: { bestScoreIndex?: number; totalPlays?: number } = {};
    const statsSnap = await getDoc(statsDocRef);
    if (!statsSnap.exists()) {
      console.log("Aggregated stats document not found; creating new document.");
      statsData = { bestScoreIndex: scoreIndex, totalPlays: 1 };
      try {
        await setDoc(statsDocRef, statsData, { merge: true });
        console.log("Aggregated stats document created:", statsData);
      } catch (err) {
        console.error("Error creating aggregated stats document:", err);
      }
    } else {
      statsData = statsSnap.data() as { bestScoreIndex?: number; totalPlays?: number };
      const newTotalPlays = (statsData.totalPlays || 0) + 1;
      const newBestScoreIndex = scoreIndex >= (statsData.bestScoreIndex || 0)
        ? scoreIndex
        : statsData.bestScoreIndex;
      try {
        await setDoc(statsDocRef, {
          totalPlays: newTotalPlays,
          bestScoreIndex: newBestScoreIndex,
        }, { merge: true });
        statsData.totalPlays = newTotalPlays;
        statsData.bestScoreIndex = newBestScoreIndex;
        console.log("Aggregated stats updated:", statsData);
      } catch (err) {
        console.error("Error updating aggregated stats document:", err);
      }
    }

    // Retrieve user's profile to get friend list and sender information.
    const profileDocRef = doc(db, "profile", userId);
    const profileSnap = await getDoc(profileDocRef);
    let friendRecipients: string[] = [];
    let sender = {
      uid: userId,
      username: "Unknown",
      theme: "Default",
    };
    if (profileSnap.exists()) {
      const profileData = profileSnap.data();
      sender = {
        uid: userId,
        username: profileData.username || "Unknown",
        theme: profileData.theme || "Default",
      };
      if (profileData.friends && profileData.friends.friends) {
        friendRecipients = profileData.friends.friends;
      }
    }
    console.log("Sender info:", sender);
    console.log("Friend recipients:", friendRecipients);

    // Write activity documents using individual setDoc calls.
    // Condition 1: New High Score.
    if (statsData.bestScoreIndex === undefined || scoreIndex >= statsData.bestScoreIndex) {
      const message = getRandomMessage(newHighScoreMessages)
        .replace("{username}", sender.username)
        .replace("{gameName}", "Maths")
        .replace("{previousHigh}", statsData.bestScoreIndex ? statsData.bestScoreIndex.toString() : "N/A")
        .replace("{newHigh}", scoreIndex.toString());
      const highScoreActivity = {
        content: {
          recipients: friendRecipients,
          type: "newHighScore",
          message,
          data: { gameName: "Maths", scoreIndex },
          sender: [sender],
          timestamp: serverTimestamp(),
        },
        reactions: [],
        comments: [],
      };
      try {
        const highScoreRef = doc(collection(db, "Activity", userId, "Activity"));
        await setDoc(highScoreRef, highScoreActivity);
        console.log("New high score activity written:", highScoreActivity);
      } catch (err) {
        console.error("Error writing new high score activity:", err);
      }
    }

    // Condition 2: Milestone - total plays is a multiple of 25.
    if (statsData.totalPlays !== undefined && statsData.totalPlays % 25 === 0) {
      const message = getRandomMessage(milestoneMessages)
        .replace("{username}", sender.username)
        .replace("{gameName}", "Maths")
        .replace("{totalPlays}", statsData.totalPlays.toString());
      const milestoneActivity = {
        content: {
          recipients: friendRecipients,
          type: "milestone",
          message,
          data: { gameName: "Maths", totalPlays: statsData.totalPlays },
          sender: [sender],
          timestamp: serverTimestamp(),
        },
        reactions: [],
        comments: [],
      };
      try {
        const milestoneRef = doc(collection(db, "Activity", userId, "Activity"));
        await setDoc(milestoneRef, milestoneActivity);
        console.log("Milestone activity written:", milestoneActivity);
      } catch (err) {
        console.error("Error writing milestone activity:", err);
      }
    }

    console.log("Activity upload process complete.");
    return scoreDocId;
  } catch (err) {
    console.error("Error in uploadMathsGameScore:", err);
    throw err;
  }
}
