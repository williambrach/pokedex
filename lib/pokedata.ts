// lib/pokedata.ts — Pokédex base data: type colors, generation ranges, sprite
// URLs, name helpers, and the client-side pokedex loader (fetches our cached
// /api/pokedex route, then memoizes in localStorage).

import type { Mon } from '@/lib/types';

export const POKE_TYPES: Record<string, { name: string; c: string }> = {
  normal: { name: 'Normal', c: '#9099a1' },
  fire: { name: 'Fire', c: '#ff9d55' },
  water: { name: 'Water', c: '#4d90d5' },
  electric: { name: 'Electric', c: '#f4d23c' },
  grass: { name: 'Grass', c: '#63bc5a' },
  ice: { name: 'Ice', c: '#73cec0' },
  fighting: { name: 'Fighting', c: '#ce4069' },
  poison: { name: 'Poison', c: '#ab6ac8' },
  ground: { name: 'Ground', c: '#d97746' },
  flying: { name: 'Flying', c: '#8fa8dd' },
  psychic: { name: 'Psychic', c: '#fa7179' },
  bug: { name: 'Bug', c: '#90c12c' },
  rock: { name: 'Rock', c: '#c7b78b' },
  ghost: { name: 'Ghost', c: '#5269ad' },
  dragon: { name: 'Dragon', c: '#0b6dc3' },
  dark: { name: 'Dark', c: '#5a5366' },
  steel: { name: 'Steel', c: '#5a8ea1' },
  fairy: { name: 'Fairy', c: '#ec8fe6' },
};

// National-dex generation boundaries (standard English region names).
export const GENERATIONS = [
  { gen: 1, region: 'Kanto', start: 1, end: 151 },
  { gen: 2, region: 'Johto', start: 152, end: 251 },
  { gen: 3, region: 'Hoenn', start: 252, end: 386 },
  { gen: 4, region: 'Sinnoh', start: 387, end: 493 },
  { gen: 5, region: 'Unova', start: 494, end: 649 },
  { gen: 6, region: 'Kalos', start: 650, end: 721 },
  { gen: 7, region: 'Alola', start: 722, end: 809 },
  { gen: 8, region: 'Galar', start: 810, end: 905 },
  { gen: 9, region: 'Paldea', start: 906, end: 1025 },
];

export function genOf(id: number): number {
  const g = GENERATIONS.find((g) => id >= g.start && id <= g.end);
  return g ? g.gen : 9;
}

// jsdelivr mirror of PokeAPI/sprites — reliable and CDN-cached.
export const SPRITE = {
  art: (id: number) =>
    `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${id}.png`,
  home: (id: number) =>
    `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/home/${id}.png`,
  pixel: (id: number) =>
    `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/${id}.png`,
};

// Pretty display name from the API slug.
export function prettyName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\bMr Mime\b/i, 'Mr. Mime')
    .replace(/\bMime Jr\b/i, 'Mime Jr.')
    .replace(/\bf$/i, '♀')
    .replace(/\bm$/i, '♂');
}

// Build a sensible TCG search term from the slug (the TCG DB names Pokémon a bit
// differently).
export function tcgQueryName(slug: string): string {
  const base = slug
    .replace(/-f$/, '')
    .replace(/-m$/, '')
    .replace(/-mime$/, ' mime')
    .replace(/-/g, ' ')
    .split(' ')[0];
  return base;
}

const POKE_CACHE_KEY = 'pokedex_base_v1';

// Load all 1025 Pokémon (id, name, types) from our cached API route. Memoized in
// localStorage so repeat loads are instant.
export async function loadPokedex(onProgress?: (n: number) => void): Promise<Mon[]> {
  try {
    const cached = JSON.parse(localStorage.getItem(POKE_CACHE_KEY) || 'null');
    if (cached && Array.isArray(cached) && cached.length >= 1000) {
      onProgress?.(1);
      return cached;
    }
  } catch {
    /* ignore */
  }

  onProgress?.(0.1);
  const res = await fetch('/api/pokedex');
  if (!res.ok) throw new Error('pokedex ' + res.status);
  const mons: Mon[] = await res.json();
  onProgress?.(0.9);

  try {
    localStorage.setItem(POKE_CACHE_KEY, JSON.stringify(mons));
  } catch {
    /* ignore */
  }
  onProgress?.(1);
  return mons;
}
