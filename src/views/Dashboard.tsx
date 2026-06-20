import { useMemo } from 'react';
import { ArrowRight, Flame, HeartPulse, Pill, Scale, Target, TreeDeciduous } from 'lucide-react';
import type { Tab } from '../App';
import { useStore } from '../store/AppStore';
import { lastNDays, minutesToHm, todayISO } from '../lib/date';
import { activeSupplements, computeStreak, focusMinutesOn, minutesOn, recoveryColor, recoveryLabel } from '../lib/stats';
import { Ring } from '../components/ui/Ring';
import { Heatmap, PageHeader } from '../components/ui/common';

export function Dashboard({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { data } = useStore();
  const today = todayISO();
  const streak = useMemo(() => computeStreak(data), [data]);

  const studiedMin = minutesOn(data, today);
  const goal = data.settings.dailyStudyGoalMin;
  const goalPct = goal > 0 ? Math.min(100, (studiedMin / goal) * 100) : 0;
  const treesToday = data.trees.filter((t) => t.day === today && t.alive).length;
  const recovery = data.recovery.find((r) => r.day === today);
  const weight = [...data.weighIns].sort((a, b) => (a.day < b.day ? 1 : -1))[0];
  const wUnit = data.settings.weightUnit;

  const dueSupps = activeSupplements(data, today);
  const takenSupps = new Set(data.supplementLogs.filter((l) => l.day === today && l.taken).map((l) => l.supplementId));
  const suppsDone = dueSupps.filter((s) => takenSupps.has(s.id)).length;

  // Heatmap of focus intensity over recent weeks.
  const heat = useMemo(() => {
    const m = new Map<string, number>();
    for (const day of lastNDays(18 * 7)) {
      const min = focusMinutesOn(data, day) + (data.study.filter((e) => e.day === day).reduce((a, e) => a + e.minutes, 0));
      if (min > 0) m.set(day, Math.min(1, min / Math.max(60, goal)));
    }
    return m;
  }, [data, goal]);

  const name = data.settings.studentName.trim();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const wDisplay = weight
    ? `${(Math.round((wUnit === 'lb' ? weight.weightKg / 0.45359237 : weight.weightKg) * 10) / 10).toFixed(1)} ${wUnit}`
    : '—';

  return (
    <div>
      <PageHeader title={`${greeting}${name ? `, ${name}` : ''}`} subtitle="Here's your day at a glance." icon={<Target size={22} />} />

      {/* Streak banner */}
      <button
        onClick={() => onNavigate('focus')}
        className="card mb-4 flex w-full items-center gap-4 p-5 text-left transition hover:border-moss-500/30"
      >
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-recover-red/10">
          <Flame size={34} className={streak.current > 0 ? 'text-orange-400' : 'text-slate-600'} />
        </div>
        <div className="flex-1">
          <div className="text-3xl font-extrabold text-white">
            {streak.current} <span className="text-base font-semibold text-slate-400">day{streak.current === 1 ? '' : 's'} streak</span>
          </div>
          <div className="text-sm text-slate-400">
            {streak.studiedToday
              ? "You've studied today — keep it alive tomorrow."
              : streak.current > 0
                ? 'Study today to keep your streak going.'
                : 'Start a focus session to begin a streak.'}{' '}
            · Longest: {streak.longest}
          </div>
        </div>
        <ArrowRight size={20} className="text-slate-500" />
      </button>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Study goal */}
        <div className="card flex items-center gap-4 p-5">
          <Ring value={goalPct} size={96} stroke={11} color="#22c55e">
            <div className="text-center">
              <div className="text-lg font-extrabold text-white">{Math.round(goalPct)}%</div>
            </div>
          </Ring>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Study goal</div>
            <div className="text-xl font-bold text-white">{minutesToHm(studiedMin)}</div>
            <div className="text-xs text-slate-400">of {minutesToHm(goal)} · {treesToday} 🌳 today</div>
          </div>
        </div>

        {/* Recovery */}
        <button onClick={() => onNavigate('health')} className="card flex items-center gap-4 p-5 text-left transition hover:border-moss-500/30">
          <Ring value={recovery?.recovery ?? 0} size={96} stroke={11} color={recoveryColor(recovery?.recovery ?? 0)}>
            <div className="text-center">
              <HeartPulse size={20} className="mx-auto" style={{ color: recoveryColor(recovery?.recovery ?? 0) }} />
            </div>
          </Ring>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Recovery</div>
            <div className="text-xl font-bold text-white">{recovery ? `${Math.round(recovery.recovery)}%` : '—'}</div>
            <div className="text-xs text-slate-400">{recovery ? recoveryLabel(recovery.recovery) : 'Not logged'}</div>
          </div>
        </button>

        {/* Weight + supplements */}
        <div className="grid gap-4">
          <button onClick={() => onNavigate('weight')} className="card flex items-center gap-3 p-4 text-left transition hover:border-moss-500/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-moss-500/15 text-moss-300">
              <Scale size={18} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Weight</div>
              <div className="font-bold text-white">{wDisplay}</div>
            </div>
          </button>
          <button onClick={() => onNavigate('supplements')} className="card flex items-center gap-3 p-4 text-left transition hover:border-moss-500/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-moss-500/15 text-moss-300">
              <Pill size={18} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Supplements</div>
              <div className="font-bold text-white">
                {suppsDone}/{dueSupps.length} taken
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="card mt-4 p-5">
        <div className="mb-3 flex items-center gap-2">
          <TreeDeciduous size={18} className="text-moss-400" />
          <h2 className="font-bold text-white">Consistency</h2>
          <span className="ml-auto text-xs text-slate-500">last 18 weeks of focus &amp; study</span>
        </div>
        <Heatmap
          values={heat}
          title={(day, intensity) => `${day}: ${Math.round(intensity * 100)}% of goal`}
        />
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
          Less
          <span className="h-3 w-3 rounded-[3px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span className="h-3 w-3 rounded-[3px]" style={{ background: '#14532d' }} />
          <span className="h-3 w-3 rounded-[3px]" style={{ background: '#16a34a' }} />
          <span className="h-3 w-3 rounded-[3px]" style={{ background: '#4ade80' }} />
          More
        </div>
      </div>
    </div>
  );
}
