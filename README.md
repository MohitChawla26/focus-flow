# FocusFlow

**AI-Powered Personal Attention Manager** — a hackathon-ready Next.js application that aggregates information, scores it against a user’s real priorities, groups repeated stories, and turns information overload into a calm, explainable feed.

The project runs immediately in demo mode with the seeded **Binod** profile. Supabase, Gemini, NewsAPI, YouTube, and CricketData activate when their environment variables are added; missing keys never crash the dashboard.

## What is implemented

- Smart Feed split into **Must See**, **Worth Reading**, and **Later**
- Deterministic importance scoring (interest 30%, urgency 25%, source 20%, keyword/person 15%, recency 10%)
- “Why this matters to you” explanations from deterministic signals
- Interactive bookmark, mark-read, hide, source toggle, search, refresh, quiet-hours, threshold and digest controls
- Catch Me Up digest experience with reading-time reduction
- Story clusters that preserve every original source
- Recharts insights dashboard with volume, attention distribution, clustering, and time-saved metrics
- Source manager and RSS entry UI
- College notice ingestion surface
- Multi-step onboarding for interests, priorities, keywords, people, notifications and quiet hours
- Supabase email/password signup, login, logout, password reset and protected-route proxy when configured
- Modular normalized source adapters for Hacker News, arXiv, Open-Meteo, RSS, NewsAPI, YouTube and CricketData
- Server-only Gemini analysis with strict runtime validation and a local fallback analyzer
- Title/keyword clustering fallback plus a pgvector-ready schema
- Graceful API warnings and a `/api/content?live=1` refresh endpoint
- Full responsive desktop/mobile interface

## Architecture

```text
External sources
  → server-only source adapters
  → normalized ContentItem
  → Gemini/local structured analysis
  → deterministic importance score
  → clustering + Supabase cache
  → Smart Feed / Catch Me Up / Insights
```

The browser never receives private API keys. Public Supabase credentials are used only by the Supabase browser client; all third-party API calls remain server-side.

## Tech stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4
- Supabase PostgreSQL, Auth, Realtime-ready tables, pgvector
- Gemini REST API (server-side)
- Recharts
- `rss-parser` and `fast-xml-parser`
- Zod validation
- Vercel deployment target

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With empty environment values the app opens in demo mode. The auth screens also accept any syntactically valid email/password in demo mode.

Quality checks:

```bash
npm run lint
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` and fill only the integrations you want:

| Variable | Required | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence/auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For persistence/auth | Public anon/publishable key; safe for browser with RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server ingestion only | Private admin key; never expose with `NEXT_PUBLIC_` |
| `GEMINI_API_KEY` | Optional | Structured summaries and analysis |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-2.5-flash` |
| `NEWS_API_KEY` | Optional | NewsAPI headlines |
| `YOUTUBE_API_KEY` | Optional | YouTube search results |
| `CRICKET_API_KEY` | Optional | CricketData/CricAPI matches |
| `DEFAULT_LATITUDE` / `DEFAULT_LONGITUDE` | Optional | Open-Meteo context; defaults to Delhi |
| `CONTENT_CLUSTER_SIMILARITY_THRESHOLD` | Optional | Defaults to `0.82` |

The optional Google OAuth and Firebase variables are documented in `.env.example` but are not required for this MVP.

## Supabase setup

1. Create or open a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run the complete migration in `supabase/migrations/20261001033851_focusflow_initial_schema.sql`.
4. In **Authentication → URL Configuration**, add:
   - Site URL: `http://localhost:3000` while developing
   - Redirect URL: `http://localhost:3000/auth/callback`
   - Add the equivalent production Vercel URLs before deployment.
5. Put the project URL and anon key in `.env.local`.
6. Keep the service-role key server-only. It is intended for scheduled source ingestion, analysis and shared-content writes.

The migration enables the `vector` extension, creates all requested tables, indexes and timestamps, and enables Row Level Security on every public table. User-owned policies compare `auth.uid()` with the owning `user_id`. Shared/global content can be read by signed-in users but private rows remain isolated.

### Tables

`profiles`, `user_interests`, `user_keywords`, `important_people`, `user_preferences`, `content_sources`, `content_items`, `content_analysis`, `content_embeddings`, `content_clusters`, `cluster_members`, `bookmarks`, `read_status`, `digests`, `digest_items`, `notifications`, and `source_fetch_logs`.

## API keys

- **Gemini:** create an API key in Google AI Studio. Add it as `GEMINI_API_KEY`.
- **NewsAPI:** register at `newsapi.org`, then add `NEWS_API_KEY`.
- **YouTube Data API:** enable YouTube Data API v3 in Google Cloud, create a restricted key, and add `YOUTUBE_API_KEY`.
- **CricketData / CricAPI:** create a key at `cricketdata.org` and add `CRICKET_API_KEY`.
- Hacker News, arXiv, Open-Meteo and RSS require no key.

Responses are cached by Next.js (`revalidate` windows vary per source). The production data flow should persist normalized items and `source_fetch_logs` to Supabase so user requests read the database instead of repeatedly calling providers.

## Demo mode

Demo mode is automatic when Supabase is not configured. It includes realistic college, AI, cricket, programming, YouTube, research, social, weather and entertainment items. Scores are calculated at runtime by `services/importanceScoring.ts`; none of the displayed importance scores are hardcoded.

Binod’s high priorities are College, Cricket and AI. That causes deadlines, major AI announcements and important India cricket updates to naturally rank above celebrity or repetitive entertainment stories.

## Deploy to Vercel

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Add the same variables from `.env.local` in **Project Settings → Environment Variables**.
4. Deploy.
5. Add the final Vercel URL and `/auth/callback` URL to Supabase Auth redirect settings.

The project uses the standard Next.js build command and requires no custom server.

## Optional phase 2

- Gmail OAuth ingestion
- Firebase Cloud Messaging push delivery
- Scheduled Vercel Cron ingestion jobs
- File storage and PDF/OCR extraction for uploaded college notices
- Production Gemini embeddings pipeline and background clustering queue
- Native mobile application / APK (intentionally not started yet)
