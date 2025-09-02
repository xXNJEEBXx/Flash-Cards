// Schema-only smoke test for MCP server build output
import { CardSchema, DeckSchema } from '../tools/mcp/flashcards-server/dist/schemas.js'

function assert(cond, msg) { if (!cond) throw new Error(msg) }

const card = CardSchema.parse({ id: 1, question: 'Q', answer: 'A', known: false })
assert(card.id === 1, 'card id')
const deck = DeckSchema.parse({ id: 10, title: 'T', description: null, cards: [card] })
assert(deck.cards.length === 1, 'deck cards length')
console.log('MCP SCHEMA SMOKE PASS')
