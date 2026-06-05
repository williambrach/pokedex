# Pokédex — Card Collection

A mobile-first Pokémon **card collection tracker**. Browse all 1025 Pokémon, pick the
real TCG card you own (or want), and track your collection's value — all in your
browser. **No backend, no account.** Everything is stored locally, and Cardmarket
price estimates come straight from the [Pokémon TCG API](https://pokemontcg.io)
(no scraping, no key required).

## Features

- **All 1025 Pokémon**, filterable by name/number, generation, type, and status.
- **Pick a real card** per Pokémon from the TCG database (newest sets first).
- **Cardmarket prices in EUR** saved with each card (trend / average / low) plus a
  direct link to the product page.
- **Collection & wishlist value** estimated live in the header from saved prices.
- **Owned-card details**: condition, variant, a manual value override, and a photo
  of your own card (stored in IndexedDB).
- **Three looks** (Album / Retro / Playful), 2- or 3-column grid, optional type
  tinting — all in an in-app Settings sheet.
- **Responsive**: a polished iOS device mockup on desktop, edge-to-edge full-screen
  on phones (with safe-area insets); installable as a PWA.

## Where data lives

| Data | Storage |
| --- | --- |
| Owned / wishlist marks, notes, card metadata + prices | `localStorage` |
| Photos of your own cards | `IndexedDB` |
| Pokédex base data + card search results | `localStorage` / `sessionStorage` cache |

Clearing your browser data (or "Clear collection" in Settings) resets everything.

## Develop

```bash
npm install
npm run build      # transpiles src/*.jsx → dist/app.js + copies static assets
npm run preview    # build, then serve dist/ at http://localhost:5173
```

There is **no runtime Babel** — JSX is transpiled ahead of time with esbuild into a
single classic script, and React is loaded from vendored production builds
(`src/vendor/`). The output in `dist/` is plain static files.

## Deploy to GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`. To publish:

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source: GitHub Actions**.
3. Every push to `main` builds `dist/` and deploys it.

The site uses only relative asset paths, so it works under a project sub-path
(e.g. `https://<user>.github.io/oliver-pokedex/`) with no extra configuration.

## Project layout

```
src/
  index.html        entry — loads vendored React + the built app.js
  styles.css        global styles & keyframes
  pokedata.jsx      Pokédex data (PokeAPI), type colors, generations
  tcgapi.jsx        TCG card search + Cardmarket price extraction
  store.jsx         collection state (localStorage + IndexedDB) + stats
  settings.jsx      user settings (localStorage) + settings sheet
  ui.jsx            icons, status meta, price formatting
  ios-frame.jsx     responsive shell (device mockup vs full-screen)
  grid.jsx          stats header, filters, dex slots
  detail.jsx        card detail sheet (assign / price / owned details)
  app.jsx           root: loading, filtering, layout
  vendor/           pinned React production UMD builds
build.mjs           esbuild build → dist/
```

Data and images: [PokeAPI](https://pokeapi.co) · [Pokémon TCG API](https://pokemontcg.io).
This is a personal, non-commercial fan project; Pokémon and Cardmarket are trademarks of their respective owners.
