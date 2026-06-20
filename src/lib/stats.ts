import type { AppData, ISODate, Supplement } from '../types';
import { addDays, parseISO, todayISO } from './date';

/** Days that count toward the study streak: any day with focus time or study log. */
export function studyDays(data: AppData): Set<ISODate> {
  const days = new Set<ISODate>();
  for (const s of data.sessions) if (s.actualMinutes > 0) days.add(s.day);
  for (const e of data.study) if (e.minutes > 0) days.add(e.day);
  return days;
}

export interface StreakInfo {
  current: number;
  longest: number;
  studiedToday: boolean;
}

/** Current streak counts consecutive days up to today (or yesterday if today
 *  hasn't been logged yet, so the streak isn't "broken" before the day ends). */
export function computeStreak(data: AppData): StreakInfo {
  const days = studyDays(data);
  const today = todayISO();
  const studiedToday = days.has(today);

  let current = 0;
  let cursor = studiedToday ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Longest streak across all history.
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: ISODate | null = null;
  for (const d of sorted) {
    if (prev && parseISO(d).getTime() - parseISO(prev).getTime() === 86_400_000) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest: Math.max(longest, current), studiedToday };
}

export function minutesOn(data: AppData, day: ISODate): number {
  let total = 0;
  for (const s of data.sessions) if (s.day === day) total += s.actualMinutes;
  for (const e of data.study) if (e.day === day) total += e.minutes;
  return total;
}

export function focusMinutesOn(data: AppData, day: ISODate): number {
  return data.sessions
    .filter((s) => s.day === day)
    .reduce((sum, s) => sum + s.actualMinutes, 0);
}

export function recoveryColor(score: number): string {
  if (score >= 67) return '#16ec8b';
  if (score >= 34) return '#ffde5a';
  return '#ff4d6d';
}

export function recoveryLabel(score: number): string {
  if (score >= 67) return 'Green';
  if (score >= 34) return 'Yellow';
  return 'Red';
}

/**
 * Determines whether a cycled supplement is in its "on" phase for a given day.
 * Non-cycled supplements are always on.
 */
export function supplementPhase(
  supp: Supplement,
  day: ISODate = todayISO(),
): { on: boolean; weekInCycle: number; cycleWeeks: number; daysLeftInPhase: number } | null {
  if (!supp.cycle) return null;
  const { onWeeks, offWeeks, startDate } = supp.cycle;
  const cycleWeeks = onWeeks + offWeeks;
  const elapsedDays = Math.floor(
    (parseISO(day).getTime() - parseISO(startDate).getTime()) / 86_400_000,
  );
  if (elapsedDays < 0) {
    return { on: false, weekInCycle: 0, cycleWeeks, daysLeftInPhase: -elapsedDays };
  }
  const cycleLenDays = cycleWeeks * 7;
  const dayInCycle = elapsedDays % cycleLenDays;
  const weekInCycle = Math.floor(dayInCycle / 7);
  const on = dayInCycle < onWeeks * 7;
  const phaseEndDay = on ? onWeeks * 7 : cycleLenDays;
  const daysLeftInPhase = phaseEndDay - dayInCycle;
  return { on, weekInCycle, cycleWeeks, daysLeftInPhase };
}

/** Supplements expected to be taken today (cycle-aware, excluding archived). */
export function activeSupplements(data: AppData, day: ISODate = todayISO()): Supplement[] {
  return data.supplements.filter((s) => {
    if (s.archived) return false;
    const phase = supplementPhase(s, day);
    return phase ? phase.on : true;
  });
}
