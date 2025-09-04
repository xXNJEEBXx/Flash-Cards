import React, { useState, useEffect } from 'react';

const ApiTester = () => {
  const [results, setResults] = useState({
    loading: true,
    error: null,
    data: null
  });
  
  useEffect(() => {
    const testApi = async () => {
      try {
        setResults(prev => ({...prev, loading: true}));
        
        // Test API configuration first
        console.log('React API URL:', process.env.REACT_APP_API_URL);
        
        // Try to fetch from the API
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/decks`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!response.ok) {
          let errorText;
          try {
            const errorData = await response.json();
            errorText = errorData.message || `HTTP error ${response.status}`;
          } catch {
            errorText = `HTTP error ${response.status}`;
          }
          throw new Error(errorText);
        }
        
        const data = await response.json();
        setResults({
          loading: false,
          error: null,
          data
        });
      } catch (err) {
        console.error('API test error:', err);
        setResults({
          loading: false,
          error: err.message,
          data: null
        });
      }
    };
    
    testApi();
  }, []);
  
  return (
    <div style={{padding: '20px', margin: '20px', border: '1px solid #ddd', borderRadius: '5px'}}>
      <h2>React API Connection Test</h2>
      
      {results.loading ? (
        <p>Loading...</p>
      ) : results.error ? (
        <div style={{color: 'red'}}>
          <h3>⚠️ Error:</h3>
          <p>{results.error}</p>
        </div>
      ) : (
        <div style={{color: 'green'}}>
          <h3>✅ Success!</h3>
          <p>Found {results.data.length} decks</p>
          <pre style={{
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(results.data, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{marginTop: '20px'}}>
        <h3>Environment Variables</h3>
        <p><strong>REACT_APP_API_URL:</strong> {process.env.REACT_APP_API_URL || 'not set'}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'not set'}</p>
      </div>
    </div>
  );
};

export default ApiTester;
