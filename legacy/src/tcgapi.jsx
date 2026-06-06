// tcgapi.jsx — Pokémon TCG card search (api.pokemontcg.io).
// The same API returns Cardmarket prices (EUR) and a direct product URL, so we
// persist them with each assigned card — no scraping, no key needed.
// Cached in-memory + sessionStorage.

const TCG_BASE = 'https://api.pokemontcg.io/v2/cards';
const _tcgMem = {}; // query -> results array

// Round to cents, treating 0 / missing as null.
const _eur = (v) => (typeof v === 'number' && v > 0 ? Math.round(v * 100) / 100 : null);

// First positive price among the given fields (handles 0 / missing).
const _pick = (p, ...keys) => { for (const k of keys) { const v = _eur(p[k]); if (v != null) return v; } return null; };

// Minimal card shape we persist when a user assigns a card.
function slimCard(c) {
  const cm = c.cardmarket || {};
  const p = cm.prices || {};
  // Many cards (esp. commons/uncommons in modern sets) only carry reverse-holo
  // Cardmarket prices — fall back through those too so every card gets a value.
  const trend = _pick(p, 'trendPrice', 'reverseHoloTrend', 'averageSellPrice', 'reverseHoloSell',
    'avg30', 'reverseHoloAvg30', 'avg7', 'avg1', 'lowPrice', 'reverseHoloLow', 'lowPriceExPlus', 'suggestedPrice');
  return {
    id: c.id,
    name: c.name,
    number: c.number,
    rarity: c.rarity || null,
    img: (c.images && c.images.large) || (c.images && c.images.small) || null,
    imgSmall: (c.images && c.images.small) || null,
    setName: c.set ? c.set.name : '',
    setSeries: c.set ? c.set.series : '',
    setId: c.set ? c.set.id : '',
    setTotal: c.set ? c.set.printedTotal || c.set.total : null,
    released: c.set ? c.set.releaseDate : '',
    setLogo: c.set && c.set.images ? c.set.images.logo : null,
    // Cardmarket (EUR) — straight from the API, no scraping
    price: trend,                            // headline estimate (trend)
    priceTrend: _pick(p, 'trendPrice', 'reverseHoloTrend'),
    priceAvg: _pick(p, 'avg30', 'reverseHoloAvg30', 'averageSellPrice', 'reverseHoloSell'),
    priceLow: _pick(p, 'lowPrice', 'reverseHoloLow', 'lowPriceExPlus'),
    priceUpdated: cm.updatedAt || null,
    cmUrl: cm.url || null,                   // direct product page
  };
}

// Search cards for a Pokémon name. Returns slim cards, newest sets first.
async function searchCards(term, { signal } = {}) {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  if (_tcgMem[q]) return _tcgMem[q];
  try {
    const sess = sessionStorage.getItem('tcg_' + q);
    if (sess) { _tcgMem[q] = JSON.parse(sess); return _tcgMem[q]; }
  } catch (e) {}

  const url = `${TCG_BASE}?q=name:"${encodeURIComponent(q)}"&pageSize=60&orderBy=-set.releaseDate`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('TCG ' + res.status);
  const j = await res.json();
  let cards = (j.data || []).map(slimCard).filter(c => c.img);

  _tcgMem[q] = cards;
  try { sessionStorage.setItem('tcg_' + q, JSON.stringify(cards.slice(0, 40))); } catch (e) {}
  return cards;
}

Object.assign(window, { searchCards, slimCard });
