import React, { useState, useEffect } from 'react';
import { supabase, deckService, cardService, testConnection } from '../utils/supabaseClient';

const DebugPanel = () => {
    const [logs, setLogs] = useState([]);
    const [apiStatus, setApiStatus] = useState('checking');

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const newLog = { timestamp, message, type };
        setLogs(prev => [...prev, newLog].slice(-50)); // Keep last 50 logs
        console.log(`[${timestamp}] ${message}`);
    };

    const checkApiStatus = async () => {
        try {
            const isConnected = await testConnection();
            if (isConnected) {
                setApiStatus('online');
                addLog('Supabase connection successful', 'success');
            } else {
                setApiStatus('offline');
                addLog('Supabase connection failed', 'error');
            }
        } catch (error) {
            setApiStatus('offline');
            addLog(`Supabase error: ${error.message}`, 'error');
        }
    };

    const testToggleKnown = async () => {
        try {
            addLog('Testing Supabase toggle known...');

            // Get first deck and card
            const decks = await deckService.getAll();
            if (decks.length === 0 || !decks[0].cards || decks[0].cards.length === 0) {
                addLog('No cards available for testing', 'warning');
                return;
            }

            const deck = decks[0];
            const card = deck.cards[0];
            const originalState = card.known;

            addLog(`Card ${card.id}: ${originalState ? 'Known' : 'Unknown'}`);

            // Toggle the card
            const result = await cardService.toggleKnown(card.id);
            if (result && result.id) {
                addLog(`Toggled to: ${result.known ? 'Known' : 'Unknown'}`, 'success');

                // Verify the change persisted
                setTimeout(async () => {
                    const updatedDecks = await deckService.getAll();
                    const updatedCard = updatedDecks[0].cards.find(c => c.id === card.id);
                    if (updatedCard.known !== originalState) {
                        addLog('SUCCESS: Change persisted in Supabase!', 'success');
                    } else {
                        addLog('FAILURE: Change was not saved!', 'error');
                    }
                }, 1000);
            } else {
                addLog('Failed to toggle card state', 'error');
            }
        } catch (error) {
            addLog(`Test error: ${error.message}`, 'error');
        }
    };

    const clearLocalStorage = () => {
        localStorage.removeItem('flashcards-decks');
        addLog('localStorage cleared', 'warning');
    };

    const clearLogs = () => {
        setLogs([]);
    };

    useEffect(() => {
        checkApiStatus();
        addLog('Debug panel loaded');
    }, []);

    if (process.env.NODE_ENV === 'production') {
        return null; // Don't show in production
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '300px',
            backgroundColor: 'white',
            border: '2px solid #007bff',
            borderRadius: '8px',
            padding: '10px',
            zIndex: 9999,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                borderBottom: '1px solid #eee',
                paddingBottom: '5px'
            }}>
                <h4 style={{ margin: 0, color: '#007bff' }}>🔧 Debug Panel (Supabase)</h4>
                <span style={{
                    color: apiStatus === 'online' ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                }}>
                    {apiStatus === 'online' ? '🟢 Connected' : '🔴 Disconnected'}
                </span>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <button
                    onClick={testToggleKnown}
                    style={{
                        padding: '5px 10px',
                        margin: '2px',
                        border: 'none',
                        borderRadius: '3px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }}
                >
                    Test Toggle
                </button>
                <button
                    onClick={checkApiStatus}
                    style={{
                        padding: '5px 10px',
                        margin: '2px',
                        border: 'none',
                        borderRadius: '3px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }}
                >
                    Check Supabase
                </button>
                <button
                    onClick={clearLocalStorage}
                    style={{
                        padding: '5px 10px',
                        margin: '2px',
                        border: 'none',
                        borderRadius: '3px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }}
                >
                    Clear Storage
                </button>
                <button
                    onClick={clearLogs}
                    style={{
                        padding: '5px 10px',
                        margin: '2px',
                        border: 'none',
                        borderRadius: '3px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }}
                >
                    Clear Log
                </button>
            </div>

            <div style={{
                height: '200px',
                overflowY: 'auto',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '3px',
                padding: '5px',
                fontFamily: 'monospace'
            }}>
                {logs.length === 0 ? (
                    <div style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
                        No logs yet...
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: '2px',
                                color: log.type === 'error' ? '#dc3545' :
                                    log.type === 'success' ? '#28a745' :
                                        log.type === 'warning' ? '#ffc107' : '#495057'
                            }}
                        >
                            [{log.timestamp}] {log.message}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DebugPanel;
