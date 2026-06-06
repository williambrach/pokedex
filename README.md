# Pokédex — Card Collection

> AI SLOP WARNING ! This repo is 100% AI generated.

A mobile-first Pokémon **card collection tracker**. Browse all 1025 Pokémon, pick the
real TCG card you own (or want), and track your collection's value. Built with
**Next.js + Supabase** — sign in with a magic link and your collection **syncs to your
account across devices**. Cardmarket price estimates come straight from the
[Pokémon TCG API](https://pokemontcg.io) (no scraping, no key required).

## Features

- **Accounts** via passwordless magic-link sign-in (Supabase Auth). Each user has
  their own private collection.
- **All 1025 Pokémon**, filterable by name/number, generation, type, and status.
- **Pick a real card** per Pokémon from the TCG database (newest sets first).
- **Cardmarket prices in EUR** saved with each card (trend / average / low) plus a
  direct link to the product page.
- **Collection & wishlist value** estimated live in the header from saved prices.
- **Owned-card details**: condition, variant, a manual value override, and a photo
  of your own card (stored in a private Supabase Storage bucket).
- **Three looks** (Album / Retro / Playful), 2- or 3-column grid, optional type
  tinting — all in an in-app Settings sheet.
- **Responsive**: a polished iOS device mockup on desktop, edge-to-edge full-screen
  on phones (with safe-area insets); installable as a PWA.

## Where data lives

| Data | Storage |
| --- | --- |
| Owned / wishlist marks, notes, card metadata + prices | Supabase Postgres (`collection` table, RLS-scoped per user) |
| Photos of your own cards | Supabase Storage (private `card-photos` bucket) |
| Appearance settings (style, columns, type tint) | `localStorage` (device-local) |
| Pokédex base data + card search results | server-cached API routes + `localStorage` / `sessionStorage` cache |

A localStorage copy of the collection is kept as an offline cache for instant paint;
the source of truth is your Supabase account.

## Setup

You need a free [Supabase](https://supabase.com) project.

1. **Environment** — create `.env.local` (already present if you set it up):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your publishable / anon key>
   ```

   Both values are public-safe (they ship to the browser); security comes from
   Row-Level Security, not from hiding them.

2. **Database + storage** — open the Supabase dashboard → **SQL Editor** → paste and
   run [`supabase/schema.sql`](supabase/schema.sql). This creates the `collection`
   table with RLS, the private `card-photos` storage bucket, and per-user storage
   policies. It's idempotent — safe to re-run.

3. **Auth redirect URLs** — in the dashboard → **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` for local dev.
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`.

   Add your production URLs here too once you deploy (see below). Magic links won't
   complete sign-in without this.

4. **Run it**:

   ```bash
   npm install
   npm run dev        # http://localhost:3000
   ```

> Email: Supabase's built-in email sender works out of the box for testing but is
> rate-limited. For real usage, configure a custom SMTP provider (e.g. Resend) under
> **Authentication → Emails**.

## Deploy (Vercel)

Next.js needs a Node server (middleware, API routes, auth) — it is **not** a static
site, so GitHub Pages no longer applies.

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables.
3. Deploy. Then add your Vercel URL (Site URL + `…/auth/callback`) to the Supabase
   **Auth redirect URLs** from step 3 above.

## Project layout

```
app/
  layout.tsx            root layout, metadata, fonts
  page.tsx              authenticated entry → renders <App/>
  globals.css           global styles & keyframes
  login/                magic-link sign-in (server page + client form)
  auth/callback/        completes sign-in (PKCE code or OTP token_hash)
  auth/signout/         POST → sign out
  api/pokedex/          cached server proxy for PokeAPI (1025 mons)
  api/cards/            cached server proxy for TCG card search
components/
  App.tsx               root: loading, filtering, layout
  Grid.tsx              stats header, filters, dex slots (3 styles)
  Detail.tsx            card detail sheet (assign / price / owned details / photo)
  Settings.tsx          settings sheet (appearance, account, reset)
  IOSFrame.tsx          responsive shell (device mockup vs full-screen)
  ui.tsx                icons, status meta, type badge
hooks/
  useCollection.ts      Supabase-backed collection + photo storage
  useSettings.ts        appearance settings (localStorage)
lib/
  supabase/             browser / server / middleware clients
  types.ts              shared domain types
  pokedata.ts           type colors, generations, name helpers, dex loader
  tcg.ts                slim card shape + cached search
  stats.ts              status / value / aggregate helpers
  format.ts             EUR formatting
middleware.ts           refresh session + gate routes to /login
supabase/schema.sql     tables, RLS, storage bucket + policies
legacy/                 the original browser-only SPA (archived for reference)
```

Data and images: [PokeAPI](https://pokeapi.co) · [Pokémon TCG API](https://pokemontcg.io).
This is a personal, non-commercial fan project; Pokémon and Cardmarket are trademarks
of their respective owners.
