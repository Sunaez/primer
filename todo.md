# Tasks to do
## Report related
1. Find one more game to implement, discuss and write code for
2. Start section 3(/4) slowly and discuss implementation


## Immediate tasks


1. Move all sign-in checks on load to a dedicated UserContext file (replacing the plain ThemeContext).
2. Save reads by storing general user information to the context directly and making sure it is constantly in line with the database. When a change is made, the change is made directly to the database which is read by the user's context and then that change being reflected in other aspects.
3. All pages just get the context from the actual user's context instead of the database.
4. When the user logs out, their authentication is cleared, local cache is cleared and user context is emptied. 



* justify defaulting dark mode
4. Add pictures to make it more engaging
    * for freeplay - This could be a short picture or a video that actually explains how the game works -D (just got reaction left)
4. In each game, show a graph showing previous results to see progress. Put this in the profile page or social page
* Reference humanbenchmark for the pairs explanation 273ms, doubling it because you react to two things



* add a "getting started" section to show what each thing does
* add a way of explaining why this actually is useful
## Front End
### Game related
2. Add the files for all the other games
3. Start making code for:
 1. N-back (maybe the GTA game where there's 6 buttons)
 3. Tetris
### Not Game Related
5. Daily streak implementation
 * If a user has played yesterday it should add 1 to their score
7. Generate individual reports for each user
 * Similar to spotify wrapped
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


Add landing page to show functionality and how to best use it
* Password stuff (min length / security)
* Add talking to each other - maybe activity feature
* add more contrasting colours , avoiding a little bit of monochromatic themes


between 10k - 15k words for report



presentation for demo needs to be done after report is completed
25 minutes to show complete work
Start with a bit of the code
Explain features from the code
Go to presentation and demo the working code
