---
name: flashcards
description: Manage flashcards, decks, and folders via the Flashcards MCP Server (create/update/delete cards and decks, organize into folders, track review progress).
---

# Flashcards Management Skill

Use this skill when interacting with the Flashcards system to create, update, organize, or review study flashcards and decks.

## Available MCP Tools

### 📁 Decks Management
- `listDecks`: Get all decks along with their cards.
- `createDeck({ title, description? })`: Create a new deck for a study topic.
- `updateDeck({ deckId, title, description? })`: Update deck title or description.
- `deleteDeck({ deckId })`: Remove a deck and its cards.
- `resetDeck({ deckId })`: Reset all cards in a deck to unknown.

### 🃏 Cards Management
- `createCard({ deckId, question, answer })`: Add a new flashcard to a deck.
- `updateCard({ deckId, cardId, question?, answer?, known? })`: Edit card content or status.
- `deleteCard({ deckId, cardId })`: Delete a flashcard.
- `toggleKnown({ deckId, cardId })`: Toggle whether the user knows the card.
- `markSeen({ deckId, cardId })`: Increment the number of times the card was seen.
- `markDifficult({ deckId, cardId })`: Mark a card as difficult for targeted practice.
- `getCardStats({ deckId, cardId })`: Retrieve review statistics for a card.

### 🗂 Folders Management
- `listFolders`: Retrieve folder tree hierarchy with nested folders and assigned decks.
- `createFolder({ name, description?, parent_folder_id?, password? })`: Create a new folder or nested subfolder, with optional password protection.
- `updateFolder({ folderId, name?, description?, password? })`: Rename, update folder details, or set/change/remove password.
- `deleteFolder({ folderId })`: Delete a folder (decks inside are moved up).
- `verifyFolderPassword({ folderId, password })`: Verify password for a locked folder.
- `moveDeckToFolder({ folderId, deckId })`: Move a deck into a specified folder.
- `removeDeckFromFolder({ deckId })`: Move a deck out of its folder to root.

### ℹ️ Diagnostics
- `backendInfo`: Check connected API backend and health status.
