import type { ReactNode } from 'react';
import { addDays, parseISO, todayISO } from '../../lib/date';
import type { ISODate } from '../../types';

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && <div className="grid h-11 w-11 place-items-center rounded-xl bg-moss-500/15 text-moss-400">{icon}</div>}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = 'text-white',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** A GitHub-style contribution heatmap of intensity per day. */
export function Heatmap({
  values,
  weeks = 18,
  colorFor,
  title,
}: {
  /** Map of ISO day → intensity (0..1). */
  values: Map<ISODate, number>;
  weeks?: number;
  colorFor?: (intensity: number) => string;
  title?: (day: ISODate, intensity: number) => string;
}) {
  const today = todayISO();
  // Align grid so the last column ends on this week.
  const end = parseISO(today);
  const endDow = end.getDay(); // 0 Sun..6 Sat
  const lastSaturday = addDays(today, 6 - endDow);
  const totalDays = weeks * 7;
  const start = addDays(lastSaturday, -(totalDays - 1));

  const cells: ISODate[] = [];
  for (let i = 0; i < totalDays; i++) cells.push(addDays(start, i));

  const cf =
    colorFor ??
    ((i: number) => {
      if (i <= 0) return 'rgba(255,255,255,0.05)';
      if (i < 0.34) return '#14532d';
      if (i < 0.67) return '#16a34a';
      return '#4ade80';
    });

  return (
    <div className="overflow-x-auto">
      <div
        className="grid grid-flow-col gap-1"
        style={{ gridTemplateRows: 'repeat(7, 1fr)' }}
      >
        {cells.map((day) => {
          const intensity = day > today ? -1 : values.get(day) ?? 0;
          const future = day > today;
          return (
            <div
              key={day}
              title={future ? day : (title ? title(day, intensity) : `${day}: ${Math.round(intensity * 100)}%`)}
              className="h-3.5 w-3.5 rounded-[3px]"
              style={{ background: future ? 'transparent' : cf(intensity), opacity: future ? 0.25 : 1 }}
            />
          );
        })}
      </div>
    </div>
  );
}
