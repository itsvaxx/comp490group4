// public/app.js
const API_BASE_URL = 'http://localhost:3000';

// Store games data globally so we can access it for details
let currentGamesData = [];
let currentComparisonData = null;
let currentStandingsData = null;
let teamLogoCache = {};

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
    // Common logo URLs for each team
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

// Team name mapping function
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
    setLoadingState('replay-info', true);
    setLoadingState('games-container', true);
    setLoadingState('standings-preview', true);
    setLoadingState('comparison-container', true);
    
    const data = await fetchFromBackend('/api/current-state');
    
    // Store data globally
    currentGamesData = data.games || [];
    currentStandingsData = data.standings || [];
    
    displayReplayInfo(data);
    displayGames(data);
    displayStandings(data);
    displayComparisonCard(); // Initialize comparison card
    
  } catch (error) {
    console.error('Failed to load current state:', error);
    showError('replay-info', `Failed to load data: ${error.message}`);
    showError('games-container', 'Could not load games data');
    showError('standings-preview', 'Could not load standings data');
    showError('comparison-container', 'Could not load comparison data');
  }
}

// Display replay information
function displayReplayInfo(data) {
    const container = document.getElementById('replay-info');
    
    const currentTime = data.metadata.CurrentTime ? 
        new Date(data.metadata.CurrentTime).toLocaleString() : 'Unknown';
    
    const filteredMessage = data.originalGameCount > data.totalGames ? 
        `<p style="color: #ff9800; margin-top: 0.5rem;">
            <strong>Note:</strong> Showing ${data.totalGames} of ${data.originalGameCount} games (only those with available boxscore data)
        </p>` : '';

    container.innerHTML = `
        <h3>NBA Live Dashboard</h3>
        <p><strong>Current Replay Time:</strong> ${currentTime}</p>
        <p><strong>Date Range:</strong> ${data.metadata.previousDate} to ${data.metadata.CurrentDate}</p>
        <p><strong>Games Available:</strong> ${data.totalGames} | 
           <strong>Live:</strong> ${data.gamesInProgress ? '<span class="live-indicator"></span>Yes' : 'No'}</p>
        ${data.metadata.IsFallback ? '<p style="color: #ff9800; margin-top: 0.5rem;"><strong>Note:</strong> Using fallback data - API may be unavailable</p>' : ''}
        ${filteredMessage}
    `;
}

// Display games
function displayGames(data) {
  const container = document.getElementById('games-container');
  
  if (!data.games || data.games.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No games scheduled
      </div>
    `;
    return;
  }

  // Separate games with and without boxscores for display
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

// Add this helper function to render game cards
function renderGameCard(game, hasData) {
  const awayTeamName = getTeamDisplayName(game.AwayTeam);
  const homeTeamName = getTeamDisplayName(game.HomeTeam);
  const gameDate = game.gameDate || (game.Day ? game.Day.split('T')[0] : 'Unknown');
  
  // Get logo URLs
  const awayLogoUrl = getTeamLogoUrl(game.AwayTeam);
  const homeLogoUrl = getTeamLogoUrl(game.HomeTeam);
  
  if (hasData) {
    // Game with boxscore data
    const hasScores = game.boxscore && game.boxscore.Game && 
                    game.boxscore.Game.AwayTeamScore !== null && 
                    game.boxscore.Game.HomeTeamScore !== null;
    
    return `
      <div class="game-card" onclick="showGameDetails(${game.GameID})">
        <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.5rem;">
          ${gameDate}
        </div>
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
    // Game without boxscore data
    return `
      <div class="game-card scheduled-game" onclick="showScheduledGameDetails(${game.GameID})">
        <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.5rem;">
          ${gameDate}
        </div>
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
      cursor: pointer;
    }
    
    .team-logo {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.2s;
    }
    
    .team-logo:hover {
      transform: scale(1.05);
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
      font-size: 0.9rem;
      color: white;
    }
    
    .team {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    /* Update the game-teams layout for logos */
    .game-teams {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0.5rem 0;
    }
    
    .vs {
      margin: 0 1rem;
      opacity: 0.7;
      font-weight: 300;
      font-size: 1.2rem;
    }
    
    /* Update game details view to show logos */
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
      color: var(--primary-red);
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
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .team-logo-container {
        width: 50px;
        height: 50px;
      }
      
      .game-details-logo {
        width: 60px;
        height: 60px;
      }
      
      .vs {
        margin: 0 0.5rem;
        font-size: 1rem;
      }
    }
    
    @media (max-width: 480px) {
      .team-logo-container {
        width: 40px;
        height: 40px;
      }
      
      .team-logo-fallback {
        width: 40px;
        height: 40px;
        font-size: 0.7rem;
      }
      
      .game-details-logo {
        width: 50px;
        height: 50px;
      }
    }
  `;
  document.head.appendChild(style);
}

// Add this function to handle scheduled game details
function showScheduledGameDetails(gameId) {
  // Find the game in our stored data
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
        
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
          <h5>Teams</h5>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: center;">
            <div>
              <div style="font-weight: bold; margin-bottom: 0.5rem;">${awayTeamName}</div>
              <div style="opacity: 0.8;">Away Team</div>
            </div>
            <div>
              <div style="font-weight: bold; margin-bottom: 0.5rem;">${homeTeamName}</div>
              <div style="opacity: 0.8;">Home Team</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getTeamScore(game, teamType) {
    // First try to get score from boxscore data
    if (game.boxscore && game.boxscore.Game) {
        const score = teamType === 'Away' ? game.boxscore.Game.AwayTeamScore : game.boxscore.Game.HomeTeamScore;
        if (score !== null && score !== undefined) return score.toString();
    }
    
    // Fallback to basic game data
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

// Display standings
function displayStandings(data) {
    const container = document.getElementById('standings');
    
    if (!data.standings || data.standings.length === 0) {
        container.innerHTML = '<div class="empty-state">No standings data available</div>';
        return;
    }

    const eastStandings = data.standings.filter(team => team.Conference === 'Eastern').slice(0, 8);
    const westStandings = data.standings.filter(team => team.Conference === 'Western').slice(0, 8);

    // Get teams playing today for highlighting
    const teamsPlayingToday = new Set();
    if (data.games) {
        data.games.forEach(game => {
            if (game.AwayTeam) teamsPlayingToday.add(game.AwayTeam);
            if (game.HomeTeam) teamsPlayingToday.add(game.HomeTeam);
        });
    }

    container.innerHTML = `
        <div class="conference-standings">
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

// Show detailed game boxscore using pre-fetched data
function showGameDetails(gameId) {
    // Find the game in our stored data
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
    const hasPlayerData = data.boxscore.PlayerGames && data.boxscore.PlayerGames.length > 0;
    
    // Get logo URLs
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
                    <div class="game-teams" style="justify-content: center; gap: 2rem;">
                        <div class="team">
                            <div class="game-details-logo">
                                ${awayLogoUrl ? 
                                  `<img src="${awayLogoUrl}" alt="${game.AwayTeam}">` : 
                                  `<div class="team-logo-fallback">${game.AwayTeam}</div>`
                                }
                            </div>
                            <div class="team-name">${awayTeamName}</div>
                        </div>
                        <div class="vs">VS</div>
                        <div class="team">
                            <div class="game-details-logo">
                                ${homeLogoUrl ? 
                                  `<img src="${homeLogoUrl}" alt="${game.HomeTeam}">` : 
                                  `<div class="team-logo-fallback">${game.HomeTeam}</div>`
                                }
                            </div>
                            <div class="team-name">${homeTeamName}</div>
                        </div>
                    </div>
                    <h3>⏰ Game Not Started</h3>
                    <p>This game is scheduled for ${new Date(game.DateTime).toLocaleString()} but hasn't started yet in the replay.</p>
                    <p><strong>Tip:</strong> Advance the replay timeline to see completed games with actual scores and stats.</p>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <h4>Game Information</h4>
                    <p><strong>Time:</strong> ${new Date(game.DateTime).toLocaleString()}</p>
                    <p><strong>Location:</strong> ${game.StadiumID || 'TBD'}</p>
                    <p><strong>TV:</strong> ${game.Channel || 'Not specified'}</p>
                    ${game.PointSpread ? `<p><strong>Spread:</strong> ${game.PointSpread > 0 ? '+' : ''}${game.PointSpread}</p>` : ''}
                </div>
            </div>
        `;
        return;
    }

    // Get team game stats
    const awayTeamStats = data.boxscore.TeamGames?.find(tg => 
        tg.Team === game.AwayTeam || tg.TeamID === game.AwayTeamID
    );
    const homeTeamStats = data.boxscore.TeamGames?.find(tg => 
        tg.Team === game.HomeTeam || tg.TeamID === game.HomeTeamID
    );

    // Get key players
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

            <!-- Final Score with Logos -->
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

            <!-- Team Stats Summary -->
            <div class="team-stats-summary">
                <div class="team-stat">
                    <h4>${awayTeamName}</h4>
                    ${awayTeamStats ? `
                        <div><strong>Field Goals:</strong> ${awayTeamStats.FieldGoalsMade || 0}/${awayTeamStats.FieldGoalsAttempted || 0} (${awayTeamStats.FieldGoalsPercentage?.toFixed(1) || '0.0'}%)</div>
                        <div><strong>3-Pointers:</strong> ${awayTeamStats.ThreePointersMade || 0}/${awayTeamStats.ThreePointersAttempted || 0} (${awayTeamStats.ThreePointersPercentage?.toFixed(1) || '0.0'}%)</div>
                        <div><strong>Free Throws:</strong> ${awayTeamStats.FreeThrowsMade || 0}/${awayTeamStats.FreeThrowsAttempted || 0} (${awayTeamStats.FreeThrowsPercentage?.toFixed(1) || '0.0'}%)</div>
                        <div><strong>Rebounds:</strong> ${awayTeamStats.Rebounds || 0} (${awayTeamStats.OffensiveRebounds || 0} offensive, ${awayTeamStats.DefensiveRebounds || 0} defensive)</div>
                        <div><strong>Assists:</strong> ${awayTeamStats.Assists || 0}</div>
                        <div><strong>Steals:</strong> ${awayTeamStats.Steals || 0}</div>
                        <div><strong>Blocks:</strong> ${awayTeamStats.BlockedShots || 0}</div>
                        <div><strong>Turnovers:</strong> ${awayTeamStats.Turnovers || 0}</div>
                    ` : '<div>Stats not available</div>'}
                </div>
                <div class="team-stat">
                    <h4>${homeTeamName}</h4>
                    ${homeTeamStats ? `
                        <div><strong>Field Goals:</strong> ${homeTeamStats.FieldGoalsMade || 0}/${homeTeamStats.FieldGoalsAttempted || 0} (${homeTeamStats.FieldGoalsPercentage?.toFixed(1) || '0.0'}%)</div>
                        <div><strong>3-Pointers:</strong> ${homeTeamStats.ThreePointersMade || 0}/${homeTeamStats.ThreePointersAttempted || 0} (${homeTeamStats.ThreePointersPercentage?.toFixed(1) || '0.0'}%)</div>
                        <div><strong>Free Throws:</strong> ${homeTeamStats.FreeThrowsMade || 0}/${homeTeamStats.FreeThrowsAttempted || 0} (${homeTeamStats.FreeThrowsPercentage?.toFixed(1) || '0.0'}%)</div>
                        <div><strong>Rebounds:</strong> ${homeTeamStats.Rebounds || 0} (${homeTeamStats.OffensiveRebounds || 0} offensive, ${homeTeamStats.DefensiveRebounds || 0} defensive)</div>
                        <div><strong>Assists:</strong> ${homeTeamStats.Assists || 0}</div>
                        <div><strong>Steals:</strong> ${homeTeamStats.Steals || 0}</div>
                        <div><strong>Blocks:</strong> ${homeTeamStats.BlockedShots || 0}</div>
                        <div><strong>Turnovers:</strong> ${homeTeamStats.Turnovers || 0}</div>
                    ` : '<div>Stats not available</div>'}
                </div>
            </div>

            <!-- Key Players -->
            <div class="key-players">
                <div class="players-section">
                    <h4>${awayTeamName} - Key Players</h4>
                    ${awayPlayers.length > 0 ? awayPlayers.map(player => `
                        <div class="player-card">
                            <div class="player-name">${player.Name || 'Unknown Player'}</div>
                            <div class="player-stats">
                                ${player.Points || 0} PTS, ${player.Rebounds || 0} REB, ${player.Assists || 0} AST
                                ${player.Steals ? `, ${player.Steals} STL` : ''}
                                ${player.BlockedShots ? `, ${player.BlockedShots} BLK` : ''}
                            </div>
                            ${player.Minutes ? `<div class="player-minutes">${Math.floor(player.Minutes)}:${String(player.Seconds || 0).padStart(2, '0')} MIN</div>` : ''}
                        </div>
                    `).join('') : '<div class="no-data">No player data available</div>'}
                </div>
                <div class="players-section">
                    <h4>${homeTeamName} - Key Players</h4>
                    ${homePlayers.length > 0 ? homePlayers.map(player => `
                        <div class="player-card">
                            <div class="player-name">${player.Name || 'Unknown Player'}</div>
                            <div class="player-stats">
                                ${player.Points || 0} PTS, ${player.Rebounds || 0} REB, ${player.Assists || 0} AST
                                ${player.Steals ? `, ${player.Steals} STL` : ''}
                                ${player.BlockedShots ? `, ${player.BlockedShots} BLK` : ''}
                            </div>
                            ${player.Minutes ? `<div class="player-minutes">${Math.floor(player.Minutes)}:${String(player.Seconds || 0).padStart(2, '0')} MIN</div>` : ''}
                        </div>
                    `).join('') : '<div class="no-data">No player data available</div>'}
                </div>
            </div>

            <!-- Quarter Scores if available -->
            ${data.boxscore.Quarters && data.boxscore.Quarters.length > 0 ? `
                <div class="quarter-scores">
                    <h4>Quarter Scores</h4>
                    <div class="quarters-grid">
                        <div class="quarter-header">
                            <div>Quarter</div>
                            <div>${awayTeamName}</div>
                            <div>${homeTeamName}</div>
                        </div>
                        ${data.boxscore.Quarters.map(quarter => `
                            <div class="quarter-row">
                                <div>${quarter.Name || `Q${quarter.Number}`}</div>
                                <div>${quarter.AwayScore || 0}</div>
                                <div>${quarter.HomeScore || 0}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Team comparison functionality
let allTeams = [];

// Open team comparison modal
async function openTeamComparison() {
  const modal = document.getElementById('comparison-modal');
  const team1Select = document.getElementById('team1-select');
  const team2Select = document.getElementById('team2-select');
  
  // Load teams if not already loaded
  if (allTeams.length === 0) {
    try {
      allTeams = await fetchFromBackend('/api/teams');
    } catch (error) {
      console.error('Error loading teams:', error);
      return;
    }
  }
  
  // Populate dropdowns
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

// Close team comparison modal
function closeTeamComparison() {
  const modal = document.getElementById('comparison-modal');
  modal.style.display = 'none';
}

// Enable compare button when both teams are selected
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

// Compare the selected teams
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
    
    // Close modal and update the main card
    closeTeamComparison();
    displayComparisonCard();
    
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">Failed to compare teams: ${error.message}</div>`;
  } finally {
    compareBtn.disabled = false;
    compareBtn.textContent = 'Compare Teams';
  }
}

// Display comparison results
function displayComparisonResults(comparison) {
  const resultsDiv = document.getElementById('comparison-results');
  const team1 = comparison.team1;
  const team2 = comparison.team2;
  const headToHead = comparison.headToHead;

  if (!team1.stats || !team2.stats) {
    resultsDiv.innerHTML = '<div class="error">Team statistics not available</div>';
    return;
  }

  // Stats to compare
  const stats = [
    { key: 'pointsPerGame', label: 'Points Per Game', higherBetter: true },
    { key: 'pointsAllowedPerGame', label: 'Points Allowed', higherBetter: false },
    { key: 'reboundsPerGame', label: 'Rebounds', higherBetter: true },
    { key: 'assistsPerGame', label: 'Assists', higherBetter: true },
    { key: 'fieldGoalPercentage', label: 'FG%', higherBetter: true },
    { key: 'threePointPercentage', label: '3P%', higherBetter: true },
    { key: 'stealsPerGame', label: 'Steals', higherBetter: true },
    { key: 'blocksPerGame', label: 'Blocks', higherBetter: true }
  ];

  const statsHTML = stats.map(stat => {
    const team1Value = parseFloat(team1.stats[stat.key]) || 0;
    const team2Value = parseFloat(team2.stats[stat.key]) || 0;
    
    const team1Wins = stat.higherBetter ? team1Value > team2Value : team1Value < team2Value;
    const team2Wins = stat.higherBetter ? team2Value > team1Value : team2Value < team1Value;
    
    return `
      <div class="stat-item">
        <div class="stat-team ${team1Wins ? 'winning' : 'losing'}">
          ${team1Value}
          ${team1Wins ? ' ↑' : ''}
        </div>
        <div>
          <div class="stat-label">${stat.label}</div>
          <div class="stat-value">VS</div>
        </div>
        <div class="stat-team ${team2Wins ? 'winning' : 'losing'}">
          ${team2Value}
          ${team2Wins ? ' ↑' : ''}
        </div>
      </div>
    `;
  }).join('');

  // Recent games HTML
  const recentGamesHTML = headToHead.games.length > 0 ? `
    <div class="recent-games">
      <h4>Recent Matchups</h4>
      ${headToHead.games.map(game => {
        const isTeam1Home = game.HomeTeam === team1.Key;
        const team1Score = isTeam1Home ? game.boxscore.Game.HomeTeamScore : game.boxscore.Game.AwayTeamScore;
        const team2Score = isTeam1Home ? game.boxscore.Game.AwayTeamScore : game.boxscore.Game.HomeTeamScore;
        const winner = team1Score > team2Score ? team1.Key : team2.Key;
        
        return `
          <div class="game-result" onclick="showGameDetails(${game.GameID});">
            <span class="${winner === team1.Key ? 'winner' : ''}">${getTeamDisplayName(team1.Key)} ${team1Score}</span>
            <span>vs</span>
            <span class="${winner === team2.Key ? 'winner' : ''}">${getTeamDisplayName(team2.Key)} ${team2Score}</span>
            <small>${new Date(game.Day).toLocaleDateString()}</small>
          </div>
        `;
      }).join('')}
    </div>
  ` : '<p style="text-align: center; opacity: 0.7; padding: 1rem;">No recent matchups found</p>';

  resultsDiv.innerHTML = `
    <div class="comparison-results">
      <div class="comparison-header">
        <div class="team-header">
          <div class="team-name-large">${team1.City} ${team1.Name}</div>
          <div class="team-record">${team1.Wins}-${team1.Losses}</div>
          <div class="team-conference">${team1.Conference}</div>
        </div>
        
        <div class="head-to-head">
          <div class="h2h-record">${headToHead.record.team1Wins}-${headToHead.record.team2Wins}</div>
          <div class="h2h-games">Head-to-Head</div>
          <div class="h2h-games">${headToHead.record.totalGames} games</div>
        </div>
        
        <div class="team-header">
          <div class="team-name-large">${team2.City} ${team2.Name}</div>
          <div class="team-record">${team2.Wins}-${team2.Losses}</div>
          <div class="team-conference">${team2.Conference}</div>
        </div>
      </div>
      
      <div class="stat-comparison">
        ${statsHTML}
      </div>
      
      ${recentGamesHTML}
      
    </div>
  `;
}

// Update the displayStandings function to show preview
function displayStandings(data) {
  const container = document.getElementById('standings-preview');
  
  if (!data.standings || data.standings.length === 0) {
    container.innerHTML = '<div class="empty-state">No standings data available</div>';
    return;
  }

  const eastStandings = data.standings.filter(team => team.Conference === 'Eastern').slice(0, 7);
  const westStandings = data.standings.filter(team => team.Conference === 'Western').slice(0, 7);

  // Get teams playing today for highlighting
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
  setTimeout(addStandingsTooltips, 100);
}

// Show full standings modal
function showFullStandings() {
  const modal = document.getElementById('standings-modal');
  const container = document.getElementById('full-standings');
  
  modal.style.display = 'flex';
  container.innerHTML = '<div class="loading">Loading full standings...</div>';
  
  // Use the current standings data we already have
  if (currentStandingsData) {
    displayFullStandings(currentStandingsData);
  } else {
    // If no data, fetch it
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

// Display full standings in modal
function displayFullStandings(standings) {
  const container = document.getElementById('full-standings');
  
  if (!standings || standings.length === 0) {
    container.innerHTML = '<div class="empty-state">No standings data available</div>';
    return;
  }

  const eastStandings = standings.filter(team => team.Conference === 'Eastern')
    .sort((a, b) => (b.Wins - b.Losses) - (a.Wins - a.Losses));
  const westStandings = standings.filter(team => team.Conference === 'Western')
    .sort((a, b) => (b.Wins - b.Losses) - (a.Wins - a.Losses));

  container.innerHTML = `
    <div class="full-standings-container">
      <div class="conference-standings-full">
        <div class="conference-section">
          <h3 style="color: #1d428a; margin-bottom: 1rem; border-bottom: 3px solid #1d428a; padding-bottom: 0.5rem;">Eastern Conference</h3>
          <div class="standings-table">
            <div class="standings-header">
              <div>Team</div>
              <div>W</div>
              <div>L</div>
              <div>PCT</div>
              <div>GB</div>
            </div>
            ${eastStandings.map((team, index) => `
              <div class="standing-row-full ${index < 8 ? 'playoff-team' : ''}">
                <div>${index + 1}. ${team.City} ${team.Name}</div>
                <div>${team.Wins}</div>
                <div>${team.Losses}</div>
                <div>${((team.Wins / (team.Wins + team.Losses)) * 100).toFixed(1)}%</div>
                <div>${index === 0 ? '—' : calculateGamesBack(eastStandings[0], team)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="conference-section">
          <h3 style="color: #c8102e; margin-bottom: 1rem; border-bottom: 3px solid #c8102e; padding-bottom: 0.5rem;">Western Conference</h3>
          <div class="standings-table">
            <div class="standings-header">
              <div>Team</div>
              <div>W</div>
              <div>L</div>
              <div>PCT</div>
              <div>GB</div>
            </div>
            ${westStandings.map((team, index) => `
              <div class="standing-row-full ${index < 8 ? 'playoff-team' : ''}">
                <div>${index + 1}. ${team.City} ${team.Name}</div>
                <div>${team.Wins}</div>
                <div>${team.Losses}</div>
                <div>${((team.Wins / (team.Wins + team.Losses)) * 100).toFixed(1)}%</div>
                <div>${index === 0 ? '—' : calculateGamesBack(westStandings[0], team)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
    setTimeout(addStandingsTooltips, 100);
}

// Helper function to calculate games back
function calculateGamesBack(leaderTeam, currentTeam) {
  const leaderWins = leaderTeam.Wins;
  const leaderLosses = leaderTeam.Losses;
  const currentWins = currentTeam.Wins;
  const currentLosses = currentTeam.Losses;
  
  const gamesBack = ((leaderWins - currentWins) + (currentLosses - leaderLosses)) / 2;
  return gamesBack === 0 ? '—' : gamesBack.toFixed(1);
}

// Close full standings modal
function closeFullStandings() {
  const modal = document.getElementById('standings-modal');
  modal.style.display = 'none';
}

function displayComparisonCard() {
  const container = document.getElementById('comparison-container');
  const actionBtn = document.getElementById('comparison-action-btn');
  
  if (!currentComparisonData) {
    // Show default state if no comparison has been made
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

  // Display full comparison in the card (not just preview)
  const team1 = currentComparisonData.team1;
  const team2 = currentComparisonData.team2;
  const headToHead = currentComparisonData.headToHead;
  
  if (!team1.stats || !team2.stats) {
    container.innerHTML = '<div class="error">Team statistics not available</div>';
    return;
  }

  // Stats to compare
  const stats = [
    { key: 'pointsPerGame', label: 'Points Per Game', higherBetter: true },
    { key: 'pointsAllowedPerGame', label: 'Points Allowed', higherBetter: false },
    { key: 'reboundsPerGame', label: 'Rebounds', higherBetter: true },
    { key: 'assistsPerGame', label: 'Assists', higherBetter: true },
    { key: 'fieldGoalPercentage', label: 'FG%', higherBetter: true },
    { key: 'threePointPercentage', label: '3P%', higherBetter: true },
    { key: 'stealsPerGame', label: 'Steals', higherBetter: true },
    { key: 'blocksPerGame', label: 'Blocks', higherBetter: true }
  ];

  const statsHTML = stats.map(stat => {
    const team1Value = parseFloat(team1.stats[stat.key]) || 0;
    const team2Value = parseFloat(team2.stats[stat.key]) || 0;
    
    const team1Wins = stat.higherBetter ? team1Value > team2Value : team1Value < team2Value;
    const team2Wins = stat.higherBetter ? team2Value > team1Value : team2Value < team1Value;
    
    return `
      <div class="stat-item">
        <div class="stat-team ${team1Wins ? 'winning' : 'losing'}">
          ${team1Value}
          ${team1Wins ? ' ↑' : ''}
        </div>
        <div>
          <div class="stat-label">${stat.label}</div>
          <div class="stat-value">VS</div>
        </div>
        <div class="stat-team ${team2Wins ? 'winning' : 'losing'}">
          ${team2Value}
          ${team2Wins ? ' ↑' : ''}
        </div>
      </div>
    `;
  }).join('');

  // Recent games HTML
  const recentGamesHTML = headToHead.games.length > 0 ? `
    <div class="recent-games">
      <h4>Recent Matchups</h4>
      ${headToHead.games.map(game => {
        const isTeam1Home = game.HomeTeam === team1.Key;
        const team1Score = isTeam1Home ? game.boxscore.Game.HomeTeamScore : game.boxscore.Game.AwayTeamScore;
        const team2Score = isTeam1Home ? game.boxscore.Game.AwayTeamScore : game.boxscore.Game.HomeTeamScore;
        const winner = team1Score > team2Score ? team1.Key : team2.Key;
        
        return `
          <div class="game-result" onclick="showGameDetails(${game.GameID});">
            <span class="${winner === team1.Key ? 'winner' : ''}">${getTeamDisplayName(team1.Key)} ${team1Score}</span>
            <span>vs</span>
            <span class="${winner === team2.Key ? 'winner' : ''}">${getTeamDisplayName(team2.Key)} ${team2Score}</span>
            <small>${new Date(game.Day).toLocaleDateString()}</small>
          </div>
        `;
      }).join('')}
    </div>
  ` : '<p style="text-align: center; opacity: 0.7; padding: 1rem;">No recent matchups found</p>';

  container.innerHTML = `
    <div class="comparison-active">
      <div class="comparison-header">
        <div class="team-header">
          <div class="team-name-large">${team1.City} ${team1.Name}</div>
          <div class="team-record">${team1.Wins}-${team1.Losses}</div>
          <div class="team-conference">${team1.Conference}</div>
        </div>
        
        <div class="head-to-head">
          <div class="h2h-record">${headToHead.record.team1Wins}-${headToHead.record.team2Wins}</div>
          <div class="h2h-games">Head-to-Head</div>
          <div class="h2h-games">${headToHead.record.totalGames} games</div>
        </div>
        
        <div class="team-header">
          <div class="team-name-large">${team2.City} ${team2.Name}</div>
          <div class="team-record">${team2.Wins}-${team2.Losses}</div>
          <div class="team-conference">${team2.Conference}</div>
        </div>
      </div>
      
      <div class="stat-comparison">
        ${statsHTML}
      </div>
      
      ${recentGamesHTML}
    </div>
  `;
  
  // Update button text
  actionBtn.textContent = 'Compare Different Teams';
}

// Refresh current comparison
function refreshComparison() {
  if (currentComparisonData) {
    const team1 = currentComparisonData.team1.Key;
    const team2 = currentComparisonData.team2.Key;
    compareTeams(team1, team2);
  }
}

// Clear current comparison
function clearComparison() {
  currentComparisonData = null;
  displayComparisonCard();
}

function handleComparisonAction() {
  if (currentComparisonData) {
    // If we have a comparison, open modal to start new one
    openTeamComparison();
  } else {
    // If no comparison, open modal to start first one
    openTeamComparison();
  }
}

const comparisonCardStyles = `
    .comparison-preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .preview-team {
      text-align: center;
      flex: 1;
    }

    .preview-team-name {
      font-weight: bold;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }

    .preview-team-record {
      opacity: 0.8;
      font-size: 0.9rem;
    }

    .preview-vs {
      margin: 0 1rem;
      font-weight: bold;
      opacity: 0.7;
    }

    .comparison-preview-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .stat-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 6px;
    }

    .stat-preview-team {
      font-weight: 600;
      min-width: 30px;
      text-align: center;
    }

    .stat-preview-team.winning {
      color: #4caf50;
      font-weight: bold;
    }

    .stat-preview-label {
      font-size: 0.8rem;
      opacity: 0.7;
    }

    .comparison-preview-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .full-standings-container {
      max-height: 70vh;
      overflow-y: auto;
    }

    .conference-standings-full {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .conference-section {
      margin-bottom: 2rem;
    }

    .standings-table {
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      overflow: hidden;
    }

    .standings-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.1);
      font-weight: bold;
      font-size: 0.9rem;
    }

    .standing-row-full {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size: 0.9rem;
    }

    .standing-row-full:last-child {
      border-bottom: none;
    }

    .standing-row-full.playoff-team {
      background: rgba(76, 175, 80, 0.1);
      border-left: 3px solid #4caf50;
    }

    .conference-standings-preview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = comparisonCardStyles;
document.head.appendChild(styleSheet);

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentState();
    setupTeamSelectors();
    
    // Auto-refresh every 60 seconds
    // setInterval(() => {
    //     loadCurrentState();
    // }, 120000);
});

// Manual refresh function
async function refreshAll() {
    await loadCurrentState();
}

// Test API function (kept for debugging if needed)
async function testAPI() {
    try {
        const response = await fetchFromBackend('/');
        console.log('API test response:', response);
        alert('API is working!');
    } catch (error) {
        console.error('API test failed:', error);
        alert('API test failed: ' + error.message);
    }
}