// lib/format.ts — price formatting (EUR).

// Compact euro formatter — no decimals for big totals, 2 for single cards.
export function formatEuro(value: number, opts: { decimals?: number } = {}): string {
  const n = Number(value) || 0;
  const d = opts.decimals != null ? opts.decimals : n >= 100 ? 0 : 2;
  return '€' + n.toLocaleString('en-IE', { minimumFractionDigits: d, maximumFractionDigits: d });
}
