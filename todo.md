# Tasks to do
## Report related
1. Find one more game to implement, discuss and write code for
2. Start section 3(/4) slowly and discuss implementation


## Immediate tasks Before the 17th


6. For simplicity, give the social section just:
 1. The top players total score for the games
 2. The best players of that day
 * Fix the data collection to collect the game that its playing
    * It works for the overall data collection but it does not work for the dailybests?
 * Add animation when dropping down the list of games



4. Add pictures to make it more engaging
    * for freeplay - This could be a short picture or a video that actually explains how the game works -D
        * ~~Also move the style from rows into larger square shapes and on hover, it expands and displays a video of how the game works~~


-> So far I got the front end functional but the backend needs more work
gonna need to upgrade to blaze to upload a certain function, or look at other methods
of implmenting it.



1. Write the code for each game to collect the data thats used to make sure it records their scores


* Make the games list a seperate .ts file array so you only have to change it there

## Front End
### Game related
2. Add the files for all the other games
3. Start making code for:
 1. N-back (maybe the GTA game where there's 6 buttons)
 2. Quick pair match
 3. Tetris
 4. Stroop Test
4. In each game, show a graph showing previous results to see progress

### Not Game Related
1. Make code for the profile page to be better
 1. Add stats
 2. Improve the profile to have more profile customisation
    1. App theme
    2. Stats
    3. Make banner colour simpler to adjust
2. Make some daily games, maybe base the id on the time of day?
3. Maybe add "react native animated" for some nice animations between everything. 🪇
4. Add pictures to make it more engaging
    * This could be a short picture or a video that actually explains how the game works -D
5. Daily streak implementation
 * If a user has played yesterday it should add 1 to their score
~~6. For simplicity, give the social section just:~~
~~ 1. The top players total score for the games~~
~~ 2. The best players of that day~~
7. Generate individual reports for each user
 * Similar to spotify wrapped
## Back End

### Data Storage related
1. Make the data for the games a single file, that way changing it is easier to find, can be quicker and isnt called in multiple places
    * Place in constants



### Not API Related
1. Write the code for each game to collect the data thats used to make sure it records their scores
2. Save progress from matches to allow show for "Not Game Related" 1.2.5



~~## Repo Related~~
~~1. Include instructions on cloining the code and actually making a firebase project~~
~~2. Show a demonstration of making the .env file and possibly how to use it~~

Deb suggested chatbots + more aesthetics

## ideas
* Consider how you can engage users
 * Animations
 * Special effects
 * Videos and additional images