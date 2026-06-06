'use client';
// components/Detail.tsx — full-screen detail sheet: assign a real TCG card, mark
// owned/wishlist, show Cardmarket price, and (when owned) record condition /
// variant / value / own photo (stored in Supabase Storage).
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { tcgQueryName } from '@/lib/pokedata';
import { searchCards } from '@/lib/tcg';
import { Icon, TypeBadge, typeGradient, STATUS } from '@/components/ui';
import { formatEuro } from '@/lib/format';
import type { Card, Entry, Mon, Status } from '@/lib/types';

const CONDITIONS = ['Mint', 'Near mint', 'Lightly played', 'Played', 'Damaged'];
const VARIANTS = ['Holo', 'Reverse holo', 'Non-holo', 'Full Art', 'Promo', 'Other'];

export interface PhotoApi {
  save: (id: number, file: File) => Promise<void>;
  load: (id: number) => Promise<string | null>;
  remove: (id: number) => Promise<void>;
}

// Cardmarket search URL — used only as a fallback when a card has no direct
// product link (the API usually gives us card.cmUrl straight away).
const cardmarketUrl = (card: Card) =>
  card.cmUrl ||
  'https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=' +
    encodeURIComponent([card.name, card.number].filter(Boolean).join(' '));
const cardmarketSearchUrl = (term: string) =>
  'https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=' + encodeURIComponent(term);

const iconBtn: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: 0,
  background: '#f0f1f4',
  color: '#3a3f47',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

// ── card search sub-view ──────────────────────────────────────────────────────
function CardSearch({ mon, onPick, onClose }: { mon: Mon; onPick: (c: Card) => void; onClose: () => void }) {
  const [term, setTerm] = useState(tcgQueryName(mon.slug));
  const [results, setResults] = useState<Card[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async (t: string) => {
    setLoading(true);
    setErr(null);
    try {
      const cards = await searchCards(t);
      setResults(cards);
    } catch {
      setErr('Could not load cards. Please try again.');
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void run(term); // initial search only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void run(term);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f4f5f8', display: 'flex', flexDirection: 'column', zIndex: 3 }}>
      <div style={{ padding: 'calc(var(--safe-top) + 6px) 16px 10px', background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={onClose} aria-label="Back" style={iconBtn}><Icon.back s={20} /></button>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Pick a card · {mon.name}</div>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 42, borderRadius: 12, background: '#f0f1f4' }}>
            <span style={{ color: '#aab0b8', display: 'flex' }}><Icon.search s={18} /></span>
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="card name…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', font: 'inherit', fontSize: 15, minWidth: 0 }} />
          </div>
          <button type="submit" style={{ padding: '0 16px', height: 42, borderRadius: 12, border: 0, background: '#e23b2e', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Search</button>
        </form>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px calc(var(--safe-bottom) + 20px)' }}>
        {loading && <div style={{ textAlign: 'center', color: '#8b9099', padding: 40, fontSize: 14 }}>Loading cards…</div>}
        {!loading && err && <div style={{ textAlign: 'center', color: '#e23b2e', padding: 40, fontSize: 14 }}>{err}</div>}
        {!loading && results && results.length === 0 && !err && (
          <div style={{ textAlign: 'center', color: '#8b9099', padding: 40, fontSize: 14 }}>No cards for “{term}”. Try a different name.</div>
        )}
        {!loading && results && results.length > 0 && (
          <div>
            <div style={{ fontSize: 12.5, color: '#8b9099', fontWeight: 600, marginBottom: 10 }}>{results.length} cards · newest sets first</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              {results.map((c) => (
                <button key={c.id} onClick={() => onPick(c)} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ borderRadius: 9, overflow: 'hidden', background: '#e7e9ee', aspectRatio: '63/88', boxShadow: '0 2px 6px rgba(0,0,0,.12)' }}>
                    <img src={c.imgSmall || c.img} alt={c.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: '#6b7079', fontWeight: 600, marginTop: 4, lineHeight: 1.25 }}>
                    {c.setName}
                    <br />
                    <span style={{ color: '#aab0b8' }}>#{c.number}{c.rarity ? ' · ' + c.rarity : ''}</span>
                  </div>
                  {c.price != null && <div style={{ fontSize: 11, color: '#2f9e57', fontWeight: 800, marginTop: 2 }}>{formatEuro(c.price)}</div>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── field helpers ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#8b9099', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button key={o} onClick={() => onChange(active ? '' : o)} style={{ padding: '8px 14px', borderRadius: 999, border: 0, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: active ? '#13151a' : '#f0f1f4', color: active ? '#fff' : '#5b6068' }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

// Big toggle button used to mark a card owned / wishlist (tap again to clear).
function StateBtn({ active, color, icon, label, onClick }: { active: boolean; color: string; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 8px', borderRadius: 13, cursor: 'pointer', fontWeight: 700, fontSize: 14.5, border: active ? `2px solid ${color}` : '2px solid #eceef2', background: active ? color : '#f7f8fa', color: active ? '#fff' : '#5b6068', transition: 'background .15s, border-color .15s' }}>
      {icon}
      {label}
    </button>
  );
}

// ── price block ────────────────────────────────────────────────────────────────
function PriceBlock({ card }: { card: Card }) {
  if (card.price == null) {
    return (
      <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 13, background: '#f7f8fa', color: '#9aa0a6', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon.tag s={15} /> No Cardmarket price available for this card.
      </div>
    );
  }
  const sub: string[] = [];
  if (card.priceLow != null) sub.push('Low ' + formatEuro(card.priceLow));
  if (card.priceAvg != null) sub.push('Avg ' + formatEuro(card.priceAvg));
  return (
    <div style={{ marginTop: 14, padding: '13px 15px', borderRadius: 13, background: 'linear-gradient(135deg,#f0fbf3,#eaf6ff)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ color: '#2f9e57', display: 'flex', flexShrink: 0 }}><Icon.tag s={20} /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7c828b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Cardmarket trend</div>
          {sub.length > 0 && <div style={{ fontSize: 11.5, color: '#8b9099', marginTop: 2 }}>{sub.join(' · ')}</div>}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#13151a', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatEuro(card.price)}</div>
    </div>
  );
}

function Meta({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ color: '#aab0b8', width: 48, flexShrink: 0, fontWeight: 600 }}>{k}</span>
      <span style={{ color: '#3a3f47', fontWeight: 600 }}>{v}</span>
    </div>
  );
}

const miniBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10, border: 0, background: '#f0f1f4', color: '#3a3f47', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const cmBtn = (owned: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 12,
  padding: '13px',
  borderRadius: 13,
  fontWeight: 700,
  fontSize: 14.5,
  cursor: 'pointer',
  textDecoration: 'none',
  background: owned ? '#fff' : '#062a63',
  color: owned ? '#062a63' : '#fff',
  border: owned ? '1.5px solid #062a63' : '0',
});
const statPillBig: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 999, fontSize: 13.5, fontWeight: 800 };

// ── detail sheet ──────────────────────────────────────────────────────────────
export function DetailSheet({
  mon,
  entry,
  status,
  onUpdate,
  photos,
  onClose,
}: {
  mon: Mon;
  entry?: Entry;
  status: Status;
  onUpdate: (id: number, patch: Partial<Entry>) => void;
  photos: PhotoApi;
  onClose: () => void;
}) {
  const [searching, setSearching] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const card = entry && entry.card;
  const owned = !!(entry && entry.owned);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const hasPhoto = !!(entry && entry.hasPhoto);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    let revoked = false;
    if (hasPhoto) {
      photos.load(mon.id).then((url) => {
        if (!revoked) {
          revokeBlob();
          setPhotoUrl(url);
        }
      });
    } else {
      revokeBlob();
      setPhotoUrl(null);
    }
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mon.id, hasPhoto]);

  // Revoke any leftover preview blob URL when the sheet unmounts.
  useEffect(() => revokeBlob, [revokeBlob]);

  // Picking a card is neutral — it does NOT auto-add to the wishlist.
  const pickCard = (c: Card) => {
    onUpdate(mon.id, { card: c });
    setSearching(false);
  };
  const removeCard = () => onUpdate(mon.id, { card: null, owned: false, want: false });
  const setState = (s: Status | null) => onUpdate(mon.id, { owned: s === 'owned', want: s === 'want' });

  // Accept comma or dot as the decimal separator, keep a single separator, and
  // store it dot-normalised so Number() parses it.
  const onValue = (raw: string) => {
    let v = String(raw).replace(/[^\d.,]/g, '').replace(/,/g, '.');
    const dot = v.indexOf('.');
    if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
    onUpdate(mon.id, { value: v });
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const localUrl = URL.createObjectURL(f);
    revokeBlob();
    blobUrlRef.current = localUrl;
    setPhotoUrl(localUrl); // instant preview
    try {
      await photos.save(mon.id, f);
      // Swap in the signed URL — also covers re-uploads where hasPhoto was
      // already true (so the load effect above doesn't re-run on its own).
      const signed = await photos.load(mon.id);
      if (signed) {
        revokeBlob();
        setPhotoUrl(signed);
      }
    } catch {
      revokeBlob();
      setPhotoUrl(null);
    }
  };
  const removePhoto = async () => {
    revokeBlob();
    setPhotoUrl(null);
    await photos.remove(mon.id);
  };

  const grad = typeGradient(mon.types);
  const st = STATUS[status];

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f4f5f8', display: 'flex', flexDirection: 'column', zIndex: 2, animation: 'sheetUp .28s cubic-bezier(.2,.8,.2,1)' }}>
      {/* hero */}
      <div style={{ position: 'relative', paddingTop: 'calc(var(--safe-top) + 4px)', paddingBottom: 18, background: `linear-gradient(165deg, ${grad[0]}, ${grad[1]})`, flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: -10, top: 30, fontSize: 120, fontWeight: 900, color: 'rgba(255,255,255,.12)', lineHeight: 1, letterSpacing: -5 }}>{String(mon.id).padStart(3, '0')}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', position: 'relative', zIndex: 1 }}>
          <button onClick={onClose} aria-label="Close" style={{ ...iconBtn, background: 'rgba(255,255,255,.25)', color: '#fff', backdropFilter: 'blur(8px)' }}><Icon.close s={20} /></button>
          <span style={{ ...statPillBig, color: '#fff', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,.22)' }}>
            {status === 'owned' && <Icon.check s={13} />}
            {status === 'want' && <Icon.bookmark s={12} />}
            {st.label}
          </span>
        </div>
        <div style={{ padding: '12px 18px 0', position: 'relative', zIndex: 1, color: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>#{String(mon.id).padStart(4, '0')}</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.05, textShadow: '0 1px 8px rgba(0,0,0,.15)' }}>{mon.name}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
            {mon.types.map((t) => <TypeBadge key={t} type={t} size="md" />)}
          </div>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 18px calc(var(--safe-bottom) + 24px)' }}>
        {/* CARD */}
        <div style={{ background: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: '0 1px 2px rgba(20,30,50,.05), 0 8px 24px rgba(20,30,50,.06)' }}>
          {card ? (
            <>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 116, flexShrink: 0, borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,.18)', aspectRatio: '63/88', background: '#e7e9ee' }}>
                  <img src={card.img} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.2 }}>{card.name}</div>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13 }}>
                    <Meta k="Series" v={card.setSeries} />
                    <Meta k="Set" v={card.setName} />
                    <Meta k="No." v={'#' + card.number + (card.setTotal ? ' / ' + card.setTotal : '')} />
                    {card.rarity && <Meta k="Rarity" v={card.rarity} />}
                    {card.released && <Meta k="Year" v={card.released.slice(0, 4)} />}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => setSearching(true)} style={miniBtn}><Icon.swap s={14} /> Change</button>
                    <button onClick={removeCard} style={{ ...miniBtn, color: '#e23b2e' }}><Icon.trash s={14} /> Remove</button>
                  </div>
                </div>
              </div>
              <PriceBlock card={card} />
              <a href={cardmarketUrl(card)} target="_blank" rel="noopener noreferrer" style={cmBtn(owned)}>
                {owned ? <Icon.ext s={16} /> : <Icon.cart s={16} />}
                <span>{owned ? 'View on Cardmarket' : 'Buy on Cardmarket'}</span>
              </a>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '14px 8px' }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#d5d9e0', letterSpacing: 2, marginBottom: 8 }}><Icon.search s={34} /></div>
              <div style={{ fontSize: 13.5, color: '#8b9099', marginBottom: 16, lineHeight: 1.45 }}>
                No card picked for this Pokémon yet.
                <br />
                Choose the one you have or want.
              </div>
              <button onClick={() => setSearching(true)} style={{ width: '100%', padding: '13px', borderRadius: 13, border: 0, background: '#e23b2e', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Icon.search s={18} /> Pick a card
              </button>
              <a href={cardmarketSearchUrl(mon.name)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 13, color: '#0a3a8c', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <Icon.ext s={14} /> Browse offers on Cardmarket
              </a>
            </div>
          )}
        </div>

        {/* STATUS selector (only when a card exists) */}
        {card && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: '0 1px 2px rgba(20,30,50,.05), 0 8px 24px rgba(20,30,50,.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b9099', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Add to my collection</div>
            <div style={{ display: 'flex', gap: 9 }}>
              <StateBtn active={status === 'want'} color="#e0922f" icon={<Icon.bookmark s={16} />} label="I want it" onClick={() => setState(status === 'want' ? null : 'want')} />
              <StateBtn active={status === 'owned'} color="#2f9e57" icon={<Icon.check s={16} />} label="I own it" onClick={() => setState(status === 'owned' ? null : 'owned')} />
            </div>
            <div style={{ fontSize: 12, color: '#9aa0a6', marginTop: 10, lineHeight: 1.4 }}>
              {status === 'owned' ? 'In your collection.' : status === 'want' ? 'On your wishlist.' : 'Just a pick for now — tap one above to add it.'}
            </div>
          </div>
        )}

        {/* OWNED details */}
        {card && owned && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: '0 1px 2px rgba(20,30,50,.05), 0 8px 24px rgba(20,30,50,.06)' }}>
            <Field label="Condition"><Chips options={CONDITIONS} value={(entry && entry.condition) || ''} onChange={(v) => onUpdate(mon.id, { condition: v })} /></Field>
            <Field label="Variant"><Chips options={VARIANTS} value={(entry && entry.variant) || ''} onChange={(v) => onUpdate(mon.id, { variant: v })} /></Field>
            <Field label="Value / price">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', height: 46, borderRadius: 12, background: '#f0f1f4' }}>
                <input type="text" inputMode="decimal" value={(entry && entry.value) || ''} onChange={(e) => onValue(e.target.value)} placeholder={card.price != null ? String(card.price) : '0'} style={{ flex: 1, border: 0, outline: 0, background: 'transparent', font: 'inherit', fontSize: 16, fontWeight: 600, minWidth: 0 }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#8b9099' }}>€</span>
              </div>
              {card.price != null && (entry == null || !entry.value) && (
                <div style={{ fontSize: 11.5, color: '#9aa0a6', marginTop: 6 }}>Defaults to the Cardmarket trend of {formatEuro(card.price)} if left blank.</div>
              )}
            </Field>
            <Field label="Photo of my card">
              {photoUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={photoUrl} alt="my card" style={{ width: 140, borderRadius: 12, display: 'block', boxShadow: '0 4px 14px rgba(0,0,0,.18)' }} />
                  <button onClick={removePhoto} style={{ position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: '50%', border: 0, background: '#e23b2e', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}><Icon.close s={15} /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current && fileRef.current.click()} style={{ width: '100%', padding: '20px', borderRadius: 13, border: '2px dashed #d5d9e0', background: '#fafbfc', color: '#8b9099', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600 }}>
                  <Icon.camera s={26} /> Add a photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: 'none' }} />
            </Field>
          </div>
        )}

        {/* NOTE */}
        <div style={{ background: '#fff', borderRadius: 18, padding: 16, boxShadow: '0 1px 2px rgba(20,30,50,.05), 0 8px 24px rgba(20,30,50,.06)' }}>
          <Field label="Note">
            <textarea value={(entry && entry.note) || ''} onChange={(e) => onUpdate(mon.id, { note: e.target.value })} placeholder={owned ? 'e.g. where I bought it…' : 'e.g. where to buy it, max price…'} rows={2} style={{ width: '100%', boxSizing: 'border-box', border: 0, outline: 0, background: '#f0f1f4', borderRadius: 12, padding: '12px 14px', font: 'inherit', fontSize: 14.5, resize: 'none' }} />
          </Field>
        </div>
      </div>

      {searching && <CardSearch mon={mon} onPick={pickCard} onClose={() => setSearching(false)} />}
    </div>
  );
}
