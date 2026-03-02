Team Comparison Endpoint
Name and Description
GET /api/compare/:team1/:team2 - Retrieves comprehensive head-to-head statistics and performance metrics for two specified NBA teams, enabling data-driven matchup analysis.
________________


Endpoint Signature
text
GET /api/compare/:team1/:team2
Example Request:
text
GET /api/compare/BOS/LAL
________________


Parameters
Parameter
	Type
	Location
	Required
	Description
	team1
	string
	URL path
	Yes
	Three-letter team code for first team (e.g., 'BOS' for Boston Celtics)
	team2
	string
	URL path
	Yes
	Three-letter team code for second team (e.g., 'LAL' for Los Angeles Lakers)
	Valid Team Codes:
* ATL (Atlanta Hawks)
* BOS (Boston Celtics)
* BKN (Brooklyn Nets)
* CHI (Chicago Bulls)
* CLE (Cleveland Cavaliers)
* DAL (Dallas Mavericks)
* DEN (Denver Nuggets)
* DET (Detroit Pistons)
* GS (Golden State Warriors)
* HOU (Houston Rockets)
* IND (Indiana Pacers)
* LAC (LA Clippers)
* LAL (Los Angeles Lakers)
* MEM (Memphis Grizzlies)
* MIA (Miami Heat)
* MIL (Milwaukee Bucks)
* MIN (Minnesota Timberwolves)
* NO (New Orleans Pelicans)
* NY (New York Knicks)
* OKC (Oklahoma City Thunder)
* ORL (Orlando Magic)
* PHI (Philadelphia 76ers)
* PHO (Phoenix Suns)
* POR (Portland Trail Blazers)
* SA (San Antonio Spurs)
* SAC (Sacramento Kings)
* TOR (Toronto Raptors)
* UTA (Utah Jazz)
* WAS (Washington Wizards)
________________


Return Value
Type: JSON Object
Success Response (200 OK):
{
 "team1": {
   "Key": "BOS",
   "City": "Boston",
   "Name": "Celtics",
   "Wins": 8,
   "Losses": 2,
   "Conference": "Eastern",
   "stats": {
     "pointsPerGame": "118.2",
     "pointsAllowedPerGame": "105.8",
     "reboundsPerGame": "45.1",
     "assistsPerGame": "25.2",
     "fieldGoalPercentage": "47.7",
     "threePointPercentage": "36.9",
     "stealsPerGame": "6.3",
     "blocksPerGame": "4.9",
     "games": 10
   }
 },
 "team2": {
   "Key": "LAL",
   "City": "Los Angeles",
   "Name": "Lakers",
   "Wins": 5,
   "Losses": 5,
   "Conference": "Western",
   "stats": {
     "pointsPerGame": "111.0",
     "pointsAllowedPerGame": "108.3",
     "reboundsPerGame": "42.6",
     "assistsPerGame": "24.9",
     "fieldGoalPercentage": "47.6",
     "threePointPercentage": "30.4",
     "stealsPerGame": "7.6",
     "blocksPerGame": "6.6",
     "games": 10
   }
 },
 "headToHead": {
   "games": [
     {
       "GameID": 19731,
       "Day": "2023-11-13T00:00:00",
       "AwayTeam": "BOS",
       "HomeTeam": "LAL",
       "boxscore": {
         "Game": {
           "AwayTeamScore": 112,
           "HomeTeamScore": 109
         }
       }
     }
   ],
   "record": {
     "team1Wins": 1,
     "team2Wins": 0,
     "totalGames": 1
   }
 },
 "lastUpdated": "2024-01-15T14:30:00.000Z"
}
	

Response Fields:
Field
	Type
	Description
	team1.Key
	string
	Team code for first team
	team1.City
	string
	City name
	team1.Name
	string
	Team name
	team1.Wins
	integer
	Season wins
	team1.Losses
	integer
	Season losses
	team1.Conference
	string
	Conference (Eastern/Western)
	team1.stats
	object
	Team statistics (see below)
	team2
	object
	Same structure as team1
	headToHead.games
	array
	List of recent matchups
	headToHead.record
	object
	Head-to-head win/loss record
	lastUpdated
	string
	ISO timestamp of last data update
	Statistics Object Fields:
Field
	Type
	Description
	pointsPerGame
	string
	Average points scored per game
	pointsAllowedPerGame
	string
	Average points allowed per game
	reboundsPerGame
	string
	Average rebounds per game
	assistsPerGame
	string
	Average assists per game
	fieldGoalPercentage
	string
	Field goal percentage
	threePointPercentage
	string
	Three-point percentage
	stealsPerGame
	string
	Average steals per game
	blocksPerGame
	string
	Average blocks per game
	games
	integer
	Number of games analyzed
	________________


Errors & Exceptions
HTTP Status
	Error Code
	Description
	Resolution
	400
	INVALID_TEAM_CODE
	One or both team codes are invalid
	Use valid three-letter team codes from list above
	404
	TEAM_NOT_FOUND
	Team data not found in database
	Verify team code is correct and team exists in current season
	500
	API_ERROR
	SportsDataIO API unavailable
	Try again later; system will use cached data if available
	500
	DATABASE_ERROR
	Internal data processing error
	Contact system administrator
	Error Response Example:
{
 "error": "Failed to compare teams: Team BOS data not found",
 "status": 404
}
	

Example Usage
JavaScript (Fetch API):
async function compareTeams(team1, team2) {
 try {
   const response = await fetch(`http://localhost:3000/api/compare/${team1}/${team2}`);
   
   if (!response.ok) {
     const error = await response.json();
     throw new Error(error.error);
   }
   
   const comparison = await response.json();
   console.log(`${team1} vs ${team2}:`);
   console.log(`Record: ${comparison.headToHead.record.team1Wins}-${comparison.headToHead.record.team2Wins}`);
   console.log(`${team1} PPG: ${comparison.team1.stats.pointsPerGame}`);
   console.log(`${team2} PPG: ${comparison.team2.stats.pointsPerGame}`);
   
   return comparison;
 } catch (error) {
   console.error('Comparison failed:', error.message);
 }
}

// Compare Celtics vs Lakers
compareTeams('BOS', 'LAL');
	

cURL:


curl -X GET "http://localhost:3000/api/compare/BOS/LAL"
	

Python:


import requests

def compare_teams(team1, team2):
   url = f"http://localhost:3000/api/compare/{team1}/{team2}"
   response = requests.get(url)
   
   if response.status_code == 200:
       data = response.json()
       print(f"{team1}: {data['team1']['Wins']}-{data['team1']['Losses']}")
       print(f"{team2}: {data['team2']['Wins']}-{data['team2']['Losses']}")
       print(f"Head-to-head: {data['headToHead']['record']['team1Wins']}-{data['headToHead']['record']['team2Wins']}")
       return data
   else:
       print(f"Error: {response.json()['error']}")
       return None

# Example usage
compare_teams('BOS', 'LAL')
	Important Notes & Limitations
1. Data Freshness: Statistics are updated every 2 minutes from the SportsDataIO replay system. For real-time data, a WebSocket connection would be required.
2. Season Context: The endpoint currently uses the 2024 regular season data. Historical season comparisons require a different endpoint.
3. Sample Size: Early in the season, statistics may be based on limited games (minimum 5 games required for meaningful comparison).
4. Head-to-Head Games: The endpoint only returns matchups where both teams have available boxscore data. Scheduled future games are not included.
5. Caching: Responses are cached for 60 seconds to reduce API load. The lastUpdated field indicates data freshness.
6. Rate Limiting: Maximum 30 requests per minute per IP address to prevent abuse.
7. Replay Mode: Currently operating in replay mode with fixed date range (November 13-14, 2023). Live data integration planned for future release.
8. Stat Calculations: All averages are calculated from games where complete boxscore data is available. Games with missing data are excluded.