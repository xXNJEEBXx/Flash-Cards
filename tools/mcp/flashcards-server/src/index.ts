import "dotenv/config";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ApiClient } from "./http.js";
import { CardSchema, DeckSchema, FolderSchema } from "./schemas.js";

const name = "flashcards-mcp-server";
const version = "0.2.0";

// Resolve backend base URL with priority:
// 1) BACKEND_BASE_URL (env)
// 2) REACT_APP_API_URL from env or frontend .env (auto + "/api")
// 3) Default Railway URL
let resolvedSource: string = "";
let rawRoot = process.env.BACKEND_BASE_URL;

if (rawRoot) {
  resolvedSource = "BACKEND_BASE_URL";
} else {
  // Try REACT_APP_API_URL from env
  let reactApi = process.env.REACT_APP_API_URL;
  if (!reactApi) {
    // Try loading from frontend .env
    try {
      // Resolve ../flash-cards/.env relative to this file
      const here = path.dirname(new URL(import.meta.url).pathname);
      const frontendEnvPath = path.resolve(
        here,
        "../../../../flash-cards/.env"
      );
      if (fs.existsSync(frontendEnvPath)) {
        const parsed = dotenv.parse(fs.readFileSync(frontendEnvPath));
        if (parsed.REACT_APP_API_URL) reactApi = parsed.REACT_APP_API_URL;
      }
    } catch {
      // ignore
    }
  }
  if (reactApi) {
    rawRoot = reactApi;
    resolvedSource = reactApi ? "REACT_APP_API_URL" : "";
  }
}

if (!rawRoot) {
  rawRoot = "https://flash-cards-production-5df5.up.railway.app";
  resolvedSource = "DEFAULT_RAILWAY";
}

// Normalize to always include trailing "/api"
const RAW_BASE = rawRoot.endsWith("/api")
  ? rawRoot
  : `${rawRoot.replace(/\/$/, "")}/api`;
const BASE_URL = RAW_BASE.endsWith("/api")
  ? RAW_BASE
  : `${RAW_BASE.replace(/\/$/, "")}/api`;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const client = new ApiClient({ baseUrl: BASE_URL, authToken: AUTH_TOKEN });

// Types are imported from schemas.ts

function okJson(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function errJson(message: string, extra?: any) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: message, details: extra }, null, 2),
      },
    ],
  };
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
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Log backend target once when tools are listed (first interaction)
    // eslint-disable-next-line no-console
    console.log(`[MCP] Using backend: ${BASE_URL} (source: ${resolvedSource})`);
    return {
      tools: [
        {
          name: "backendInfo",
          description:
            "Show the configured backend base URL and health status (to confirm MCP DB target)",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "createCard",
          description: "Create a card in a deck",
          inputSchema: {
            type: "object",
            required: ["deckId", "question", "answer"],
            properties: {
              deckId: { type: "number", description: "Deck ID" },
              question: { type: "string" },
              answer: { type: "string" },
            },
          },
        },
        {
          name: "updateCard",
          description: "Update a card in a deck",
          inputSchema: {
            type: "object",
            required: ["deckId", "cardId"],
            properties: {
              deckId: { type: "number" },
              cardId: { type: "number" },
              question: { type: "string" },
              answer: { type: "string" },
              known: { type: "boolean" },
            },
          },
        },
        {
          name: "deleteCard",
          description: "Delete a card from a deck",
          inputSchema: {
            type: "object",
            required: ["deckId", "cardId"],
            properties: {
              deckId: { type: "number" },
              cardId: { type: "number" },
            },
          },
        },
        {
          name: "toggleKnown",
          description: "Toggle known state of a card",
          inputSchema: {
            type: "object",
            required: ["deckId", "cardId"],
            properties: {
              deckId: { type: "number" },
              cardId: { type: "number" },
            },
          },
        },
        {
          name: "markSeen",
          description: "Increment seen counter for a card",
          inputSchema: {
            type: "object",
            required: ["deckId", "cardId"],
            properties: {
              deckId: { type: "number" },
              cardId: { type: "number" },
            },
          },
        },
        {
          name: "markDifficult",
          description: "Mark card as difficult",
          inputSchema: {
            type: "object",
            required: ["deckId", "cardId"],
            properties: {
              deckId: { type: "number" },
              cardId: { type: "number" },
            },
          },
        },
        {
          name: "getCardStats",
          description: "Get statistics for a card",
          inputSchema: {
            type: "object",
            required: ["deckId", "cardId"],
            properties: {
              deckId: { type: "number" },
              cardId: { type: "number" },
            },
          },
        },
        {
          name: "listDecks",
          description: "List decks with cards",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "createDeck",
          description: "Create a new deck",
          inputSchema: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        {
          name: "updateDeck",
          description: "Update an existing deck",
          inputSchema: {
            type: "object",
            required: ["deckId", "title"],
            properties: {
              deckId: { type: "number" },
              title: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        {
          name: "deleteDeck",
          description: "Delete a deck",
          inputSchema: {
            type: "object",
            required: ["deckId"],
            properties: { deckId: { type: "number" } },
          },
        },
        {
          name: "resetDeck",
          description: "Reset all cards in a deck to unknown",
          inputSchema: {
            type: "object",
            required: ["deckId"],
            properties: { deckId: { type: "number" } },
          },
        },
        // ===== Folder Management Tools =====
        {
          name: "listFolders",
          description: "List all folders with their decks and subfolders",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "createFolder",
          description: "Create a new folder",
          inputSchema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", description: "Folder name" },
              description: {
                type: "string",
                description: "Folder description",
              },
              parent_folder_id: {
                type: "number",
                description: "Parent folder ID for nested folders",
              },
            },
          },
        },
        {
          name: "updateFolder",
          description: "Update an existing folder",
          inputSchema: {
            type: "object",
            required: ["folderId"],
            properties: {
              folderId: { type: "number" },
              name: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        {
          name: "deleteFolder",
          description:
            "Delete a folder (decks and subfolders will be moved to parent level)",
          inputSchema: {
            type: "object",
            required: ["folderId"],
            properties: { folderId: { type: "number" } },
          },
        },
        {
          name: "moveDeckToFolder",
          description: "Move a deck into a folder",
          inputSchema: {
            type: "object",
            required: ["folderId", "deckId"],
            properties: {
              folderId: { type: "number", description: "Target folder ID" },
              deckId: { type: "number", description: "Deck ID to move" },
            },
          },
        },
        {
          name: "removeDeckFromFolder",
          description: "Remove a deck from its folder (move to root level)",
          inputSchema: {
            type: "object",
            required: ["deckId"],
            properties: {
              deckId: {
                type: "number",
                description: "Deck ID to remove from folder",
              },
            },
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "backendInfo": {
          const health = await client.call<any>("GET", "/health");
          return okJson({ baseUrl: BASE_URL, health });
        }
        case "createCard": {
          const { deckId, question, answer } = args as any;
          const res = await client.call<any>("POST", `/decks/${deckId}/cards`, {
            question,
            answer,
          });
          return okJson(CardSchema.parse(res));
        }

        case "updateCard": {
          const { deckId, cardId, question, answer, known } = args as any;
          const body: any = {};
          if (typeof question === "string") body.question = question;
          if (typeof answer === "string") body.answer = answer;
          if (typeof known === "boolean") body.known = known;
          const res = await client.call<any>(
            "PUT",
            `/decks/${deckId}/cards/${cardId}`,
            body
          );
          return okJson(CardSchema.parse(res));
        }

        case "deleteCard": {
          const { deckId, cardId } = args as any;
          await client.call<void>("DELETE", `/decks/${deckId}/cards/${cardId}`);
          return okJson({ success: true });
        }

        case "toggleKnown": {
          const { deckId, cardId } = args as any;
          const res = await client.call<any>(
            "POST",
            `/decks/${deckId}/cards/${cardId}/toggle-known`
          );
          return okJson(res);
        }

        case "markSeen": {
          const { deckId, cardId } = args as any;
          const res = await client.call<any>(
            "POST",
            `/decks/${deckId}/cards/${cardId}/mark-seen`
          );
          return okJson(res);
        }

        case "markDifficult": {
          const { deckId, cardId } = args as any;
          const res = await client.call<any>(
            "POST",
            `/decks/${deckId}/cards/${cardId}/mark-difficult`
          );
          return okJson(res);
        }

        case "getCardStats": {
          const { deckId, cardId } = args as any;
          const res = await client.call<any>(
            "GET",
            `/decks/${deckId}/cards/${cardId}/stats`
          );
          return okJson(res);
        }

        case "listDecks": {
          const res = await client.call<any>("GET", `/decks`);
          const decks = z.array(DeckSchema).parse(res);
          return okJson(decks);
        }

        case "createDeck": {
          const { title, description } = args as any;
          const res = await client.call<any>("POST", `/decks`, {
            title,
            description,
          });
          return okJson(DeckSchema.parse(res));
        }

        case "updateDeck": {
          const { deckId, title, description } = args as any;
          const res = await client.call<any>("PUT", `/decks/${deckId}`, {
            title,
            description,
          });
          return okJson(DeckSchema.parse(res));
        }

        case "deleteDeck": {
          const { deckId } = args as any;
          await client.call<void>("DELETE", `/decks/${deckId}`);
          return okJson({ success: true });
        }

        case "resetDeck": {
          const { deckId } = args as any;
          const res = await client.call<any>("POST", `/decks/${deckId}/reset`);
          return okJson(DeckSchema.parse(res));
        }

        // ===== Folder Handlers =====
        case "listFolders": {
          const res = await client.call<any>("GET", `/folders`);
          const foldersData = res.data || res;
          const folders = z.array(FolderSchema).parse(foldersData);
          return okJson(folders);
        }

        case "createFolder": {
          const { name, description, parent_folder_id } = args as any;
          const body: any = { name };
          if (description) body.description = description;
          if (parent_folder_id) body.parent_folder_id = parent_folder_id;
          const res = await client.call<any>("POST", `/folders`, body);
          // Extract data from Laravel response wrapper
          const folderData = res.data || res;
          return okJson(FolderSchema.parse(folderData));
        }

        case "updateFolder": {
          const { folderId, name, description } = args as any;
          const body: any = {};
          if (name) body.name = name;
          if (description !== undefined) body.description = description;
          const res = await client.call<any>(
            "PUT",
            `/folders/${folderId}`,
            body
          );
          // Extract data from Laravel response wrapper
          const folderData = res.data || res;
          return okJson(FolderSchema.parse(folderData));
        }

        case "deleteFolder": {
          const { folderId } = args as any;
          await client.call<void>("DELETE", `/folders/${folderId}`);
          return okJson({ success: true });
        }

        case "moveDeckToFolder": {
          const { folderId, deckId } = args as any;
          const res = await client.call<any>(
            "POST",
            `/folders/${folderId}/move-deck`,
            {
              deck_id: deckId,
            }
          );
          const responseData = res.data || res;
          return okJson(responseData);
        }

        case "removeDeckFromFolder": {
          const { deckId } = args as any;
          const res = await client.call<any>("POST", `/folders/remove-deck`, {
            deck_id: deckId,
          });
          const responseData = res.data || res;
          return okJson(responseData);
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (e: any) {
      return errJson(`Failed to execute ${name}`, e.message || String(e));
    }
  });

  await server.connect(new StdioServerTransport());
}
main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
