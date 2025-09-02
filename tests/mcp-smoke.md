# MCP Server Smoke Test

This test validates the schema layer only (no network).

Steps:

1) Build the MCP server

```powershell
cd "tools/mcp/flashcards-server"
npm install
npm run build
```

2) Run the schema smoke test

```powershell
node ./tests/smoke.js
```

Expected output:

```
SMOKE PASS
```
