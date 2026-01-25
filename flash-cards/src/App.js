import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { CardsContext, CardsProvider } from './context/CardsContext';
import { FoldersProvider } from './context/FoldersContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import QuickActions from './components/Dashboard/QuickActions';
import DeckListWithFolders from './components/DeckList/DeckListWithFolders';
import FolderView from './components/Folders/FolderView';
import DeckForm from './components/Forms/DeckForm';
import CardForm from './components/Forms/CardForm';
import StudyMode from './components/StudyMode/StudyMode';
import { confirmDeleteWithPassword } from './utils/passwordProtection';
// Removed debug components for clean production interface
import './App.css';

function App() {
  return (
    <CardsProvider>
      <FoldersProvider>
        <Router>
          <AppRoutes />
        </Router>
      </FoldersProvider>
    </CardsProvider>
  );
}

// Routes wrapper component
const AppRoutes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Routes>
      <Route path="/" element={<AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
      <Route path="/folder/:folderId" element={<AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
      <Route path="/deck/:deckId" element={<AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
      <Route path="/deck/:deckId/edit" element={<AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
      <Route path="/deck/:deckId/study" element={<AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
      <Route path="/deck/:deckId/card/new" element={<AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
      <Route path="/deck/:deckId/card/:cardId" element={<AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
      <Route path="/create-deck" element={<AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
    </Routes>
  );
};

// The main app content with access to the context
const AppContent = ({ sidebarOpen, setSidebarOpen }) => {
  const { addCard, editCard, decks } = React.useContext(CardsContext);
  const navigate = useNavigate();
  const params = useParams();
  
  // Determine current view from URL
  const currentPath = window.location.pathname;
  let view = 'decks';
  let selectedDeckId = params.deckId ? parseInt(params.deckId) : null;
  let selectedCardId = params.cardId ? parseInt(params.cardId) : null;
  let selectedFolderId = params.folderId ? parseInt(params.folderId) : null;

  if (currentPath === '/create-deck') {
    view = 'create-deck';
  } else if (currentPath.includes('/study')) {
    view = 'study';
  } else if (currentPath.includes('/card/new')) {
    view = 'create-card';
  } else if (currentPath.includes('/card/')) {
    view = 'edit-card';
  } else if (currentPath.includes('/edit')) {
    view = 'edit-deck';
  } else if (currentPath.includes('/folder/')) {
    view = 'folder-view';
  } else if (currentPath.includes('/deck/') && !currentPath.includes('/edit') && !currentPath.includes('/study')) {
    view = 'edit-deck';
  }

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
                <h1>My Flash Cards</h1>
              </div>
              <button
                className="btn btn-primary btn-large"
                onClick={() => navigate('/create-deck')}
              >
                <span className="btn-icon">➕</span>
                Create New Deck
              </button>
            </div>

            <QuickActions
              onCreateDeck={() => navigate('/create-deck')}
              onImportDeck={() => console.log('Import deck')}
              deckStats={deckStats}
            />

            <DeckListWithFolders
              onSelectDeck={(deckId) => navigate(`/deck/${deckId}/edit`)}
              onStudyDeck={(deckId) => navigate(`/deck/${deckId}/study`)}
              onOpenFolder={(folderId) => navigate(`/folder/${folderId}`)}
            />
          </div>
        );

      case 'folder-view':
        return (
          <div className="main-content">
            <FolderView
              folderId={selectedFolderId}
              onBack={() => navigate('/')}
              onSelectDeck={(deckId) => navigate(`/deck/${deckId}/edit`)}
              onStudyDeck={(deckId) => navigate(`/deck/${deckId}/study`)}
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
                onClick={() => navigate('/')}
              >
                <span className="btn-icon">🔙</span>
                Back to Decks
              </button>
            </div>
            <DeckForm
              onSave={() => navigate('/')}
              onCancel={() => navigate('/')}
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
                onClick={() => navigate('/')}
              >
                <span className="btn-icon">🔙</span>
                Back to Decks
              </button>
            </div>
            <DeckForm
              deckId={selectedDeckId}
              onSave={() => navigate('/')}
              onCancel={() => navigate('/')}
            />
            <div className="card-management">
              <div className="card-management-header">
                <h2>
                  <span className="section-icon">🗃️</span>
                  Cards in this Deck
                </h2>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/deck/${selectedDeckId}/card/new`)}
                >
                  <span className="btn-icon">➕</span>
                  Add New Card
                </button>
              </div>
              <CardList
                deckId={selectedDeckId}
                onEditCard={(cardId) => navigate(`/deck/${selectedDeckId}/card/${cardId}`)}
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
                onClick={() => navigate(`/deck/${selectedDeckId}/edit`)}
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
                navigate(`/deck/${selectedDeckId}/edit`);
              }}
              onCancel={() => navigate(`/deck/${selectedDeckId}/edit`)}
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
                onClick={() => navigate(`/deck/${selectedDeckId}/edit`)}
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
                navigate(`/deck/${selectedDeckId}/edit`);
              }}
              onCancel={() => navigate(`/deck/${selectedDeckId}/edit`)}
            />
          </div>
        );

      case 'study':
        return (
          <StudyMode
            deckId={selectedDeckId}
            onBack={() => navigate('/')}
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
        onNavigate={(viewName) => {
          if (viewName === 'decks') navigate('/');
          else if (viewName === 'create-deck') navigate('/create-deck');
        }}
        deckStats={deckStats}
      />

      <Header
        currentView={view}
        onNavigate={(viewName) => {
          if (viewName === 'decks') navigate('/');
          else if (viewName === 'create-deck') navigate('/create-deck');
        }}
        title={getViewTitle()}
      />

      <main className="app-main">
        {renderCurrentView()}
      </main>

      {/* Debug components removed for clean production interface */}
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
                if (confirmDeleteWithPassword('البطاقة', card.question.substring(0, 30) + '...')) {
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
