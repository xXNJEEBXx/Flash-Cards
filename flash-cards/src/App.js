import React, { useState } from 'react';
import { CardsContext, CardsProvider } from './context/CardsContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import QuickActions from './components/Dashboard/QuickActions';
import DeckList from './components/DeckList/DeckList';
import DeckForm from './components/Forms/DeckForm';
import CardForm from './components/Forms/CardForm';
import StudyMode from './components/StudyMode/StudyMode';
import DebugPanel from './components/DebugPanel';
import './App.css';

function App() {
  const [view, setView] = useState('decks'); // 'decks', 'create-deck', 'edit-deck', 'create-card', 'edit-card', 'study'
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <CardsProvider>
      <AppContent
        view={view}
        setView={setView}
        selectedDeckId={selectedDeckId}
        setSelectedDeckId={setSelectedDeckId}
        selectedCardId={selectedCardId}
        setSelectedCardId={setSelectedCardId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    </CardsProvider>
  );
}

// The main app content with access to the context
const AppContent = ({ view, setView, selectedDeckId, setSelectedDeckId, selectedCardId, setSelectedCardId, sidebarOpen, setSidebarOpen }) => {
  const { addCard, editCard, decks } = React.useContext(CardsContext);

  // Calculate deck statistics
  const deckStats = React.useMemo(() => {
    const totalDecks = decks.length;
    const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
    const learnedCards = decks.reduce((sum, deck) =>
      sum + deck.cards.filter(card => card.known).length, 0
    );
    const pendingCards = totalCards - learnedCards;

    return {
      totalDecks,
      totalCards,
      learnedCards,
      pendingCards
    };
  }, [decks]);

  // Get current view title
  const getViewTitle = () => {
    switch (view) {
      case 'create-deck':
        return 'Create New Deck';
      case 'edit-deck':
        const deck = decks.find(d => d.id === selectedDeckId);
        return deck ? `Editing: ${deck.title}` : 'Edit Deck';
      case 'create-card':
        return 'Add New Card';
      case 'edit-card':
        return 'Edit Card';
      case 'study':
        const studyDeck = decks.find(d => d.id === selectedDeckId);
        return studyDeck ? `Studying: ${studyDeck.title}` : 'Study Mode';
      default:
        return null;
    }
  };

  // Views
  const renderCurrentView = () => {
    switch (view) {
      case 'decks':
        return (
          <div className="main-content">
            <div className="content-header">
              <div className="header-with-menu">
                <button
                  className="menu-toggle"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <h1>My Flash Card Decks</h1>
              </div>
              <button
                className="btn btn-primary btn-large"
                onClick={() => setView('create-deck')}
              >
                <span className="btn-icon">➕</span>
                Create New Deck
              </button>
            </div>

            <QuickActions
              onCreateDeck={() => setView('create-deck')}
              onImportDeck={() => console.log('Import deck')}
              deckStats={deckStats}
            />

            <DeckList
              onSelectDeck={(deckId) => {
                setSelectedDeckId(deckId);
                setView('edit-deck');
              }}
              onStudyDeck={(deckId) => {
                setSelectedDeckId(deckId);
                setView('study');
              }}
            />
          </div>
        );

      case 'create-deck':
        return (
          <div className="main-content">
            <div className="content-header">
              <h1>Create New Deck</h1>
              <button
                className="btn btn-outline"
                onClick={() => setView('decks')}
              >
                <span className="btn-icon">🔙</span>
                Back to Decks
              </button>
            </div>
            <DeckForm
              onSave={() => setView('decks')}
              onCancel={() => setView('decks')}
            />
          </div>
        );

      case 'edit-deck':
        return (
          <div className="main-content">
            <div className="content-header">
              <h1>Edit Deck</h1>
              <button
                className="btn btn-outline"
                onClick={() => setView('decks')}
              >
                <span className="btn-icon">🔙</span>
                Back to Decks
              </button>
            </div>
            <DeckForm
              deckId={selectedDeckId}
              onSave={() => setView('decks')}
              onCancel={() => setView('decks')}
            />
            <div className="card-management">
              <div className="card-management-header">
                <h2>
                  <span className="section-icon">🗃️</span>
                  Cards in this Deck
                </h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setView('create-card')}
                >
                  <span className="btn-icon">➕</span>
                  Add New Card
                </button>
              </div>
              <CardList
                deckId={selectedDeckId}
                onEditCard={(cardId) => {
                  setSelectedCardId(cardId);
                  setView('edit-card');
                }}
              />
            </div>
          </div>
        );

      case 'create-card':
        return (
          <div className="main-content">
            <div className="content-header">
              <h1>Add New Card</h1>
              <button
                className="btn btn-outline"
                onClick={() => setView('edit-deck')}
              >
                <span className="btn-icon">🔙</span>
                Back to Deck
              </button>
            </div>
            <CardForm
              deckId={selectedDeckId}
              onSave={(cardData) => {
                // Add new card to selected deck
                addCard(selectedDeckId, cardData);
                setView('edit-deck');
              }}
              onCancel={() => setView('edit-deck')}
            />
          </div>
        );

      case 'edit-card':
        // Find the current card to edit
        const currentDeck = decks.find(d => d.id === selectedDeckId);
        const currentCard = currentDeck ? currentDeck.cards.find(c => c.id === selectedCardId) : null;

        return (
          <div className="main-content">
            <div className="content-header">
              <h1>Edit Card</h1>
              <button
                className="btn btn-outline"
                onClick={() => setView('edit-deck')}
              >
                <span className="btn-icon">🔙</span>
                Back to Deck
              </button>
            </div>
            <CardForm
              deckId={selectedDeckId}
              card={currentCard}
              onSave={(updatedCard) => {
                // Edit existing card
                editCard(selectedDeckId, updatedCard);
                setView('edit-deck');
              }}
              onCancel={() => setView('edit-deck')}
            />
          </div>
        );

      case 'study':
        return (
          <StudyMode
            deckId={selectedDeckId}
            onBack={() => setView('decks')}
          />
        );

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="app">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={view}
        onNavigate={setView}
        deckStats={deckStats}
      />

      <Header
        currentView={view}
        onNavigate={setView}
        title={getViewTitle()}
      />

      <main className="app-main">
        {renderCurrentView()}
      </main>

      <DebugPanel />
    </div>
  );
};

// Helper component to list cards of a deck with edit/delete functionality
const CardList = ({ deckId, onEditCard }) => {
  const { decks, deleteCard } = React.useContext(CardsContext);
  const deck = decks.find(d => d.id === deckId);

  if (!deck) return <div>Deck not found</div>;

  if (deck.cards.length === 0) {
    return (
      <div className="empty-cards">
        <p>No cards in this deck yet. Add your first card to get started!</p>
      </div>
    );
  }

  return (
    <div className="card-list">
      {deck.cards.map(card => (
        <div key={card.id} className="card-list-item">
          <div className="card-content">
            <div className="card-question">
              <strong>Q:</strong> {card.question}
            </div>
            <div className="card-answer">
              <strong>A:</strong> {card.answer}
            </div>
          </div>
          <div className="card-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onEditCard(card.id)}
            >
              Edit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this card?')) {
                  deleteCard(deckId, card.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default App;
