# Gotoap

A decentralized P2P messenger with built-in AI that works entirely without storage servers. All data travels directly between browsers over WebRTC and WebTorrent.

- **P2P signaling:** Trystero over WebTorrent trackers (`@trystero-p2p/torrent`)
- **History:** WebTorrent seeder for JSON snapshots + local browser storage
- **Identity:** `did:peer` DIDs on Ed25519 keys (`@stablelib/ed25519`)
- **Encryption:** WebCrypto AES-GCM + Ed25519 signatures
- **AI:** local via WebGPU (`@mlc-ai/web-llm`, Llama-3.2-1B) or server-side Edge proxy for OpenAI/Anthropic
- **State:** Zustand
- **Deploy:** Vercel + GitHub Actions

## Interface

The UI follows modern messengers (Telegram-like) and ships with a fully custom, in-repo icon set (`components/icons`, no icon libraries):

- Two-pane layout: chat list sidebar with search, plus a chat pane with a dotted wallpaper.
- Local profile: display name, bio, and deterministic gradient avatars with a chosen color (`components/profile`).
- Chats can be pinned, muted, renamed, and deleted from a custom dropdown menu.
- Message bubbles with date separators, delivery ticks, lock badge for encrypted payloads, and a custom emoji picker.
- The AI assistant lives in a slide-over panel that reads the last 10 messages as context.
- Everything is stored only in the browser (localStorage) - there is no server-side profile or message store.

> Architecture note for Next.js: this repository intentionally has **no `output: 'export'`**, because a static export is incompatible with the server-side Edge routes `/api/ai-proxy` and `/api/verify-did`. Vercel builds a hybrid Next.js app: static pages + Edge Functions for the API. This is a deliberate deviation from the original spec so the AI proxy actually works.

## Local run

```bash
git clone <repo>
cd enter
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`, create a DID, and start a chat.

Useful scripts:

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Environment variables

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_APP_ID=gotoap-chat`
- `NEXT_PUBLIC_TRACKERS=wss://tracker.webtorrent.dev,...`
- `NEXT_PUBLIC_DEFAULT_AI_MODE=local`
- `OPENAI_API_KEY=`
- `ANTHROPIC_API_KEY=`
- `OPENAI_BASE_URL=https://api.openai.com`
- `ANTHROPIC_BASE_URL=https://api.anthropic.com`
- `AI_PROXY_TIMEOUT_MS=30000`

Public `NEXT_PUBLIC_*` values end up in the browser bundle. Keep secret keys only on the server/Vercel.

## Deploy to Vercel

### Via Dashboard

1. Import the repository into Vercel.
2. Framework Preset: `Next.js`.
3. Add Environment Variables: `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`.
4. Deploy.

### Via CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

GitHub Actions (`.github/workflows/deploy.yml`) automatically runs `npm ci`, `npm run typecheck`, `npm run build`, and deploys with `vercel --prod --prebuilt` using the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets.

## Structure

```text
/app
  /page.tsx
  /chat/[id]/page.tsx
  /settings/page.tsx
  /api/ai-proxy/route.ts
  /api/verify-did/route.ts
/components
  /ui
  /chat
  /did
  /ai
/lib
  /p2p
  /did
  /ai
  /crypto
  /store
```

## License

MIT. See `LICENSE` for details.
