// pokedata.jsx — Pokédex base data: load 1025 Pokémon (names + types) from PokeAPI,
// cache in localStorage. Plus type colors, generation ranges, sprite URLs, name helpers.

const POKE_TYPES = {
  normal:   { name: 'Normal',   c: '#9099a1' },
  fire:     { name: 'Fire',     c: '#ff9d55' },
  water:    { name: 'Water',    c: '#4d90d5' },
  electric: { name: 'Electric', c: '#f4d23c' },
  grass:    { name: 'Grass',    c: '#63bc5a' },
  ice:      { name: 'Ice',      c: '#73cec0' },
  fighting: { name: 'Fighting', c: '#ce4069' },
  poison:   { name: 'Poison',   c: '#ab6ac8' },
  ground:   { name: 'Ground',   c: '#d97746' },
  flying:   { name: 'Flying',   c: '#8fa8dd' },
  psychic:  { name: 'Psychic',  c: '#fa7179' },
  bug:      { name: 'Bug',      c: '#90c12c' },
  rock:     { name: 'Rock',     c: '#c7b78b' },
  ghost:    { name: 'Ghost',    c: '#5269ad' },
  dragon:   { name: 'Dragon',   c: '#0b6dc3' },
  dark:     { name: 'Dark',     c: '#5a5366' },
  steel:    { name: 'Steel',    c: '#5a8ea1' },
  fairy:    { name: 'Fairy',    c: '#ec8fe6' },
};

// National-dex generation boundaries (region names are the standard English ones)
const GENERATIONS = [
  { gen: 1, region: 'Kanto',  start: 1,    end: 151  },
  { gen: 2, region: 'Johto',  start: 152,  end: 251  },
  { gen: 3, region: 'Hoenn',  start: 252,  end: 386  },
  { gen: 4, region: 'Sinnoh', start: 387,  end: 493  },
  { gen: 5, region: 'Unova',  start: 494,  end: 649  },
  { gen: 6, region: 'Kalos',  start: 650,  end: 721  },
  { gen: 7, region: 'Alola',  start: 722,  end: 809  },
  { gen: 8, region: 'Galar',  start: 810,  end: 905  },
  { gen: 9, region: 'Paldea', start: 906,  end: 1025 },
];

function genOf(id) {
  const g = GENERATIONS.find(g => id >= g.start && id <= g.end);
  return g ? g.gen : 9;
}

// jsdelivr mirror of PokeAPI/sprites — reliable and CDN-cached
const SPRITE = {
  art:   (id) => `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${id}.png`,
  home:  (id) => `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/home/${id}.png`,
  pixel: (id) => `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/${id}.png`,
};

// Pretty display name from the API slug
function prettyName(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    // common form abbreviations
    .replace(/\bMr Mime\b/i, 'Mr. Mime')
    .replace(/\bMime Jr\b/i, 'Mime Jr.')
    .replace(/\bf$/i, '♀')
    .replace(/\bm$/i, '♂');
}

// Build a sensible TCG search term from the slug (the TCG DB names Pokémon a bit differently)
function tcgQueryName(slug) {
  let base = slug
    .replace(/-f$/, '')     // nidoran-f → nidoran
    .replace(/-m$/, '')
    .replace(/-mime$/, ' mime')
    .replace(/-/g, ' ')
    .split(' ')[0];          // take the species root for the widest match
  return base;
}

const POKE_CACHE_KEY = 'pokedex_base_v1';

// Load all 1025 Pokémon (id, name, types). Cached in localStorage.
async function loadPokedex(onProgress) {
  // 1. cache hit?
  try {
    const cached = JSON.parse(localStorage.getItem(POKE_CACHE_KEY) || 'null');
    if (cached && cached.length >= 1000) {
      onProgress && onProgress(1);
      return cached;
    }
  } catch (e) {}

  // 2. names + ids
  onProgress && onProgress(0.05);
  const listRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0');
  const list = await listRes.json();
  const idFromUrl = (url) => parseInt(url.split('/').filter(Boolean).pop(), 10);
  const mons = list.results.map(r => ({
    id: idFromUrl(r.url),
    slug: r.name,
    name: prettyName(r.name),
    types: [],
  })).filter(m => m.id <= 1025).sort((a, b) => a.id - b.id);
  const byId = {};
  mons.forEach(m => { byId[m.id] = m; });

  // 3. types — 18 type endpoints map ids → types (efficient: ~18 calls vs 1025)
  const typeNames = Object.keys(POKE_TYPES);
  let done = 0;
  await Promise.all(typeNames.map(async (t) => {
    try {
      const r = await fetch('https://pokeapi.co/api/v2/type/' + t);
      const j = await r.json();
      j.pokemon.forEach(entry => {
        const id = idFromUrl(entry.pokemon.url);
        if (byId[id]) byId[id].types.push(t);
      });
    } catch (e) {}
    done++;
    onProgress && onProgress(0.1 + 0.85 * (done / typeNames.length));
  }));

  mons.forEach(m => { if (m.types.length === 0) m.types = ['normal']; });

  try { localStorage.setItem(POKE_CACHE_KEY, JSON.stringify(mons)); } catch (e) {}
  onProgress && onProgress(1);
  return mons;
}

Object.assign(window, {
  POKE_TYPES, GENERATIONS, genOf, SPRITE, prettyName, tcgQueryName, loadPokedex,
});
