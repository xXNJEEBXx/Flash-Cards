# Flashcards MCP Server

Model Context Protocol server exposing tools to manage Flash Cards via the Laravel backend.

## Tools

Cards:
- createCard(deckId, question, answer)
- updateCard(deckId, cardId, question?, answer?, known?)
- deleteCard(deckId, cardId)
- toggleKnown(deckId, cardId)
- markSeen(deckId, cardId)
- markDifficult(deckId, cardId)
- getCardStats(deckId, cardId)

Decks (optional):
- listDecks()
- createDeck(title, description?)
- updateDeck(deckId, title, description?)
- deleteDeck(deckId)
- resetDeck(deckId)

## Setup

1) Copy env and edit if needed

```powershell
Copy-Item .env.example .env
# Edit .env for BACKEND_BASE_URL if not http://localhost:8000/api
```

2) Install deps and build

```powershell
npm install
npm run build
npm test
```

3) Run as MCP server over stdio (for Desktop Commander or other MCP clients)

```powershell
node dist/index.js
```

Or use the provided bin:

```powershell
npx flashcards-mcp-server
```

## Configuration

- BACKEND_BASE_URL: Base URL of Laravel REST (default http://localhost:8000/api)
- AUTH_TOKEN: Optional Bearer token header

## Notes

- This server validates responses with zod and returns JSON text blocks as tool outputs.
- Network calls require the Laravel backend running; tests only check schemas.
