// lib/stats.ts — collection status + value helpers (pure).

import type { Collection, Entry, Mon, Stats, Status } from '@/lib/types';

// A picked card is "empty" (tba) until the user explicitly marks it owned or
// wishlist — picking a card alone never puts it on the wishlist.
export function statusOf(entry?: Entry | null): Status {
  if (!entry || !entry.card) return 'tba';
  if (entry.owned) return 'owned';
  if (entry.want) return 'want';
  return 'tba';
}

// Best price estimate for an entry: a manually-entered value wins, otherwise the
// Cardmarket trend price saved with the card.
export function entryValue(entry?: Entry | null): number {
  if (!entry || !entry.card) return 0;
  const manual = Number(entry.value);
  if (manual > 0) return manual;
  return Number(entry.card.price) || 0;
}

// Aggregate stats. `value` = estimated worth of what you own, `wishValue` =
// estimated cost of the wishlist — both from saved Cardmarket prices.
export function computeStats(mons: Mon[], coll: Collection): Stats {
  let owned = 0;
  let want = 0;
  let value = 0;
  let wishValue = 0;
  for (const m of mons) {
    const e = coll[m.id];
    const s = statusOf(e);
    if (s === 'owned') {
      owned++;
      value += entryValue(e);
    } else if (s === 'want') {
      want++;
      wishValue += entryValue(e);
    }
  }
  const total = mons.length;
  return { owned, want, value, wishValue, total, missing: total - owned, pct: total ? owned / total : 0 };
}
