// public/app.js
const API_BASE_URL = 'http://localhost:3000';

// Store games data globally so we can access it for details
let currentGamesData = [];
let currentComparisonData = null;
let currentStandingsData = null;
let charts = {}; // Store chart instances
let allTeams = [];

// Helper functions
function setLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = isLoading ? '<div class="loading">Loading...</div>' : '';
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="error">${message}</div>`;
    }
}

async function fetchFromBackend(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching from backend:', error);
        throw error;
    }
}

function getTeamLogoUrl(teamKey) {
    const logoMap = {
        'ATL': 'https://upload.wikimedia.org/wikipedia/en/2/24/Atlanta_Hawks_logo.svg',
        'BOS': 'https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg',
        'BKN': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Brooklyn_Nets_newlogo.svg',
        'CHA': 'https://upload.wikimedia.org/wikipedia/en/c/c4/Charlotte_Hornets_%282014%29.svg',
        'CHI': 'https://upload.wikimedia.org/wikipedia/en/6/67/Chicago_Bulls_logo.svg',
        'CLE': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Cleveland_Cavaliers_logo.svg',
        'DAL': 'https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg',
        'DEN': 'https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg',
        'DET': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Logo_of_the_Detroit_Pistons.svg',
        'GS': 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg',
        'HOU': 'https://upload.wikimedia.org/wikipedia/en/2/28/Houston_Rockets.svg',
        'IND': 'https://upload.wikimedia.org/wikipedia/en/1/1b/Indiana_Pacers.svg',
        'LAC': 'https://upload.wikimedia.org/wikipedia/en/b/bb/Los_Angeles_Clippers_%282015%29.svg',
        'LAL': 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg',
        'MEM': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Memphis_Grizzlies.svg',
        'MIA': 'https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg',
        'MIL': 'https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg',
        'MIN': 'https://upload.wikimedia.org/wikipedia/en/c/c2/Minnesota_Timberwolves_logo.svg',
        'NO': 'https://upload.wikimedia.org/wikipedia/en/0/0d/New_Orleans_Pelicans_logo.svg',
        'NY': 'https://upload.wikimedia.org/wikipedia/en/2/25/New_York_Knicks_logo.svg',
        'OKC': 'https://upload.wikimedia.org/wikipedia/en/5/5d/Oklahoma_City_Thunder.svg',
        'ORL': 'https://upload.wikimedia.org/wikipedia/en/1/10/Orlando_Magic_logo.svg',
        'PHI': 'https://upload.wikimedia.org/wikipedia/en/0/0e/Philadelphia_76ers_logo.svg',
        'PHO': 'https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg',
        'POR': 'https://upload.wikimedia.org/wikipedia/en/2/21/Portland_Trail_Blazers_logo.svg',
        'SAC': 'https://upload.wikimedia.org/wikipedia/en/c/c7/SacramentoKings.svg',
        'SA': 'https://upload.wikimedia.org/wikipedia/en/a/a2/San_Antonio_Spurs.svg',
        'TOR': 'https://upload.wikimedia.org/wikipedia/en/3/36/Toronto_Raptors_logo.svg',
        'UTA': 'https://upload.wikimedia.org/wikipedia/en/5/52/Utah_Jazz_logo_2022.svg',
        'WAS': 'https://upload.wikimedia.org/wikipedia/en/0/02/Washington_Wizards_logo.svg'
    };
    
    return logoMap[teamKey] || null;
}

function getTeamDisplayName(teamKey) {
    const teamMap = {
        'ATL': 'Atlanta Hawks',
        'BOS': 'Boston Celtics',
        'BKN': 'Brooklyn Nets',
        'CHA': 'Charlotte Hornets',
        'CHI': 'Chicago Bulls',
        'CLE': 'Cleveland Cavaliers',
        'DAL': 'Dallas Mavericks',
        'DEN': 'Denver Nuggets',
        'DET': 'Detroit Pistons',
        'GS': 'Golden State Warriors',
        'HOU': 'Houston Rockets',
        'IND': 'Indiana Pacers',
        'LAC': 'LA Clippers',
        'LAL': 'Los Angeles Lakers',
        'MEM': 'Memphis Grizzlies',
        'MIA': 'Miami Heat',
        'MIL': 'Milwaukee Bucks',
        'MIN': 'Minnesota Timberwolves',
        'NO': 'New Orleans Pelicans',
        'NY': 'New York Knicks',
        'OKC': 'Oklahoma City Thunder',
        'ORL': 'Orlando Magic',
        'PHI': 'Philadelphia 76ers',
        'PHO': 'Phoenix Suns',
        'POR': 'Portland Trail Blazers',
        'SAC': 'Sacramento Kings',
        'SA': 'San Antonio Spurs',
        'TOR': 'Toronto Raptors',
        'UTA': 'Utah Jazz',
        'WAS': 'Washington Wizards'
    };
    
    return teamMap[teamKey] || teamKey;
}

// Load and display current state (main function)
async function loadCurrentState() {
  try {
    setLoadingState('games-container', true);
    setLoadingState('standings-preview', true);
    setLoadingState('comparison-container', true);
    
    const data = await fetchFromBackend('/api/current-state');
    
    // Store data globally
    currentGamesData = data.games || [];
    currentStandingsData = data.standings || [];
    
    displayGames(data);
    displayStandings(data);
    displayComparisonCard();
    
  } catch (error) {
    console.error('Failed to load current state:', error);
    showError('games-container', 'Could not load games data');
    showError('standings-preview', 'Could not load standings data');
    showError('comparison-container', 'Could not load comparison data');
  }
}

// Display games
function displayGames(data) {
  const container = document.getElementById('games-container');
  
  if (!data.games || data.games.length === 0) {
    container.innerHTML = `<div class="empty-state">No games scheduled</div>`;
    return;
  }

  const gamesWithBoxscores = data.games.filter(game => game.hasBoxscore);
  const gamesWithoutBoxscores = data.games.filter(game => !game.hasBoxscore);

  container.innerHTML = `
    ${gamesWithBoxscores.length > 0 ? `
      <div class="games-section">
        <h4 style="margin-bottom: 1rem; color: #4caf50;">Completed Games</h4>
        <div class="games-grid">
          ${gamesWithBoxscores.map(game => renderGameCard(game, true)).join('')}
        </div>
      </div>
    ` : ''}
    
    ${gamesWithoutBoxscores.length > 0 ? `
      <div class="games-section" style="margin-top: ${gamesWithBoxscores.length > 0 ? '2rem' : '0'}">
        <h4 style="margin-bottom: 1rem; color: #ff9800;">Scheduled Games</h4>
        <div class="games-grid">
          ${gamesWithoutBoxscores.map(game => renderGameCard(game, false)).join('')}
        </div>
      </div>
    ` : ''}
    
    <div style="margin-top: 1rem; text-align: center; opacity: 0.7; font-size: 0.9rem;">
      ${data.games.length} total game${data.games.length !== 1 ? 's' : ''} • 
      ${gamesWithBoxscores.length} completed • 
      ${gamesWithoutBoxscores.length} scheduled
    </div>
  `;
}

function renderGameCard(game, hasData) {
  const awayTeamName = getTeamDisplayName(game.AwayTeam);
  const homeTeamName = getTeamDisplayName(game.HomeTeam);
  const gameDate = game.gameDate || (game.Day ? game.Day.split('T')[0] : 'Unknown');
  
  const awayLogoUrl = getTeamLogoUrl(game.AwayTeam);
  const homeLogoUrl = getTeamLogoUrl(game.HomeTeam);
  
  if (hasData) {
    const hasScores = game.boxscore && game.boxscore.Game && 
                    game.boxscore.Game.AwayTeamScore !== null && 
                    game.boxscore.Game.HomeTeamScore !== null;
    
    return `
      <div class="game-card" onclick="showGameDetails(${game.GameID})">
        <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.5rem;">${gameDate}</div>
        <div class="game-teams">
          <div class="team">
            <div class="team-logo-container" title="${awayTeamName}">
              ${awayLogoUrl ? 
                `<img src="${awayLogoUrl}" alt="${game.AwayTeam}" class="team-logo">` : 
                `<div class="team-logo-fallback">${game.AwayTeam}</div>`
              }
            </div>
            <div class="score ${hasScores ? '' : 'no-score'}">${getTeamScore(game, 'Away')}</div>
          </div>
          <div class="vs">VS</div>
          <div class="team">
            <div class="team-logo-container" title="${homeTeamName}">
              ${homeLogoUrl ? 
                `<img src="${homeLogoUrl}" alt="${game.HomeTeam}" class="team-logo">` : 
                `<div class="team-logo-fallback">${game.HomeTeam}</div>`
              }
            </div>
            <div class="score ${hasScores ? '' : 'no-score'}">${getTeamScore(game, 'Home')}</div>
          </div>
        </div>
        <div class="game-status ${getStatusClass(game.Status)}">
          ${getStatusDisplay(game.Status)} | 
          ${game.DateTime ? new Date(game.DateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
        </div>
        ${game.Channel ? `<div style="margin-top: 0.5rem; font-size: 0.9rem;">📺 ${game.Channel}</div>` : ''}
      </div>
    `;
  } else {
    return `
      <div class="game-card scheduled-game" onclick="showScheduledGameDetails(${game.GameID})">
        <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.5rem;">${gameDate}</div>
        <div class="game-teams">
          <div class="team">
            <div class="team-logo-container" title="${awayTeamName}">
              ${awayLogoUrl ? 
                `<img src="${awayLogoUrl}" alt="${game.AwayTeam}" class="team-logo">` : 
                `<div class="team-logo-fallback">${game.AwayTeam}</div>`
              }
            </div>
            <div class="score no-score">-</div>
          </div>
          <div class="vs">VS</div>
          <div class="team">
            <div class="team-logo-container" title="${homeTeamName}">
              ${homeLogoUrl ? 
                `<img src="${homeLogoUrl}" alt="${game.HomeTeam}" class="team-logo">` : 
                `<div class="team-logo-fallback">${game.HomeTeam}</div>`
              }
            </div>
            <div class="score no-score">-</div>
          </div>
        </div>
        <div class="game-status game-scheduled">
          ${getStatusDisplay(game.Status)} | 
          ${game.DateTime ? new Date(game.DateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
        </div>
        ${game.Channel ? `<div style="margin-top: 0.5rem; font-size: 0.9rem;">📺 ${game.Channel}</div>` : ''}
      </div>
    `;
  }
}

function showScheduledGameDetails(gameId) {
  const game = currentGamesData.find(g => g.GameID === gameId);
  if (!game) {
    showError('games-container', 'Game data not available. Please try refreshing.');
    return;
  }
  displayScheduledGameDetails(game);
}

function displayScheduledGameDetails(game) {
  const container = document.getElementById('games-container');
  const awayTeamName = getTeamDisplayName(game.AwayTeam);
  const homeTeamName = getTeamDisplayName(game.HomeTeam);
  
  container.innerHTML = `
    <div class="game-details">
      <button class="back-btn" onclick="loadCurrentState()">← Back to Games</button>
      <div class="game-details-header">
        <h3>${awayTeamName} vs ${homeTeamName}</h3>
        <div class="game-meta">
          <div>${new Date(game.DateTime).toLocaleDateString()} • ${game.StadiumID || 'Arena'}</div>
          <div class="game-status game-scheduled">${getStatusDisplay(game.Status)}</div>
        </div>
      </div>
      
      <div style="text-align: center; padding: 40px; background: rgba(255, 152, 0, 0.1); border-radius: 8px; margin: 20px 0;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⏰</div>
        <h3>Game Not Started</h3>
        <p><strong>Scheduled Time:</strong> ${new Date(game.DateTime).toLocaleString()}</p>
      </div>
      
      <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin-top: 20px;">
        <h4>Game Information</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <p><strong>Date & Time:</strong><br>${new Date(game.DateTime).toLocaleString()}</p>
            <p><strong>Location:</strong><br>${game.StadiumID || 'TBD'}</p>
          </div>
          <div>
            <p><strong>TV Broadcast:</strong><br>${game.Channel || 'Not specified'}</p>
            ${game.PointSpread ? `<p><strong>Point Spread:</strong><br>${game.PointSpread > 0 ? '+' : ''}${game.PointSpread}</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function getTeamScore(game, teamType) {
    if (game.boxscore && game.boxscore.Game) {
        const score = teamType === 'Away' ? game.boxscore.Game.AwayTeamScore : game.boxscore.Game.HomeTeamScore;
        if (score !== null && score !== undefined) return score.toString();
    }
    const score = teamType === 'Away' ? game.AwayTeamScore : game.HomeTeamScore;
    return score !== null && score !== undefined ? score.toString() : '-';
}

function getStatusClass(status) {
    if (!status) return 'game-scheduled';
    if (status.includes('InProgress') || status.includes('Live')) return 'game-status';
    if (status.includes('Final')) return 'game-final';
    return 'game-scheduled';
}

function getStatusDisplay(status) {
    if (!status) return 'Scheduled';
    if (status.includes('InProgress') || status.includes('Live')) return 'LIVE';
    if (status.includes('Final')) return 'FINAL';
    return status;
}

function displayStandings(data) {
  const container = document.getElementById('standings-preview');
  
  if (!data.standings || data.standings.length === 0) {
    container.innerHTML = '<div class="empty-state">No standings data available</div>';
    return;
  }

  const eastStandings = data.standings.filter(team => team.Conference === 'Eastern').slice(0, 7);
  const westStandings = data.standings.filter(team => team.Conference === 'Western').slice(0, 7);

  const teamsPlayingToday = new Set();
  if (data.games) {
    data.games.forEach(game => {
      if (game.AwayTeam) teamsPlayingToday.add(game.AwayTeam);
      if (game.HomeTeam) teamsPlayingToday.add(game.HomeTeam);
    });
  }

  container.innerHTML = `
    <div class="conference-standings-preview">
      <div>
        <h4 style="color: #1d428a; margin-bottom: 1rem; border-bottom: 2px solid #1d428a; padding-bottom: 0.5rem;">Eastern Conference</h4>
        ${eastStandings.map(team => `
          <div class="standing-row ${teamsPlayingToday.has(team.Key) ? 'team-highlight' : ''}">
            <span>${team.City} ${team.Name}</span>
            <span><strong>${team.Wins}-${team.Losses}</strong></span>
          </div>
        `).join('')}
      </div>
      
      <div>
        <h4 style="color: #c8102e; margin-bottom: 1rem; border-bottom: 2px solid #c8102e; padding-bottom: 0.5rem;">Western Conference</h4>
        ${westStandings.map(team => `
          <div class="standing-row ${teamsPlayingToday.has(team.Key) ? 'team-highlight' : ''}">
            <span>${team.City} ${team.Name}</span>
            <span><strong>${team.Wins}-${team.Losses}</strong></span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function showGameDetails(gameId) {
    const game = currentGamesData.find(g => g.GameID === gameId);
    
    if (!game || !game.boxscore) {
        showError('games-container', 'Game data not available. Please try refreshing.');
        return;
    }
    
    displayGameDetails({
        boxscore: game.boxscore,
        gameId: gameId
    });
}

function displayGameDetails(data) {
    const container = document.getElementById('games-container');
    const game = data.boxscore.Game;
    
    if (!game) {
        container.innerHTML = '<div class="error">No game data available</div>';
        return;
    }

    const hasScores = game.AwayTeamScore !== null && game.HomeTeamScore !== null;
    
    const awayLogoUrl = getTeamLogoUrl(game.AwayTeam);
    const homeLogoUrl = getTeamLogoUrl(game.HomeTeam);
    const awayTeamName = getTeamDisplayName(game.AwayTeam);
    const homeTeamName = getTeamDisplayName(game.HomeTeam);
    
    if (!hasScores) {
        container.innerHTML = `
            <div class="game-details">
                <button class="back-btn" onclick="loadCurrentState()">← Back to Games</button>
                <h3>${awayTeamName} vs ${homeTeamName}</h3>
                <div class="game-meta">
                    <div>${new Date(game.DateTime).toLocaleDateString()} • ${game.StadiumID || 'Arena'}</div>
                    <div class="game-status ${getStatusClass(game.Status)}">${getStatusDisplay(game.Status)}</div>
                </div>
                
                <div style="text-align: center; padding: 40px; background: rgba(255, 152, 0, 0.1); border-radius: 8px; margin: 20px 0;">
                    <h3>⏰ Game Not Started</h3>
                    <p>This game is scheduled for ${new Date(game.DateTime).toLocaleString()} but hasn't started yet in the replay.</p>
                </div>
            </div>
        `;
        return;
    }

    const awayTeamStats = data.boxscore.TeamGames?.find(tg => 
        tg.Team === game.AwayTeam || tg.TeamID === game.AwayTeamID
    );
    const homeTeamStats = data.boxscore.TeamGames?.find(tg => 
        tg.Team === game.HomeTeam || tg.TeamID === game.HomeTeamID
    );

    const players = data.boxscore.PlayerGames || [];
    const awayPlayers = players.filter(p => 
        p.Team === game.AwayTeam || p.TeamID === game.AwayTeamID
    ).sort((a, b) => (b.Points || 0) - (a.Points || 0)).slice(0, 5);
    
    const homePlayers = players.filter(p => 
        p.Team === game.HomeTeam || p.TeamID === game.HomeTeamID
    ).sort((a, b) => (b.Points || 0) - (a.Points || 0)).slice(0, 5);

    container.innerHTML = `
        <div class="game-details">
            <div class="game-details-header">
                <button class="back-btn" onclick="loadCurrentState()">← Back to Games</button>
                <h3>${awayTeamName} vs ${homeTeamName}</h3>
                <div class="game-meta">
                    <div>${new Date(game.DateTime).toLocaleDateString()} • ${game.StadiumID || 'Arena'}</div>
                    <div class="game-status ${getStatusClass(game.Status)}">${getStatusDisplay(game.Status)}</div>
                </div>
            </div>

            <div class="final-score">
                <div class="score-team">
                    <div class="game-details-logo">
                        ${awayLogoUrl ? 
                          `<img src="${awayLogoUrl}" alt="${game.AwayTeam}" title="${awayTeamName}">` : 
                          `<div class="team-logo-fallback">${game.AwayTeam}</div>`
                        }
                    </div>
                    <div class="team-name">${awayTeamName}</div>
                    <div class="team-score">${game.AwayTeamScore || '0'}</div>
                </div>
                <div class="score-separator">-</div>
                <div class="score-team">
                    <div class="game-details-logo">
                        ${homeLogoUrl ? 
                          `<img src="${homeLogoUrl}" alt="${game.HomeTeam}" title="${homeTeamName}">` : 
                          `<div class="team-logo-fallback">${game.HomeTeam}</div>`
                        }
                    </div>
                    <div class="team-name">${homeTeamName}</div>
                    <div class="team-score">${game.HomeTeamScore || '0'}</div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <button class="refresh-btn" onclick="showGameInsights(${data.gameId})" style="background: linear-gradient(135deg, #4caf50 0%, #2196f3 100%);">
                📊 View Play-by-Play Insights
              </button>
            </div>

            <div class="team-stats-summary">
                <div class="team-stat">
                  <h4>${awayTeamName}</h4>
                  ${awayTeamStats ? `
                    <div><strong>${createStatTooltip('Field Goals', 'The number of shots made from the field (2-point or 3-point shots). Format: Made/Attempted (Percentage)')}</strong> ${awayTeamStats.FieldGoalsMade || 0}/${awayTeamStats.FieldGoalsAttempted || 0} (${(awayTeamStats.FieldGoalsPercentage || 0).toFixed(1)}%)</div>
                    <div><strong>${createStatTooltip('3-Pointers', 'Shots made from beyond the three-point line. Worth 3 points each.')}</strong> ${awayTeamStats.ThreePointersMade || 0}/${awayTeamStats.ThreePointersAttempted || 0} (${(awayTeamStats.ThreePointersPercentage || 0).toFixed(1)}%)</div>
                    <div><strong>${createStatTooltip('Free Throws', 'Uncontested shots taken from the free-throw line, worth 1 point each. Usually awarded after fouls.')}</strong> ${awayTeamStats.FreeThrowsMade || 0}/${awayTeamStats.FreeThrowsAttempted || 0} (${(awayTeamStats.FreeThrowsPercentage || 0).toFixed(1)}%)</div>
                    <div><strong>${createStatTooltip('Rebounds', 'Gaining possession of the ball after a missed shot. Offensive rebounds = on offense, Defensive rebounds = on defense.')}</strong> ${awayTeamStats.Rebounds || 0}</div>
                    <div><strong>${createStatTooltip('Assists', 'A pass that directly leads to a made basket by a teammate.')}</strong> ${awayTeamStats.Assists || 0}</div>
                    <div><strong>${createStatTooltip('Steals', 'Taking the ball away from the opposing team, leading to a change in possession.')}</strong> ${awayTeamStats.Steals || 0}</div>
                    <div><strong>${createStatTooltip('Blocks', 'Deflecting or stopping an opponent\'s shot attempt before it reaches the basket.')}</strong> ${awayTeamStats.BlockedShots || 0}</div>
                    <div><strong>${createStatTooltip('Turnovers', 'Losing possession of the ball to the opposing team through errors like bad passes or violations.')}</strong> ${awayTeamStats.Turnovers || 0}</div>
                  ` : '<div>Stats not available</div>'}
                </div>
                <div class="team-stat">
                  <h4>${homeTeamName}</h4>
                  ${homeTeamStats ? `
                    <div><strong>${createStatTooltip('Field Goals', 'The number of shots made from the field (2-point or 3-point shots). Format: Made/Attempted (Percentage)')}</strong> ${homeTeamStats.FieldGoalsMade || 0}/${homeTeamStats.FieldGoalsAttempted || 0} (${(homeTeamStats.FieldGoalsPercentage || 0).toFixed(1)}%)</div>
                    <div><strong>${createStatTooltip('3-Pointers', 'Shots made from beyond the three-point line. Worth 3 points each.')}</strong> ${homeTeamStats.ThreePointersMade || 0}/${homeTeamStats.ThreePointersAttempted || 0} (${(homeTeamStats.ThreePointersPercentage || 0).toFixed(1)}%)</div>
                    <div><strong>${createStatTooltip('Free Throws', 'Uncontested shots taken from the free-throw line, worth 1 point each. Usually awarded after fouls.')}</strong> ${homeTeamStats.FreeThrowsMade || 0}/${homeTeamStats.FreeThrowsAttempted || 0} (${(homeTeamStats.FreeThrowsPercentage || 0).toFixed(1)}%)</div>
                    <div><strong>${createStatTooltip('Rebounds', 'Gaining possession of the ball after a missed shot. Offensive rebounds = on offense, Defensive rebounds = on defense.')}</strong> ${homeTeamStats.Rebounds || 0}</div>
                    <div><strong>${createStatTooltip('Assists', 'A pass that directly leads to a made basket by a teammate.')}</strong> ${homeTeamStats.Assists || 0}</div>
                    <div><strong>${createStatTooltip('Steals', 'Taking the ball away from the opposing team, leading to a change in possession.')}</strong> ${homeTeamStats.Steals || 0}</div>
                    <div><strong>${createStatTooltip('Blocks', 'Deflecting or stopping an opponent\'s shot attempt before it reaches the basket.')}</strong> ${homeTeamStats.BlockedShots || 0}</div>
                    <div><strong>${createStatTooltip('Turnovers', 'Losing possession of the ball to the opposing team through errors like bad passes or violations.')}</strong> ${homeTeamStats.Turnovers || 0}</div>
                  ` : '<div>Stats not available</div>'}
                </div>
            </div>

            <div class="key-players">
                <div class="players-section">
                    <h4>${awayTeamName} - Key Players</h4>
                    ${awayPlayers.map(player => `
                        <div class="player-card" onclick="showPlayerDetails(${player.PlayerID}, ${game.GameID})">
                          <div class="player-name">${player.Name || 'Unknown Player'}</div>
                          <div class="player-stats">
                            <span class="stat-tooltip">${player.Points || 0} PTS
                              <span class="tooltip-content"><h5>Points</h5><p>Total points scored by the player. 2-pointers = 2 pts, 3-pointers = 3 pts, free throws = 1 pt.</p></span>
                            </span>, 
                            <span class="stat-tooltip">${player.Rebounds || 0} REB
                              <span class="tooltip-content"><h5>Rebounds</h5><p>Number of missed shots the player grabbed. Offensive rebounds give team another scoring chance.</p></span>
                            </span>, 
                            <span class="stat-tooltip">${player.Assists || 0} AST
                              <span class="tooltip-content"><h5>Assists</h5><p>Passes that directly lead to a teammate scoring. Shows playmaking ability.</p></span>
                            </span>
                          </div>
                        </div>
                    `).join('')}
                </div>
                <div class="players-section">
                    <h4>${homeTeamName} - Key Players</h4>
                    ${homePlayers.map(player => `
                        <div class="player-card" onclick="showPlayerDetails(${player.PlayerID}, ${game.GameID})">
                          <div class="player-name">${player.Name || 'Unknown Player'}</div>
                          <div class="player-stats">
                            <span class="stat-tooltip">${player.Points || 0} PTS
                              <span class="tooltip-content"><h5>Points</h5><p>Total points scored by the player. 2-pointers = 2 pts, 3-pointers = 3 pts, free throws = 1 pt.</p></span>
                            </span>, 
                            <span class="stat-tooltip">${player.Rebounds || 0} REB
                              <span class="tooltip-content"><h5>Rebounds</h5><p>Number of missed shots the player grabbed. Offensive rebounds give team another scoring chance.</p></span>
                            </span>, 
                            <span class="stat-tooltip">${player.Assists || 0} AST
                              <span class="tooltip-content"><h5>Assists</h5><p>Passes that directly lead to a teammate scoring. Shows playmaking ability.</p></span>
                            </span>
                          </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${data.boxscore.Quarters && data.boxscore.Quarters.length > 0 ? `
                <div class="quarter-scores">
                    <h4>Quarter Scores</h4>
                    <div class="quarters-grid">
                        ${data.boxscore.Quarters.map(quarter => `
                            <div>Q${quarter.Number}: ${quarter.AwayScore || 0} - ${quarter.HomeScore || 0}</div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Team comparison functionality
async function openTeamComparison() {
  const modal = document.getElementById('comparison-modal');
  const team1Select = document.getElementById('team1-select');
  const team2Select = document.getElementById('team2-select');
  
  if (allTeams.length === 0) {
    try {
      allTeams = await fetchFromBackend('/api/teams');
    } catch (error) {
      console.error('Error loading teams:', error);
      return;
    }
  }
  
  team1Select.innerHTML = '<option value="">Select a team...</option>';
  team2Select.innerHTML = '<option value="">Select a team...</option>';
  
  allTeams.forEach(team => {
    const option1 = new Option(`${team.city} ${team.name}`, team.key);
    const option2 = new Option(`${team.city} ${team.name}`, team.key);
    team1Select.add(option1);
    team2Select.add(option2);
  });
  
  modal.style.display = 'flex';
}

function closeTeamComparison() {
  const modal = document.getElementById('comparison-modal');
  modal.style.display = 'none';
}

function setupTeamSelectors() {
  const team1Select = document.getElementById('team1-select');
  const team2Select = document.getElementById('team2-select');
  const compareBtn = document.getElementById('compare-btn');
  
  function updateCompareButton() {
    const team1Selected = team1Select.value;
    const team2Selected = team2Select.value;
    const sameTeam = team1Selected === team2Selected;
    
    compareBtn.disabled = !team1Selected || !team2Selected || sameTeam;
  }
  
  team1Select.addEventListener('change', updateCompareButton);
  team2Select.addEventListener('change', updateCompareButton);
}

async function compareTeams() {
  const team1Select = document.getElementById('team1-select');
  const team2Select = document.getElementById('team2-select');
  const resultsDiv = document.getElementById('comparison-results');
  const compareBtn = document.getElementById('compare-btn');
  
  const team1 = team1Select.value;
  const team2 = team2Select.value;
  
  if (!team1 || !team2 || team1 === team2) return;
  
  compareBtn.disabled = true;
  compareBtn.textContent = 'Comparing...';
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = '<div class="loading-comparison">Loading comparison data...</div>';
  
  try {
    const comparison = await fetchFromBackend(`/api/compare/${team1}/${team2}`);
    currentComparisonData = comparison;
    
    closeTeamComparison();
    displayComparisonCard();
    
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">Failed to compare teams: ${error.message}</div>`;
  } finally {
    compareBtn.disabled = false;
    compareBtn.textContent = 'Compare Teams';
  }
}

function displayComparisonCard() {
  const container = document.getElementById('comparison-container');
  const actionBtn = document.getElementById('comparison-action-btn');
  
  if (!currentComparisonData) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; opacity: 0.7;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏀</div>
        <h4>Compare Team Performance</h4>
        <p>Select two teams to view head-to-head statistics and season performance</p>
      </div>
    `;
    actionBtn.textContent = 'Start New Comparison';
    return;
  }

  const team1 = currentComparisonData.team1;
  const team2 = currentComparisonData.team2;
  const headToHead = currentComparisonData.headToHead;
  
  container.innerHTML = `
    <div class="comparison-active">
      <div class="comparison-header">
        <div class="team-header">
          <div class="team-name-large">${team1.City} ${team1.Name}</div>
          <div class="team-record">${team1.Wins}-${team1.Losses}</div>
        </div>
        <div class="head-to-head">
          <div class="h2h-record">${headToHead.record.team1Wins}-${headToHead.record.team2Wins}</div>
          <div class="h2h-games">Head-to-Head</div>
        </div>
        <div class="team-header">
          <div class="team-name-large">${team2.City} ${team2.Name}</div>
          <div class="team-record">${team2.Wins}-${team2.Losses}</div>
        </div>
      </div>
    </div>
  `;
  
  actionBtn.textContent = 'Compare Different Teams';
}

function handleComparisonAction() {
  openTeamComparison();
}

function showFullStandings() {
  const modal = document.getElementById('standings-modal');
  modal.style.display = 'flex';
  
  const container = document.getElementById('full-standings');
  container.innerHTML = '<div class="loading">Loading full standings...</div>';
  
  if (currentStandingsData) {
    displayFullStandings(currentStandingsData);
  } else {
    fetchFromBackend('/api/current-state')
      .then(data => {
        currentStandingsData = data.standings;
        displayFullStandings(data.standings);
      })
      .catch(error => {
        container.innerHTML = `<div class="error">Failed to load standings: ${error.message}</div>`;
      });
  }
}

function displayFullStandings(standings) {
  const container = document.getElementById('full-standings');
  
  if (!standings || standings.length === 0) {
    container.innerHTML = '<div class="empty-state">No standings data available</div>';
    return;
  }

  // Sort standings by win-loss record (win percentage)
  const eastStandings = standings.filter(team => team.Conference === 'Eastern')
    .sort((a, b) => {
      const aPct = a.Wins / (a.Wins + a.Losses);
      const bPct = b.Wins / (b.Wins + b.Losses);
      return bPct - aPct;
    });
    
  const westStandings = standings.filter(team => team.Conference === 'Western')
    .sort((a, b) => {
      const aPct = a.Wins / (a.Wins + a.Losses);
      const bPct = b.Wins / (b.Wins + b.Losses);
      return bPct - aPct;
    });

  // Calculate games behind for each conference
  const eastLeader = eastStandings[0];
  const westLeader = westStandings[0];

  container.innerHTML = `
    <div class="full-standings-container">
      <!-- Eastern Conference -->
      <div class="conference-full">
        <div class="conference-header eastern">
          <h2>Eastern Conference</h2>
          <div class="conference-stats">
            <span>Top 8 make playoffs</span>
          </div>
        </div>
        
        <div class="standings-table">
          <div class="standings-row header">
            <div class="rank">#</div>
            <div class="team">Team</div>
            <div class="stat">W</div>
            <div class="stat">L</div>
            <div class="stat">PCT</div>
            <div class="stat">GB</div>
            <div class="stat">HOME</div>
            <div class="stat">AWAY</div>
            <div class="stat">L10</div>
            <div class="stat">STRK</div>
          </div>
          
          ${eastStandings.map((team, index) => {
            const pct = ((team.Wins / (team.Wins + team.Losses)) * 100).toFixed(1);
            const gamesBehind = index === 0 ? '-' : 
              ((eastLeader.Wins - team.Wins) + (team.Losses - eastLeader.Losses)) / 2;
            const isPlayoffTeam = index < 8;
            
            return `
              <div class="standings-row ${isPlayoffTeam ? 'playoff-position' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="team">
                  <div class="team-info">
                    <span class="team-city">${team.City}</span>
                    <span class="team-name">${team.Name}</span>
                  </div>
                </div>
                <div class="stat">${team.Wins}</div>
                <div class="stat">${team.Losses}</div>
                <div class="stat">${pct}%</div>
                <div class="stat">${gamesBehind === '-' ? '-' : gamesBehind.toFixed(1)}</div>
                <div class="stat">${team.HomeWins || 0}-${team.HomeLosses || 0}</div>
                <div class="stat">${team.AwayWins || 0}-${team.AwayLosses || 0}</div>
                <div class="stat">${team.LastTenWins || 0}-${team.LastTenLosses || 0}</div>
                <div class="stat streak">
                  ${team.StreakDescription || 
                    (team.Streak > 0 ? `W${team.Streak}` : 
                     team.Streak < 0 ? `L${Math.abs(team.Streak)}` : '-')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Western Conference -->
      <div class="conference-full">
        <div class="conference-header western">
          <h2>Western Conference</h2>
          <div class="conference-stats">
            <span>Top 8 make playoffs</span>
          </div>
        </div>
        
        <div class="standings-table">
          <div class="standings-row header">
            <div class="rank">#</div>
            <div class="team">Team</div>
            <div class="stat">W</div>
            <div class="stat">L</div>
            <div class="stat">PCT</div>
            <div class="stat">GB</div>
            <div class="stat">HOME</div>
            <div class="stat">AWAY</div>
            <div class="stat">L10</div>
            <div class="stat">STRK</div>
          </div>
          
          ${westStandings.map((team, index) => {
            const pct = ((team.Wins / (team.Wins + team.Losses)) * 100).toFixed(1);
            const gamesBehind = index === 0 ? '-' : 
              ((westLeader.Wins - team.Wins) + (team.Losses - westLeader.Losses)) / 2;
            const isPlayoffTeam = index < 8;
            
            return `
              <div class="standings-row ${isPlayoffTeam ? 'playoff-position' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="team">
                  <div class="team-info">
                    <span class="team-city">${team.City}</span>
                    <span class="team-name">${team.Name}</span>
                  </div>
                </div>
                <div class="stat">${team.Wins}</div>
                <div class="stat">${team.Losses}</div>
                <div class="stat">${pct}%</div>
                <div class="stat">${gamesBehind === '-' ? '-' : gamesBehind.toFixed(1)}</div>
                <div class="stat">${team.HomeWins || 0}-${team.HomeLosses || 0}</div>
                <div class="stat">${team.AwayWins || 0}-${team.AwayLosses || 0}</div>
                <div class="stat">${team.LastTenWins || 0}-${team.LastTenLosses || 0}</div>
                <div class="stat streak">
                  ${team.StreakDescription || 
                    (team.Streak > 0 ? `W${team.Streak}` : 
                     team.Streak < 0 ? `L${Math.abs(team.Streak)}` : '-')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function closeFullStandings() {
  const modal = document.getElementById('standings-modal');
  modal.style.display = 'none';
}

// Helper function to get play type color
function getPlayTypeColor(play) {
  if (play.Points === 3) return '#4caf50';
  if (play.Points === 2) return '#2196f3';
  if (play.Points === 1) return '#ff9800';
  if (play.Category === 'Foul') return '#f44336';
  if (play.Category === 'Turnover') return '#9c27b0';
  return '#888';
}

// Helper function to get team color
function getTeamColor(team, game) {
  if (!team || !game) return '#fff';
  if (team === game.AwayTeam) return '#1d428a';
  if (team === game.HomeTeam) return '#c8102e';
  return '#fff';
}

// Play-by-play insights functions
async function showGameInsights(gameId) {
  const game = currentGamesData.find(g => g.GameID === gameId);
  
  if (!game || !game.boxscore) {
    alert('Game data not available');
    return;
  }
  
  displayGameDetails({ boxscore: game.boxscore, gameId: gameId });
  addInsightsTab(gameId);
  
  try {
    const pbpData = await fetchFromBackend(`/api/game/${gameId}/playbyplay`);
    const keyPlaysData = await fetchFromBackend(`/api/game/${gameId}/keyplays`);
    
    displayPlayByPlayInsights(gameId, pbpData, keyPlaysData, game);
  } catch (error) {
    console.error('Error fetching play-by-play:', error);
    showInsightsError(gameId);
  }
}

function addInsightsTab(gameId) {
  const container = document.querySelector('.game-details');
  if (!container) return;
  
  const existingTabs = document.getElementById('insights-tabs');
  if (existingTabs) existingTabs.remove();
  
  const existingContent = document.getElementById('insights-content');
  if (existingContent) existingContent.remove();
  
  const tabsHtml = `
    <div class="insights-tabs" id="insights-tabs">
      <button class="tab-btn active" onclick="switchGameTab('stats', ${gameId})" id="tab-stats">Game Stats</button>
      <button class="tab-btn" onclick="switchGameTab('insights', ${gameId})" id="tab-insights">Play-by-Play Insights</button>
    </div>
    <div id="insights-content" style="display: none;"></div>
  `;
  
  const header = container.querySelector('.game-details-header');
  if (header) {
    header.insertAdjacentHTML('afterend', tabsHtml);
  }
}

function switchGameTab(tab, gameId) {
  const statsElements = document.querySelectorAll('.game-details > *:not(.game-details-header):not(.insights-tabs)');
  const insightsContent = document.getElementById('insights-content');
  const tabStats = document.getElementById('tab-stats');
  const tabInsights = document.getElementById('tab-insights');
  
  if (tab === 'stats') {
    statsElements.forEach(el => el.style.display = '');
    if (insightsContent) insightsContent.style.display = 'none';
    tabStats?.classList.add('active');
    tabInsights?.classList.remove('active');
  } else {
    statsElements.forEach(el => el.style.display = 'none');
    if (insightsContent) {
      insightsContent.style.display = 'block';
      if (insightsContent.innerHTML === '') {
        insightsContent.innerHTML = '<div class="loading">Loading play-by-play insights...</div>';
        showGameInsights(gameId);
      }
    }
    tabStats?.classList.remove('active');
    tabInsights?.classList.add('active');
  }
}

function displayPlayByPlayInsights(gameId, pbpData, keyPlaysData, game) {
  const insightsContent = document.getElementById('insights-content');
  if (!insightsContent) return;
  
  if (!pbpData.hasPlays) {
    insightsContent.innerHTML = `
      <div class="empty-state" style="padding: 40px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
        <h3>No Play-by-Play Data Available</h3>
        <p>This game doesn't have detailed play-by-play data in the replay system.</p>
      </div>
    `;
    return;
  }
  
  const awayTeam = getTeamDisplayName(game.AwayTeam);
  const homeTeam = getTeamDisplayName(game.HomeTeam);
  const awayTeamKey = game.AwayTeam;
  const homeTeamKey = game.HomeTeam;
  const highlights = keyPlaysData.highlights || { topScorers: [] };
  const keyPlays = keyPlaysData.keyPlays || {};
  
  // Prepare data for charts
  const scoreProgression = prepareScoreProgressionData(pbpData.plays);
  const leadChangeData = prepareLeadChangeData(keyPlaysData.leadChanges || []);
  
  insightsContent.innerHTML = `
    <div class="insights-container">
      <!-- Game Summary Card -->
      <div class="insights-summary">
        <h4>Game Summary</h4>
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-value">${keyPlaysData.summary?.totalPlays || 0}</div>
            <div class="stat-label">Total Plays</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${keyPlaysData.summary?.leadChanges || 0}</div>
            <div class="stat-label">Lead Changes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${keyPlaysData.summary?.biggestRun || 0}</div>
            <div class="stat-label">Biggest Run</div>
          </div>
        </div>
      </div>
      
      <!-- Score Progression Chart -->
      <div class="chart-container">
        <h4>Score Progression</h4>
        <div class="chart-wrapper">
          <canvas id="score-chart-${gameId}" width="400" height="200"></canvas>
        </div>
        <div class="chart-legend">
          <span class="legend-item" style="color: #1d428a;">■ ${awayTeam}</span>
          <span class="legend-item" style="color: #c8102e;">■ ${homeTeam}</span>
        </div>
      </div>
      
      <!-- Lead Change Timeline -->
      <div class="lead-change-container">
        <h4>Lead Change Timeline</h4>
        ${keyPlaysData.leadChanges && keyPlaysData.leadChanges.length > 0 ? `
          <div class="lead-change-visualization">
            ${generateLeadChangeVisualization(keyPlaysData.leadChanges, awayTeamKey, homeTeamKey, game)}
          </div>
          <div class="lead-change-list">
            ${keyPlaysData.leadChanges.map((change, index) => `
              <div class="lead-change-item ${change.newLeader === 'Away' ? 'away-lead' : 'home-lead'}">
                <span class="lead-change-time">${change.time}</span>
                <span class="lead-change-description">
                  ${change.newLeader === 'Away' ? awayTeam : homeTeam} takes lead
                </span>
                <span class="lead-change-score">${change.score}</span>
              </div>
            `).join('')}
          </div>
        ` : '<p class="no-data">No lead changes in this game</p>'}
      </div>
      
      <!-- Quarter Breakdown with Bar Chart -->
      <div class="quarter-breakdown">
        <h4>Quarter Analysis</h4>
        <div class="chart-wrapper">
          <canvas id="quarter-chart-${gameId}" width="400" height="200"></canvas>
        </div>
        <div class="quarters-table">
          <table>
            <thead>
              <tr>
                <th>Quarter</th>
                <th>${awayTeam}</th>
                <th>${homeTeam}</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              ${pbpData.quarters.map((quarter, index) => {
                const diff = quarter.AwayScore - quarter.HomeScore;
                const diffText = diff > 0 ? `+${diff}` : diff < 0 ? diff : '0';
                const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
                return `
                  <tr>
                    <td>Q${quarter.Number}</td>
                    <td class="text-center">${quarter.AwayScore}</td>
                    <td class="text-center">${quarter.HomeScore}</td>
                    <td class="text-center ${diffClass}">${diffText}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Momentum Swing Chart -->
      <div class="momentum-container">
        <h4>Momentum Swings</h4>
        <div class="chart-wrapper">
          <canvas id="momentum-chart-${gameId}" width="400" height="150"></canvas>
        </div>
        <p class="chart-note">* Shows point differential over time (positive = ${awayTeam} leading, negative = ${homeTeam} leading)</p>
      </div>
      
      <!-- Key Plays Timeline -->
      <div class="key-plays">
        <h4>Key Moments</h4>
        <div class="plays-timeline">
          ${pbpData.plays.filter(play => play.Points > 0 || play.Category === 'Foul' || play.Category === 'Turnover')
            .slice(-20).reverse().map(play => `
              <div class="play-item" style="border-left-color: ${getPlayTypeColor(play)};">
                <div class="play-header">
                  <span class="play-team" style="color: ${getTeamColor(play.Team, game)}">${play.Team || 'Game'}</span>
                  <span class="play-time">Q${play.QuarterName} ${play.TimeRemainingMinutes}:${String(play.TimeRemainingSeconds).padStart(2, '0')}</span>
                </div>
                <div class="play-description">${play.Description || 'Play'}</div>
                <div class="play-score">
                  <span>Score: ${play.AwayTeamScore || 0} - ${play.HomeTeamScore || 0}</span>
                  ${play.Points ? `<span class="play-points">+${play.Points}</span>` : ''}
                </div>
              </div>
            `).join('')}
        </div>
      </div>
      
      <!-- Clutch Moments -->
      ${keyPlays.clutchPlays && keyPlays.clutchPlays.length > 0 ? `
        <div class="clutch-moments">
          <h4>Clutch Moments (Last 2 Minutes)</h4>
          <div class="clutch-list">
            ${keyPlays.clutchPlays.map(play => `
              <div class="clutch-item">
                <div class="clutch-description" style="color: ${getTeamColor(play.Team, game)}">${play.Description}</div>
                <div class="clutch-time">${play.TimeRemainingMinutes}:${String(play.TimeRemainingSeconds).padStart(2, '0')}</div>
                <div class="clutch-score">Score: ${play.AwayTeamScore}-${play.HomeTeamScore}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  // Initialize charts after DOM is updated
  setTimeout(() => {
    try {
      if (typeof Chart !== 'undefined') {
        createScoreProgressionChart(`score-chart-${gameId}`, scoreProgression, awayTeam, homeTeam);
        createQuarterChart(`quarter-chart-${gameId}`, pbpData.quarters, awayTeam, homeTeam);
        createMomentumChart(`momentum-chart-${gameId}`, scoreProgression, awayTeam, homeTeam);
      } else {
        console.warn('Chart.js not loaded');
      }
    } catch (chartError) {
      console.error('Error creating charts:', chartError);
    }
  }, 100);
}

function prepareScoreProgressionData(plays) {
  const progression = [];
  let currentAwayScore = 0;
  let currentHomeScore = 0;
  
  // Sort plays by sequence
  const sortedPlays = [...plays].sort((a, b) => a.Sequence - b.Sequence);
  
  // Add starting point
  progression.push({
    playNumber: 0,
    time: 'Start',
    awayScore: 0,
    homeScore: 0,
    quarter: 1
  });
  
  sortedPlays.forEach((play, index) => {
    if (play.AwayTeamScore !== undefined && play.HomeTeamScore !== undefined) {
      currentAwayScore = play.AwayTeamScore;
      currentHomeScore = play.HomeTeamScore;
      
      progression.push({
        playNumber: index + 1,
        time: `Q${play.QuarterName} ${play.TimeRemainingMinutes}:${String(play.TimeRemainingSeconds).padStart(2, '0')}`,
        awayScore: currentAwayScore,
        homeScore: currentHomeScore,
        quarter: play.QuarterName,
        description: play.Description
      });
    }
  });
  
  return progression;
}

// Helper function to prepare lead change data
function prepareLeadChangeData(leadChanges) {
  return leadChanges.map((change, index) => ({
    ...change,
    index: index + 1
  }));
}

// Generate visual representation of lead changes
function generateLeadChangeVisualization(leadChanges, awayTeam, homeTeam, game) {
  if (!leadChanges || leadChanges.length === 0) return '<p>No lead changes</p>';
  
  const totalDuration = 48; // 48 minutes in an NBA game
  let visualization = '<div class="lead-change-track">';
  
  // Create timeline track
  leadChanges.forEach((change, index) => {
    const timeParts = change.time.split(' - ');
    if (timeParts.length < 2) return;
    
    const quarter = timeParts[0].replace('Q', '');
    const timeStr = timeParts[1];
    const [minutes, seconds] = timeStr.split(':').map(Number);
    
    // Calculate position on timeline (simplified)
    const quarterStart = (parseInt(quarter) - 1) * 12;
    const timeElapsed = quarterStart + (12 - minutes) + (seconds / 60);
    const position = (timeElapsed / totalDuration) * 100;
    
    visualization += `
      <div class="lead-change-marker ${change.newLeader === 'Away' ? 'away-marker' : 'home-marker'}" 
           style="left: ${position}%"
           title="${change.newLeader === 'Away' ? getTeamDisplayName(awayTeam) : getTeamDisplayName(homeTeam)} takes lead at ${change.time}">
        <span class="marker-tooltip">${change.time}</span>
      </div>
    `;
  });
  
  visualization += '</div>';
  return visualization;
}

// Create score progression chart
function createScoreProgressionChart(canvasId, data, awayTeam, homeTeam) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;
  
  // Clean up old chart if exists
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }
  
  const ctx = canvas.getContext('2d');
  charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.time),
      datasets: [
        {
          label: awayTeam,
          data: data.map(d => d.awayScore),
          borderColor: '#1d428a',
          backgroundColor: 'rgba(29, 66, 138, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 2,
          pointHoverRadius: 5
        },
        {
          label: homeTeam,
          data: data.map(d => d.homeScore),
          borderColor: '#c8102e',
          backgroundColor: 'rgba(200, 16, 46, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 2,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const index = context[0].dataIndex;
              if (data[index] && data[index].description) {
                return data[index].description;
              }
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: 'rgba(255,255,255,0.7)' }
        },
        x: {
          ticks: {
            color: 'rgba(255,255,255,0.7)',
            maxRotation: 45,
            maxTicksLimit: 10
          },
          grid: { display: false }
        }
      }
    }
  });
}

// Create quarter comparison chart
function createQuarterChart(canvasId, quarters, awayTeam, homeTeam) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;
  
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }
  
  const ctx = canvas.getContext('2d');
  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: quarters.map(q => `Q${q.Number}`),
      datasets: [
        {
          label: awayTeam,
          data: quarters.map(q => q.AwayScore),
          backgroundColor: '#1d428a',
          borderRadius: 4
        },
        {
          label: homeTeam,
          data: quarters.map(q => q.HomeScore),
          backgroundColor: '#c8102e',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: 'rgba(255,255,255,0.7)' }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255,255,255,0.7)' }
        }
      }
    }
  });
}

// Create momentum chart (point differential over time)
function createMomentumChart(canvasId, data, awayTeam, homeTeam) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;
  
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }
  
  const differentialData = data.map(d => d.awayScore - d.homeScore);
  
  const ctx = canvas.getContext('2d');
  charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.time),
      datasets: [
        {
          label: 'Point Differential',
          data: differentialData,
          borderColor: '#4caf50',
          backgroundColor: (context) => {
            const value = context.dataset.data[context.dataIndex];
            return value > 0 ? 'rgba(29, 66, 138, 0.2)' : 'rgba(200, 16, 46, 0.2)';
          },
          borderWidth: 2,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 5,
          segment: {
            borderColor: ctx => {
              return ctx.p0.parsed.y > 0 ? '#1d428a' : '#c8102e';
            }
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const team = value > 0 ? awayTeam : (value < 0 ? homeTeam : 'Tied');
              const absValue = Math.abs(value);
              return `${team} leads by ${absValue}`;
            }
          }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: {
            color: 'rgba(255,255,255,0.7)',
            callback: function(value) {
              return value > 0 ? `+${value}` : value;
            }
          }
        },
        x: {
          ticks: {
            color: 'rgba(255,255,255,0.7)',
            maxRotation: 45,
            maxTicksLimit: 8
          },
          grid: { display: false }
        }
      }
    }
  });
}

function showInsightsError(gameId) {
  const insightsContent = document.getElementById('insights-content');
  if (insightsContent) {
    insightsContent.innerHTML = `
      <div class="error" style="padding: 20px; text-align: center;">
        <h3>Unable to Load Play-by-Play Data</h3>
        <p>There was an error fetching the play-by-play data for this game.</p>
        <button class="back-btn" onclick="showGameInsights(${gameId})">Try Again</button>
      </div>
    `;
  }
}

function createStatTooltip(statName, description) {
  return `
    <span class="stat-tooltip">
      ${statName}
      <span class="tooltip-content">
        <h5>${statName}</h5>
        <p>${description}</p>
      </span>
    </span>
  `;
}

async function showPlayerDetails(playerId, gameId) {
  const game = currentGamesData.find(g => g.GameID === gameId);
  if (!game || !game.boxscore) return;
  
  const player = game.boxscore.PlayerGames?.find(p => p.PlayerID === playerId);
  if (!player) return;
  
  const modal = document.getElementById('player-modal');
  const content = document.getElementById('player-details-content');
  
  const teamName = getTeamDisplayName(player.Team);
  const opponent = player.Team === game.AwayTeam ? game.HomeTeam : game.AwayTeam;
  const opponentName = getTeamDisplayName(opponent);
  const teamLogo = getTeamLogoUrl(player.Team);
  
  // Calculate advanced stats if we have the data
  const minutes = player.Minutes || 0;
  const fga = player.FieldGoalsAttempted || 0;
  const fgm = player.FieldGoalsMade || 0;
  const fta = player.FreeThrowsAttempted || 0;
  const ftm = player.FreeThrowsMade || 0;
  const tpa = player.ThreePointersAttempted || 0;
  const tpm = player.ThreePointersMade || 0;
  const rebounds = player.Rebounds || 0;
  const assists = player.Assists || 0;
  const steals = player.Steals || 0;
  const blocks = player.BlockedShots || 0;
  const turnovers = player.Turnovers || 0;
  const points = player.Points || 0;
  const fouls = player.PersonalFouls || 0;
  
  // Calculate percentages correctly (already decimals, just format to 1 decimal)
  const fgPct = player.FieldGoalsPercentage !== undefined && player.FieldGoalsPercentage !== null 
    ? (player.FieldGoalsPercentage).toFixed(1) 
    : '0.0';
    
  const threePct = player.ThreePointersPercentage !== undefined && player.ThreePointersPercentage !== null 
    ? (player.ThreePointersPercentage).toFixed(1) 
    : '0.0';
    
  const ftPct = player.FreeThrowsPercentage !== undefined && player.FreeThrowsPercentage !== null 
    ? (player.FreeThrowsPercentage).toFixed(1) 
    : '0.0';
  
  // Calculate True Shooting Percentage (TS%)
  const tsPercent = fga + (0.44 * fta) > 0 
    ? (points / (2 * (fga + (0.44 * fta)))).toFixed(1)
    : '0.0';
  
  // Calculate Effective Field Goal Percentage (eFG%)
  const efgPercent = fga > 0
    ? ((fgm + 0.5 * tpm) / fga * 100).toFixed(1)
    : '0.0';
  
  // Calculate Game Score
  const gameScore = (
    points +
    0.4 * fgm -
    0.7 * fga -
    0.4 * (fta - ftm) +
    0.7 * (player.OffensiveRebounds || 0) +
    0.3 * (player.DefensiveRebounds || 0) +
    steals +
    0.7 * assists +
    0.7 * blocks -
    0.4 * fouls -
    turnovers
  ).toFixed(1);
  
  // Calculate PIR (Performance Index Rating)
  const pir = (
    points +
    rebounds +
    assists +
    steals +
    blocks +
    (fga - fgm) * -1 +
    (fta - ftm) * -1 +
    turnovers * -1
  ).toFixed(1);
  
  // Calculate usage rate approximation
  const teamPossessions = (game.boxscore.Game.AwayTeamFGA + game.boxscore.Game.AwayTeamTurnovers + 
                          game.boxscore.Game.HomeTeamFGA + game.boxscore.Game.HomeTeamTurnovers) / 2;
  const usageRate = teamPossessions > 0 && minutes > 0
    ? ((fga + 0.44 * fta + turnovers) * minutes * 5 / teamPossessions).toFixed(1)
    : '0.0';
  
  // Calculate assist-to-turnover ratio
  const astToRatio = turnovers > 0 
    ? (assists / turnovers).toFixed(2)
    : assists > 0 ? assists.toFixed(2) : '0.0';
  
  content.innerHTML = `
    <div class="player-details">
      <div class="player-details-header">
        <div class="player-details-logo">
          ${teamLogo ? `<img src="${teamLogo}" alt="${player.Team}">` : ''}
        </div>
        <div class="player-basic-info">
          <h4>${player.Name}</h4>
          <div class="player-position">${player.Position || 'Position N/A'} | #${player.Jersey || 'N/A'}</div>
          <div class="player-game-info">${teamName} vs ${opponentName}</div>
        </div>
      </div>
      
      <div class="player-stats-grid">
        <div class="player-stat-item">
          <div class="player-stat-value">${player.Points || 0}</div>
          <div class="player-stat-label">${createStatTooltip('PTS', 'Total points scored')}</div>
        </div>
        <div class="player-stat-item">
          <div class="player-stat-value">${player.Rebounds || 0}</div>
          <div class="player-stat-label">${createStatTooltip('REB', 'Total rebounds')}</div>
        </div>
        <div class="player-stat-item">
          <div class="player-stat-value">${player.Assists || 0}</div>
          <div class="player-stat-label">${createStatTooltip('AST', 'Total assists')}</div>
        </div>
        <div class="player-stat-item">
          <div class="player-stat-value">${player.Minutes || 0}</div>
          <div class="player-stat-label">${createStatTooltip('MIN', 'Minutes played')}</div>
        </div>
      </div>
      
      <div class="advanced-stats-grid">
        <div class="advanced-stat-item">
          <div class="advanced-stat-value">${tsPercent}%</div>
          <div class="advanced-stat-label">${createStatTooltip('TS%', 'True Shooting Percentage - Measures scoring efficiency taking into account 2-pointers, 3-pointers, and free throws.')}</div>
        </div>
        <div class="advanced-stat-item">
          <div class="advanced-stat-value">${efgPercent}%</div>
          <div class="advanced-stat-label">${createStatTooltip('eFG%', 'Effective Field Goal Percentage - Adjusts for the fact that 3-pointers are worth more than 2-pointers.')}</div>
        </div>
        <div class="advanced-stat-item">
          <div class="advanced-stat-value">${gameScore}</div>
          <div class="advanced-stat-label">${createStatTooltip('Game Score', 'A metric created by John Hollinger that gives a rough measure of a player\'s productivity for a single game.')}</div>
        </div>
        <div class="advanced-stat-item">
          <div class="advanced-stat-value">${pir}</div>
          <div class="advanced-stat-label">${createStatTooltip('PIR', 'Performance Index Rating - Used in international basketball to measure overall performance.')}</div>
        </div>
        <div class="advanced-stat-item">
          <div class="advanced-stat-value">${usageRate}</div>
          <div class="advanced-stat-label">${createStatTooltip('USG%', 'Usage Rate - Estimated percentage of team plays used by this player while on the floor.')}</div>
        </div>
        <div class="advanced-stat-item">
          <div class="advanced-stat-value">${astToRatio}</div>
          <div class="advanced-stat-label">${createStatTooltip('AST/TO', 'Assist-to-Turnover Ratio - Measures playmaking efficiency. Higher is better.')}</div>
        </div>
      </div>
      
      <div class="player-stats-categories">
        <div class="stats-category">
          <h5>Shooting</h5>
          <div class="stats-grid shooting-grid">
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('FG', 'Field Goals')}</span>
              <span class="stat-value">${fgm}/${fga} (${fgPct}%)</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('3P', '3-Pointers')}</span>
              <span class="stat-value">${tpm}/${tpa} (${threePct}%)</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('FT', 'Free Throws')}</span>
              <span class="stat-value">${ftm}/${fta} (${ftPct}%)</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('2P', '2-Pointers')}</span>
              <span class="stat-value">${fgm - tpm || 0}/${fga - tpa || 0}</span>
            </div>
          </div>
        </div>
        
        <div class="stats-category">
          <h5>Rebounding</h5>
          <div class="stats-grid">
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('Offensive Rebounds', 'Rebounds grabbed on offense')}</span>
              <span class="stat-value">${player.OffensiveRebounds || 0}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('Defensive Rebounds', 'Rebounds grabbed on defense')}</span>
              <span class="stat-value">${player.DefensiveRebounds || 0}</span>
            </div>
          </div>
        </div>
        
        <div class="stats-category">
          <h5>Other Stats</h5>
          <div class="stats-grid">
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('Steals', 'Taking the ball from opponent')}</span>
              <span class="stat-value">${steals}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('Blocks', 'Rejecting opponent\'s shot')}</span>
              <span class="stat-value">${blocks}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('Turnovers', 'Losing ball to opponent')}</span>
              <span class="stat-value">${turnovers}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('Personal Fouls', 'Illegal physical contact')}</span>
              <span class="stat-value">${fouls}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${createStatTooltip('Plus/Minus', 'Team scoring differential while player on court')}</span>
              <span class="stat-value">${player.PlusMinus || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

function closePlayerModal() {
  const modal = document.getElementById('player-modal');
  modal.style.display = 'none';
}

// Update the displayComparisonCard function with tooltips
function displayComparisonCard() {
  const container = document.getElementById('comparison-container');
  const actionBtn = document.getElementById('comparison-action-btn');
  
  if (!currentComparisonData) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; opacity: 0.7;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏀</div>
        <h4>Compare Team Performance</h4>
        <p>Select two teams to view head-to-head statistics and season performance</p>
      </div>
    `;
    actionBtn.textContent = 'Start New Comparison';
    return;
  }

  const team1 = currentComparisonData.team1;
  const team2 = currentComparisonData.team2;
  const headToHead = currentComparisonData.headToHead;
  const stats1 = currentComparisonData.team1.stats;
  const stats2 = currentComparisonData.team2.stats;
  
  container.innerHTML = `
    <div class="comparison-active">
      <div class="comparison-header">
        <div class="team-header">
          <div class="team-name-large">${team1.City} ${team1.Name}</div>
          <div class="team-record">${team1.Wins}-${team1.Losses}</div>
        </div>
        <div class="head-to-head">
          <div class="h2h-record">${headToHead.record.team1Wins}-${headToHead.record.team2Wins}</div>
          <div class="h2h-games">Head-to-Head</div>
        </div>
        <div class="team-header">
          <div class="team-name-large">${team2.City} ${team2.Name}</div>
          <div class="team-record">${team2.Wins}-${team2.Losses}</div>
        </div>
      </div>
      
      <div class="stat-comparison">
        <div class="stat-label">${createStatTooltip('Points Per Game', 'Average points scored per game. Shows offensive firepower.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.pointsPerGame) > parseFloat(stats2.pointsPerGame) ? 'leading' : ''}">${stats1.pointsPerGame}</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.pointsPerGame) > parseFloat(stats1.pointsPerGame) ? 'leading' : ''}">${stats2.pointsPerGame}</span>
        </div>
        
        <div class="stat-label">${createStatTooltip('Points Allowed', 'Average points allowed per game. Lower is better for defense.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.pointsAllowedPerGame) < parseFloat(stats2.pointsAllowedPerGame) ? 'leading' : ''}">${stats1.pointsAllowedPerGame}</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.pointsAllowedPerGame) < parseFloat(stats1.pointsAllowedPerGame) ? 'leading' : ''}">${stats2.pointsAllowedPerGame}</span>
        </div>
        
        <div class="stat-label">${createStatTooltip('Rebounds Per Game', 'Average rebounds per game. Shows physicality and hustle.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.reboundsPerGame) > parseFloat(stats2.reboundsPerGame) ? 'leading' : ''}">${stats1.reboundsPerGame}</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.reboundsPerGame) > parseFloat(stats1.reboundsPerGame) ? 'leading' : ''}">${stats2.reboundsPerGame}</span>
        </div>
        
        <div class="stat-label">${createStatTooltip('Assists Per Game', 'Average assists per game. Shows ball movement and teamwork.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.assistsPerGame) > parseFloat(stats2.assistsPerGame) ? 'leading' : ''}">${stats1.assistsPerGame}</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.assistsPerGame) > parseFloat(stats1.assistsPerGame) ? 'leading' : ''}">${stats2.assistsPerGame}</span>
        </div>
        
        <div class="stat-label">${createStatTooltip('Field Goal %', 'Percentage of shots made. Higher is more efficient.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.fieldGoalPercentage) > parseFloat(stats2.fieldGoalPercentage) ? 'leading' : ''}">${stats1.fieldGoalPercentage}%</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.fieldGoalPercentage) > parseFloat(stats1.fieldGoalPercentage) ? 'leading' : ''}">${stats2.fieldGoalPercentage}%</span>
        </div>
        
        <div class="stat-label">${createStatTooltip('3-Point %', 'Percentage of three-pointers made. Shows outside shooting ability.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.threePointPercentage) > parseFloat(stats2.threePointPercentage) ? 'leading' : ''}">${stats1.threePointPercentage}%</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.threePointPercentage) > parseFloat(stats1.threePointPercentage) ? 'leading' : ''}">${stats2.threePointPercentage}%</span>
        </div>
        
        <div class="stat-label">${createStatTooltip('Steals Per Game', 'Average steals per game. Shows defensive pressure.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.stealsPerGame) > parseFloat(stats2.stealsPerGame) ? 'leading' : ''}">${stats1.stealsPerGame}</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.stealsPerGame) > parseFloat(stats1.stealsPerGame) ? 'leading' : ''}">${stats2.stealsPerGame}</span>
        </div>
        
        <div class="stat-label">${createStatTooltip('Blocks Per Game', 'Average blocks per game. Shows rim protection.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.blocksPerGame) > parseFloat(stats2.blocksPerGame) ? 'leading' : ''}">${stats1.blocksPerGame}</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.blocksPerGame) > parseFloat(stats1.blocksPerGame) ? 'leading' : ''}">${stats2.blocksPerGame}</span>
        </div>
        
        <div class="stat-label">${createStatTooltip('Turnovers Per Game', 'Average turnovers per game. Lower is better - fewer mistakes.')}</div>
        <div class="stat-item">
          <span class="stat-team ${parseFloat(stats1.turnoversPerGame) < parseFloat(stats2.turnoversPerGame) ? 'leading' : ''}">${stats1.turnoversPerGame}</span>
          <span class="stat-value">vs</span>
          <span class="stat-team ${parseFloat(stats2.turnoversPerGame) < parseFloat(stats1.turnoversPerGame) ? 'leading' : ''}">${stats2.turnoversPerGame}</span>
        </div>
      </div>
      
      ${headToHead.games.length > 0 ? `
        <div style="margin-top: 2rem;">
          <h4>Recent Matchups</h4>
          ${headToHead.games.map(game => {
            const winner = game.boxscore.Game.AwayTeamScore > game.boxscore.Game.HomeTeamScore ? game.AwayTeam : game.HomeTeam;
            const winnerName = getTeamDisplayName(winner);
            const date = new Date(game.Day).toLocaleDateString();
            return `
              <div class="game-result" onclick="showGameDetails(${game.GameID})">
                <span>${getTeamDisplayName(game.AwayTeam)} @ ${getTeamDisplayName(game.HomeTeam)}</span>
                <span class="winner">${winnerName} won</span>
                <span>${game.boxscore.Game.AwayTeamScore}-${game.boxscore.Game.HomeTeamScore}</span>
                <span style="opacity:0.7; font-size:0.8rem;">${date}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  actionBtn.textContent = 'Compare Different Teams';
}

function addInsightsStyles() {
  if (document.getElementById('insights-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'insights-styles';
  style.textContent = `
    .insights-tabs {
      display: flex;
      margin: 20px 0;
      border-bottom: 2px solid rgba(255,255,255,0.1);
    }
    
    .tab-btn {
      background: none;
      border: none;
      color: white;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.7;
      border-bottom: 3px solid transparent;
    }
    
    .tab-btn:hover { opacity: 1; }
    .tab-btn.active {
      opacity: 1;
      border-bottom-color: #c8102e;
      font-weight: bold;
    }
    
    .insights-container {
      padding: 20px;
    }
    
    .insights-summary, .quarter-breakdown, .key-plays, .clutch-moments, 
    .lead-change-container, .chart-container, .momentum-container, .top-performers {
      background: rgba(255,255,255,0.05);
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 25px;
    }
    
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .stat-card {
      background: rgba(255,255,255,0.1);
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #4caf50;
    }
    
    .stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-top: 5px;
    }
    
    .chart-container, .momentum-container {
      min-height: 300px;
    }
    
    .chart-wrapper {
      position: relative;
      height: 250px;
      width: 100%;
      margin: 15px 0;
    }
    
    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 10px;
    }
    
    .legend-item {
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .lead-change-visualization {
      margin: 20px 0;
      padding: 10px 0;
    }
    
    .lead-change-track {
      position: relative;
      height: 40px;
      background: linear-gradient(to right, #1d428a, #c8102e);
      border-radius: 20px;
      margin: 20px 0;
    }
    
    .lead-change-marker {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      top: 50%;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .lead-change-marker:hover {
      transform: translate(-50%, -50%) scale(1.5);
    }
    
    .lead-change-marker:hover .marker-tooltip {
      display: block;
    }
    
    .away-marker {
      background: #1d428a;
      border: 2px solid white;
    }
    
    .home-marker {
      background: #c8102e;
      border: 2px solid white;
    }
    
    .marker-tooltip {
      display: none;
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      white-space: nowrap;
      z-index: 10;
    }
    
    .lead-change-list {
      max-height: 200px;
      overflow-y: auto;
      margin-top: 15px;
      border-radius: 8px;
    }
    
    .lead-change-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      margin: 5px 0;
      border-radius: 6px;
      transition: transform 0.2s;
    }
    
    .lead-change-item:hover {
      transform: translateX(5px);
    }
    
    .away-lead {
      background: rgba(29, 66, 138, 0.2);
      border-left: 3px solid #1d428a;
    }
    
    .home-lead {
      background: rgba(200, 16, 46, 0.2);
      border-left: 3px solid #c8102e;
    }
    
    .lead-change-time {
      font-size: 0.85rem;
      opacity: 0.8;
      min-width: 80px;
    }
    
    .lead-change-description {
      flex: 1;
      margin: 0 15px;
      font-weight: 500;
    }
    
    .lead-change-score {
      font-weight: bold;
      font-size: 1.1rem;
    }
    
    .quarters-table {
      overflow-x: auto;
      margin-top: 15px;
    }
    
    .quarters-table table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .quarters-table th {
      background: rgba(255,255,255,0.1);
      padding: 10px;
      text-align: left;
    }
    
    .quarters-table td {
      padding: 8px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .text-center {
      text-align: center;
    }
    
    .positive { color: #4caf50; }
    .negative { color: #f44336; }
    
    .plays-timeline {
      max-height: 400px;
      overflow-y: auto;
      padding-right: 10px;
    }
    
    .play-item {
      padding: 12px;
      margin-bottom: 10px;
      background: rgba(255,255,255,0.03);
      border-left: 4px solid;
      border-radius: 6px;
      transition: transform 0.2s;
    }
    
    .play-item:hover {
      transform: translateX(5px);
      background: rgba(255,255,255,0.05);
    }
    
    .play-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    
    .play-team {
      font-weight: bold;
    }
    
    .play-time {
      font-size: 0.85rem;
      opacity: 0.7;
    }
    
    .play-description {
      margin: 5px 0;
    }
    
    .play-score {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .play-points {
      color: #4caf50;
      font-weight: bold;
    }
    
    .performers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .performer-card {
      background: rgba(255,255,255,0.08);
      padding: 15px;
      border-radius: 8px;
      transition: transform 0.2s;
    }
    
    .performer-card:hover {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.1);
    }
    
    .performer-name {
      font-weight: bold;
      font-size: 1.1rem;
      margin-bottom: 5px;
    }
    
    .performer-team {
      font-size: 0.9rem;
      margin-bottom: 10px;
    }
    
    .performer-stats {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .stat {
      background: rgba(255,255,255,0.1);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    
    .clutch-list {
      margin-top: 10px;
    }
    
    .clutch-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .clutch-item:last-child {
      border-bottom: none;
    }
    
    .clutch-description {
      flex: 2;
      font-weight: 500;
    }
    
    .clutch-time {
      flex: 1;
      text-align: center;
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .clutch-score {
      flex: 1;
      text-align: right;
      font-weight: bold;
    }
    
    .chart-note {
      text-align: center;
      font-size: 0.85rem;
      opacity: 0.7;
      margin-top: 10px;
      font-style: italic;
    }
    
    .no-data {
      text-align: center;
      padding: 20px;
      opacity: 0.7;
      font-style: italic;
    }
    
    /* Scrollbar styles */
    .plays-timeline::-webkit-scrollbar,
    .lead-change-list::-webkit-scrollbar {
      width: 8px;
    }
    
    .plays-timeline::-webkit-scrollbar-track,
    .lead-change-list::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
    }
    
    .plays-timeline::-webkit-scrollbar-thumb,
    .lead-change-list::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
    }
    
    .plays-timeline::-webkit-scrollbar-thumb:hover,
    .lead-change-list::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.3);
    }
  `;
  document.head.appendChild(style);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentState();
    setupTeamSelectors();
    addLogoStyles();
    addInsightsStyles();
});

async function refreshAll() {
    await loadCurrentState();
}

// Add CSS for team logos
function addLogoStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .team-logo-container {
      width: 60px;
      height: 60px;
      margin: 0 auto 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .team-logo {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .team-logo-fallback {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      font-weight: bold;
    }
    
    .team {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .game-teams {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0.5rem 0;
    }
    
    .vs {
      margin: 0 1rem;
      opacity: 0.7;
      font-size: 1.2rem;
    }
    
    .final-score {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 40px;
      margin: 30px 0;
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
    }
    
    .score-team {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    
    .team-score {
      font-size: 2.5rem;
      font-weight: bold;
      color: #c8102e;
    }
    
    .game-details-logo {
      width: 80px;
      height: 80px;
    }
    
    .game-details-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .team-stats-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin: 30px 0;
    }
    
    .team-stat {
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    
    .key-players {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin: 30px 0;
    }
    
    .player-card {
      background: rgba(255,255,255,0.05);
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .quarter-scores .quarters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      padding: 15px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    
    .conference-standings-preview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    
    .standing-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .team-highlight {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      font-weight: 600;
    }
    
    .modal {
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .modal-content {
      background: #2d2d2d;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 20px;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }
    
    .close-btn {
      font-size: 2rem;
      cursor: pointer;
    }
    
    .team-selectors {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .team-selector select {
      padding: 0.75rem;
      border-radius: 6px;
      background: rgba(0,0,0,0.8);
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
      width: 100%;
    }
    
    .compare-action-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #1d428a, #c8102e);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.1rem;
    }
    
    .compare-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .back-btn {
      background: rgba(255,255,255,0.1);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 1rem;
    }
    
    .back-btn:hover {
      background: rgba(255,255,255,0.2);
    }
    
    .refresh-btn {
      background: linear-gradient(135deg, #1d428a, #c8102e);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .loading, .empty-state {
      text-align: center;
      padding: 2rem;
      opacity: 0.7;
    }
    
    .error {
      background: #d32f2f;
      color: white;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}