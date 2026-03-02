// test-api.js - Run this with: node test-api.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_KEY = 'b1365d31c78a4759962c4fcc1d3c0fa8';
const BASE_URL = 'https://replay.sportsdata.io/api/v3/nba';
const METADATA_URL = 'https://replay.sportsdata.io/api/metadata?key=b1365d31c78a4759962c4fcc1d3c0fa8';

async function testEndpoint(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint}key=${API_KEY}`;
    console.log(`Testing: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`❌ FAILED: ${response.status} - ${data.Message || data.message}`);
      return false;
    }
    
    console.log(`✅ SUCCESS: ${Array.isArray(data) ? `Array with ${data.length} items` : typeof data}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`   Sample:`, data[0]);
    }
    return true;
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Testing NBA Replay API Endpoints...\n');
  
  // Test metadata first
  console.log('1. Testing Metadata:');
  await testEndpoint('/metadata?');
  
  // Test basic endpoints
  console.log('\n2. Testing Basic Endpoints:');
  await testEndpoint('/stats/json/areanygamesinprogress?');
  await testEndpoint('/stats/json/Teams?');
  
  // Test with specific dates from your replay
  console.log('\n3. Testing Date-Specific Endpoints:');
  await testEndpoint('/stats/json/GamesByDate/2023-12-02?');
  await testEndpoint('/stats/json/PlayerGameStatsByDate/2023-12-02?');
  await testEndpoint('/stats/json/Standings/2024reg?');
  
  // Test specific game endpoints
  console.log('\n4. Testing Game Endpoints:');
  await testEndpoint('/stats/json/BoxScore/19817?');
  await testEndpoint('/pbp/json/PlayByPlay/19817?');
  
  // Test team endpoints
  console.log('\n5. Testing Team Endpoints:');
  await testEndpoint('/stats/json/Players/ny?');
  await testEndpoint('/stats/json/Players/orl?');
}

runTests();