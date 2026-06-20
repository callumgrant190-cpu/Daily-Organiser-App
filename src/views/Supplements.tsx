import { useMemo, useState } from 'react';
import { Check, CircleDashed, Pill, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { lastNDays, prettyDate, todayISO } from '../lib/date';
import { supplementPhase } from '../lib/stats';
import type { Supplement } from '../types';
import { PageHeader, EmptyState, StatTile } from '../components/ui/common';

export function Supplements() {
  const { data, addSupplement, removeSupplement, toggleSupplementLog } = useStore();
  const today = todayISO();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dose: '',
    timing: 'Morning',
    cycled: false,
    onWeeks: '8',
    offWeeks: '4',
    startDate: today,
  });

  const takenToday = useMemo(() => {
    const set = new Set<string>();
    for (const l of data.supplementLogs) if (l.day === today && l.taken) set.add(l.supplementId);
    return set;
  }, [data.supplementLogs, today]);

  const visible = data.supplements.filter((s) => !s.archived);
  const dueToday = visible.filter((s) => {
    const phase = supplementPhase(s, today);
    return phase ? phase.on : true;
  });

  // 7-day adherence across supplements that were "on" each day.
  const adherence = useMemo(() => {
    const days = lastNDays(7);
    let due = 0;
    let done = 0;
    for (const day of days) {
      for (const s of visible) {
        const phase = supplementPhase(s, day);
        const on = phase ? phase.on : true;
        if (!on) continue;
        due++;
        if (data.supplementLogs.some((l) => l.day === day && l.supplementId === s.id && l.taken)) done++;
      }
    }
    return due === 0 ? null : Math.round((done / due) * 100);
  }, [visible, data.supplementLogs]);

  function save() {
    if (!form.name.trim()) return;
    addSupplement({
      name: form.name.trim(),
      dose: form.dose.trim() || undefined,
      timing: form.timing || undefined,
      cycle: form.cycled
        ? {
            onWeeks: Math.max(1, Number(form.onWeeks) || 1),
            offWeeks: Math.max(0, Number(form.offWeeks) || 0),
            startDate: form.startDate,
          }
        : undefined,
    });
    setForm({ name: '', dose: '', timing: 'Morning', cycled: false, onWeeks: '8', offWeeks: '4', startDate: today });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Supplements"
        subtitle="Tick off today's stack and keep cycles on schedule."
        icon={<Pill size={22} />}
        action={
          <button className="btn-ghost text-xs" onClick={() => setOpen((o) => !o)}>
            <Plus size={14} /> Add supplement
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Due today" value={dueToday.length} sub={`${takenToday.size} taken`} accent="text-moss-300" />
        <StatTile label="7-day adherence" value={adherence == null ? '—' : `${adherence}%`} />
        <StatTile label="In your stack" value={visible.length} />
      </div>

      {open && (
        <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="label">Name</label>
            <input className="input" placeholder="e.g. Creatine monohydrate" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Dose</label>
            <input className="input" placeholder="e.g. 5 g" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} />
          </div>
          <div className="sm:col-span-1">
            <label className="label">Timing</label>
            <select className="input" value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })}>
              {['Morning', 'Midday', 'Pre-workout', 'Post-workout', 'Evening', 'With food'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-6">
            <input type="checkbox" className="h-4 w-4 accent-moss-500" checked={form.cycled} onChange={(e) => setForm({ ...form, cycled: e.target.checked })} />
            Run this as a cycle (on for some weeks, then off)
          </label>

          {form.cycled && (
            <div className="grid gap-3 rounded-xl border border-white/10 bg-ink-900/40 p-3 sm:col-span-6 sm:grid-cols-3">
              <div>
                <label className="label">On (weeks)</label>
                <input className="input" inputMode="numeric" value={form.onWeeks} onChange={(e) => setForm({ ...form, onWeeks: e.target.value })} />
              </div>
              <div>
                <label className="label">Off (weeks)</label>
                <input className="input" inputMode="numeric" value={form.offWeeks} onChange={(e) => setForm({ ...form, offWeeks: e.target.value })} />
              </div>
              <div>
                <label className="label">Cycle start</label>
                <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
            </div>
          )}

          <div className="sm:col-span-6">
            <button className="btn-primary" onClick={save}>
              Add to stack
            </button>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="mb-3 font-bold text-white">Today · {prettyDate(today)}</h2>
        {visible.length === 0 ? (
          <EmptyState title="No supplements yet" hint="Add your first supplement to start logging." />
        ) : (
          <div className="grid gap-2">
            {visible.map((s) => (
              <SupplementRow
                key={s.id}
                s={s}
                taken={takenToday.has(s.id)}
                onToggle={() => toggleSupplementLog(s.id, today, !takenToday.has(s.id))}
                onRemove={() => removeSupplement(s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SupplementRow({
  s,
  taken,
  onToggle,
  onRemove,
}: {
  s: Supplement;
  taken: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const phase = supplementPhase(s);
  const off = phase ? !phase.on : false;

  return (
    <div className={`group flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3 ${off ? 'bg-ink-900/20 opacity-70' : 'bg-ink-900/40'}`}>
      <button
        onClick={onToggle}
        disabled={off}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
          taken ? 'border-moss-500 bg-moss-500 text-ink-900' : 'border-white/20 text-slate-500 hover:border-moss-500/60'
        } ${off ? 'cursor-not-allowed' : ''}`}
        aria-label={taken ? 'Mark not taken' : 'Mark taken'}
      >
        {taken ? <Check size={18} strokeWidth={3} /> : <CircleDashed size={18} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">{s.name}</span>
          {s.dose && <span className="text-sm text-slate-400">{s.dose}</span>}
          {s.timing && <span className="chip">{s.timing}</span>}
          {s.cycle && (
            <span className={`chip ${off ? '' : '!border-moss-500/40 !text-moss-300'}`}>
              <RotateCcw size={11} />
              {off ? 'Off cycle' : 'On cycle'}
            </span>
          )}
        </div>
        {phase && (
          <div className="mt-0.5 text-[11px] text-slate-500">
            {off ? 'Resuming' : 'Continues'} in {phase.daysLeftInPhase} day{phase.daysLeftInPhase === 1 ? '' : 's'} · week{' '}
            {phase.weekInCycle + 1} of {phase.cycleWeeks} ({s.cycle!.onWeeks} on / {s.cycle!.offWeeks} off)
          </div>
        )}
      </div>

      <button onClick={onRemove} className="text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-recover-red">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
