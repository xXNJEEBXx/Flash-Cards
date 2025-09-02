import 'dotenv/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { ApiClient } from './http.js'
import { CardSchema, DeckSchema } from './schemas.js'

const name = 'flashcards-mcp-server'
const version = '0.1.0'

const BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8000/api'
const AUTH_TOKEN = process.env.AUTH_TOKEN

const client = new ApiClient({ baseUrl: BASE_URL, authToken: AUTH_TOKEN })

// Types are imported from schemas.ts

function okJson(data: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

function errJson(message: string, extra?: any) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message, details: extra }, null, 2) }] }
}

async function main() {
  const server = new Server(
    {
      name,
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'createCard',
          description: 'Create a card in a deck',
          inputSchema: {
            type: 'object',
            required: ['deckId', 'question', 'answer'],
            properties: {
              deckId: { type: 'number', description: 'Deck ID' },
              question: { type: 'string' },
              answer: { type: 'string' }
            }
          }
        },
        {
          name: 'updateCard',
          description: 'Update a card in a deck',
          inputSchema: {
            type: 'object',
            required: ['deckId', 'cardId'],
            properties: {
              deckId: { type: 'number' },
              cardId: { type: 'number' },
              question: { type: 'string' },
              answer: { type: 'string' },
              known: { type: 'boolean' }
            }
          }
        },
        {
          name: 'deleteCard',
          description: 'Delete a card from a deck',
          inputSchema: {
            type: 'object',
            required: ['deckId', 'cardId'],
            properties: { deckId: { type: 'number' }, cardId: { type: 'number' } }
          }
        },
        {
          name: 'toggleKnown',
          description: 'Toggle known state of a card',
          inputSchema: {
            type: 'object',
            required: ['deckId', 'cardId'],
            properties: { deckId: { type: 'number' }, cardId: { type: 'number' } }
          }
        },
        {
          name: 'markSeen',
          description: 'Increment seen counter for a card',
          inputSchema: {
            type: 'object',
            required: ['deckId', 'cardId'],
            properties: { deckId: { type: 'number' }, cardId: { type: 'number' } }
          }
        },
        {
          name: 'markDifficult',
          description: 'Mark card as difficult',
          inputSchema: {
            type: 'object',
            required: ['deckId', 'cardId'],
            properties: { deckId: { type: 'number' }, cardId: { type: 'number' } }
          }
        },
        {
          name: 'getCardStats',
          description: 'Get statistics for a card',
          inputSchema: {
            type: 'object',
            required: ['deckId', 'cardId'],
            properties: { deckId: { type: 'number' }, cardId: { type: 'number' } }
          }
        },
        {
          name: 'listDecks',
          description: 'List decks with cards',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'createDeck',
          description: 'Create a new deck',
          inputSchema: {
            type: 'object',
            required: ['title'],
            properties: { title: { type: 'string' }, description: { type: 'string' } }
          }
        },
        {
          name: 'updateDeck',
          description: 'Update an existing deck',
          inputSchema: {
            type: 'object',
            required: ['deckId', 'title'],
            properties: { deckId: { type: 'number' }, title: { type: 'string' }, description: { type: 'string' } }
          }
        },
        {
          name: 'deleteDeck',
          description: 'Delete a deck',
          inputSchema: {
            type: 'object',
            required: ['deckId'],
            properties: { deckId: { type: 'number' } }
          }
        },
        {
          name: 'resetDeck',
          description: 'Reset all cards in a deck to unknown',
          inputSchema: {
            type: 'object',
            required: ['deckId'],
            properties: { deckId: { type: 'number' } }
          }
        }
      ]
    }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params

    try {
      switch (name) {
        case 'createCard': {
          const { deckId, question, answer } = args as any
          const res = await client.call<any>('POST', `/decks/${deckId}/cards`, { question, answer })
          return okJson(CardSchema.parse(res))
        }

        case 'updateCard': {
          const { deckId, cardId, question, answer, known } = args as any
          const body: any = {}
          if (typeof question === 'string') body.question = question
          if (typeof answer === 'string') body.answer = answer
          if (typeof known === 'boolean') body.known = known
          const res = await client.call<any>('PUT', `/decks/${deckId}/cards/${cardId}`, body)
          return okJson(CardSchema.parse(res))
        }

        case 'deleteCard': {
          const { deckId, cardId } = args as any
          await client.call<void>('DELETE', `/decks/${deckId}/cards/${cardId}`)
          return okJson({ success: true })
        }

        case 'toggleKnown': {
          const { deckId, cardId } = args as any
          const res = await client.call<any>('POST', `/decks/${deckId}/cards/${cardId}/toggle-known`)
          return okJson(res)
        }

        case 'markSeen': {
          const { deckId, cardId } = args as any
          const res = await client.call<any>('POST', `/decks/${deckId}/cards/${cardId}/mark-seen`)
          return okJson(res)
        }

        case 'markDifficult': {
          const { deckId, cardId } = args as any
          const res = await client.call<any>('POST', `/decks/${deckId}/cards/${cardId}/mark-difficult`)
          return okJson(res)
        }

        case 'getCardStats': {
          const { deckId, cardId } = args as any
          const res = await client.call<any>('GET', `/decks/${deckId}/cards/${cardId}/stats`)
          return okJson(res)
        }

        case 'listDecks': {
          const res = await client.call<any>('GET', `/decks`)
          const decks = z.array(DeckSchema).parse(res)
          return okJson(decks)
        }

        case 'createDeck': {
          const { title, description } = args as any
          const res = await client.call<any>('POST', `/decks`, { title, description })
          return okJson(DeckSchema.parse(res))
        }

        case 'updateDeck': {
          const { deckId, title, description } = args as any
          const res = await client.call<any>('PUT', `/decks/${deckId}`, { title, description })
          return okJson(DeckSchema.parse(res))
        }

        case 'deleteDeck': {
          const { deckId } = args as any
          await client.call<void>('DELETE', `/decks/${deckId}`)
          return okJson({ success: true })
        }

        case 'resetDeck': {
          const { deckId } = args as any
          const res = await client.call<any>('POST', `/decks/${deckId}/reset`)
          return okJson(DeckSchema.parse(res))
        }

        default:
          throw new Error(`Unknown tool: ${name}`)
      }
    } catch (e: any) {
      return errJson(`Failed to execute ${name}`, e.message || String(e))
    }
  })

  await server.connect(new StdioServerTransport())
}main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
