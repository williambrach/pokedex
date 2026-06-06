// lib/tcg.ts — Pokémon TCG card data.
//   slimCard()    — pure: trims a raw api.pokemontcg.io card to what we persist.
//                   Used server-side by /api/cards.
//   searchCards() — client: queries our cached /api/cards proxy, memoizes in
//                   sessionStorage.

import type { Card } from '@/lib/types';

// Round to cents, treating 0 / missing as null.
const eur = (v: unknown): number | null =>
  typeof v === 'number' && v > 0 ? Math.round(v * 100) / 100 : null;

// First positive price among the given fields (handles 0 / missing).
function pick(p: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = eur(p[k]);
    if (v != null) return v;
  }
  return null;
}

// Raw shape from api.pokemontcg.io (only the fields we read).
export interface RawTcgCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images?: { small?: string; large?: string };
  set?: {
    name?: string;
    series?: string;
    id?: string;
    printedTotal?: number;
    total?: number;
    releaseDate?: string;
    images?: { logo?: string };
  };
  cardmarket?: { url?: string; updatedAt?: string; prices?: Record<string, number> };
}

export function slimCard(c: RawTcgCard): Card {
  const cm = c.cardmarket || {};
  const p = cm.prices || {};
  // Many cards (esp. commons/uncommons in modern sets) only carry reverse-holo
  // Cardmarket prices — fall back through those too so every card gets a value.
  const trend = pick(
    p,
    'trendPrice',
    'reverseHoloTrend',
    'averageSellPrice',
    'reverseHoloSell',
    'avg30',
    'reverseHoloAvg30',
    'avg7',
    'avg1',
    'lowPrice',
    'reverseHoloLow',
    'lowPriceExPlus',
    'suggestedPrice'
  );
  return {
    id: c.id,
    name: c.name,
    number: c.number,
    rarity: c.rarity || null,
    img: (c.images && (c.images.large || c.images.small)) || '',
    imgSmall: (c.images && c.images.small) || null,
    setName: c.set?.name || '',
    setSeries: c.set?.series || '',
    setId: c.set?.id || '',
    setTotal: c.set ? c.set.printedTotal ?? c.set.total ?? null : null,
    released: c.set?.releaseDate || '',
    setLogo: c.set?.images?.logo || null,
    price: trend,
    priceTrend: pick(p, 'trendPrice', 'reverseHoloTrend'),
    priceAvg: pick(p, 'avg30', 'reverseHoloAvg30', 'averageSellPrice', 'reverseHoloSell'),
    priceLow: pick(p, 'lowPrice', 'reverseHoloLow', 'lowPriceExPlus'),
    priceUpdated: cm.updatedAt || null,
    cmUrl: cm.url || null,
  };
}

const tcgMem: Record<string, Card[]> = {}; // query -> results array
// Versioned so a Card-shape change invalidates stale sessionStorage entries.
const SESS_PREFIX = 'tcg_v2_';

// Search cards for a Pokémon name via our cached proxy. Newest sets first.
export async function searchCards(term: string): Promise<Card[]> {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  if (tcgMem[q]) return tcgMem[q];
  try {
    const sess = sessionStorage.getItem(SESS_PREFIX + q);
    if (sess) {
      tcgMem[q] = JSON.parse(sess);
      return tcgMem[q];
    }
  } catch {
    /* ignore */
  }

  const res = await fetch('/api/cards?name=' + encodeURIComponent(q));
  if (!res.ok) throw new Error('TCG ' + res.status);
  const cards: Card[] = await res.json();

  tcgMem[q] = cards;
  try {
    // Persist the full result set so a reload returns the same count as the
    // in-memory cache (avoids a 40-vs-60 discrepancy).
    sessionStorage.setItem(SESS_PREFIX + q, JSON.stringify(cards));
  } catch {
    /* ignore — sessionStorage full or unavailable */
  }
  return cards;
}
