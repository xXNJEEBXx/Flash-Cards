import React, { useState } from 'react';
import { CardsContext, CardsProvider } from './context/CardsContext';
import DeckList from './components/DeckList/DeckList';
import DeckForm from './components/Forms/DeckForm';
import CardForm from './components/Forms/CardForm';
import StudyMode from './components/StudyMode/StudyMode';
import './App.css';

function App() {
  const [view, setView] = useState('decks'); // 'decks', 'create-deck', 'edit-deck', 'create-card', 'edit-card', 'study'
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);

  return (
    <CardsProvider>
      <AppContent
        view={view}
        setView={setView}
        selectedDeckId={selectedDeckId}
        setSelectedDeckId={setSelectedDeckId}
        selectedCardId={selectedCardId}
        setSelectedCardId={setSelectedCardId}
      />
    </CardsProvider>
  );
}

// The main app content with access to the context
const AppContent = ({ view, setView, selectedDeckId, setSelectedDeckId, selectedCardId, setSelectedCardId }) => {
  const { addCard, editCard, decks } = React.useContext(CardsContext);

  // Views
  const renderCurrentView = () => {
    switch (view) {
      case 'decks':
        return (
          <>
            <header className="app-header">
              <h1>Flash Cards</h1>
              <button
                className="btn btn-primary"
                onClick={() => setView('create-deck')}
              >
                Create New Deck
              </button>
            </header>
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
          </>
        );

      case 'create-deck':
        return (
          <DeckForm
            onSave={() => setView('decks')}
            onCancel={() => setView('decks')}
          />
        );

      case 'edit-deck':
        return (
          <div>
            <DeckForm
              deckId={selectedDeckId}
              onSave={() => setView('decks')}
              onCancel={() => setView('decks')}
            />
            <div className="card-management">
              <div className="card-management-header">
                <h2>Cards in this Deck</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setView('create-card')}
                >
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
          <CardForm
            deckId={selectedDeckId}
            onSave={(cardData) => {
              // Add new card to selected deck
              addCard(selectedDeckId, cardData);
              setView('edit-deck');
            }}
            onCancel={() => setView('edit-deck')}
          />
        );

      case 'edit-card':
        // Find the current card to edit
        const currentDeck = decks.find(d => d.id === selectedDeckId);
        const currentCard = currentDeck ? currentDeck.cards.find(c => c.id === selectedCardId) : null;

        return (
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
      {renderCurrentView()}
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
