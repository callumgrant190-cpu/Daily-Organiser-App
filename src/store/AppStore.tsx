import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Activity,
  AppData,
  ISODate,
  RecoveryEntry,
  Settings,
  StudyEntry,
  Supplement,
  Tree,
  TreeSpecies,
  WeighIn,
  FocusSession,
} from '../types';
import { todayISO } from '../lib/date';

const STORAGE_KEY = 'grove.appdata.v1';

const DEFAULT_SETTINGS: Settings = {
  studentName: '',
  weightUnit: 'kg',
  focusLengthMin: 30,
  dailyStudyGoalMin: 120,
  whoopConnected: false,
  stravaConnected: false,
};

function emptyData(): AppData {
  return {
    version: 1,
    settings: DEFAULT_SETTINGS,
    trees: [],
    sessions: [],
    recovery: [],
    activities: [],
    study: [],
    weighIns: [],
    supplements: [],
    supplementLogs: [],
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return { ...emptyData(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
  } catch {
    return emptyData();
  }
}

const SPECIES: TreeSpecies[] = ['oak', 'pine', 'cherry', 'maple', 'willow'];
export function randomSpecies(): TreeSpecies {
  return SPECIES[Math.floor(Math.random() * SPECIES.length)];
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

interface Store {
  data: AppData;
  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  // focus + trees
  recordSession: (session: Omit<FocusSession, 'id'>, trees: Omit<Tree, 'id'>[]) => void;
  // recovery
  upsertRecovery: (entry: RecoveryEntry) => void;
  removeRecovery: (day: ISODate) => void;
  // activities
  addActivity: (a: Omit<Activity, 'id'>) => void;
  removeActivity: (id: string) => void;
  // study
  addStudyEntry: (e: Omit<StudyEntry, 'id'>) => void;
  removeStudyEntry: (id: string) => void;
  // weigh-ins
  upsertWeighIn: (w: WeighIn) => void;
  removeWeighIn: (day: ISODate) => void;
  // supplements
  addSupplement: (s: Omit<Supplement, 'id' | 'createdAt'>) => void;
  updateSupplement: (id: string, patch: Partial<Supplement>) => void;
  removeSupplement: (id: string) => void;
  toggleSupplementLog: (supplementId: string, day: ISODate, taken: boolean) => void;
  // danger
  resetAll: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
}

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load());
  const dataRef = useRef(data);
  dataRef.current = data;

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [data]);

  const store = useMemo<Store>(() => {
    const mutate = (fn: (d: AppData) => AppData) => setData((d) => fn(d));

    return {
      data,
      updateSettings: (patch) =>
        mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      recordSession: (session, trees) =>
        mutate((d) => ({
          ...d,
          sessions: [{ ...session, id: uid() }, ...d.sessions],
          trees: [...trees.map((t) => ({ ...t, id: uid() })), ...d.trees],
        })),

      upsertRecovery: (entry) =>
        mutate((d) => ({
          ...d,
          recovery: [...d.recovery.filter((r) => r.day !== entry.day), entry].sort((a, b) =>
            a.day < b.day ? 1 : -1,
          ),
        })),
      removeRecovery: (day) =>
        mutate((d) => ({ ...d, recovery: d.recovery.filter((r) => r.day !== day) })),

      addActivity: (a) => mutate((d) => ({ ...d, activities: [{ ...a, id: uid() }, ...d.activities] })),
      removeActivity: (id) =>
        mutate((d) => ({ ...d, activities: d.activities.filter((a) => a.id !== id) })),

      addStudyEntry: (e) => mutate((d) => ({ ...d, study: [{ ...e, id: uid() }, ...d.study] })),
      removeStudyEntry: (id) => mutate((d) => ({ ...d, study: d.study.filter((e) => e.id !== id) })),

      upsertWeighIn: (w) =>
        mutate((d) => ({
          ...d,
          weighIns: [...d.weighIns.filter((x) => x.day !== w.day), w].sort((a, b) =>
            a.day < b.day ? 1 : -1,
          ),
        })),
      removeWeighIn: (day) =>
        mutate((d) => ({ ...d, weighIns: d.weighIns.filter((w) => w.day !== day) })),

      addSupplement: (s) =>
        mutate((d) => ({
          ...d,
          supplements: [...d.supplements, { ...s, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateSupplement: (id, patch) =>
        mutate((d) => ({
          ...d,
          supplements: d.supplements.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      removeSupplement: (id) =>
        mutate((d) => ({
          ...d,
          supplements: d.supplements.filter((s) => s.id !== id),
          supplementLogs: d.supplementLogs.filter((l) => l.supplementId !== id),
        })),
      toggleSupplementLog: (supplementId, day, taken) =>
        mutate((d) => ({
          ...d,
          supplementLogs: [
            ...d.supplementLogs.filter((l) => !(l.supplementId === supplementId && l.day === day)),
            { supplementId, day, taken },
          ],
        })),

      resetAll: () => setData(emptyData()),
      exportJSON: () => JSON.stringify(dataRef.current, null, 2),
      importJSON: (json) => {
        try {
          const parsed = JSON.parse(json) as AppData;
          if (!parsed || typeof parsed !== 'object') return false;
          setData({ ...emptyData(), ...parsed });
          return true;
        } catch {
          return false;
        }
      },
    };
  }, [data]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within AppStoreProvider');
  return ctx;
}

export { uid, todayISO };
