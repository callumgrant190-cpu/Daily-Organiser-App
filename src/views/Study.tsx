import { useMemo, useState } from 'react';
import { BookOpen, Brain, ChevronDown, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { minutesToHm, prettyDate, todayISO } from '../lib/date';
import { RECALL_SPACING_SPLIT, STUDY_METHODS, methodById } from '../lib/studyMethods';
import type { StudyMethod } from '../lib/studyMethods';
import { PageHeader, EmptyState, StatTile } from '../components/ui/common';

export function StudyView() {
  return (
    <div>
      <PageHeader title="Study" subtitle="Track what you learn and study smarter." icon={<BookOpen size={22} />} />
      <div className="grid gap-6">
        <StudyLog />
        <Methods />
      </div>
    </div>
  );
}

function StudyLog() {
  const { data, addStudyEntry, removeStudyEntry } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', topic: '', minutes: '', method: '', confidence: 3, notes: '' });

  const totalMin = data.study.reduce((a, e) => a + e.minutes, 0);
  const subjects = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of data.study) m.set(e.subject, (m.get(e.subject) ?? 0) + e.minutes);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [data.study]);

  function save() {
    const minutes = Number(form.minutes);
    if (!form.subject.trim() || !minutes || isNaN(minutes)) return;
    addStudyEntry({
      day: todayISO(),
      subject: form.subject.trim(),
      topic: form.topic.trim() || undefined,
      minutes,
      method: form.method || undefined,
      confidence: form.confidence,
      notes: form.notes.trim() || undefined,
    });
    setForm({ subject: '', topic: '', minutes: '', method: '', confidence: 3, notes: '' });
    setOpen(false);
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen size={18} className="text-moss-400" />
        <h2 className="font-bold text-white">Study log</h2>
        <button className="btn-ghost ml-auto text-xs" onClick={() => setOpen((o) => !o)}>
          <Plus size={14} /> Add entry
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Total studied" value={minutesToHm(totalMin)} sub={`${data.study.length} entries`} accent="text-moss-300" />
        <StatTile label="Subjects" value={subjects.length} sub={subjects[0] ? `top: ${subjects[0][0]}` : '—'} />
        <StatTile label="Today" value={minutesToHm(data.study.filter((e) => e.day === todayISO()).reduce((a, e) => a + e.minutes, 0))} />
      </div>

      {open && (
        <div className="mb-4 grid gap-3 rounded-xl border border-white/10 bg-ink-900/40 p-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="label">Subject</label>
            <input className="input" placeholder="e.g. Biochemistry" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <label className="label">Topic (optional)</label>
            <input className="input" placeholder="e.g. Glycolysis" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Minutes</label>
            <input className="input" inputMode="numeric" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Method</label>
            <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="">—</option>
              {STUDY_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Confidence: {form.confidence}/5</label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.confidence}
              onChange={(e) => setForm({ ...form, confidence: Number(e.target.value) })}
              className="w-full accent-moss-500"
            />
          </div>
          <div className="sm:col-span-6">
            <label className="label">Notes (optional)</label>
            <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="sm:col-span-6">
            <button className="btn-primary" onClick={save}>
              Save entry
            </button>
          </div>
        </div>
      )}

      {data.study.length === 0 ? (
        <EmptyState title="Nothing logged yet" hint="Record a study session to build your history." />
      ) : (
        <div className="grid gap-2">
          {data.study.slice(0, 15).map((e) => {
            const method = methodById(e.method);
            return (
              <div key={e.id} className="group flex items-start gap-3 rounded-xl border border-white/5 bg-ink-900/40 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{e.subject}</span>
                    {e.topic && <span className="text-sm text-slate-400">· {e.topic}</span>}
                    {method && <span className="chip">{method.name}</span>}
                  </div>
                  {e.notes && <p className="mt-1 text-xs text-slate-400">{e.notes}</p>}
                  <div className="mt-1 text-[11px] text-slate-500">
                    {prettyDate(e.day)} · {minutesToHm(e.minutes)}
                    {e.confidence ? ` · confidence ${e.confidence}/5` : ''}
                  </div>
                </div>
                <button onClick={() => removeStudyEntry(e.id)} className="text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-recover-red">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Methods() {
  const [openId, setOpenId] = useState<string | null>('active-recall');
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Brain size={18} className="text-moss-400" />
        <h2 className="font-bold text-white">Recommended study methods</h2>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-moss-500/20 bg-moss-500/10 p-4">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-moss-300" />
        <p className="text-sm text-slate-200">
          <b className="text-moss-200">{RECALL_SPACING_SPLIT.headline}.</b> {RECALL_SPACING_SPLIT.detail}
        </p>
      </div>

      <div className="grid gap-2">
        {STUDY_METHODS.map((m) => (
          <MethodCard key={m.id} m={m} open={openId === m.id} onToggle={() => setOpenId(openId === m.id ? null : m.id)} />
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
        Recommendations summarise cognitive-science research on retrieval practice (Roediger &amp; Karpicke, 2006),
        the spacing effect and "desirable difficulties" (Bjork).
      </p>
    </section>
  );
}

function MethodCard({ m, open, onToggle }: { m: StudyMethod; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-900/40">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{m.name}</span>
            <span className={`chip ${m.evidence === 'strong' ? '!border-moss-500/40 !text-moss-300' : ''}`}>
              {m.evidence} evidence
            </span>
            <span className="chip">{m.effort} effort</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{m.tagline}</p>
        </div>
        <ChevronDown size={18} className={`shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="animate-floatIn border-t border-white/5 px-4 py-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {m.bestFor.map((b) => (
              <span key={b} className="chip">
                {b}
              </span>
            ))}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">How to do it</div>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-300">
            {m.how.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
          <div className="mt-3 rounded-lg bg-white/5 p-3 text-sm text-slate-300">
            <span className="font-semibold text-slate-200">Why it works: </span>
            {m.why}
          </div>
        </div>
      )}
    </div>
  );
}
