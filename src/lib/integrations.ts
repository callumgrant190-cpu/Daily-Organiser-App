// Integration layer for Whoop (recovery) and Strava (activities).
//
// Real Whoop and Strava sync uses OAuth 2.0 and must run through a backend
// that holds your client secret and stores refresh tokens — it cannot be done
// safely from the browser alone. This module defines the seam where that
// backend call belongs, and ships a clearly-labelled SIMULATED sync so the
// feature is usable end-to-end today. Swap `simulate*` for real fetch() calls
// to your `/api/whoop` and `/api/strava` endpoints when credentials exist.

import type { Activity, ActivityType, RecoveryEntry } from '../types';
import { todayISO } from './date';

export const WHOOP_OAUTH_DOCS = 'https://developer.whoop.com/docs/developing/oauth';
export const STRAVA_OAUTH_DOCS = 'https://developers.strava.com/docs/authentication/';

function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

/** Simulated Whoop recovery for today. Replace with a real API response. */
export async function simulateWhoopRecovery(): Promise<RecoveryEntry> {
  await new Promise((r) => setTimeout(r, 650));
  const recovery = rand(28, 96);
  return {
    day: todayISO(),
    recovery,
    hrv: rand(35, 110),
    rhr: rand(46, 64),
    sleepHours: Math.round((rand(55, 85) / 10) * 10) / 10,
    sleepPerformance: rand(60, 99),
    source: 'whoop',
  };
}

/** Simulated recent Strava activities. Replace with a real API response. */
export async function simulateStravaActivities(): Promise<Omit<Activity, 'id'>[]> {
  await new Promise((r) => setTimeout(r, 650));
  const type: ActivityType = 'run';
  const distanceKm = Math.round(rand(40, 140) / 10) / 1; // 4.0–14.0 km
  const km = distanceKm / 10;
  const paceSecPerKm = rand(280, 380); // 4:40–6:20 /km
  const durationMin = Math.round((km * paceSecPerKm) / 60);
  return [
    {
      day: todayISO(),
      type,
      name: 'Morning Run',
      distanceKm: km,
      durationMin,
      paceSecPerKm,
      avgHr: rand(140, 168),
      calories: Math.round(km * 65),
      source: 'strava',
      externalId: `sim-${Date.now()}`,
    },
  ];
}
