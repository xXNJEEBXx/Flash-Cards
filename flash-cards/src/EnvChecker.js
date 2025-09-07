// Enhanced component to check environment variables and run API diagnostics
import React, { useState, useEffect } from 'react';
import { runApiDiagnostics } from './utils/apiDiagnostics';
import { API_CONFIG } from './config/api';

const EnvChecker = () => {
    const [diagnostics, setDiagnostics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const runDiagnostics = async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await runApiDiagnostics();
            setDiagnostics(results);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Run diagnostics on mount
    useEffect(() => {
        runDiagnostics();
    }, []);

    return (
        <div style={{
            padding: '20px',
            margin: '20px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#f9f9f9'
        }}>
            <h2>🔍 API Connection Diagnostics</h2>

            <div style={{ marginBottom: '15px' }}>
                <h3>Environment Variables</h3>
                <ul>
                    <li><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'not set'}</li>
                    <li><strong>REACT_APP_API_URL:</strong> {process.env.REACT_APP_API_URL || 'not set'}</li>
                    <li><strong>API_CONFIG.getApiUrl():</strong> {API_CONFIG.getApiUrl()}</li>
                    <li><strong>Current Time:</strong> {new Date().toISOString()}</li>
                </ul>
            </div>

            <div>
                <button
                    onClick={runDiagnostics}
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'wait' : 'pointer'
                    }}
                >
                    {loading ? 'Running Tests...' : 'Run Diagnostics'}
                </button>
            </div>

            {error && (
                <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#FFEBEE',
                    border: '1px solid #FFCDD2',
                    borderRadius: '4px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {diagnostics && (
                <div style={{ marginTop: '15px' }}>
                    <h3>Diagnostic Results</h3>
                    <p><strong>Timestamp:</strong> {diagnostics.timestamp}</p>

                    {diagnostics.results.map((result, index) => (
                        <div key={index} style={{
                            margin: '10px 0',
                            padding: '10px',
                            backgroundColor: result.success ? '#E8F5E9' : '#FFEBEE',
                            border: `1px solid ${result.success ? '#A5D6A7' : '#FFCDD2'}`,
                            borderRadius: '4px'
                        }}>
                            <h4>
                                {result.success ? '✅' : '❌'} {result.test}
                            </h4>
                            <pre style={{
                                backgroundColor: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '4px',
                                overflow: 'auto',
                                maxHeight: '200px'
                            }}>
                                {JSON.stringify(result.details, null, 2)}
                            </pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EnvChecker;
