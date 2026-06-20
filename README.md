# 🌳 Grove — Daily Organiser

A calm, focused daily organiser for students and self-improvers. Plant a tree
with every block of focused study, keep a streak alive, and track your training,
recovery, weight and supplements — all in one place.

Inspired by Forest (focus timer), Whoop (recovery) and Strava (activity).

## Features

- **🌲 Forest-style focus timer** — Pick a session length and start. A tree
  grows as you focus and is planted in your grove for **every 30 focused
  minutes**. Leave early and the tree withers, but any completed 30-minute
  block is still yours to keep. Your grove fills up as you study.
- **🔥 Study streaks** — Any day with focus time or a study log keeps your
  streak alive. The dashboard shows your current and longest streak plus an
  18-week consistency heatmap.
- **❤️ Recovery (Whoop-style)** — A colour-coded recovery ring (green / yellow /
  red) with HRV, resting HR and sleep. Enter it manually or **sync from Whoop**.
- **🏃 Activity (Strava)** — Log runs, rides, swims and strength sessions with
  distance, duration, pace and heart rate, or **sync from Strava**.
- **📚 Study log + smart recommendations** — Record what you study (subject,
  topic, method, confidence). The app recommends **evidence-based study
  methods** (active recall, spaced repetition, interleaving, Feynman and more)
  with how-to steps and the science behind each.
- **⚖️ Daily weigh-in** — Quick daily weight entry with a trend chart and
  7-day / since-start changes (kg or lb).
- **💊 Supplement log with cycles** — Tick off your daily stack. Mark any
  supplement as a **cycle** (e.g. 8 weeks on / 4 weeks off) and the app tracks
  which phase you're in and pauses it automatically during off weeks.

## Tech

- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts (weight trend)
- All data persists in your browser's `localStorage` — no account, no backend.
  Export / import a JSON backup from **Settings**.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Whoop & Strava sync

The **Connect / Sync** buttons are wired through `src/lib/integrations.ts`. In
this build they return clearly-labelled **simulated** data so the feature works
end-to-end with no setup.

Real Whoop and Strava sync uses OAuth 2.0 and must run through a small backend
that holds your client secret and stores refresh tokens — it can't be done
safely from the browser alone. `integrations.ts` marks exactly where those
backend calls belong; swap the `simulate*` functions for `fetch()` calls to your
own `/api/whoop` and `/api/strava` endpoints once you have credentials.

- Whoop OAuth: <https://developer.whoop.com/docs/developing/oauth>
- Strava API: <https://developers.strava.com/docs/authentication/>

## Project structure

```
src/
  components/ui/   Tree, recovery Ring, heatmap & shared bits
  lib/             date helpers, stats/streaks, study methods, integrations
  store/           localStorage-backed app store (React context)
  views/           Dashboard, Focus, Health, Study, Weight, Supplements, Settings
  types.ts         domain model
```
