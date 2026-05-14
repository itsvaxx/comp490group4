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
    
    // Extract date from CurrentTime ISO string
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

      // Check if we have valid data
      const hasValidScores = boxscore.Game && 
                           boxscore.Game.AwayTeamScore !== null && 
                           boxscore.Game.HomeTeamScore !== null;
      
      const hasPlayerData = boxscore.PlayerGames && boxscore.PlayerGames.length > 0;
      
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
        console.log(`✓ Game ${game.GameID} from ${gameDate} has boxscore data`);
      } else {
        console.log(`✗ Game ${game.GameID} from ${gameDate} has no usable boxscore data`);
      }
    } catch (error) {
      console.log(`✗ Game ${game.GameID} boxscore unavailable: ${error.message}`);
      gamesWithStatus.push({
        ...game,
        boxscore: null,
        hasBoxscore: false,
        gameDate: game.Day ? game.Day.split('T')[0] : 'Unknown',
        boxscoreStatus: 'unavailable'
      });
    }
  }
  
  return gamesWithStatus;
}

// Get detailed boxscore for a specific game
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
    console.log('Fetching teams data...');
    
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
      { key: 'NY', name: 'Knicks', city: 'New York', wins: 5, losses: 5, conference: 'Eastern' },
      { key: 'GS', name: 'Warriors', city: 'Golden State', wins: 6, losses: 5, conference: 'Western' },
      { key: 'LAL', name: 'Lakers', city: 'Los Angeles', wins: 5, losses: 5, conference: 'Western' }
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
    
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    const previousDate = date.toISOString().split("T")[0];
    
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

// Get play-by-play data for a specific game
app.get('/api/game/:gameId/playbyplay', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    console.log(`Fetching play-by-play for game: ${gameId}`);
    
    const pbpData = await fetchFromReplayAPI(`/pbp/json/playbyplay/${gameId}`);
    
    // Check if there's actual play data
    const hasPlays = pbpData && pbpData.Plays && pbpData.Plays.length > 0;
    
    res.json({
      gameId: gameId,
      hasPlays: hasPlays,
      quarters: pbpData.Quarters || [],
      plays: pbpData.Plays || [],
      totalPlays: pbpData.Plays ? pbpData.Plays.length : 0
    });
  } catch (error) {
    console.error(`Error fetching play-by-play for game ${gameId}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch play-by-play data',
      details: error.message,
      gameId: gameId,
      hasPlays: false
    });
  }
});

// Get a summary of key plays for a game
app.get('/api/game/:gameId/keyplays', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    console.log(`Fetching key plays for game: ${gameId}`);
    
    const pbpData = await fetchFromReplayAPI(`/pbp/json/playbyplay/${gameId}`);
    
    if (!pbpData || !pbpData.Plays || pbpData.Plays.length === 0) {
      return res.json({
        gameId: gameId,
        hasPlays: false,
        message: 'No play data available for this game'
      });
    }
    
    // Filter for key plays (scoring plays, fouls, turnovers)
    const allPlays = pbpData.Plays;
    
    // Get scoring plays
    const scoringPlays = allPlays.filter(play => 
      play.Points && play.Points > 0
    ).slice(-10); // Last 10 scoring plays
    
    // Get biggest runs
    const runs = analyzeRuns(allPlays, pbpData.Quarters);
    
    // Get clutch moments (last 2 minutes of 4th quarter/overtime)
    const clutchPlays = getClutchPlays(allPlays, pbpData.Quarters);
    
    // Get lead changes
    const leadChanges = analyzeLeadChanges(allPlays);
    
    // Get player highlights
    const playerHighlights = analyzePlayerHighlights(allPlays);
    
    res.json({
      gameId: gameId,
      hasPlays: true,
      summary: {
        totalPlays: allPlays.length,
        scoringPlays: scoringPlays.length,
        leadChanges: leadChanges.count,
        biggestRun: runs.biggestRun
      },
      keyPlays: {
        recentScoring: scoringPlays,
        clutchPlays: clutchPlays.slice(0, 5),
        biggestRun: runs.biggestRunDetails,
        gameWinner: findGameWinningPlay(allPlays, pbpData.Game)
      },
      highlights: playerHighlights,
      leadChanges: leadChanges.timeline
    });
    
  } catch (error) {
    console.error(`Error fetching key plays for game ${gameId}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch key plays',
      details: error.message 
    });
  }
});

// Helper function to analyze runs
function analyzeRuns(plays, quarters) {
  let currentRunTeam = null;
  let currentRunPoints = 0;
  let biggestRun = { team: null, points: 0, startTime: null, endTime: null };
  let biggestRunDetails = null;
  
  // Sort plays by sequence
  const sortedPlays = [...plays].sort((a, b) => a.Sequence - b.Sequence);
  
  for (const play of sortedPlays) {
    if (play.Points && play.Points > 0 && play.Team) {
      if (play.Team === currentRunTeam) {
        currentRunPoints += play.Points;
      } else {
        // Run ended
        if (currentRunPoints > biggestRun.points) {
          biggestRun = {
            team: currentRunTeam,
            points: currentRunPoints,
            startTime: play.TimeRemainingMinutes ? `${play.QuarterName || 'Q?'} - ${play.TimeRemainingMinutes}:${play.TimeRemainingSeconds}` : null,
            endTime: null
          };
        }
        // Start new run
        currentRunTeam = play.Team;
        currentRunPoints = play.Points;
      }
    }
  }
  
  // Check final run
  if (currentRunPoints > biggestRun.points) {
    biggestRun = {
      team: currentRunTeam,
      points: currentRunPoints,
      description: `${currentRunTeam} went on a ${currentRunPoints}-point run`
    };
  }
  
  return {
    biggestRun: biggestRun.points,
    biggestRunDetails: biggestRun
  };
}

// Helper function to get clutch plays
function getClutchPlays(plays, quarters) {
  if (!quarters || quarters.length === 0) return [];
  
  // Find the last quarter (4th or OT)
  const lastQuarter = quarters[quarters.length - 1];
  
  // Get plays from last 2 minutes of final quarter
  const clutchPlays = plays.filter(play => 
    play.QuarterID === lastQuarter.QuarterID &&
    play.TimeRemainingMinutes <= 2 &&
    (play.Points > 0 || play.Category === 'Foul' || play.Category === 'Turnover')
  );
  
  return clutchPlays;
}

// Helper function to analyze lead changes
function analyzeLeadChanges(plays) {
  let currentLeader = null;
  let leadChanges = [];
  
  const sortedPlays = [...plays].sort((a, b) => a.Sequence - b.Sequence);
  
  for (const play of sortedPlays) {
    if (play.AwayTeamScore !== undefined && play.HomeTeamScore !== undefined) {
      if (play.AwayTeamScore > play.HomeTeamScore) {
        if (currentLeader !== 'Away') {
          currentLeader = 'Away';
          leadChanges.push({
            time: `${play.QuarterName || 'Q?'} - ${play.TimeRemainingMinutes}:${play.TimeRemainingSeconds}`,
            newLeader: 'Away',
            score: `${play.AwayTeamScore}-${play.HomeTeamScore}`
          });
        }
      } else if (play.HomeTeamScore > play.AwayTeamScore) {
        if (currentLeader !== 'Home') {
          currentLeader = 'Home';
          leadChanges.push({
            time: `${play.QuarterName || 'Q?'} - ${play.TimeRemainingMinutes}:${play.TimeRemainingSeconds}`,
            newLeader: 'Home',
            score: `${play.AwayTeamScore}-${play.HomeTeamScore}`
          });
        }
      }
    }
  }
  
  return {
    count: leadChanges.length,
    timeline: leadChanges
  };
}

// Helper function to analyze player highlights
function analyzePlayerHighlights(plays) {
  const playerStats = {};
  
  for (const play of plays) {
    if (play.PlayerID && play.Points > 0) {
      if (!playerStats[play.PlayerID]) {
        playerStats[play.PlayerID] = {
          playerId: play.PlayerID,
          playerName: play.PlayerName || 'Player',
          team: play.Team,
          points: 0,
          madeShots: 0,
          assists: 0,
          highlights: []
        };
      }
      
      playerStats[play.PlayerID].points += play.Points || 0;
      playerStats[play.PlayerID].madeShots += 1;
      
      if (play.Points >= 3) {
        playerStats[play.PlayerID].highlights.push({
          time: `${play.QuarterName || 'Q?'} - ${play.TimeRemainingMinutes}:${play.TimeRemainingSeconds}`,
          description: play.Description,
          points: play.Points
        });
      }
    }
    
    if (play.Category === 'Assist' && play.AssistedByPlayerID) {
      if (!playerStats[play.AssistedByPlayerID]) {
        playerStats[play.AssistedByPlayerID] = {
          playerId: play.AssistedByPlayerID,
          playerName: 'Player',
          team: play.Team,
          points: 0,
          madeShots: 0,
          assists: 0,
          highlights: []
        };
      }
      playerStats[play.AssistedByPlayerID].assists += 1;
    }
  }
  
  // Get top performers
  const topScorers = Object.values(playerStats)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
    
  return {
    topScorers
  };
}

// Helper function to find game-winning play
function findGameWinningPlay(plays, gameInfo) {
  if (!gameInfo) return null;
  
  // Find plays in final minutes that could be game-winners
  const finalPlays = plays.filter(play => 
    play.QuarterName === '4' && play.TimeRemainingMinutes <= 5 && play.Points > 0
  ).sort((a, b) => {
    // Sort by time (later in game first)
    if (a.TimeRemainingMinutes !== b.TimeRemainingMinutes) {
      return a.TimeRemainingMinutes - b.TimeRemainingMinutes;
    }
    return a.TimeRemainingSeconds - b.TimeRemainingSeconds;
  });
  
  if (finalPlays.length === 0) return null;
  
  // Look for plays that put the winning team ahead for good
  let winningPlay = null;
  let winningTeam = gameInfo.AwayTeamScore > gameInfo.HomeTeamScore ? gameInfo.AwayTeam : gameInfo.HomeTeam;
  
  for (const play of finalPlays) {
    if (play.Team === winningTeam) {
      winningPlay = play;
      break;
    }
  }
  
  return winningPlay;
}

// Start the server
app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`NBA Live Analytics Dashboard - Enhanced`);
  console.log(`Server running on http://localhost:${PORT}`);
});