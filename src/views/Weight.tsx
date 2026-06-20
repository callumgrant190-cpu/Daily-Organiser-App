import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Plus, Scale, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { parseISO, prettyDate, todayISO } from '../lib/date';
import { PageHeader, EmptyState, StatTile } from '../components/ui/common';

const KG_PER_LB = 0.45359237;

export function WeightView() {
  const { data, upsertWeighIn, removeWeighIn } = useStore();
  const unit = data.settings.weightUnit;
  const today = todayISO();
  const todayEntry = data.weighIns.find((w) => w.day === today);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');

  function toDisplay(kg: number): number {
    return unit === 'lb' ? kg / KG_PER_LB : kg;
  }
  function toKg(v: number): number {
    return unit === 'lb' ? v * KG_PER_LB : v;
  }

  function save() {
    const v = Number(value);
    if (!value || isNaN(v) || v <= 0) return;
    upsertWeighIn({ day: today, weightKg: toKg(v), note: note.trim() || undefined });
    setValue('');
    setNote('');
  }

  const sorted = useMemo(() => [...data.weighIns].sort((a, b) => (a.day < b.day ? -1 : 1)), [data.weighIns]);

  const chartData = sorted.map((w) => ({
    day: w.day,
    label: parseISO(w.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: Math.round(toDisplay(w.weightKg) * 10) / 10,
  }));

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const prev = sorted[sorted.length - 2];
  const change7 = useMemo(() => {
    if (!latest) return null;
    const target = parseISO(latest.day).getTime() - 7 * 86_400_000;
    let ref = sorted[0];
    for (const w of sorted) if (parseISO(w.day).getTime() <= target) ref = w;
    if (!ref || ref.day === latest.day) return null;
    return toDisplay(latest.weightKg) - toDisplay(ref.weightKg);
  }, [sorted, latest]);

  const u = unit;
  const fmt = (kg: number) => `${(Math.round(toDisplay(kg) * 10) / 10).toFixed(1)} ${u}`;

  return (
    <div>
      <PageHeader title="Weight" subtitle="A quick daily weigh-in keeps the trend honest." icon={<Scale size={22} />} />

      <div className="card mb-4 p-5">
        <div className="mb-3 text-sm font-semibold text-white">
          {todayEntry ? `Today: ${fmt(todayEntry.weightKg)}` : "Log today's weigh-in"}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <label className="label">Weight ({u})</label>
            <input className="input" inputMode="decimal" placeholder={u === 'kg' ? '74.5' : '164'} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="label">Note (optional)</label>
            <input className="input" placeholder="e.g. post-run, fasted" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={save}>
            <Plus size={16} /> {todayEntry ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Latest" value={latest ? fmt(latest.weightKg) : '—'} />
        <StatTile
          label="7-day change"
          value={change7 == null ? '—' : `${change7 >= 0 ? '+' : ''}${change7.toFixed(1)} ${u}`}
          accent={change7 == null ? 'text-white' : change7 <= 0 ? 'text-moss-300' : 'text-recover-yellow'}
          sub={prev ? `prev ${fmt(prev.weightKg)}` : undefined}
        />
        <StatTile
          label="Since start"
          value={first && latest ? `${(toDisplay(latest.weightKg) - toDisplay(first.weightKg)).toFixed(1)} ${u}` : '—'}
          sub={first ? `from ${fmt(first.weightKg)}` : undefined}
        />
        <StatTile label="Entries" value={data.weighIns.length} />
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          {change7 != null && (change7 <= 0 ? <TrendingDown size={18} className="text-moss-400" /> : <TrendingUp size={18} className="text-recover-yellow" />)}
          <h2 className="font-bold text-white">Trend</h2>
        </div>
        {chartData.length < 2 ? (
          <EmptyState title="Not enough data yet" hint="Log at least two days to see your trend line." />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(v: number) => [`${v} ${u}`, 'Weight']}
                />
                <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5} fill="url(#wgrad)" dot={{ r: 2.5, fill: '#22c55e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="card mt-4 p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">History</div>
          <div className="grid gap-1.5">
            {[...sorted].reverse().slice(0, 14).map((w) => (
              <div key={w.day} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <span className="w-28 text-sm text-slate-400">{prettyDate(w.day)}</span>
                <span className="font-semibold text-white">{fmt(w.weightKg)}</span>
                {w.note && <span className="truncate text-xs text-slate-500">{w.note}</span>}
                <button onClick={() => removeWeighIn(w.day)} className="ml-auto text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-recover-red">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
