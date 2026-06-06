// app/api/cards/route.ts — cached proxy for Pokémon TCG card search. Keeps the
// upstream API key-free request server-side and caches results per name.
import { NextResponse } from 'next/server';
import { slimCard, type RawTcgCard } from '@/lib/tcg';

// NOTE: this handler reads request searchParams, so it runs dynamically and the
// full-route cache does not apply — caching comes from the inner fetch's
// `next.revalidate` (per-name, 1 day), which is what we rely on here.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get('name') || '').trim().toLowerCase();
  if (!name) return NextResponse.json([]);

  const url =
    'https://api.pokemontcg.io/v2/cards?q=name:"' +
    encodeURIComponent(name) +
    '"&pageSize=60&orderBy=-set.releaseDate';

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache per name, 1 day
    if (!res.ok) throw new Error('tcg ' + res.status);
    const j = await res.json();
    const cards = ((j.data as RawTcgCard[]) || []).map(slimCard).filter((c) => c.img);
    return NextResponse.json(cards);
  } catch {
    return NextResponse.json({ error: 'failed to load cards' }, { status: 502 });
  }
}
