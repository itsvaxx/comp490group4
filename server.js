// server.js
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// SportsDataIO Replay API Key
const REPLAY_API_KEY = process.env.SPORTSDATAIO_API_KEY;
const REPLAY_BASE_URL = 'https://replay.sportsdata.io/api/v3/nba';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.static('public'));

// Helper function for replay API
async function fetchFromReplayAPI(endpoint) {
  try {
    const url = `${REPLAY_BASE_URL}${endpoint}?key=${REPLAY_API_KEY}`;
    console.log('Fetching from replay API:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from Replay API:', error.message);
    throw error;
  }
}

// Get metadata to understand current replay state
async function getReplayMetadata() {
  try {
    const metadataUrl = `https://replay.sportsdata.io/api/metadata?key=${REPLAY_API_KEY}`;
    console.log('Fetching replay metadata:', metadataUrl);
    
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Metadata API error! status: ${response.status}`);
    }
    
    const metadata = await response.json();
    
    // Extract date from CurrentTime ISO string "2023-12-02T02:01:52.2747338"
    let currentDate;
    if (metadata.CurrentTime) {
      currentDate = new Date(metadata.CurrentTime).toISOString().split('T')[0];
      console.log('Parsed current date from CurrentTime:', currentDate);
    } else {
      console.warn('Metadata missing CurrentTime, using fallback');
      currentDate = '2023-12-02'; // Fallback to your replay date
    }
    
    // Use CurrentSeason if available, otherwise fallback
    const currentSeason = metadata.CurrentSeason || '2024reg';
    console.log(currentSeason);
    
    return {
      ...metadata,
      CurrentDate: currentDate,
      CurrentSeason: currentSeason
    };
  } catch (error) {
    console.error('Error fetching metadata:', error.message);
    // Fallback to known values from your replay package
    return {
      CurrentTime: '2023-12-02T00:00:00.0000000',
      CurrentDate: '2023-12-02',
      CurrentSeason: '2024reg',
      IsFallback: true
    };
  }
}

// Simple root route
app.get('/', (req, res) => {
  res.json({ message: 'NBA Analytics Backend is running!' });
});

// Core endpoint: Get current replay state with games that have available boxscores
app.get('/api/current-state', async (req, res) => {
  try {
    console.log('=== Starting /api/current-state ===');
    
    const metadata = await getReplayMetadata();
    const currentDate = metadata.CurrentDate;
    const currentSeason = metadata.CurrentSeason;
    
    console.log(`Current replay date: ${currentDate}`);

    const date = new Date(currentDate);

    date.setDate(date.getDate() - 1);

    const previousDate = date.toISOString().split("T")[0];
    
    console.log(`Fetching games for both dates: ${previousDate} and ${currentDate}`);
    
    // Get games from both days
    const [currentDayGames, previousDayGames] = await Promise.all([
      fetchFromReplayAPI(`/stats/json/gamesbydate/${currentDate}`),
      fetchFromReplayAPI(`/stats/json/gamesbydate/${previousDate}`)
    ]);
    
    console.log(`Found ${currentDayGames ? currentDayGames.length : 0} games for ${currentDate}`);
    console.log(`Found ${previousDayGames ? previousDayGames.length : 0} games for ${previousDate}`);
    
    // Combine games from both days
    const allGames = [
      ...(currentDayGames || []),
      ...(previousDayGames || [])
    ];
    
    console.log(`Total games across both days: ${allGames.length}`);
    
    if (allGames.length > 0) {
      console.log('Sample games from both days:');
      allGames.slice(0, 3).forEach(game => {
        console.log(`- ${game.GameID}: ${game.AwayTeam} vs ${game.HomeTeam} (${game.Status}) on ${game.Day.split('T')[0]}`);
      });
    }
    
    const gamesWithBoxscoreStatus = await checkGamesBoxscoreStatus(allGames);
    console.log(`Processed ${gamesWithBoxscoreStatus.length} games with boxscore status`);
    
    // Get standings for context
    const standings = await fetchFromReplayAPI(`/stats/json/standings/${currentSeason}`);
    console.log(`Found ${standings ? standings.length : 0} standings entries`);
    
    // Get game status
    const gamesInProgress = await fetchFromReplayAPI('/stats/json/areanygamesinprogress');
    console.log(`Games in progress: ${gamesInProgress}`);
    
    const responseData = {
      metadata: {
        ...metadata,
        previousDate: previousDate
      },
      games: gamesWithBoxscoreStatus,
      standings: standings || [],
      gamesInProgress: gamesInProgress,
      totalGames: gamesWithBoxscoreStatus.length,
      originalGameCount: allGames.length,
      dateInfo: {
        currentDate,
        previousDate,
        currentGames: currentDayGames ? currentDayGames.length : 0,
        previousGames: previousDayGames ? previousDayGames.length : 0
      }
    };
    
    console.log('=== Successfully completed /api/current-state ===');
    res.json(responseData);
    
  } catch (error) {
    console.error('=== ERROR in /api/current-state ===', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch current state',
      details: error.message 
    });
  }
});

// app.get('/api/debug/boxscore/:gameId', async (req, res) => {
//   try {
//     const gameId = req.params.gameId;
//     console.log(`=== DEBUG: Testing boxscore for game ${gameId} ===`);
    
//     const boxscoreUrl = `${REPLAY_BASE_URL}/stats/json/boxscore/${gameId}?key=${REPLAY_API_KEY}`;
//     console.log('Fetching from:', boxscoreUrl);
    
//     const response = await fetch(boxscoreUrl);
//     console.log('Response status:', response.status);
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
    
//     const boxscore = await response.json();
//     console.log('Boxscore data structure:', {
//       hasGame: !!boxscore.Game,
//       gameStatus: boxscore.Game?.Status,
//       awayScore: boxscore.Game?.AwayTeamScore,
//       homeScore: boxscore.Game?.HomeTeamScore,
//       hasTeamGames: !!boxscore.TeamGames,
//       teamGamesLength: boxscore.TeamGames?.length,
//       hasPlayerGames: !!boxscore.PlayerGames,
//       playerGamesLength: boxscore.PlayerGames?.length,
//       hasQuarters: !!boxscore.Quarters,
//       quartersLength: boxscore.Quarters?.length
//     });
    
//     res.json({
//       url: boxscoreUrl,
//       status: response.status,
//       data: boxscore
//     });
    
//   } catch (error) {
//     console.error('DEBUG Error:', error.message);
//     res.status(500).json({
//       error: error.message,
//       url: boxscoreUrl
//     });
//   }
// });

// app.get('/api/debug/metadata', async (req, res) => {
//   try {
//     const metadata = await getReplayMetadata();
//     res.json(metadata);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Helper function to filter games that have available boxscores
async function checkGamesBoxscoreStatus(games) {
  if (!games || games.length === 0) {
    return [];
  }

  const gamesWithStatus = [];
  
  // Check each game for boxscore availability
  for (const game of games) {
    try {
      const gameDate = game.Day ? game.Day.split('T')[0] : 'Unknown';
      console.log(`\n=== Checking game ${game.GameID} from ${gameDate}: ${game.AwayTeam} vs ${game.HomeTeam} ===`);
      console.log('Game status:', game.Status);
      
      const boxscore = await fetchFromReplayAPI(`/stats/json/boxscore/${game.GameID}`);
      
      // Debug the boxscore structure
      // console.log(`Boxscore check for ${game.GameID}:`, {
      //   hasGame: !!boxscore.Game,
      //   gameStatus: boxscore.Game?.Status,
      //   awayScore: boxscore.Game?.AwayTeamScore,
      //   homeScore: boxscore.Game?.HomeTeamScore,
      //   teamGamesCount: boxscore.TeamGames?.length,
      //   playerGamesCount: boxscore.PlayerGames?.length
      // });

      // Check if we have valid data
      const hasValidScores = boxscore.Game && 
                           boxscore.Game.AwayTeamScore !== null && 
                           boxscore.Game.HomeTeamScore !== null;
      
      const hasPlayerData = boxscore.PlayerGames && boxscore.PlayerGames.length > 0;
      const hasTeamData = boxscore.TeamGames && boxscore.TeamGames.length > 0;
      
      // Include if it has scores OR has player data
      const hasBoxscoreData = hasValidScores || hasPlayerData;
      
      // Always include the game, but with boxscore status
      gamesWithStatus.push({
        ...game,
        boxscore: hasBoxscoreData ? boxscore : null,
        hasBoxscore: hasBoxscoreData,
        gameDate: gameDate,
        boxscoreStatus: hasBoxscoreData ? 'available' : 'unavailable'
      });
      
      if (hasBoxscoreData) {
        console.log(`✓ Game ${game.GameID} from ${gameDate} has boxscore data (scores: ${boxscore.Game.AwayTeamScore}-${boxscore.Game.HomeTeamScore}, players: ${boxscore.PlayerGames?.length})`);
      } else {
        console.log(`✗ Game ${game.GameID} from ${gameDate} has no usable boxscore data`);
      }
    } catch (error) {
      console.log(`✗ Game ${game.GameID} boxscore unavailable: ${error.message}`);
      // Still include the game but mark as unavailable
      gamesWithStatus.push({
        ...game,
        boxscore: null,
        hasBoxscore: false,
        gameDate: game.Day ? game.Day.split('T')[0] : 'Unknown',
        boxscoreStatus: 'unavailable'
      });
    }
  }
  
  console.log(`\n=== BOXSCORE STATUS RESULTS ===`);
  console.log(`Total games processed: ${gamesWithStatus.length}`);
  
  const availableGames = gamesWithStatus.filter(g => g.hasBoxscore).length;
  const unavailableGames = gamesWithStatus.filter(g => !g.hasBoxscore).length;
  
  console.log(`Games with boxscores: ${availableGames}`);
  console.log(`Games without boxscores: ${unavailableGames}`);
  
  // Log the games
  gamesWithStatus.forEach(game => {
    if (game.hasBoxscore) {
      console.log(`✓ ${game.GameID}: ${game.AwayTeam} vs ${game.HomeTeam} - ${game.boxscore.Game.AwayTeamScore}-${game.boxscore.Game.HomeTeamScore} (${game.gameDate})`);
    } else {
      console.log(`⏰ ${game.GameID}: ${game.AwayTeam} vs ${game.HomeTeam} - Not started (${game.gameDate})`);
    }
  });
  
  return gamesWithStatus;
}

// Get detailed boxscore for a specific game (now we can use cached data)
app.get('/api/game/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    console.log(`Fetching boxscore for game: ${gameId}`);
    
    const boxscore = await fetchFromReplayAPI(`/stats/json/boxscore/${gameId}`);
    
    res.json({
      boxscore: boxscore,
      gameId: gameId
    });
  } catch (error) {
    console.error(`Error fetching game ${gameId}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch game data',
      details: error.message 
    });
  }
});

// Get all teams for comparison dropdown
app.get('/api/teams', async (req, res) => {
  try {
    const metadata = await getReplayMetadata();
    const currentSeason = metadata.CurrentSeason;
    
    // Get teams from standings data
    const standings = await fetchFromReplayAPI(`/stats/json/standings/${currentSeason}`);
    
    const teams = standings.map(team => ({
      key: team.Key,
      name: team.Name,
      city: team.City,
      wins: team.Wins,
      losses: team.Losses,
      conference: team.Conference
    }));
    
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error.message);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get all teams for comparison dropdown - using real data
app.get('/api/teams', async (req, res) => {
  try {
    console.log('Fetching teams data...');
    
    // Use the actual standings data we already have
    const metadata = await getReplayMetadata();
    const currentSeason = metadata.CurrentSeason;
    const standings = await fetchFromReplayAPI(`/stats/json/standings/${currentSeason}`);
    
    const teams = standings.map(team => ({
      key: team.Key,
      name: team.Name,
      city: team.City,
      wins: team.Wins,
      losses: team.Losses,
      conference: team.Conference
    }));
    
    console.log(`Found ${teams.length} teams`);
    res.json(teams);
    
  } catch (error) {
    console.error('Error fetching teams:', error.message);
    // Fallback to static team list if API fails
    const fallbackTeams = [
      { key: 'BOS', name: 'Celtics', city: 'Boston', wins: 8, losses: 2, conference: 'Eastern' },
      { key: 'PHI', name: '76ers', city: 'Philadelphia', wins: 8, losses: 1, conference: 'Eastern' },
      { key: 'DEN', name: 'Nuggets', city: 'Denver', wins: 8, losses: 2, conference: 'Western' },
      { key: 'DAL', name: 'Mavericks', city: 'Dallas', wins: 8, losses: 2, conference: 'Western' },
      { key: 'MIN', name: 'Timberwolves', city: 'Minnesota', wins: 7, losses: 2, conference: 'Western' },
      { key: 'MIL', name: 'Bucks', city: 'Milwaukee', wins: 6, losses: 4, conference: 'Eastern' },
      { key: 'IND', name: 'Pacers', city: 'Indiana', wins: 6, losses: 4, conference: 'Eastern' },
      { key: 'HOU', name: 'Rockets', city: 'Houston', wins: 6, losses: 3, conference: 'Western' },
      { key: 'MIA', name: 'Heat', city: 'Miami', wins: 6, losses: 4, conference: 'Eastern' },
      { key: 'OKC', name: 'Thunder', city: 'Oklahoma City', wins: 6, losses: 4, conference: 'Western' },
      { key: 'GS', name: 'Warriors', city: 'Golden State', wins: 6, losses: 5, conference: 'Western' },
      { key: 'ATL', name: 'Hawks', city: 'Atlanta', wins: 5, losses: 4, conference: 'Eastern' },
      { key: 'BKN', name: 'Nets', city: 'Brooklyn', wins: 5, losses: 5, conference: 'Eastern' },
      { key: 'NY', name: 'Knicks', city: 'New York', wins: 5, losses: 5, conference: 'Eastern' },
      { key: 'ORL', name: 'Magic', city: 'Orlando', wins: 5, losses: 4, conference: 'Eastern' },
      { key: 'LAL', name: 'Lakers', city: 'Los Angeles', wins: 5, losses: 5, conference: 'Western' },
      { key: 'TOR', name: 'Raptors', city: 'Toronto', wins: 5, losses: 5, conference: 'Eastern' },
      { key: 'SAC', name: 'Kings', city: 'Sacramento', wins: 5, losses: 4, conference: 'Western' },
      { key: 'CLE', name: 'Cavaliers', city: 'Cleveland', wins: 4, losses: 6, conference: 'Eastern' },
      { key: 'CHI', name: 'Bulls', city: 'Chicago', wins: 4, losses: 7, conference: 'Eastern' },
      { key: 'NO', name: 'Pelicans', city: 'New Orleans', wins: 4, losses: 6, conference: 'Western' },
      { key: 'PHO', name: 'Suns', city: 'Phoenix', wins: 4, losses: 6, conference: 'Western' },
      { key: 'LAC', name: 'Clippers', city: 'Los Angeles', wins: 3, losses: 6, conference: 'Western' },
      { key: 'CHA', name: 'Hornets', city: 'Charlotte', wins: 3, losses: 6, conference: 'Eastern' },
      { key: 'POR', name: 'Trail Blazers', city: 'Portland', wins: 3, losses: 6, conference: 'Western' },
      { key: 'SA', name: 'Spurs', city: 'San Antonio', wins: 3, losses: 7, conference: 'Western' },
      { key: 'UTA', name: 'Jazz', city: 'Utah', wins: 3, losses: 7, conference: 'Western' },
      { key: 'MEM', name: 'Grizzlies', city: 'Memphis', wins: 2, losses: 8, conference: 'Western' },
      { key: 'DET', name: 'Pistons', city: 'Detroit', wins: 2, losses: 9, conference: 'Eastern' },
      { key: 'WAS', name: 'Wizards', city: 'Washington', wins: 2, losses: 8, conference: 'Eastern' }
    ];
    res.json(fallbackTeams);
  }
});


// Compare two teams 
app.get('/api/compare/:team1/:team2', async (req, res) => {
  try {
    const { team1, team2 } = req.params;
    console.log(`Comparing teams: ${team1} vs ${team2}`);
    
    // Get team season stats from the actual data
    const teamStatsData = await getTeamSeasonStats();
    
    const team1Data = teamStatsData.find(t => t.Team === team1);
    const team2Data = teamStatsData.find(t => t.Team === team2);
    
    if (!team1Data || !team2Data) {
      return res.status(404).json({ error: 'One or both teams not found' });
    }
    
    // Get standings for win-loss records
    const metadata = await getReplayMetadata();
    const standings = await fetchFromReplayAPI(`/stats/json/standings/${metadata.CurrentSeason}`);
    const team1Standing = standings.find(t => t.Key === team1);
    const team2Standing = standings.find(t => t.Key === team2);
    
    // Get head-to-head games from our existing games data
    const allGames = await getAllGamesForComparison();
    const headToHeadGames = allGames.filter(game => 
      ((game.AwayTeam === team1 && game.HomeTeam === team2) ||
       (game.AwayTeam === team2 && game.HomeTeam === team1)) &&
      game.hasBoxscore
    );
    
    // Calculate head-to-head record
    const headToHeadRecord = calculateHeadToHeadRecord(headToHeadGames, team1, team2);
    
    const comparison = {
      team1: {
        ...team1Standing,
        stats: extractTeamStats(team1Data),
        seasonStats: team1Data
      },
      team2: {
        ...team2Standing,
        stats: extractTeamStats(team2Data),
        seasonStats: team2Data
      },
      headToHead: {
        games: headToHeadGames.slice(0, 3), // Last 3 matchups
        record: headToHeadRecord
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json(comparison);
    
  } catch (error) {
    console.error('Error comparing teams:', error.message);
    res.status(500).json({ error: 'Failed to compare teams: ' + error.message });
  }
});

// Helper function to get team season stats from the actual data
async function getTeamSeasonStats() {
  try {

    const metadata = await getReplayMetadata();
    const teamStats = await fetchFromReplayAPI(`/stats/json/teamseasonstats/${metadata.CurrentSeason}`);
    return teamStats;
  } catch (error) {
    console.error('Error fetching team season stats:', error.message);
    // Return empty array if API fails
    return [];
  }
}

// Helper function to extract relevant stats for comparison
function extractTeamStats(teamData) {
  if (!teamData) return {};
  
  return {
    pointsPerGame: (teamData.Points / teamData.Games).toFixed(1),
    pointsAllowedPerGame: teamData.OpponentStat ? (teamData.OpponentStat.Points / teamData.Games).toFixed(1) : '0.0',
    reboundsPerGame: (teamData.Rebounds / teamData.Games).toFixed(1),
    assistsPerGame: (teamData.Assists / teamData.Games).toFixed(1),
    fieldGoalPercentage: (teamData.FieldGoalsPercentage || 0).toFixed(1),
    threePointPercentage: (teamData.ThreePointersPercentage || 0).toFixed(1),
    freeThrowPercentage: (teamData.FreeThrowsPercentage || 0).toFixed(1),
    stealsPerGame: (teamData.Steals / teamData.Games).toFixed(1),
    blocksPerGame: (teamData.BlockedShots / teamData.Games).toFixed(1),
    turnoversPerGame: (teamData.Turnovers / teamData.Games).toFixed(1),
    games: teamData.Games
  };
}

// Helper function to get all games for comparison
async function getAllGamesForComparison() {
  try {
    const metadata = await getReplayMetadata();
    const currentDate = metadata.CurrentDate;
    // const previousDate = '2023-11-13';
    
    const [currentDayGames, previousDayGames] = await Promise.all([
      fetchFromReplayAPI(`/stats/json/gamesbydate/${currentDate}`),
      fetchFromReplayAPI(`/stats/json/gamesbydate/${previousDate}`)
    ]);
    
    const allGames = [
      ...(currentDayGames || []),
      ...(previousDayGames || [])
    ];
    
    // Enhance games with boxscore status
    const gamesWithStatus = [];
    for (const game of allGames) {
      try {
        const boxscore = await fetchFromReplayAPI(`/stats/json/boxscore/${game.GameID}`);
        const hasValidData = boxscore.Game && boxscore.Game.AwayTeamScore !== null;
        
        gamesWithStatus.push({
          ...game,
          boxscore: hasValidData ? boxscore : null,
          hasBoxscore: hasValidData
        });
      } catch (error) {
        gamesWithStatus.push({
          ...game,
          boxscore: null,
          hasBoxscore: false
        });
      }
    }
    
    return gamesWithStatus;
  } catch (error) {
    console.error('Error getting games for comparison:', error.message);
    return [];
  }
}

// Helper function to calculate head-to-head record
function calculateHeadToHeadRecord(games, team1, team2) {
  let team1Wins = 0;
  let team2Wins = 0;
  
  games.forEach(game => {
    if (game.hasBoxscore && game.boxscore.Game) {
      const awayScore = game.boxscore.Game.AwayTeamScore;
      const homeScore = game.boxscore.Game.HomeTeamScore;
      
      if (game.AwayTeam === team1 && game.HomeTeam === team2) {
        if (awayScore > homeScore) team1Wins++;
        else if (homeScore > awayScore) team2Wins++;
      } else if (game.AwayTeam === team2 && game.HomeTeam === team1) {
        if (awayScore > homeScore) team2Wins++;
        else if (homeScore > awayScore) team1Wins++;
      }
    }
  });
  
  return {
    team1Wins,
    team2Wins,
    totalGames: games.length
  };
}

// Helper function to calculate team stats from games
async function calculateTeamSeasonStats(teamKey, allGames) {
  const teamGames = allGames.filter(game => 
    (game.AwayTeam === teamKey || game.HomeTeam === teamKey) && game.hasBoxscore
  );
  
  let totalPoints = 0;
  let totalPointsAllowed = 0;
  let totalRebounds = 0;
  let totalAssists = 0;
  let gameCount = 0;
  
  teamGames.forEach(game => {
    if (game.boxscore && game.boxscore.Game && game.boxscore.TeamGames) {
      const teamGame = game.boxscore.TeamGames.find(tg => 
        tg.Team === teamKey || tg.TeamID === teamKey
      );
      const isHome = game.HomeTeam === teamKey;
      const pointsFor = isHome ? game.boxscore.Game.HomeTeamScore : game.boxscore.Game.AwayTeamScore;
      const pointsAgainst = isHome ? game.boxscore.Game.AwayTeamScore : game.boxscore.Game.HomeTeamScore;
      
      if (teamGame && pointsFor !== null && pointsAgainst !== null) {
        totalPoints += pointsFor;
        totalPointsAllowed += pointsAgainst;
        totalRebounds += teamGame.Rebounds || 0;
        totalAssists += teamGame.Assists || 0;
        gameCount++;
      }
    }
  });
  
  return {
    pointsPerGame: gameCount > 0 ? (totalPoints / gameCount).toFixed(1) : '0.0',
    pointsAllowedPerGame: gameCount > 0 ? (totalPointsAllowed / gameCount).toFixed(1) : '0.0',
    reboundsPerGame: gameCount > 0 ? (totalRebounds / gameCount).toFixed(1) : '0.0',
    assistsPerGame: gameCount > 0 ? (totalAssists / gameCount).toFixed(1) : '0.0',
    gamesAnalyzed: gameCount
  };
}

// Start the server
app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`NBA Live Analytics Dashboard - Enhanced`);
  console.log(`Server running on http://localhost:${PORT}`);
});