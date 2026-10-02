# FocusFlow

**AI-Powered Personal Attention Manager** — a hackathon-ready Next.js application that aggregates information, scores it against a user’s real priorities, groups repeated stories, and turns information overload into a calm, explainable feed.

The project uses authenticated Supabase profiles and stored source content. New accounts begin with an honest empty state; FocusFlow never fills a user dashboard with seeded stories or a placeholder identity.

## What is implemented

- Smart Feed split into **Must See**, **Worth Reading**, and **Later**
- Jarvis-style **Overview radar** with high-priority items nearest the user
- Private project tracking with details, priority, deadline and completion state
- Persistent light/dark themes, profile editing and local-session logout
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
- Server-only Gemini analysis with Groq failover, strict runtime validation, and a deterministic local fallback
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

Open `http://localhost:3000`. Configure Supabase before signing up; authenticated users are guided through onboarding and then see their own stored content.

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
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | For persistence/auth | Current public browser key; safe to expose with RLS enabled |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy alternative | Older Supabase anon key; used only when no publishable key is set |
| `SUPABASE_SERVICE_ROLE_KEY` | Server ingestion only | Private admin key; never expose with `NEXT_PUBLIC_` |
| `GEMINI_API_KEY` | Optional | Structured summaries and analysis |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-flash-latest` |
| `GROQ_API_KEY` | Optional fallback | Used only when Gemini fails or returns malformed output |
| `GROQ_BASE_URL` | Optional | Defaults to `https://api.groq.com/openai/v1` |
| `GROQ_MODEL` | Optional | Defaults to `openai/gpt-oss-20b` |
| `NEWS_API_KEY` | Optional | NewsAPI headlines |
| `CRICKET_API_KEY` | Optional | CricketData/CricAPI matches |
| `DEFAULT_LATITUDE` / `DEFAULT_LONGITUDE` | Optional | Open-Meteo context; defaults to Delhi |
| `CONTENT_CLUSTER_SIMILARITY_THRESHOLD` | Optional | Defaults to `0.82` |

The optional Google OAuth and Firebase variables are documented in `.env.example` but are not required for this MVP.

## Supabase setup

1. Create or open a Supabase project.
2. Link the Supabase CLI and run `npx supabase db push`, or apply the three files in `supabase/migrations` in filename order. The connected `focus-flow` project already has these migrations applied.
3. Keep Email enabled in **Authentication → Providers**.
4. In **Authentication → URL Configuration**, add:
   - Site URL: `http://localhost:3000` while developing
   - Redirect URL: `http://localhost:3000/auth/callback`
   - Add the equivalent production Vercel URLs before deployment.
5. Put the project URL and publishable key in `.env.local`.
6. Keep the service-role key server-only. It is intended for scheduled source ingestion, analysis and shared-content writes.

Supabase Auth securely owns email addresses and password hashes in `auth.users`; the application does not duplicate passwords in public tables. A signup trigger creates the matching `profiles` and `user_preferences` rows. The migrations also enable the `vector` extension, create the requested tables and indexes, and enable Row Level Security on every public table. User-owned policies compare `auth.uid()` with the owning `user_id`. Shared/global content can be read by signed-in users while private rows remain isolated.

### Tables

`profiles`, `user_interests`, `user_keywords`, `important_people`, `user_preferences`, `content_sources`, `content_items`, `content_analysis`, `content_embeddings`, `content_clusters`, `cluster_members`, `bookmarks`, `read_status`, `digests`, `digest_items`, `notifications`, and `source_fetch_logs`.

`user_projects` stores each signed-in user’s project title, details, priority, deadline and status. Row Level Security and explicit grants limit select, insert, update and delete operations to the owning user.

## API keys

- **Gemini:** create an API key in Google AI Studio. Add it as `GEMINI_API_KEY`.
- **Groq:** create an API key in Groq Console. Add it as `GROQ_API_KEY`; FocusFlow calls it only after Gemini fails.
- **NewsAPI:** register at `newsapi.org`, then add `NEWS_API_KEY`.
- **CricketData / CricAPI:** create a key at `cricketdata.org` and add `CRICKET_API_KEY`.
- Hacker News, arXiv, Open-Meteo and RSS require no key.

Responses are cached by Next.js (`revalidate` windows vary per source). The production data flow should persist normalized items and `source_fetch_logs` to Supabase so user requests read the database instead of repeatedly calling providers.

## Real-data mode

The dashboard reads the signed-in user’s profile, interests, keywords and content from Supabase. If no content has been ingested, it displays an empty state rather than fabricated stories or metrics. Scores are calculated at runtime by `services/importanceScoring.ts`.

Each user’s saved interests, priority levels, keywords and important people drive the deterministic importance score.

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
