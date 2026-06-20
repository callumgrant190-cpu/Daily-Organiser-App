// Core domain types for the Grove daily organiser.
// All dates are stored as ISO day strings ("YYYY-MM-DD") unless noted.

export type ISODate = string; // e.g. "2026-06-20"

export type TreeSpecies = 'oak' | 'pine' | 'cherry' | 'maple' | 'willow';

/** A tree earned by completing a focus session (one per 30 focused minutes). */
export interface Tree {
  id: string;
  species: TreeSpecies;
  plantedAt: string; // ISO timestamp
  day: ISODate;
  subject?: string;
  /** Minutes of focus this tree represents (usually 30). */
  minutes: number;
  /** False if the session was given up early — a withered tree. */
  alive: boolean;
}

/** A completed (or abandoned) focus session. */
export interface FocusSession {
  id: string;
  startedAt: string; // ISO timestamp
  endedAt: string; // ISO timestamp
  day: ISODate;
  plannedMinutes: number;
  actualMinutes: number;
  subject?: string;
  note?: string;
  completed: boolean;
  treesEarned: number;
}

/** A whoop-style recovery entry for a single day. */
export interface RecoveryEntry {
  day: ISODate;
  /** 0-100 recovery score. */
  recovery: number;
  hrv?: number; // ms
  rhr?: number; // bpm
  sleepHours?: number;
  sleepPerformance?: number; // 0-100
  source: 'manual' | 'whoop';
}

export type ActivityType = 'run' | 'ride' | 'walk' | 'swim' | 'strength' | 'other';

/** A logged physical activity (e.g. a run), manual or from Strava. */
export interface Activity {
  id: string;
  day: ISODate;
  type: ActivityType;
  name: string;
  distanceKm?: number;
  durationMin: number;
  /** Average pace in seconds per km (derived for runs/walks). */
  paceSecPerKm?: number;
  avgHr?: number;
  calories?: number;
  source: 'manual' | 'strava';
  externalId?: string;
}

/** A study log entry — what you studied and for how long. */
export interface StudyEntry {
  id: string;
  day: ISODate;
  subject: string;
  topic?: string;
  minutes: number;
  method?: string; // references a study method id
  notes?: string;
  /** Confidence 1-5 after the session. */
  confidence?: number;
}

/** A daily body-weight measurement. */
export interface WeighIn {
  day: ISODate;
  weightKg: number;
  note?: string;
}

/** A supplement the user takes, optionally on a cycle. */
export interface Supplement {
  id: string;
  name: string;
  dose?: string;
  timing?: string; // e.g. "Morning", "Pre-workout"
  /** If cycled, the supplement is taken for `onWeeks` then paused for `offWeeks`. */
  cycle?: {
    onWeeks: number;
    offWeeks: number;
    startDate: ISODate;
  };
  createdAt: string;
  archived?: boolean;
}

/** Records that a supplement was taken on a given day. */
export interface SupplementLog {
  day: ISODate;
  supplementId: string;
  taken: boolean;
}

export interface Settings {
  studentName: string;
  weightUnit: 'kg' | 'lb';
  focusLengthMin: number; // default planned session length
  dailyStudyGoalMin: number;
  whoopConnected: boolean;
  stravaConnected: boolean;
}

export interface AppData {
  version: number;
  settings: Settings;
  trees: Tree[];
  sessions: FocusSession[];
  recovery: RecoveryEntry[];
  activities: Activity[];
  study: StudyEntry[];
  weighIns: WeighIn[];
  supplements: Supplement[];
  supplementLogs: SupplementLog[];
}
