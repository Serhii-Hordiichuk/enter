# Готоап

Децентралізований P2P-месенджер із вбудованим ШІ, який працює повністю без серверів зберігання. Усі дані передаються напряму між браузерами через WebRTC та WebTorrent.

- **P2P-сигналінг:** Trystero через WebTorrent-трекери (`@trystero-p2p/torrent`)
- **Історія:** WebTorrent-сідер JSON-знімків + локальне сховище браузера
- **Ідентичність:** DID `did:peer` на ключах Ed25519 (`@stablelib/ed25519`)
- **Шифрування:** WebCrypto AES-GCM + підписи Ed25519
- **ШІ:** локально через WebGPU (`@mlc-ai/web-llm`, Llama-3.2-1B) або серверний Edge-проксі OpenAI/Anthropic
- **Стан:** Zustand
- **Деплой:** Vercel + GitHub Actions

> Важливо про архітектуру Next.js: у цьому репозиторії **немає `output: 'export'`**, тому що статичний експорт несумісний із серверними Edge-маршрутами `/api/ai-proxy` і `/api/verify-did`. Vercel збирає гібридний Next.js-білд: статичні сторінки + Edge Functions для API. Це свідоме відхилення від початкового ТЗ заради робочого ШІ-проксі.

## Локальний запуск

```bash
git clone <repo>
cd enter
cp .env.example .env.local
npm install
npm run dev
```

Відкрийте `http://localhost:3000`, створіть DID і почніть чат.

Корисні скрипти:

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Змінні середовища

Скопіюйте `.env.example` у `.env.local`:

- `NEXT_PUBLIC_APP_ID=gotoap-chat`
- `NEXT_PUBLIC_TRACKERS=wss://tracker.webtorrent.dev,...`
- `NEXT_PUBLIC_DEFAULT_AI_MODE=local`
- `OPENAI_API_KEY=`
- `ANTHROPIC_API_KEY=`
- `OPENAI_BASE_URL=https://api.openai.com`
- `ANTHROPIC_BASE_URL=https://api.anthropic.com`
- `AI_PROXY_TIMEOUT_MS=30000`

Публічні `NEXT_PUBLIC_*` потрапляють у браузерний бандл. Секретні ключі зберігайте лише на сервері/Vercel.

## Деплой на Vercel

### Через Dashboard

1. Імпортуйте репозиторій у Vercel.
2. Framework Preset: `Next.js`.
3. Додайте Environment Variables: `OPENAI_API_KEY` та/або `ANTHROPIC_API_KEY`.
4. Deploy.

### Через CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

GitHub Actions (`.github/workflows/deploy.yml`) автоматично перевіряє `npm ci`, `npm run typecheck`, `npm run build` і деплоїть `vercel --prod --prebuilt` за секретами `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Структура

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

## Ліцензія

MIT. Деталі — у файлі `LICENSE` (додайте текст MIT перед публікацією).
