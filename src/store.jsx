// store.jsx — collection state. Lightweight metadata in localStorage,
// user card photos in IndexedDB (blobs, too big for localStorage).
// Everything lives in the browser — no backend.

const COLL_KEY = 'pokedex_collection_v1';

// ---- IndexedDB photo store --------------------------------------------------
const PHOTO_DB = 'pokedex_photos';
let _dbP = null;
function openPhotoDB() {
  if (_dbP) return _dbP;
  _dbP = new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('photos');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbP;
}
async function savePhoto(id, blob) {
  const db = await openPhotoDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(blob, id);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
async function loadPhoto(id) {
  const db = await openPhotoDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('photos', 'readonly');
    const r = tx.objectStore('photos').get(id);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
}
async function deletePhoto(id) {
  const db = await openPhotoDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').delete(id);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
async function clearPhotos() {
  const db = await openPhotoDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').clear();
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}

// ---- collection hook --------------------------------------------------------
// A picked card is "empty" (tba) until the user explicitly marks it owned or
// wishlist — picking a card alone never puts it on the wishlist.
function statusOf(entry) {
  if (!entry || !entry.card) return 'tba';
  if (entry.owned) return 'owned';
  if (entry.want) return 'want';
  return 'tba';
}

// Best price estimate for an entry: a manually-entered value wins, otherwise the
// Cardmarket trend price saved with the card.
function entryValue(entry) {
  if (!entry || !entry.card) return 0;
  const manual = Number(entry.value);
  if (manual > 0) return manual;
  return Number(entry.card.price) || 0;
}

function useCollection() {
  const [coll, setColl] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(COLL_KEY) || '{}'); } catch (e) { return {}; }
  });
  const collRef = React.useRef(coll);
  collRef.current = coll;

  const persist = React.useCallback((next) => {
    setColl(next);
    try { localStorage.setItem(COLL_KEY, JSON.stringify(next)); } catch (e) {}
  }, []);

  const update = React.useCallback((id, patch) => {
    const cur = collRef.current[id] || {};
    const merged = { ...cur, ...patch, updatedAt: Date.now() };
    // prune empty entry
    const isEmpty = !merged.card && !merged.owned && !merged.want && !merged.note &&
      !merged.value && !merged.hasPhoto;
    const next = { ...collRef.current };
    if (isEmpty) delete next[id]; else next[id] = merged;
    persist(next);
    return merged;
  }, [persist]);

  const reset = React.useCallback(() => { persist({}); clearPhotos().catch(() => {}); }, [persist]);

  return { coll, update, reset };
}

// Aggregate stats. `value` = estimated worth of what you own, `wishValue` =
// estimated cost of the wishlist — both from saved Cardmarket prices.
function computeStats(mons, coll) {
  let owned = 0, want = 0, value = 0, wishValue = 0;
  for (const m of mons) {
    const e = coll[m.id];
    const s = statusOf(e);
    if (s === 'owned') { owned++; value += entryValue(e); }
    else if (s === 'want') { want++; wishValue += entryValue(e); }
  }
  const total = mons.length;
  return { owned, want, value, wishValue, total, missing: total - owned, pct: total ? owned / total : 0 };
}

Object.assign(window, {
  useCollection, statusOf, entryValue, computeStats,
  savePhoto, loadPhoto, deletePhoto, clearPhotos,
});
