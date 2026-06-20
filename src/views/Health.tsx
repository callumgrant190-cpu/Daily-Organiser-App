import { useState } from 'react';
import {
  Activity as ActivityIcon,
  Bike,
  Footprints,
  HeartPulse,
  Moon,
  Plus,
  RefreshCw,
  Trash2,
  Waves,
  Wind,
  Dumbbell,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { prettyDate, secToPace, todayISO, minutesToHm } from '../lib/date';
import { recoveryColor, recoveryLabel } from '../lib/stats';
import { simulateStravaActivities, simulateWhoopRecovery, WHOOP_OAUTH_DOCS, STRAVA_OAUTH_DOCS } from '../lib/integrations';
import type { Activity, ActivityType } from '../types';
import { Ring } from '../components/ui/Ring';
import { PageHeader, EmptyState } from '../components/ui/common';

export function Health() {
  return (
    <div>
      <PageHeader title="Health" subtitle="Recovery and training, in one place." icon={<HeartPulse size={22} />} />
      <div className="grid gap-6">
        <Recovery />
        <ActivitySection />
      </div>
    </div>
  );
}

function Recovery() {
  const { data, upsertRecovery, removeRecovery, updateSettings } = useStore();
  const today = todayISO();
  const todayEntry = data.recovery.find((r) => r.day === today);
  const [form, setForm] = useState({ recovery: '', hrv: '', rhr: '', sleepHours: '', sleepPerformance: '' });
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);

  async function syncWhoop() {
    setSyncing(true);
    try {
      const entry = await simulateWhoopRecovery();
      upsertRecovery(entry);
      updateSettings({ whoopConnected: true });
    } finally {
      setSyncing(false);
    }
  }

  function save() {
    const recovery = Number(form.recovery);
    if (!form.recovery || isNaN(recovery)) return;
    upsertRecovery({
      day: today,
      recovery: Math.max(0, Math.min(100, recovery)),
      hrv: form.hrv ? Number(form.hrv) : undefined,
      rhr: form.rhr ? Number(form.rhr) : undefined,
      sleepHours: form.sleepHours ? Number(form.sleepHours) : undefined,
      sleepPerformance: form.sleepPerformance ? Number(form.sleepPerformance) : undefined,
      source: 'manual',
    });
    setForm({ recovery: '', hrv: '', rhr: '', sleepHours: '', sleepPerformance: '' });
    setOpen(false);
  }

  const score = todayEntry?.recovery ?? 0;

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <HeartPulse size={18} className="text-recover-green" />
        <h2 className="font-bold text-white">Recovery</h2>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost text-xs" onClick={syncWhoop} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {data.settings.whoopConnected ? 'Sync Whoop' : 'Connect Whoop'}
          </button>
          <button className="btn-ghost text-xs" onClick={() => setOpen((o) => !o)}>
            <Plus size={14} /> Manual
          </button>
        </div>
      </div>

      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="grid place-items-center">
          <Ring value={score} color={recoveryColor(score)} size={170} stroke={16}>
            {todayEntry ? (
              <div>
                <div className="text-4xl font-extrabold text-white">{Math.round(score)}%</div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: recoveryColor(score) }}>
                  {recoveryLabel(score)}
                </div>
              </div>
            ) : (
              <div className="px-6 text-center text-sm text-slate-400">No recovery logged today</div>
            )}
          </Ring>
        </div>

        <div>
          {todayEntry ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="HRV" value={todayEntry.hrv ? `${todayEntry.hrv}` : '—'} unit="ms" />
              <Metric label="Resting HR" value={todayEntry.rhr ? `${todayEntry.rhr}` : '—'} unit="bpm" />
              <Metric label="Sleep" value={todayEntry.sleepHours ? `${todayEntry.sleepHours}` : '—'} unit="h" />
              <Metric label="Sleep score" value={todayEntry.sleepPerformance ? `${todayEntry.sleepPerformance}` : '—'} unit="%" />
              <div className="col-span-2 sm:col-span-4">
                <span className="chip">
                  Source: {todayEntry.source === 'whoop' ? 'Whoop (simulated)' : 'Manual'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Recovery reflects how ready your body is to take on strain — green means go hard, red means
              prioritise rest. Sync from Whoop or log it manually.
            </p>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-ink-900/40 p-4 sm:grid-cols-5">
          <Field label="Recovery %" v={form.recovery} on={(v) => setForm({ ...form, recovery: v })} />
          <Field label="HRV (ms)" v={form.hrv} on={(v) => setForm({ ...form, hrv: v })} />
          <Field label="Resting HR" v={form.rhr} on={(v) => setForm({ ...form, rhr: v })} />
          <Field label="Sleep (h)" v={form.sleepHours} on={(v) => setForm({ ...form, sleepHours: v })} />
          <Field label="Sleep score" v={form.sleepPerformance} on={(v) => setForm({ ...form, sleepPerformance: v })} />
          <div className="sm:col-span-5">
            <button className="btn-primary" onClick={save}>
              Save recovery
            </button>
          </div>
        </div>
      )}

      {data.recovery.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent</div>
          <div className="flex flex-wrap gap-2">
            {data.recovery.slice(0, 10).map((r) => (
              <div key={r.day} className="group relative flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2">
                <Moon size={14} style={{ color: recoveryColor(r.recovery) }} />
                <div>
                  <div className="text-sm font-semibold text-white">{Math.round(r.recovery)}%</div>
                  <div className="text-[10px] text-slate-500">{prettyDate(r.day)}</div>
                </div>
                <button
                  onClick={() => removeRecovery(r.day)}
                  className="ml-1 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-recover-red"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
        Whoop sync is simulated in this build. Real sync needs OAuth via a small backend —{' '}
        <a className="underline hover:text-slate-400" href={WHOOP_OAUTH_DOCS} target="_blank" rel="noreferrer">
          see Whoop's OAuth docs
        </a>
        .
      </p>
    </section>
  );
}

const ACTIVITY_ICON: Record<ActivityType, typeof ActivityIcon> = {
  run: Footprints,
  ride: Bike,
  walk: Footprints,
  swim: Waves,
  strength: Dumbbell,
  other: Wind,
};

function ActivitySection() {
  const { data, addActivity, removeActivity, updateSettings } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ type: ActivityType; name: string; distanceKm: string; durationMin: string; avgHr: string }>({
    type: 'run',
    name: '',
    distanceKm: '',
    durationMin: '',
    avgHr: '',
  });

  async function syncStrava() {
    setSyncing(true);
    try {
      const acts = await simulateStravaActivities();
      acts.forEach((a) => addActivity(a));
      updateSettings({ stravaConnected: true });
    } finally {
      setSyncing(false);
    }
  }

  function save() {
    const durationMin = Number(form.durationMin);
    if (!durationMin || isNaN(durationMin)) return;
    const distanceKm = form.distanceKm ? Number(form.distanceKm) : undefined;
    const paceSecPerKm = distanceKm && distanceKm > 0 ? (durationMin * 60) / distanceKm : undefined;
    addActivity({
      day: todayISO(),
      type: form.type,
      name: form.name || defaultName(form.type),
      distanceKm,
      durationMin,
      paceSecPerKm,
      avgHr: form.avgHr ? Number(form.avgHr) : undefined,
      source: 'manual',
    });
    setForm({ type: 'run', name: '', distanceKm: '', durationMin: '', avgHr: '' });
    setOpen(false);
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <ActivityIcon size={18} className="text-moss-400" />
        <h2 className="font-bold text-white">Activity</h2>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost text-xs" onClick={syncStrava} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {data.settings.stravaConnected ? 'Sync Strava' : 'Connect Strava'}
          </button>
          <button className="btn-ghost text-xs" onClick={() => setOpen((o) => !o)}>
            <Plus size={14} /> Log
          </button>
        </div>
      </div>

      {open && (
        <div className="mb-4 grid gap-3 rounded-xl border border-white/10 bg-ink-900/40 p-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ActivityType })}>
              {(['run', 'ride', 'walk', 'swim', 'strength', 'other'] as ActivityType[]).map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4">
            <label className="label">Name</label>
            <input className="input" placeholder={defaultName(form.type)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <Field label="Distance (km)" v={form.distanceKm} on={(v) => setForm({ ...form, distanceKm: v })} span="sm:col-span-2" />
          <Field label="Duration (min)" v={form.durationMin} on={(v) => setForm({ ...form, durationMin: v })} span="sm:col-span-2" />
          <Field label="Avg HR" v={form.avgHr} on={(v) => setForm({ ...form, avgHr: v })} span="sm:col-span-2" />
          <div className="sm:col-span-6">
            <button className="btn-primary" onClick={save}>
              Save activity
            </button>
          </div>
        </div>
      )}

      {data.activities.length === 0 ? (
        <EmptyState title="No activities yet" hint="Log a run or sync from Strava." />
      ) : (
        <div className="grid gap-2">
          {data.activities.slice(0, 12).map((a) => (
            <ActivityRow key={a.id} a={a} onRemove={() => removeActivity(a.id)} />
          ))}
        </div>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
        Strava sync is simulated in this build. Real sync needs OAuth via a small backend —{' '}
        <a className="underline hover:text-slate-400" href={STRAVA_OAUTH_DOCS} target="_blank" rel="noreferrer">
          see Strava's API docs
        </a>
        .
      </p>
    </section>
  );
}

function ActivityRow({ a, onRemove }: { a: Activity; onRemove: () => void }) {
  const Icon = ACTIVITY_ICON[a.type];
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/5 bg-ink-900/40 px-4 py-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-moss-500/15 text-moss-300">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{a.name}</div>
        <div className="text-xs text-slate-400">
          {prettyDate(a.day)} · {a.source === 'strava' ? 'Strava (simulated)' : 'Manual'}
        </div>
      </div>
      <div className="hidden gap-5 text-right sm:flex">
        {a.distanceKm != null && <Stat v={`${a.distanceKm.toFixed(1)}`} u="km" />}
        <Stat v={minutesToHm(a.durationMin)} u="time" />
        {a.paceSecPerKm != null && <Stat v={secToPace(a.paceSecPerKm)} u="pace" />}
        {a.avgHr != null && <Stat v={`${a.avgHr}`} u="bpm" />}
      </div>
      <button onClick={onRemove} className="text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-recover-red">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function Stat({ v, u }: { v: string; u: string }) {
  return (
    <div>
      <div className="text-sm font-bold text-white">{v}</div>
      <div className="text-[10px] uppercase text-slate-500">{u}</div>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-ink-900/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-bold text-white">
        {value}
        <span className="ml-0.5 text-xs font-normal text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function Field({ label, v, on, span }: { label: string; v: string; on: (v: string) => void; span?: string }) {
  return (
    <div className={span}>
      <label className="label">{label}</label>
      <input className="input" inputMode="decimal" value={v} onChange={(e) => on(e.target.value)} />
    </div>
  );
}

function defaultName(t: ActivityType): string {
  const map: Record<ActivityType, string> = {
    run: 'Run',
    ride: 'Ride',
    walk: 'Walk',
    swim: 'Swim',
    strength: 'Strength session',
    other: 'Workout',
  };
  return map[t];
}
