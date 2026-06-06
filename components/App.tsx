'use client';
// components/App.tsx — Pokédex app root: data loading, filtering, grid, detail,
// settings. Collection is synced to the signed-in user's Supabase account.
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useViewport, useDeviceScale, IOSDevice } from '@/components/IOSFrame';
import { useSettings } from '@/hooks/useSettings';
import { useCollection } from '@/hooks/useCollection';
import { loadPokedex, genOf } from '@/lib/pokedata';
import { statusOf, computeStats } from '@/lib/stats';
import { StatsHeader, FilterBar, SlotCard, DEX_BG, slotIntrinsic } from '@/components/Grid';
import { DetailSheet } from '@/components/Detail';
import { SettingsSheet } from '@/components/Settings';
import type { Mon, Stats } from '@/lib/types';

function LoadScreen({ progress, error, onRetry }: { progress: number; error: boolean; onRetry: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 40, textAlign: 'center', background: '#fff' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(#e23b2e 0 50%, #fff 50% 100%)', border: '4px solid #13151a', position: 'relative', animation: error ? 'none' : 'spin 1.4s linear infinite' }}>
        <div style={{ position: 'absolute', top: 'calc(50% - 3px)', left: 0, right: 0, height: 6, background: '#13151a' }} />
        <div style={{ position: 'absolute', top: 'calc(50% - 9px)', left: 'calc(50% - 9px)', width: 18, height: 18, borderRadius: '50%', background: '#fff', border: '4px solid #13151a' }} />
      </div>
      {error ? (
        <>
          <div style={{ fontSize: 15, color: '#5b6068', maxWidth: 240 }}>Couldn’t load the Pokédex. Check your connection.</div>
          <button onClick={onRetry} style={{ padding: '11px 22px', borderRadius: 12, border: 0, background: '#e23b2e', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Try again</button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#13151a' }}>Loading the Pokédex…</div>
          <div style={{ width: 180, height: 6, borderRadius: 999, background: '#eceef2', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: '#e23b2e', transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 12.5, color: '#aab0b8' }}>1025 Pokémon · the first load takes a moment</div>
        </>
      )}
    </div>
  );
}

const EMPTY_STATS: Stats = { owned: 0, want: 0, value: 0, wishValue: 0, total: 0, missing: 0, pct: 0 };

export default function App({ userEmail }: { userEmail: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const framed = useViewport();
  useDeviceScale();
  const [settings, setSetting] = useSettings();
  const { coll, update, reset, savePhoto, loadPhoto, deletePhoto } = useCollection();

  const [mons, setMons] = useState<Mon[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadErr, setLoadErr] = useState(false);

  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [gen, setGen] = useState(0);
  const [typeF, setTypeF] = useState<string[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(() => {
    setLoadErr(false);
    setProgress(0);
    loadPokedex(setProgress)
      .then(setMons)
      .catch(() => setLoadErr(true));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // filtering (everything except status) → counts → status filter → list
  const { list, counts, stats } = useMemo(() => {
    if (!mons) return { list: [] as Mon[], counts: { all: 0, owned: 0, want: 0, tba: 0 }, stats: EMPTY_STATS };
    const qn = q.trim().toLowerCase();
    const base = mons.filter((m) => {
      if (gen && genOf(m.id) !== gen) return false;
      if (typeF.length && !typeF.some((tp) => m.types.includes(tp))) return false;
      if (qn) {
        const hitName = m.name.toLowerCase().includes(qn);
        const hitNum = String(m.id) === qn.replace(/^#?0*/, '') || String(m.id).padStart(4, '0').includes(qn.replace('#', ''));
        if (!hitName && !hitNum) return false;
      }
      return true;
    });
    const counts = { all: base.length, owned: 0, want: 0, tba: 0 };
    base.forEach((m) => {
      counts[statusOf(coll[m.id])]++;
    });
    const list = statusF === 'all' ? base : base.filter((m) => statusOf(coll[m.id]) === statusF);
    return { list, counts, stats: computeStats(mons, coll) };
  }, [mons, coll, q, gen, typeF, statusF]);

  const photos = useMemo(() => ({ save: savePhoto, load: loadPhoto, remove: deletePhoto }), [savePhoto, loadPhoto, deletePhoto]);

  if (!mounted) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#eef0f4' }}>
        <LoadScreen progress={0} error={false} onRetry={load} />
      </div>
    );
  }

  const bg = DEX_BG[settings.cardStyle] || DEX_BG.album;
  const cols = settings.columns || 2;
  const cvHeight = slotIntrinsic(settings.cardStyle, cols);
  const openMon = openId != null && mons ? mons.find((m) => m.id === openId) : null;

  const headerBg =
    settings.cardStyle === 'retro'
      ? 'linear-gradient(#b3261e,#8f1d17)'
      : settings.cardStyle === 'playful'
        ? 'linear-gradient(#221d38,#1a1530)'
        : 'linear-gradient(#fbfbfd,#eef0f4)';

  const safeVars: CSSProperties = framed
    ? ({ '--safe-top': '50px', '--safe-bottom': '34px' } as CSSProperties)
    : ({ '--safe-top': 'calc(env(safe-area-inset-top, 0px) + 14px)', '--safe-bottom': 'env(safe-area-inset-bottom, 0px)' } as CSSProperties);

  const onReset = () => {
    if (window.confirm('Clear your whole collection? This removes every owned/wishlist mark and photo.')) {
      void reset();
      setShowSettings(false);
    }
  };

  const screen = (
    <div className="device-screen" style={{ position: framed ? 'absolute' : 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: bg.page, ...safeVars }}>
      {!mons ? (
        <LoadScreen progress={progress} error={loadErr} onRetry={load} />
      ) : (
        <>
          <div style={{ paddingTop: 'var(--safe-top)', flexShrink: 0, background: headerBg, borderBottom: settings.cardStyle === 'album' ? '1px solid #e2e5ea' : 'none', boxShadow: settings.cardStyle === 'album' ? '0 2px 12px rgba(0,0,0,.03)' : 'none', position: 'relative', zIndex: 2 }}>
            <StatsHeader stats={stats} style={settings.cardStyle} onOpenSettings={() => setShowSettings(true)} />
            <FilterBar q={q} setQ={setQ} status={statusF} setStatus={setStatusF} gen={gen} setGen={setGen} types={typeF} setTypes={setTypeF} counts={counts} style={settings.cardStyle} />
          </div>
          <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {list.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 30px', color: bg.sub, fontSize: 14.5, lineHeight: 1.5 }}>No cards match this filter.</div>
            ) : (
              <div key={`grid-${cols}-${settings.cardStyle}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: cols >= 3 ? 8 : 11, padding: '12px 14px calc(var(--safe-bottom) + 30px)' }}>
                {list.map((m) => (
                  <SlotCard key={m.id} mon={m} entry={coll[m.id]} status={statusOf(coll[m.id])} style={settings.cardStyle} typeColors={settings.typeColors} cvHeight={cvHeight} onClick={() => setOpenId(m.id)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {openMon && <DetailSheet mon={openMon} entry={coll[openMon.id]} status={statusOf(coll[openMon.id])} onUpdate={update} photos={photos} onClose={() => setOpenId(null)} />}

      {showSettings && <SettingsSheet settings={settings} setSetting={setSetting} onReset={onReset} onClose={() => setShowSettings(false)} userEmail={userEmail} />}
    </div>
  );

  if (framed) {
    return (
      <div className="stage">
        <div className="device-wrap">
          <IOSDevice>{screen}</IOSDevice>
        </div>
      </div>
    );
  }
  return screen;
}
