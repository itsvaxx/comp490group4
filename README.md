# GameLens - NBA Analytics Dashboard

## Project Overview

GameLens is an interactive NBA analytics dashboard that transforms raw sports data into actionable insights. The platform provides real-time game tracking, comprehensive team statistics, head-to-head comparison tools, and conference standings.

### Features

* **Detailed Game Analytics** - Team statistics, player performances, quarter-by-quarter breakdowns
* **Team Comparison Tool** - Head-to-head analysis across 8 statistical categories
* **Conference Standings** - Complete standings with playoff indicators and games-back calculations

## Prerequisites

|Requirement|Version|Download Link|
|-|-|-|
|Node.js|v14 or higher|[nodejs.org](https://nodejs.org/)|
|npm|v6 or higher|(included with Node.js)|
|SportsDataIO API Key|Free tier|[sportsdata.io](https://sportsdata.io/developers/api)|

## Installation \& Setup

### 1\. Clone the Repository

```bash
git clone https://github.com/itsvaxx/comp490group4.git
cd comp490group4
```

### 2\. Install Dependencies

```bash
npm install
```

This installs:

* `express` - Web server framework
* `node-fetch` - HTTP client for API calls
* `dotenv` - Environment variable management

### 3\. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file and add your SportsDataIO API key:

```env
SPORTSDATAIO\_API\_KEY=your\_api\_key\_here
PORT=3000
```

### 4\. Start the Application

```bash
npm start
```

Expected output:

```
==========================================
NBA Live Analytics Dashboard - Enhanced
Server running on http://localhost:3000
Using dynamic replay system
==========================================
```

### 5\. Access the Dashboard

Open your browser and navigate to: **http://localhost:3000**

## Project Structure

```
comp490group4/
├── server.js              # Express backend with API endpoints
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variable template
├── .gitignore             # Git ignore rules
├── public/
│   ├── index.html        # Main dashboard UI
│   └── app.js            # Client-side JavaScript
├── docs/
│   ├── api.md            # API documentation
│   └── user\_guide.md     # User guide
└── data/
    └── NBA\_Teams\_List.txt # Team reference data
```

## Usage Guide

### Viewing Games

1. Open the dashboard to see all games
2. Green-bordered games = Completed (click for full stats)
3. Orange-bordered games = Upcoming (basic info only)
4. Click any game to view detailed analytics

### Comparing Teams

1. Scroll to the Team Comparison card
2. Click "Start New Comparison"
3. Select two teams from the dropdown menus
4. Click "Compare" to see head-to-head statistics

### Viewing Standings

1. Find the Standings preview card
2. Click "View Full Standings"
3. See complete conference rankings with playoff indicators

## API Endpoints

|Endpoint|Method|Description|
|-|-|-|
|`/api/current-state`|GET|Current replay state with games and standings|
|`/api/teams`|GET|List of all NBA teams|
|`/api/compare/:team1/:team2`|GET|Head-to-head team comparison|
|`/api/game/:gameId`|GET|Detailed boxscore for a specific game|

## Validation

To verify the installation is working:

**1. Check server status:**

```bash
curl http://localhost:3000
```

Expected response: `{"message":"NBA Analytics Backend is running!"}`

**2. Test teams endpoint:**

```bash
curl http://localhost:3000/api/teams
```

Expected response: JSON array of 30 NBA teams with names and records

**3. Test comparison endpoint:**

```bash
curl http://localhost:3000/api/compare/BOS/LAL
```

Expected response: JSON with team statistics and head-to-head data

**4. Open browser to http://localhost:3000** - Dashboard should display NBA games

## Troubleshooting

|Issue|Solution|
|-|-|
|`Error: Cannot find module`|Run `npm install` again|
|`Port 3000 already in use`|Change PORT in .env file to 3001 or another available port|
|`API key invalid`|Verify your key at sportsdata.io dashboard|
|`No games displayed`|Wait 30 seconds for API response, then refresh|
|`Connection refused`|Make sure server is running with `npm start`|
|`Empty comparison results`|Ensure both teams have played at least 5 games this season|

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to auto-restart the server on code changes.

### Environment Variables for Development

```env
SPORTSDATAIO\_API\_KEY=your\_api\_key
PORT=3000
NODE\_ENV=development
```

## Technologies Used

* **Backend**: Node.js, Express
* **Frontend**: HTML5, CSS3, Vanilla JavaScript
* **API**: SportsDataIO Replay API
* **Deployment**: Docker, Heroku, Vercel (see DEPLOY.md)

## License

MIT

## Authors

COMP490 Group 4

## Acknowledgments

* SportsDataIO for providing the NBA replay API
* NBA for game data and statistics

