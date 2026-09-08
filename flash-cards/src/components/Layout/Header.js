import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

const Header = ({ currentView, onNavigate, title }) => {
    const { isDark, toggleTheme } = useTheme();
    const navigationItems = [
        { id: 'decks', label: 'My Decks', icon: '📚' },
        { id: 'create-deck', label: 'New Deck', icon: '➕' },
    ];

    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-logo">
                    <h1>
                        <span className="logo-icon">🎯</span>
                        Flash Cards
                    </h1>
                    {title && <span className="header-subtitle">{title}</span>}
                </div>

                <nav className="header-navigation">
                    {navigationItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-btn ${currentView === item.id ? 'active' : ''}`}
                            onClick={() => onNavigate(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="header-actions">
                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
                        aria-label="Toggle Dark Mode"
                    >
                        <span className="theme-toggle-icon">{isDark ? '☀️' : '🌙'}</span>
                        <span className="theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
                    </button>

                    {currentView !== 'decks' && (
                        <button
                            className="btn btn-outline back-btn"
                            onClick={() => onNavigate('decks')}
                        >
                            <span>🔙</span> Back to Decks
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
