// lib/types.ts — shared domain types for the Pokédex app.

export interface Mon {
  id: number;
  slug: string;
  name: string;
  types: string[]; // type slugs, e.g. ['fire', 'flying']
}

// Slim card shape persisted when a user assigns a card. Mirrors slimCard() in
// lib/tcg.ts. `img` is always a non-empty URL (cards without art are filtered
// out before they reach the client).
export interface Card {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  img: string;
  imgSmall: string | null;
  setName: string;
  setSeries: string;
  setId: string;
  setTotal: number | null;
  released: string;
  setLogo: string | null;
  // Cardmarket (EUR), straight from the API
  price: number | null;
  priceTrend: number | null;
  priceAvg: number | null;
  priceLow: number | null;
  priceUpdated: string | null;
  cmUrl: string | null;
}

export type Status = 'owned' | 'want' | 'tba';

// A collection entry. A picked card is "empty" (tba) until explicitly marked
// owned or want.
export interface Entry {
  card?: Card | null;
  owned?: boolean;
  want?: boolean;
  note?: string;
  value?: string; // raw user-typed EUR amount, dot-normalised
  condition?: string;
  variant?: string;
  hasPhoto?: boolean;
  photoPath?: string | null; // Supabase Storage object path
  updatedAt?: number;
}

export type Collection = Record<number, Entry>;

export interface Stats {
  owned: number;
  want: number;
  value: number;
  wishValue: number;
  total: number;
  missing: number;
  pct: number;
}

export type CardStyle = 'album' | 'retro' | 'playful';

export interface Settings {
  cardStyle: CardStyle;
  typeColors: boolean;
  columns: number;
}
