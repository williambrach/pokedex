// app/api/pokedex/route.ts — server-side Pokédex loader. Fetches the 1025
// Pokémon (names + types) from PokeAPI once and caches it for everyone, instead
// of every visitor hammering PokeAPI from the browser.
import { NextResponse } from 'next/server';
import { POKE_TYPES, prettyName } from '@/lib/pokedata';
import type { Mon } from '@/lib/types';

export const revalidate = 604800; // 7 days

const POKEAPI = 'https://pokeapi.co/api/v2';
const idFromUrl = (url: string): number => parseInt(url.split('/').filter(Boolean).pop() || '0', 10);

async function buildPokedex(): Promise<Mon[]> {
  const listRes = await fetch(`${POKEAPI}/pokemon?limit=1025&offset=0`, { next: { revalidate } });
  if (!listRes.ok) throw new Error('pokeapi list ' + listRes.status);
  const list = await listRes.json();

  const mons: Mon[] = (list.results as { name: string; url: string }[])
    .map((r) => ({ id: idFromUrl(r.url), slug: r.name, name: prettyName(r.name), types: [] as string[] }))
    .filter((m) => m.id <= 1025)
    .sort((a, b) => a.id - b.id);

  const byId: Record<number, Mon> = {};
  mons.forEach((m) => {
    byId[m.id] = m;
  });

  // 18 type endpoints map ids → types (efficient: ~18 calls vs 1025).
  await Promise.all(
    Object.keys(POKE_TYPES).map(async (t) => {
      try {
        const r = await fetch(`${POKEAPI}/type/${t}`, { next: { revalidate } });
        const j = await r.json();
        (j.pokemon as { pokemon: { url: string } }[]).forEach((entry) => {
          const id = idFromUrl(entry.pokemon.url);
          if (byId[id]) byId[id].types.push(t);
        });
      } catch {
        /* skip a failed type endpoint */
      }
    })
  );

  mons.forEach((m) => {
    if (m.types.length === 0) m.types = ['normal'];
  });
  return mons;
}

export async function GET() {
  try {
    const mons = await buildPokedex();
    return NextResponse.json(mons);
  } catch {
    return NextResponse.json({ error: 'failed to load pokedex' }, { status: 502 });
  }
}
