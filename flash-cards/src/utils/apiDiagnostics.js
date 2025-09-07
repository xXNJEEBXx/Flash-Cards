// API Diagnostics Utility
// Place in flash-cards/src/utils/apiDiagnostics.js

export const runApiDiagnostics = async () => {
  const results = [];

  console.log('🔍 Starting API diagnostics...');

  // 1. Check environment variables
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL
  };

  results.push({
    test: 'Environment Variables',
    success: !!process.env.REACT_APP_API_URL,
    details: envVars
  });

  // 2. Determine API URL
  let apiUrl;
  try {
    // Import dynamically to prevent circular dependencies
    const { API_CONFIG } = await import('../config/api.js');
    apiUrl = API_CONFIG.getApiUrl();

    results.push({
      test: 'API URL Resolution',
      success: !!apiUrl,
      details: {
        resolvedUrl: apiUrl,
        fromEnv: process.env.REACT_APP_API_URL === apiUrl
      }
    });
  } catch (error) {
    results.push({
      test: 'API URL Resolution',
      success: false,
      details: { error: error.message }
    });
    apiUrl = 'https://flash-cards-production-5df5.up.railway.app'; // Fallback to Railway
  }

  // 3. Test health endpoint
  try {
    console.log(`Testing health endpoint at ${apiUrl}/api/health...`);
    const healthResponse = await fetch(`${apiUrl}/api/health`);
    const healthData = await healthResponse.json();

    results.push({
      test: 'API Health Check',
      success: healthData.status === 'ok',
      details: healthData
    });
  } catch (error) {
    results.push({
      test: 'API Health Check',
      success: false,
      details: { error: error.message }
    });
  }

  // 4. Test decks endpoint with detailed error handling
  try {
    console.log(`Testing decks endpoint at ${apiUrl}/api/decks...`);
    const response = await fetch(`${apiUrl}/api/decks`, {
      headers: {
        'Accept': 'application/json',
        'X-Debug': 'true'
      }
    });

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = { message: await response.text() || 'Unknown error' };
      }

      results.push({
        test: 'Fetch Decks',
        success: false,
        details: {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails,
          headers: Object.fromEntries([...response.headers.entries()])
        }
      });
    } else {
      const decks = await response.json();
      results.push({
        test: 'Fetch Decks',
        success: true,
        details: {
          count: decks.length,
          firstDeck: decks[0] ? {
            id: decks[0].id,
            title: decks[0].title,
            cardCount: decks[0].cards?.length
          } : null
        }
      });
    }
  } catch (error) {
    results.push({
      test: 'Fetch Decks',
      success: false,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
  }

  // Print results to console
  console.log('📊 API Diagnostics Results:', results);

  // Return results for potential UI display
  return {
    timestamp: new Date().toISOString(),
    results
  };
};

export default {
  runApiDiagnostics
};
