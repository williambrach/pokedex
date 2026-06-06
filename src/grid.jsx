// grid.jsx — Pokédex grid: stats header, filter bar, and the dex slots (3 visual styles).

const DEX_BG = {
  album:   { page: '#eef0f4', card: '#ffffff', text: '#1b1d21', sub: '#8b9099' },
  retro:   { page: '#b3261e', card: '#0d1f12', text: '#d7ffe2', sub: '#5fae74' },
  playful: { page: '#1a1530', card: '#ffffff', text: '#1b1d21', sub: '#8b9099' },
};

// Off-screen cards are skipped via content-visibility; this is the placeholder
// height so the scrollbar stays roughly stable across 1025 cards.
function slotIntrinsic(style, cols) {
  const three = cols >= 3;
  if (style === 'retro')   return three ? 180 : 250;
  if (style === 'playful') return three ? 215 : 300;
  return three ? 210 : 300; // album
}

// ── stats header ────────────────────────────────────────────────────────────
function StatsHeader({ stats, style, onOpenSettings }) {
  const retro = style === 'retro';
  const pct = Math.round(stats.pct * 100);
  const accent = retro ? '#7CFC9B' : '#e23b2e';
  const sub = retro ? 'rgba(255,255,255,.7)' : '#8b9099';
  const gearStyle = {
    width: 38, height: 38, borderRadius: 11, border: 0, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: retro ? 'rgba(0,0,0,.28)' : '#fff',
    color: retro ? 'rgba(255,255,255,.85)' : '#5b6068',
    boxShadow: retro ? 'none' : '0 1px 3px rgba(0,0,0,.08)',
  };
  return (
    <div style={{ padding: '4px 18px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{
            fontSize: 30, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1,
            color: retro ? '#fff' : '#13151a',
            fontFamily: retro ? '"DM Mono", ui-monospace, monospace' : 'inherit',
          }}>Pokédex</div>
          <div style={{ fontSize: 12.5, color: sub, marginTop: 4, fontWeight: 500 }}>Card collection</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 26, fontWeight: 800, color: accent, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: retro ? '"DM Mono", ui-monospace, monospace' : 'inherit',
            }}>{stats.owned}<span style={{ fontSize: 15, color: retro ? 'rgba(255,255,255,.55)' : '#b3b8c0', fontWeight: 700 }}> / {stats.total}</span></div>
            <div style={{ fontSize: 11.5, color: sub, fontWeight: 600, marginTop: 2 }}>{pct}% collected</div>
          </div>
          <button onClick={onOpenSettings} aria-label="Settings" style={gearStyle}><Icon.cog s={20} /></button>
        </div>
      </div>

      <div style={{ height: 7, borderRadius: 999, background: retro ? 'rgba(0,0,0,.35)' : '#dfe2e8', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${stats.pct * 100}%`, background: `linear-gradient(90deg, ${accent}, ${retro ? '#36d96a' : '#ff7a4d'})`, transition: 'width .4s' }} />
        <div style={{ width: `${(stats.want / Math.max(stats.total, 1)) * 100}%`, background: retro ? 'rgba(124,252,155,.3)' : 'rgba(224,146,47,.45)' }} />
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11.5, fontWeight: 600, color: retro ? 'rgba(255,255,255,.7)' : '#6b7079' }}>
        <span><b style={{ color: '#2f9e57' }}>●</b> {stats.owned} owned</span>
        <span><b style={{ color: '#e0922f' }}>●</b> {stats.want} wishlist</span>
        <span><b style={{ color: retro ? 'rgba(255,255,255,.4)' : '#c2c7cf' }}>●</b> {stats.missing - stats.want} empty</span>
      </div>

      {(stats.owned > 0 || stats.want > 0) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 11, flexWrap: 'wrap' }}>
          {stats.owned > 0 && <ValueChip retro={retro} color="#2f9e57" label="Collection" value={stats.value} />}
          {stats.want > 0 && <ValueChip retro={retro} color="#e0922f" label="Wishlist" value={stats.wishValue} />}
        </div>
      )}
    </div>
  );
}

function ValueChip({ retro, color, label, value }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 12,
      background: retro ? 'rgba(0,0,0,.28)' : '#fff',
      boxShadow: retro ? 'none' : '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <span style={{ color, display: 'flex' }}><Icon.tag s={15} /></span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: retro ? 'rgba(255,255,255,.65)' : '#8b9099' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 800, color: retro ? '#fff' : '#13151a', fontVariantNumeric: 'tabular-nums' }}>≈ {formatEuro(value)}</span>
    </div>
  );
}

// ── filter bar ──────────────────────────────────────────────────────────────
function FilterBar({ q, setQ, status, setStatus, gen, setGen, types, setTypes, counts, style }) {
  const [showTypes, setShowTypes] = React.useState(false);
  const retro = style === 'retro';
  const field = {
    background: retro ? 'rgba(0,0,0,.3)' : '#fff',
    color: retro ? '#fff' : '#13151a',
    border: retro ? '1px solid rgba(255,255,255,.18)' : '1px solid #e2e5ea',
  };
  const statusOpts = [
    ['all', 'All', counts.all],
    ['owned', 'Owned', counts.owned],
    ['want', 'Wishlist', counts.want],
    ['tba', 'Empty', counts.tba],
  ];
  return (
    <div style={{ padding: '0 14px 8px', display: 'flex', flexDirection: 'column', gap: 9 }}>
      {/* search */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, borderRadius: 12, ...field }}>
          <span style={{ color: retro ? 'rgba(255,255,255,.5)' : '#aab0b8', display: 'flex' }}><Icon.search s={17} /></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search Pokémon…"
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', font: 'inherit', fontSize: 15, color: 'inherit', minWidth: 0 }} />
          {q && <button onClick={() => setQ('')} style={{ border: 0, background: 'transparent', color: retro ? 'rgba(255,255,255,.5)' : '#aab0b8', cursor: 'pointer', display: 'flex', padding: 2 }}><Icon.close s={16} /></button>}
        </div>
        <button onClick={() => setShowTypes(v => !v)} aria-label="Filter by type" style={{
          width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', ...field,
          color: (types.length || showTypes) ? '#e23b2e' : (retro ? 'rgba(255,255,255,.7)' : '#6b7079'),
          background: types.length ? (retro ? 'rgba(124,252,155,.15)' : '#fff0ee') : field.background,
        }}><Icon.sliders s={19} /></button>
      </div>

      {/* status segmented */}
      <div style={{ display: 'flex', gap: 6 }}>
        {statusOpts.map(([key, label, n]) => {
          const active = status === key;
          const col = key === 'owned' ? '#2f9e57' : key === 'want' ? '#e0922f' : key === 'tba' ? '#9aa0a6' : '#e23b2e';
          return (
            <button key={key} onClick={() => setStatus(key)} style={{
              flex: 1, padding: '8px 4px 7px', borderRadius: 10, cursor: 'pointer', border: 0,
              background: active ? col : (retro ? 'rgba(0,0,0,.25)' : '#fff'),
              color: active ? '#fff' : (retro ? 'rgba(255,255,255,.75)' : '#5b6068'),
              boxShadow: active ? 'none' : (retro ? 'none' : '0 1px 2px rgba(0,0,0,.05)'),
              transition: 'background .15s',
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1 }}>{label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: .82, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
            </button>
          );
        })}
      </div>

      {/* generation scroll */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, margin: '0 -2px', scrollbarWidth: 'none' }}>
        {[{ gen: 0, region: 'All' }, ...GENERATIONS].map(g => {
          const active = gen === g.gen;
          return (
            <button key={g.gen} onClick={() => setGen(g.gen)} style={{
              flexShrink: 0, padding: '6px 13px', borderRadius: 999, cursor: 'pointer', border: 0,
              fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
              background: active ? (retro ? '#7CFC9B' : '#13151a') : (retro ? 'rgba(0,0,0,.25)' : '#fff'),
              color: active ? (retro ? '#0d1f12' : '#fff') : (retro ? 'rgba(255,255,255,.7)' : '#5b6068'),
            }}>{g.region}</button>
          );
        })}
      </div>

      {/* type filter (collapsible) */}
      {showTypes && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
          {Object.keys(POKE_TYPES).map(t => {
            const active = types.includes(t);
            return (
              <button key={t} onClick={() => setTypes(active ? types.filter(x => x !== t) : [...types, t])} style={{
                padding: '5px 11px', borderRadius: 999, cursor: 'pointer', border: 0,
                fontSize: 11.5, fontWeight: 700, color: '#fff',
                background: POKE_TYPES[t].c, opacity: active ? 1 : (retro ? .4 : .42),
                outline: active ? '2px solid rgba(255,255,255,.9)' : 'none', outlineOffset: -2,
                boxShadow: active ? '0 2px 6px rgba(0,0,0,.2)' : 'none',
              }}>{POKE_TYPES[t].name}</button>
            );
          })}
          {types.length > 0 && <button onClick={() => setTypes([])} style={{ padding: '5px 11px', borderRadius: 999, border: 0, cursor: 'pointer', fontSize: 11.5, fontWeight: 700, background: retro ? 'rgba(255,255,255,.15)' : '#eceef2', color: retro ? '#fff' : '#5b6068' }}>Clear</button>}
        </div>
      )}
    </div>
  );
}

// ── single dex slot ──────────────────────────────────────────────────────────
const SlotCard = React.memo(function SlotCard({ mon, entry, status, style, typeColors, cvHeight, onClick }) {
  const grad = typeGradient(mon.types);
  const numStr = '#' + String(mon.id).padStart(4, '0');
  const card = entry && entry.card;
  const st = STATUS[status];
  const cv = { contentVisibility: 'auto', containIntrinsicSize: `0 ${cvHeight}px` };

  // Only surface the real card art once it's owned/wishlist — an unmarked pick
  // (status 'tba') keeps the plain Pokémon preview sprite.
  const showCard = !!card && status !== 'tba';
  const cardImg = showCard ? (
    <img src={card.img} alt={card.name} loading="lazy" decoding="async"
      style={{ width: '100%', height: '100%', objectFit: 'contain', filter: status === 'want' ? 'saturate(.92)' : 'none' }} />
  ) : null;

  // ----- RETRO ---------------------------------------------------------------
  if (style === 'retro') {
    return (
      <button onClick={onClick} style={{
        display: 'flex', flexDirection: 'column', textAlign: 'left', cursor: 'pointer',
        border: '1px solid rgba(124,252,155,.22)', borderRadius: 8, padding: 7, gap: 6,
        background: 'rgba(0,0,0,.28)', color: '#d7ffe2', fontFamily: '"DM Mono", ui-monospace, monospace', minWidth: 0, ...cv,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
          <span style={{ color: '#7CFC9B', fontWeight: 700 }}>{numStr}</span>
          <span style={{ color: st.c, fontWeight: 700, fontSize: 10 }}>{st.label}</span>
        </div>
        <div style={{ aspectRatio: '63/88', borderRadius: 5, overflow: 'hidden', background: 'rgba(124,252,155,.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          boxShadow: 'inset 0 0 0 1px rgba(124,252,155,.18)' }}>
          {showCard ? cardImg : (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <img src={SPRITE.pixel(mon.id)} alt="" loading="lazy"
                style={{ width: '64%', imageRendering: 'pixelated', filter: 'brightness(0) invert(1) opacity(.25) drop-shadow(0 0 1px #7CFC9B)' }} />
              <div style={{ fontSize: 13, color: 'rgba(124,252,155,.5)', fontWeight: 700, letterSpacing: 1, marginTop: -4 }}>—</div>
            </div>
          )}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mon.name}</div>
      </button>
    );
  }

  // ----- PLAYFUL -------------------------------------------------------------
  if (style === 'playful') {
    const bg = typeColors
      ? `linear-gradient(160deg, ${grad[0]}, ${grad[1]})`
      : 'linear-gradient(160deg,#3a3550,#221d38)';
    return (
      <button onClick={onClick} style={{
        position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'left', cursor: 'pointer',
        border: 0, borderRadius: 20, padding: 11, gap: 8, background: bg, color: '#fff',
        boxShadow: '0 8px 18px rgba(0,0,0,.22)', overflow: 'hidden', minWidth: 0, ...cv,
      }}>
        <div style={{ position: 'absolute', right: -18, top: -22, fontSize: 78, fontWeight: 900, color: 'rgba(255,255,255,.13)', lineHeight: 1, letterSpacing: -3 }}>{String(mon.id).padStart(3, '0')}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 800, opacity: .85 }}>{numStr}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,.22)', padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 800 }}>
            {status === 'owned' && <Icon.check s={11} />}{status === 'want' && <Icon.bookmark s={10} />}{st.label}
          </span>
        </div>
        <div style={{ aspectRatio: '63/88', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, backdropFilter: 'blur(2px)' }}>
          {showCard ? cardImg : (
            <div style={{ textAlign: 'center' }}>
              <img src={SPRITE.home(mon.id)} alt="" loading="lazy" style={{ width: '74%', filter: 'brightness(0) invert(1) opacity(.32)' }} />
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1, opacity: .6, marginTop: -6 }}>—</div>
            </div>
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mon.name}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {mon.types.map(t => <span key={t} style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(0,0,0,.22)', padding: '2px 7px', borderRadius: 999 }}>{POKE_TYPES[t].name}</span>)}
          </div>
        </div>
      </button>
    );
  }

  // ----- ALBUM (default) -----------------------------------------------------
  const accent = typeColors ? grad[0] : '#e2e5ea';
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', textAlign: 'left', cursor: 'pointer',
      border: 0, borderRadius: 16, padding: 9, gap: 8, background: '#fff', color: '#1b1d21',
      boxShadow: '0 1px 2px rgba(20,30,50,.05), 0 6px 16px rgba(20,30,50,.06)',
      borderTop: typeColors ? `3px solid ${accent}` : '3px solid transparent', minWidth: 0, ...cv,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b3b8c0', fontVariantNumeric: 'tabular-nums' }}>{numStr}</span>
        <StatusPill status={status} />
      </div>
      <div style={{
        aspectRatio: '63/88', borderRadius: 10, overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: showCard ? '#f4f5f8' : (typeColors ? `linear-gradient(160deg, ${grad[0]}22, ${grad[1]}14)` : '#f4f5f8'),
        boxShadow: showCard ? 'none' : 'inset 0 0 0 2px rgba(0,0,0,.04)',
      }}>
        {card ? cardImg : (
          <div style={{ textAlign: 'center', width: '100%', padding: 4 }}>
            <img src={SPRITE.art(mon.id)} alt="" loading="lazy" style={{ width: '76%', filter: 'grayscale(.2) opacity(.32)' }} />
          </div>
        )}
        {status === 'want' && <div style={{ position: 'absolute', top: 6, left: 6, background: '#e0922f', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999, boxShadow: '0 1px 4px rgba(0,0,0,.2)' }}>wishlist</div>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: -0.2 }}>{mon.name}</div>
        <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {showCard ? `${card.setName} · ${card.number}` : mon.types.map(t => POKE_TYPES[t].name).join(' / ')}
        </div>
      </div>
    </button>
  );
});

Object.assign(window, { StatsHeader, FilterBar, SlotCard, DEX_BG, slotIntrinsic });
