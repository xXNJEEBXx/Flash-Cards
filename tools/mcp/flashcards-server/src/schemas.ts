import { z } from 'zod'

export const CardSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
  known: z.boolean().optional(),
  deck_id: z.number().optional(),
  times_seen: z.number().optional(),
  times_known: z.number().optional(),
  last_seen_at: z.string().nullable().optional(),
  last_known_at: z.string().nullable().optional(),
  is_difficult: z.boolean().optional()
})

export const DeckSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  cards: z.array(CardSchema).optional()
})

// Using any types here to avoid requiring type-level zod during bootstrap.
export type Card = any
export type Deck = any
