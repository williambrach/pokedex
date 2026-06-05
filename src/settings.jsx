// settings.jsx — user settings (persisted to localStorage) + the settings sheet.
// Replaces the prototype "tweaks" host panel with a real in-app surface.

const SETTINGS_KEY = 'pokedex_settings_v1';
const SETTINGS_DEFAULTS = { cardStyle: 'album', typeColors: true, columns: 2 };

function useSettings() {
  const [settings, setSettings] = React.useState(() => {
    try { return { ...SETTINGS_DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch (e) { return { ...SETTINGS_DEFAULTS }; }
  });
  const setSetting = React.useCallback((key, val) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);
  return [settings, setSetting];
}

// ── small controls ────────────────────────────────────────────────────────────
function SettingSeg({ value, options, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, background: '#eceef2', padding: 3, borderRadius: 12 }}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <button key={String(o.value)} onClick={() => onChange(o.value)} style={{
            flex: 1, padding: '9px 6px', borderRadius: 9, border: 0, cursor: 'pointer',
            fontSize: 13.5, fontWeight: 700, transition: 'background .15s, color .15s',
            background: active ? '#fff' : 'transparent',
            color: active ? '#13151a' : '#7c828b',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function SettingToggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} aria-label="toggle" style={{
      width: 52, height: 31, borderRadius: 999, border: 0, cursor: 'pointer', position: 'relative',
      background: value ? '#2f9e57' : '#d5d9e0', transition: 'background .2s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: 3, left: value ? 24 : 3, width: 25, height: 25, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,.25)', transition: 'left .2s' }} />
    </button>
  );
}

function SettingRow({ label, hint, children, stacked }) {
  return (
    <div style={{ display: 'flex', flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', justifyContent: 'space-between', gap: stacked ? 10 : 12, padding: '14px 0' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: '#13151a' }}>{label}</div>
        {hint && <div style={{ fontSize: 12.5, color: '#8b9099', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingCard({ children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '0 16px', marginBottom: 14, boxShadow: '0 1px 2px rgba(20,30,50,.05), 0 8px 24px rgba(20,30,50,.06)' }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: '#f0f1f4' }} />;
}

// ── settings sheet ─────────────────────────────────────────────────────────────
function SettingsSheet({ settings, setSetting, onReset, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 5, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', background: 'rgba(10,12,18,.4)', animation: 'fadeIn .2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#f4f5f8', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '88%', display: 'flex', flexDirection: 'column',
        animation: 'sheetSlide .28s cubic-bezier(.2,.8,.2,1)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>Settings</div>
          <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 10, border: 0, background: '#eceef2', color: '#3a3f47', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon.close s={18} /></button>
        </div>

        <div style={{ overflow: 'auto', padding: '4px 16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8b9099', textTransform: 'uppercase', letterSpacing: .5, margin: '6px 4px 8px' }}>Appearance</div>
          <SettingCard>
            <SettingRow label="Card style" stacked>
              <SettingSeg value={settings.cardStyle} onChange={v => setSetting('cardStyle', v)}
                options={[{ value: 'album', label: 'Album' }, { value: 'retro', label: 'Retro' }, { value: 'playful', label: 'Playful' }]} />
            </SettingRow>
            <Divider />
            <SettingRow label="Color by type" hint="Tint cards with their Pokémon type">
              <SettingToggle value={settings.typeColors} onChange={v => setSetting('typeColors', v)} />
            </SettingRow>
            <Divider />
            <SettingRow label="Columns" stacked>
              <SettingSeg value={settings.columns} onChange={v => setSetting('columns', v)}
                options={[{ value: 2, label: '2' }, { value: 3, label: '3' }]} />
            </SettingRow>
          </SettingCard>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#8b9099', textTransform: 'uppercase', letterSpacing: .5, margin: '16px 4px 8px' }}>Collection</div>
          <SettingCard>
            <SettingRow label="Clear collection" hint="Remove every owned/wishlist mark and photo">
              <button onClick={onReset} style={{ padding: '9px 14px', borderRadius: 11, border: 0, background: '#fdecea', color: '#e23b2e', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Icon.trash s={15} /> Clear
              </button>
            </SettingRow>
          </SettingCard>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 6px 0', color: '#9aa0a6', fontSize: 12, lineHeight: 1.5 }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}><Icon.info s={15} /></span>
            <span>Everything stays in your browser — no account, no server. Card images &amp; prices come from the Pokémon TCG API, with Cardmarket price estimates in EUR.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useSettings, SettingsSheet, SETTINGS_DEFAULTS });
