import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, currentView, onNavigate, deckStats }) => {
    const { isDark, toggleTheme } = useTheme();
    const menuItems = [
        {
            id: 'decks',
            label: 'All Decks',
            icon: '📚',
            badge: deckStats?.totalDecks || 0
        },
        {
            id: 'create-deck',
            label: 'Create Deck',
            icon: '➕',
            badge: null
        },
        {
            id: 'statistics',
            label: 'Statistics',
            icon: '📊',
            badge: deckStats?.totalCards || 0
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: '⚙️',
            badge: null
        }
    ];

    const quickStats = [
        { label: 'Total Decks', value: deckStats?.totalDecks || 0, icon: '📚' },
        { label: 'Total Cards', value: deckStats?.totalCards || 0, icon: '🗃️' },
        { label: 'Learned', value: deckStats?.learnedCards || 0, icon: '✅' },
        { label: 'Pending', value: deckStats?.pendingCards || 0, icon: '⏳' }
    ];

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <h3>
                        <span className="sidebar-icon">🎯</span>
                        Flash Cards
                    </h3>
                    <button className="sidebar-close" onClick={onClose}>✕</button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <h4>Navigation</h4>
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                className={`sidebar-nav-item ${currentView === item.id ? 'active' : ''}`}
                                onClick={() => {
                                    onNavigate(item.id);
                                    onClose();
                                }}
                            >
                                <span className="nav-item-icon">{item.icon}</span>
                                <span className="nav-item-label">{item.label}</span>
                                {item.badge !== null && (
                                    <span className="nav-item-badge">{item.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-stats">
                    <h4>Quick Stats</h4>
                    <div className="stats-grid">
                        {quickStats.map(stat => (
                            <div key={stat.label} className="stat-item">
                                <span className="stat-icon">{stat.icon}</span>
                                <div className="stat-content">
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-theme-toggle">
                        <button
                            className="sidebar-theme-btn"
                            onClick={toggleTheme}
                            aria-label="Toggle Dark Mode"
                        >
                            <span className="theme-icon">{isDark ? "☀️" : "🌙"}</span>
                            <span>{isDark ? "الوضع النهاري (Light)" : "الوضع الليلي (Dark)"}</span>
                        </button>
                    </div>

                    <div className="progress-summary">
                        <h4>Learning Progress</h4>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${deckStats?.totalCards > 0
                                        ? (deckStats.learnedCards / deckStats.totalCards) * 100
                                        : 0}%`
                                }}
                            ></div>
                        </div>
                        <span className="progress-text">
                            {Math.round(deckStats?.totalCards > 0
                                ? (deckStats.learnedCards / deckStats.totalCards) * 100
                                : 0)}% Complete
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
