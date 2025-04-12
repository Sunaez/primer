# Tasks to do
## Report related
1. Find one more game to implement, discuss and write code for
2. Start section 3(/4) slowly and discuss implementation


## Immediate tasks
### Code Related


1. In each game, Indicate their previous highest score and whether this score is a new high score
 1. First, add an event in uploading in each score service which actually uploads to a new database for each user. This is unique for each game and has:
  2. Daily Best score
  3. High score
  4. Total number of plays
  5. By doing this, we can add some checks:
  1. If a user beats their previous high score then send an activity - to: All friends
   * example: " {Username} beat their score in {Game name} from {Previous High Score} to {High Score}"
  2. If a user beats their friend's daily score with their own daily score - to: Friend who's score got beaten 
   * example: " {Friend's Username} just beat your score on {Game name} by {Points difference}, you gonna let that slide?"
  3. If a friend's daily score surpasses a user's high score - to: User
   * example: "Someone's having a good day! {Friend's username} Just beat your highscore on {Game name}! "
  4. If a user's daily score surpasses a friend's high score - to: Friend
   * example: "Someone's having a good day! {username} Just beat your highscore on {Game name}! "
  5. If a user hits a multiple of 25 in total number of plays - to: All friends
   * example: " {username} just got {Number of plays} plays !"
 3. Next, when we receive a friend request we should send an activity alert to the user, allowing them to accept or reject it from the alerts.
 4. For each activity (excluding friend requests) Allow for:
  1. Unique Emoji reactions (similar to facebook)
  2. Comments visible to everyone (a friend's friend should be able to see their comment )
   * explained. Imagine Friendship A-B-C, person A is not friends with person C but B is friends with both. If person B sends activity to his friends, user's A and C should be able to see each other's reaction's as well as messages.

* Fix the onboarding not working on iphone


2. Add pictures to make it more engaging
    * for freeplay - This could be a short picture or a video that actually explains how the game works -D (just got reaction + stroop left)

### Report Related
* justify defaulting dark mode in report


## Front End
### Game related
3. Start making code for:
 1. N-back (maybe the GTA game where there's 6 buttons)
 3. Tetris
### Not Game Related

## Back End
### Not API Related
Deb suggested chatbots + more aesthetics

## ideas
* Consider how you can engage users
 * Animations
 * Special effects
 * Videos and additional images
* Password hasing - Prevent MITM attacks
* Use more React Native reanimated
* Generate individual reports for each user
 * Similar to spotify wrapped
* Password stuff (min length / security)


between 10k - 15k words for report
presentation for demo needs to be done after report is completed
25 minutes to show complete work
Start with a bit of the code
Explain features from the code
Go to presentation and demo the working code
* When presenting, animations would be really nice to add, whether to show the app icon for the framework
 * Also animations for each graph thats used
