# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: up-chat

up-chat (https://up-chat.com, API at https://api.up-chat.com) is a multi-tenant SaaS platform where a user creates an AI "bot" (a system prompt + knowledge base + integrations), connects it to one or more messaging channels (Telegram, WhatsApp, Instagram), and the bot auto-replies to that channel's customers using Gemini. The platform also acts as a **shared inbox**: an operator can open any conversation in the web UI and reply manually, pause the AI for a single chat, or turn the bot off entirely.

Monetization is per-message: users buy message packs (Robokassa), every AI reply deducts from `User.messagesRemaining`, and a background worker scores conversations into a sales funnel for analytics. UI copy is primarily Russian.

## Stack

| Layer | Tech |
|---|---|
| Backend | Node 20, Express 5, ES modules (`"type": "module"`), Socket.IO, `src/main.js` entrypoint |
| DB | PostgreSQL 16 via Prisma 7 with the `@prisma/adapter-pg` driver adapter (not the default engine) |
| AI | Gemini `gemini-3.1-flash-lite` via `@google/genai` with the **Vertex AI** backend, authed by `backend/google-key.json` |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind 3 + CSS Modules, `socket.io-client` |
| Auth | `express-session` + `connect-pg-simple` (table `user_sessions`), session cookie, Google OAuth |
| Deploy | Docker Compose behind Traefik (Let's Encrypt), `docker-compose.yml` at repo root |

## Commands

There is no test suite and no backend lint config. `backend/package.json`'s `test` script is a stub that exits 1.

```bash
docker compose up -d --build
```

Backend (from `backend/`):

```bash
npm start
```

```bash
npx prisma generate
```

```bash
npx prisma db push
```

Frontend (from `frontend/`):

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

The backend needs `backend/.env` (`DATABASE_URL`, `BASE_URL`, `SESSION_SECRET`, `PORT`) plus the WhatsApp/Instagram/Robokassa/SMTP vars that `docker-compose.yml` injects. `prisma/schema.prisma` declares `datasource db` **without a `url`** — the URL comes from `DATABASE_URL` at runtime through the adapter, so Prisma CLI commands need that env var exported.

The many loose `test-*.js`, `fix-*.js`, `check*.js` files in `backend/` are one-off operator scripts, not a test suite. Don't treat them as part of the app.

## Architecture

### Bot → Channel → Message

`Bot` is the AI configuration (`system_prompt`, `data_prompt` = the RAG blob, integration URLs, `pausedChats`). `Channel` is one messaging account attached to that bot. This is a **migration in progress**: bots originally carried their own `platform` + `apiToken`, and multi-channel support was layered on top later.

The consequence is a legacy/base-channel duality that appears throughout the code:

- `GET /api/bot/:id/channels` synthesizes a pseudo-channel with id `"base-<botId>"` from the `Bot` row when no real `Channel` exists for the bot's own platform. Routes taking a `:channelId` must handle the `base-` prefix.
- Webhooks look up a `Channel` first, then fall back to the legacy `Bot` row.
- Tokens resolve as `channel.apiToken ?? bot.apiToken`.

New code should prefer `Channel` and treat the base-channel path as compatibility only.

### chatId is platform-dependent — this is the #1 source of bugs

`Message.chatId` / `Contact.chatId` hold a different identifier per platform, and mismatches silently split one conversation into two threads:

- **Telegram** — numeric chat id, no `@`.
- **WhatsApp Cloud API** — bare `wa_id` (digits only, e.g. `79991234567`), which is what the webhook's `messages[0].from` gives.
- **WhatsApp legacy (Baileys)** — full JID `...@s.whatsapp.net`, and sometimes a `...@lid` privacy id whose real number lives in `Contact.realJid`.
- **Instagram** — IGSID.

Baileys was ripped out in favor of the Cloud API, so `@s.whatsapp.net` / `@lid` values only exist in old rows. `GET /api/bot/:id/chats` and boot code in `main.js` run **inline one-time migrations** to merge those legacy ids. Anything writing a WhatsApp `chatId` must match what the webhook writes, or the operator's reply lands in a thread the customer's messages don't appear in.

### Message flow (inbound)

All three webhooks in `backend/src/routes/bot-routes.js` follow the same shape, and `POST /api/webhook/telegram/:slug` is the most complete reference implementation:

1. Respond `200` **immediately**, then process — providers retry on slow responses.
2. Resolve bot + channel from the platform id in the payload.
3. Download any media to `backend/uploads/`, set `mediaUrl` (`/uploads/<name>`) + `mediaType` (`image` | `audio` | `video` | `document`).
4. Upsert `Contact`, persist the user `Message`, emit `chat-<botId>` over Socket.IO.
5. **Re-read `isActive` and `pausedChats` fresh from the DB** before replying — the objects fetched in step 2 may be stale or cached. Storing the inbound message but skipping the reply is the correct behavior when a bot is off.
6. `hasEnoughMessages(userId)` gate; on empty balance, deactivate and email the owner.
7. Build history from the last 20 messages, call `generateGeminiResponse`, send the reply, persist it, emit again.

`GeminiService` returns `{ text, inputTokens, outputTokens, shouldPauseChat }`. `shouldPauseChat` means the AI handed off to a human: append the chat id to `Bot.pausedChats`. Token counts must be passed to `trackUsage()` from `services/usage-tracker.js`, which writes `AIUsage` + `MessageTransaction` and decrements the user's balance.

Instagram and WhatsApp webhooks cache platform-id → `{ bot, channel }` in module-level `Map`s (`igAccountToConfigMap`, `waAccountToConfigMap`). These caches are never invalidated, so **never read `isActive` from a cached object.**

### Message flow (outbound, operator)

`POST /api/bot/:id/send` (multipart, `upload.single('file')`) is the operator's manual reply. It resolves the real chat id via `Contact.realJid`, resolves the channel/token, dispatches per platform, then persists with `sender: 'bot'` and emits `chat-<botId>`. Media is written to `uploads/` and, for audio, transcoded to Opus/OGG with `ffmpeg` (installed in the backend image) because both WhatsApp and Telegram voice notes require it.

Because operator replies and AI replies are both stored as `sender: 'bot'`, the transcript does not distinguish them.

WhatsApp Cloud has a hard constraint the other platforms don't: outside the **24-hour customer service window** only approved templates can be sent, and free-form sends fail with Graph error `131047`. Surface that error text to the UI rather than swallowing it.

### WhatsApp Cloud specifics

`services/whatsapp-cloud.js` wraps Graph API v21.0. Onboarding is Meta **Embedded Signup**: the frontend returns a `code`, `POST /api/integrations/whatsapp/connect` exchanges it, reads the WABA id out of the token's granular scopes, subscribes the WABA to the app webhook, and stores `whatsappWabaId` + `whatsappPhoneNumberId` on the `Channel`. Sending uses the long-lived `WA_SYSTEM_USER_TOKEN`, not the per-user token.

`registerPhone()` exists but is **deliberately not called** during connect — invoking `/register` forces full migration and breaks Coexistence (the customer would lose WhatsApp on their phone).

**Precondition for the whole flow:** Embedded Signup runs on Facebook Login, which for users who hold no role on the Meta app requires **Advanced Access** on `public_profile` *and* `email`. This app uses the use-case dashboard, so those live under **Use cases → (the Facebook Login use case) → Permissions**, *not* under App Review — and for a Business-type app they upgrade by direct toggle with no App Review submission. At Standard access the dialog dies with "Feature unavailable — Facebook Login is not available for this app", before Embedded Signup starts, so none of the Coexistence switches below can even be evaluated. Advanced Access itself is gated on completed Business Verification. Confirmed with Meta Support, Aug 2026. While it is pending, the flow is still testable end-to-end by anyone given an admin/developer/tester role on the app.

Coexistence (connecting a number that is still live in the customer's WhatsApp Business app) has three separate switches, and all of them must be on. Two are outside the repo, so a code-only check will always say it looks fine:

1. `featureType: 'whatsapp_business_app_onboarding'` in the `FB.login` extras (`frontend/app/bots/[id]/page.tsx`). **A blank `featureType` is not a neutral default** — Meta reads it as the standard flow and silently drops the "Select your setup" step, so the dialog goes straight to phone-number entry and the Coexistence option never renders.
2. The `history`, `smb_app_state_sync` and `smb_message_echoes` webhook topics subscribed in the Meta App Dashboard.
3. Tech Provider or Solution Partner status on the Meta business account. **Granted (Aug 2026)** — Use cases → Связь в WhatsApp → Станьте партнером reports "Выполнено шагов: 2 из 2".

The webhook then receives three extra `change.field` values. None may reach the AI reply path: they describe messages that were already sent, so replying makes the bot answer itself and bills the owner. `Message.waMessageId` holds the wamid on inbound *and* outbound sends specifically so an echo of our own message is recognised instead of duplicated.

To check whether a given number can use Coexistence at all: `GET /{phone-number-id}?fields=is_on_biz_app,platform_type`. `is_on_biz_app: false` means the number is API-only and can never coexist, regardless of configuration.

Media is a two-step protocol in both directions: upload bytes to `/{phone-number-id}/media` to get an id before sending, and for inbound, `GET /{media-id}` returns a URL that must then be fetched with the `Authorization` header attached.

### Tenant isolation

A bot's `system_prompt` + `data_prompt` are that tenant's private data. Two invariants keep them from mixing, and both have been broken before:

1. **Never resolve an inbound webhook to a "best guess" bot.** The platform account id (Telegram slug, `whatsappPhoneNumberId`, Instagram account id) must match exactly. If nothing matches, drop the message and log it. Falling back to "the first active bot" answers a stranger's customer with another tenant's prompts, files the transcript under their bot, and spends their message balance.
2. **One platform account id maps to exactly one bot.** Meta lets numbers and IG accounts move between owners, and test numbers get reused constantly, so a stale row can still point at an id someone else just connected. Every connect path calls `claimInstagramAccountId()` (or the equivalent inline `updateMany` for WhatsApp) to strip the id from everyone else first. The schema does not enforce this — the application does.

Anything taking a bot id from a request (route param, OAuth `state`, webhook body) must verify ownership against `req.session.userId` before touching prompts. `requireBotOwnership` does this for `/bot/:id/...` routes.

### Real-time

Socket.IO event names are string-interpolated per bot and joined by no rooms — the server broadcasts and clients filter:

- `chat-<botId>` — new message in either direction
- `contact-update-<botId>` — contact created/renamed
- `bot-update-<botId>` — `{ isActive }` changed

### Background work

Started from `main.js` at boot: re-registration of all Telegram webhooks against the current `BASE_URL` (bots created against an old/ngrok URL would otherwise be dead), legacy `@lid` contact merging, a daily Instagram token refresh loop, and `startCompletionChecker` (every 15 min). `services/analytics-worker.js` drains the `BackgroundJob` queue to fill `ChatAnalytics` (funnel stage, drop-off reason, score).

### Frontend

`frontend/app/bots/[id]/page.tsx` (~3.7k lines) is the product: chat list, transcript, media rendering, operator composer with voice recording, prompt editor, channel management, integrations. `frontend/app/create-bot/page.tsx` is the AI-assisted bot-building wizard (`POST /api/bot/:id/agent-chat`).

Frontend conventions worth knowing before editing:

- `API` base comes from `app/config.ts` → `NEXT_PUBLIC_API_URL`. Every fetch needs `credentials: 'include'` (cookie sessions, cross-origin).
- All UI strings go through `LanguageContext` + `app/locales/translations.ts`; don't hardcode user-visible text.
- Media URLs are server-relative — render as `${API_BASE}${msg.mediaUrl}`.
- Audio arrives two ways: as `mediaType === 'audio'` + `mediaUrl`, **and** as an inline `[AUDIO]/uploads/<file>` token embedded in `text` (so the transcript reaches Gemini as text). The renderer strips that token before display; keep both in sync when touching audio.
- `frontend/AGENTS.md` (loaded via `frontend/CLAUDE.md`) warns that Next.js 16 has breaking changes vs. training data — check `node_modules/next/dist/docs/` before writing Next-specific code.

## Gotchas

- `main.js` uses top-level `await import()` for nearly every module so `dotenv.config()` runs first. Adding a static top-level import of a module that reads `process.env` at load time will break startup.
- Prisma is lazily constructed in `getPrisma()` (exported from `bot-routes.js` as `prisma`) for the same reason. Import that, don't construct a second `PrismaClient`.
- `docker-compose.yml` hardcodes production secrets (Meta tokens, Robokassa passwords, SMTP credentials) and is tracked in git. Don't add more, and don't echo the existing ones into new files or logs.
- Node 20's global `fetch` is used everywhere; `node-fetch` appears in a couple of imports but is **not** a declared dependency — prefer global `fetch`.
- Bot ids are sequential integers exposed in URLs, so `requireAuth` alone never secures a `/bot/:id/...` route — chain `requireBotOwnership` (in `bot-routes.js`) after it, or scope the query with `where: { id, user_id: req.session.userId }` as the analytics routes do. The only intentionally public routes are the five `/webhook/*` endpoints, `/public-test-chat`, and `/support`.
