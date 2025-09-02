import React from 'react';
import './QuickActions.css';

const QuickActions = ({ onCreateDeck, onImportDeck, deckStats }) => {
  const actions = [
    {
      id: 'create',
      title: 'Create New Deck',
      description: 'Start building your knowledge',
      icon: '➕',
      color: '#667eea',
      onClick: onCreateDeck
    },
    {
      id: 'import',
      title: 'Import Deck',
      description: 'Import from file or template',
      icon: '📥',
      color: '#48bb78',
      onClick: onImportDeck
    },
    {
      id: 'practice',
      title: 'Quick Practice',
      description: 'Review random cards',
      icon: '🎯',
      color: '#ed8936',
      onClick: () => console.log('Quick practice')
    },
    {
      id: 'stats',
      title: 'View Statistics',
      description: 'Track your progress',
      icon: '📊',
      color: '#9f7aea',
      onClick: () => console.log('View stats')
    }
  ];

  return (
    <div className="quick-actions">
      <div className="quick-actions-header">
        <h3>Quick Actions</h3>
        <p>What would you like to do today?</p>
      </div>
      
      <div className="actions-grid">
        {actions.map(action => (
          <button
            key={action.id}
            className="action-card"
            onClick={action.onClick}
          >
            <div className="action-icon" style={{ backgroundColor: action.color }}>
              {action.icon}
            </div>
            <div className="action-content">
              <h4>{action.title}</h4>
              <p>{action.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      <div className="daily-goal">
        <div className="goal-header">
          <span className="goal-icon">🎯</span>
          <h4>Daily Goal</h4>
        </div>
        <div className="goal-progress">
          <div className="goal-text">
            Study 20 cards today
          </div>
          <div className="goal-bar">
            <div 
              className="goal-bar-fill" 
              style={{ width: '60%' }}
            ></div>
          </div>
          <div className="goal-stats">
            12/20 completed
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
