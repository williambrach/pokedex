'use client';
// hooks/useSettings.ts — user appearance settings, persisted to localStorage
// (device preference; not synced to the account).
import { useCallback, useState } from 'react';
import type { Settings } from '@/lib/types';

const SETTINGS_KEY = 'pokedex_settings_v1';
export const SETTINGS_DEFAULTS: Settings = { cardStyle: 'album', typeColors: true, columns: 2 };

export function useSettings(): [
  Settings,
  <K extends keyof Settings>(key: K, val: Settings[K]) => void,
] {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return { ...SETTINGS_DEFAULTS };
    try {
      return { ...SETTINGS_DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch {
      return { ...SETTINGS_DEFAULTS };
    }
  });

  const setSetting = useCallback(<K extends keyof Settings>(key: K, val: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: val };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return [settings, setSetting];
}
