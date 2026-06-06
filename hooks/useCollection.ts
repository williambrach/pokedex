'use client';
// hooks/useCollection.ts — the user's collection, backed by Supabase with a
// localStorage cache for instant paint and offline reads. Card photos live in a
// private Supabase Storage bucket; we hand back short-lived signed URLs.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Collection, Entry } from '@/lib/types';

const CACHE_KEY = 'pokedex_collection_cache_v2';
const PHOTO_BUCKET = 'card-photos';
const SYNC_DEBOUNCE_MS = 350;
const PHOTO_TTL_S = 28800; // 8h signed-URL lifetime — covers a long session
const LIST_PAGE = 100; // Supabase storage list() max page size

interface Row {
  pokemon_id: number;
  card: Entry['card'];
  owned: boolean;
  want: boolean;
  note: string | null;
  value: string | null;
  condition: string | null;
  variant: string | null;
  photo_path: string | null;
  updated_at: string;
}

function rowToEntry(r: Row): Entry {
  return {
    card: r.card ?? null,
    owned: !!r.owned,
    want: !!r.want,
    note: r.note ?? '',
    value: r.value ?? '',
    condition: r.condition ?? '',
    variant: r.variant ?? '',
    hasPhoto: !!r.photo_path,
    photoPath: r.photo_path ?? null,
    updatedAt: Date.parse(r.updated_at) || Date.now(),
  };
}

// Mirrors the original prune rule: a card pick alone is enough to keep a row,
// but a truly empty entry is dropped.
function isEmptyEntry(e: Entry): boolean {
  return !e.card && !e.owned && !e.want && !e.note && !e.value && !e.hasPhoto;
}

export interface UseCollection {
  coll: Collection;
  loading: boolean;
  update: (id: number, patch: Partial<Entry>) => Entry;
  reset: () => Promise<void>;
  savePhoto: (id: number, file: File) => Promise<void>;
  loadPhoto: (id: number) => Promise<string | null>;
  deletePhoto: (id: number) => Promise<void>;
}

export function useCollection(): UseCollection {
  const [supabase] = useState(() => createClient());

  const [coll, setColl] = useState<Collection>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(true);

  const collRef = useRef<Collection>(coll);
  collRef.current = coll;
  const uidRef = useRef<string | null>(null);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const persistCache = useCallback((next: Collection) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  // Resolve the signed-in user id, lazily fetching it if the initial load
  // effect hasn't populated it yet (avoids photo/reset no-ops in that window).
  const ensureUid = useCallback(async (): Promise<string | null> => {
    if (uidRef.current) return uidRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uidRef.current = user?.id ?? null;
    return uidRef.current;
  }, [supabase]);

  // Push one entry to Supabase (upsert) or delete it if pruned.
  const syncRow = useCallback(
    async (id: number) => {
      const uid = await ensureUid();
      if (!uid) return;
      const entry = collRef.current[id];
      if (!entry || isEmptyEntry(entry)) {
        const { error } = await supabase.from('collection').delete().eq('user_id', uid).eq('pokemon_id', id);
        if (error) console.error('collection delete', error);
        return;
      }
      const row = {
        user_id: uid,
        pokemon_id: id,
        card: entry.card ?? null,
        owned: !!entry.owned,
        want: !!entry.want,
        note: entry.note || null,
        value: entry.value || null,
        condition: entry.condition || null,
        variant: entry.variant || null,
        photo_path: entry.photoPath ?? null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('collection').upsert(row);
      if (error) console.error('collection upsert', error);
    },
    [ensureUid, supabase]
  );

  const update = useCallback(
    (id: number, patch: Partial<Entry>): Entry => {
      const cur = collRef.current[id] || {};
      const merged: Entry = { ...cur, ...patch, updatedAt: Date.now() };
      const next = { ...collRef.current };
      if (isEmptyEntry(merged)) delete next[id];
      else next[id] = merged;
      collRef.current = next;
      setColl(next);
      persistCache(next);

      if (timers.current[id]) clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => {
        delete timers.current[id];
        void syncRow(id);
      }, SYNC_DEBOUNCE_MS);
      return merged;
    },
    [persistCache, syncRow]
  );

  // Initial load: resolve the user, pull their rows, and reconcile — preserving
  // any local edits that were made (and not yet synced) before this resolved.
  useEffect(() => {
    let active = true;
    (async () => {
      const uid = await ensureUid();
      if (!uid) {
        if (active) setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('collection').select('*');
      if (!active) return;
      if (!error && data) {
        const merged: Collection = {};
        (data as Row[]).forEach((r) => {
          merged[r.pokemon_id] = rowToEntry(r);
        });
        // An id with a pending sync timer is an unsynced local edit — keep it.
        for (const key of Object.keys(collRef.current)) {
          const id = Number(key);
          if (timers.current[id]) merged[id] = collRef.current[id];
        }
        setColl(merged);
        collRef.current = merged;
        persistCache(merged);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [ensureUid, supabase, persistCache]);

  // On unmount, flush any pending debounced edits so they aren't lost.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      Object.keys(pending).forEach((k) => {
        const id = Number(k);
        clearTimeout(pending[id]);
        void syncRow(id);
      });
    };
  }, [syncRow]);

  const reset = useCallback(async () => {
    // Capture which cards have photos before we wipe local state.
    const photoIds = Object.entries(collRef.current)
      .filter(([, e]) => e.hasPhoto)
      .map(([id]) => id);

    setColl({});
    collRef.current = {};
    persistCache({});

    const uid = await ensureUid();
    if (!uid) return;
    await supabase.from('collection').delete().eq('user_id', uid);

    // Remove known photo paths, plus page through the bucket as a backstop so
    // collections with >100 photos don't leak orphaned objects.
    const toRemove = new Set(photoIds.map((id) => `${uid}/${id}`));
    try {
      let offset = 0;
      for (;;) {
        const { data } = await supabase.storage.from(PHOTO_BUCKET).list(uid, { limit: LIST_PAGE, offset });
        if (!data || data.length === 0) break;
        data.forEach((f) => toRemove.add(`${uid}/${f.name}`));
        if (data.length < LIST_PAGE) break;
        offset += LIST_PAGE;
      }
    } catch {
      /* fall back to the known paths below */
    }
    if (toRemove.size) {
      try {
        await supabase.storage.from(PHOTO_BUCKET).remove([...toRemove]);
      } catch {
        /* ignore storage cleanup errors */
      }
    }
  }, [ensureUid, supabase, persistCache]);

  const savePhoto = useCallback(
    async (id: number, file: File) => {
      const uid = await ensureUid();
      if (!uid) return;
      const path = `${uid}/${id}`;
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      update(id, { hasPhoto: true, photoPath: path });
    },
    [ensureUid, supabase, update]
  );

  const loadPhoto = useCallback(
    async (id: number): Promise<string | null> => {
      const entry = collRef.current[id];
      if (!entry?.hasPhoto) return null;
      const uid = await ensureUid();
      const path = entry.photoPath || `${uid}/${id}`;
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, PHOTO_TTL_S);
      if (error || !data) return null;
      return data.signedUrl;
    },
    [ensureUid, supabase]
  );

  const deletePhoto = useCallback(
    async (id: number) => {
      const uid = await ensureUid();
      if (!uid) return;
      await supabase.storage.from(PHOTO_BUCKET).remove([`${uid}/${id}`]);
      update(id, { hasPhoto: false, photoPath: null });
    },
    [ensureUid, supabase, update]
  );

  return { coll, loading, update, reset, savePhoto, loadPhoto, deletePhoto };
}
