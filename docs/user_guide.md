GameLens NBA Analytics Dashboard
User Guide for New Users
________________


Who This Guide Is For
This guide is designed for new users, teaching assistants, and instructors who want to understand, install, and use the GameLens NBA Analytics Dashboard. No prior experience with sports analytics or coding is required, though basic familiarity with running applications from the command line is helpful.
________________


System Overview
GameLens is a comprehensive NBA analytics dashboard that transforms raw game data into actionable basketball insights. The system connects to the SportsDataIO replay API to provide:
* Real-time game tracking with live status indicators
* Detailed game analysis including team and player statistics
* Head-to-head team comparisons across 8 key performance categories
* Conference standings with playoff positioning and games-back calculations
* Historical matchup data with links to detailed boxscores
The dashboard is built for basketball enthusiasts, fantasy players, and sports analysts who want to understand why teams win, not just the final score.
________________


Installation & Setup
Prerequisites
Before installing GameLens, ensure you have:
* Node.js (version 14 or higher) - Download here
* npm (usually installed with Node.js)
* Git (optional, for cloning) - Download here
* Modern web browser (Chrome, Firefox, Safari, or Edge)
Step-by-Step Installation
1. Clone or Download the Repository
# Using Git (recommended)
git clone https://github.com/yourusername/gamelens-nba-dashboard.git
cd gamelens-nba-dashboard

# Or download and extract the ZIP file from your repository
	2. Install Dependencies
npm install
	

This installs all required packages including Express, node-fetch, and dotenv.
3. Set Up Environment Variables
Create a file named .env in the root directory:
# .env file
SPORTSDATAIO_API_KEY=your_api_key_here
PORT=3000
	

Important: You need a SportsDataIO API key. If you don't have one:
1. Visit SportsDataIO
2. Sign up for a free trial or developer account
3. Copy your API key from the dashboard
4. Start the Application
npm start
	

You should see:
==========================================
NBA Live Analytics Dashboard - Enhanced
Server running on http://localhost:3000
Using dynamic replay system
==========================================
	

5. Access the Dashboard
Open your browser and navigate to:
http://localhost:3000
	

Core Workflow: Analyzing a Game Matchup
This step-by-step guide shows how to use GameLens to analyze an NBA game matchup.
Step 1: View the Dashboard
When you first open the application, you'll see:
* Header: Shows current replay time and date range
* Live Games Section: Displays any games currently in progress
* Completed Games: Games with full statistics available (green indicator)
* Upcoming Games: Scheduled games (orange indicator)
* Standings Preview: Top teams from each conference
* Team Comparison Card: Tool for analyzing team matchups
Step 2: Explore Completed Games
1. In the "Completed Games" section, you'll see a list of finished games
2. Each game shows:
   * Time/date of the game
   * Team names and final scores
   * "FINAL" status indicator
3. Click any completed game to view its detailed analytics
Step 3: Analyze a Game in Detail
After clicking a game (e.g., "Boston Celtics vs Philadelphia 76ers"), you'll see:
Final Score Section: Displays the final score prominently
Team Statistics Summary:
* Field goal percentages
* Three-point shooting
* Rebounds, assists, steals, blocks
* Turnovers and fouls
Key Players Section:
* Top performers from each team
* Points, rebounds, assists for each player
* Minutes played and shooting efficiency
Quarter Scores: Quarter-by-quarter breakdown of scoring
Step 4: Compare Two Teams
1. Return to the main dashboard by clicking "Back to Games"
2. Find the "Team Comparison" card
3. Click "Start New Comparison"
4. In the modal window:
   * Select first team (e.g., "Boston Celtics")
   * Select second team (e.g., "Los Angeles Lakers")
   * Click "Compare"
The comparison results show:
* Team records and conferences
* Head-to-head win/loss record
* Statistical comparison across 8 categories (↑ indicates leader)
* Recent matchup history with clickable links to game details
Step 5: View Full Standings
1. From the main dashboard, find the standings preview
2. Click "View Full Standings"
3. In the modal window, see:
   * Complete 15-team conference standings
   * Playoff-position teams highlighted in green
   * Games-back calculations for each team
   * Win percentages
________________


Where Outputs Appear & How to Interpret Them
Game List View
Element
	Location
	Meaning
	Green border
	Game list item
	Game is completed with full statistics
	Orange border
	Game list item
	Game is upcoming/scheduled
	Green pulse border
	Game list item
	Game is currently live
	FINAL badge
	Game list item
	Game completed, click for stats
	UPCOMING badge
	Game list item
	Game scheduled, basic info only
	LIVE badge
	Game list item
	Game in progress
	Game Detail View
Section
	Interpretation
	Final Score
	Winner has higher score; margin indicates game competitiveness
	Team Stats
	Higher percentages = better efficiency; rebound advantage = possession control
	Key Players
	Top scorers, rebounders, playmakers; minutes show coach trust
	Quarter Scores
	Momentum shifts; which team dominated which periods
	Team Comparison View
Indicator
	Meaning
	↑ arrow
	Team leads in this statistical category
	Green highlight
	Team has advantage
	Head-to-head record
	Historical dominance between teams
	Recent matchups
	Last 3 games with dates and scores
	________________


Troubleshooting Tips
Tip 1: "Cannot connect to server" error
Problem: You see "Failed to fetch" or "Connection refused" errors.
Solutions:
1. Check if server is running: Ensure npm start is running and shows "Server running on http://localhost:3000"
2. Verify port availability: Make sure port 3000 isn't being used by another application
3. Check API key: Ensure your .env file contains a valid SportsDataIO API key
4. Restart the server: Press Ctrl+C to stop, then npm start again
Tip 2: "No games available" or empty dashboard
Problem: The dashboard loads but shows no games.
Solutions:
1. Wait for data refresh: The system refreshes every 2 minutes; give it time
2. Check replay date range: The system uses November 13-14, 2023 data; no games outside this range
3. Verify API connection: Check console for API errors (F12 → Console tab)
4. Clear browser cache: Sometimes cached data causes display issues
Tip 3: API Key errors
Problem: Console shows "Invalid API key" or "401 Unauthorized"
Solutions:
1. Copy key correctly: Ensure no extra spaces when pasting into .env
2. Check API subscription: Free tier may have limited access to certain endpoints
3. Regenerate key: Get a new key from SportsDataIO dashboard
Tip 4: Missing dependencies after npm install
Problem: Errors about missing packages when starting the server.
Solutions:
# Delete node_modules and reinstall
rm -rf node_modules
npm cache clean --force
npm install

# Or install missing packages individually
npm install express node-fetch dotenv
	

Getting Help
If you encounter issues not covered in this guide:
1. Check the console: Press F12 in your browser and look for error messages
2. Review the code: Check server logs in the terminal where you ran npm start
3. Contact support: Reach out to the development team with:
   * Screenshots of the error
   * Console output
   * Steps to reproduce
________________


Quick Reference
Command
	Purpose
	npm install
	Install all dependencies
	npm start
	Start the server
	http://localhost:3000
	Access the dashboard
	Ctrl+C
	Stop the server
	File Locations:
* Main application: server.js
* Frontend files: public/ directory
* Documentation: docs/ directory
* Environment variables: .env file