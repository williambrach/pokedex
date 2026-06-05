// ui.jsx — shared UI primitives, icons, status meta, and formatting helpers.

// ---- icons (stroke = currentColor) -----------------------------------------
const Icon = {
  check: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  star: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} {...p}><path d="M12 3l2.7 5.5 6 .9-4.4 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9L12 3z" fill="currentColor"/></svg>,
  bookmark: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  dots: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} {...p}><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  camera: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M3 8a2 2 0 012-2h2l1.2-1.8A1 1 0 019 4h6a1 1 0 01.8.4L17 6h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="2"/></svg>,
  close: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>,
  trash: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevron: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  back: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  swap: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M7 4L3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sliders: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="6" r="2.4" fill="currentColor"/><circle cx="15" cy="12" r="2.4" fill="currentColor"/><circle cx="8" cy="18" r="2.4" fill="currentColor"/></svg>,
  ext: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M14 4h6v6M20 4l-9 9M18 13v5a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cart: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M3 4h2l2.4 12.2a1 1 0 001 .8h9.2a1 1 0 001-.8L21 8H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9.5" cy="20" r="1.5" fill="currentColor"/><circle cx="17.5" cy="20" r="1.5" fill="currentColor"/></svg>,
  cog: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2"/><path d="M19.4 13.5a1 1 0 00.2 1.1l.1.1a1.4 1.4 0 11-2 2l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V18a1.4 1.4 0 11-2.8 0v-.1a1 1 0 00-.7-.9 1 1 0 00-1.1.2l-.1.1a1.4 1.4 0 11-2-2l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H6a1.4 1.4 0 110-2.8h.1a1 1 0 00.9-.7 1 1 0 00-.2-1.1l-.1-.1a1.4 1.4 0 112-2l.1.1a1 1 0 001.1.2H10a1 1 0 00.6-.9V6a1.4 1.4 0 112.8 0v.1a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a1.4 1.4 0 112 2l-.1.1a1 1 0 00-.2 1.1V10a1 1 0 00.9.6h.1a1.4 1.4 0 110 2.8H18a1 1 0 00-.9.6z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  tag: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><path d="M3.5 12.5l8-8 8.5.5.5 8.5-8 8a1.5 1.5 0 01-2.1 0l-6.9-6.9a1.5 1.5 0 010-2.1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor"/></svg>,
  info: (p) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7.7" r="1.2" fill="currentColor"/></svg>,
};

// ---- status meta ------------------------------------------------------------
const STATUS = {
  owned: { label: 'Owned',    c: '#2f9e57', bg: 'rgba(47,158,87,.12)' },
  want:  { label: 'Wishlist', c: '#e0922f', bg: 'rgba(224,146,47,.14)' },
  tba:   { label: 'Empty',    c: '#9aa0a6', bg: 'rgba(154,160,166,.14)' },
};

// ---- price formatting (EUR) -------------------------------------------------
// Compact euro formatter — no decimals for big totals, 2 for single cards.
function formatEuro(value, { decimals } = {}) {
  const n = Number(value) || 0;
  const d = decimals != null ? decimals : (n >= 100 ? 0 : 2);
  return '€' + n.toLocaleString('en-IE', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// type badge ------------------------------------------------------------------
function TypeBadge({ type, size = 'sm' }) {
  const t = POKE_TYPES[type] || POKE_TYPES.normal;
  const pad = size === 'sm' ? '2px 8px' : '3px 11px';
  const fs = size === 'sm' ? 10.5 : 12;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', background: t.c, color: '#fff',
      padding: pad, borderRadius: 999, fontSize: fs, fontWeight: 700,
      letterSpacing: .2, textShadow: '0 1px 1px rgba(0,0,0,.18)', lineHeight: 1.2,
    }}>{t.name}</span>
  );
}

// status pill -----------------------------------------------------------------
function StatusPill({ status, withIcon = true }) {
  const s = STATUS[status];
  const Ico = status === 'owned' ? Icon.check : status === 'want' ? Icon.bookmark : null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, color: s.c, background: s.bg,
      padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, lineHeight: 1,
    }}>
      {withIcon && Ico && <Ico s={12} />}
      {s.label}
    </span>
  );
}

// mix two type colors for a soft gradient
function typeGradient(types) {
  const cols = (types || ['normal']).slice(0, 2).map(t => (POKE_TYPES[t] || POKE_TYPES.normal).c);
  if (cols.length === 1) cols.push(cols[0]);
  return cols;
}

Object.assign(window, { Icon, STATUS, TypeBadge, StatusPill, typeGradient, formatEuro });
