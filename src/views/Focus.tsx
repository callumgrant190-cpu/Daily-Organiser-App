import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Sparkles, Timer, TreeDeciduous, X } from 'lucide-react';
import { randomSpecies, useStore } from '../store/AppStore';
import { todayISO } from '../lib/date';
import { minutesToHm } from '../lib/date';
import type { Tree as TreeT, TreeSpecies } from '../types';
import { Tree } from '../components/ui/Tree';
import { PageHeader, StatTile, EmptyState } from '../components/ui/common';

const PRESETS = [25, 30, 45, 60, 90, 120];
const MIN_TREE_MINUTES = 30;

type Phase = 'idle' | 'running' | 'paused' | 'done';

export function Focus() {
  const { data, recordSession } = useStore();
  const [planned, setPlanned] = useState(data.settings.focusLengthMin || 30);
  const [subject, setSubject] = useState('');
  const [species, setSpecies] = useState<TreeSpecies>(() => randomSpecies());
  const [phase, setPhase] = useState<Phase>('idle');

  // Timer is timestamp-based so it stays accurate across tab switches.
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number>(0); // performance.now() at last (re)start
  const baseRef = useRef<number>(0); // accumulated ms before current run
  const startedAtRef = useRef<string>('');
  const [celebrate, setCelebrate] = useState<number | null>(null);

  const plannedMs = planned * 60_000;
  const remainingMs = Math.max(0, plannedMs - elapsedMs);
  const growth = Math.min(1, plannedMs === 0 ? 0 : elapsedMs / plannedMs);
  const elapsedMin = elapsedMs / 60_000;
  const treesGrowing = Math.floor(elapsedMin / MIN_TREE_MINUTES);

  // Tick while running.
  useEffect(() => {
    if (phase !== 'running') return;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const next = baseRef.current + (now - startRef.current);
      setElapsedMs(next);
      if (next >= plannedMs) {
        finish(plannedMs);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, plannedMs]);

  function start() {
    setSpecies(randomSpecies());
    baseRef.current = 0;
    startRef.current = performance.now();
    startedAtRef.current = new Date().toISOString();
    setElapsedMs(0);
    setPhase('running');
  }

  function pause() {
    baseRef.current += performance.now() - startRef.current;
    setPhase('paused');
  }

  function resume() {
    startRef.current = performance.now();
    setPhase('running');
  }

  function finish(finalMs: number) {
    const actualMin = Math.floor(finalMs / 60_000);
    const completed = finalMs >= plannedMs;
    const treesEarned = Math.floor(actualMin / MIN_TREE_MINUTES);
    const day = todayISO();

    const trees: Omit<TreeT, 'id'>[] = [];
    if (treesEarned > 0) {
      for (let i = 0; i < treesEarned; i++) {
        trees.push({
          species: i === 0 ? species : randomSpecies(),
          plantedAt: new Date().toISOString(),
          day,
          subject: subject || undefined,
          minutes: MIN_TREE_MINUTES,
          alive: true,
        });
      }
    } else if (actualMin >= 1) {
      // A short or abandoned session leaves a withered sprout as a memento.
      trees.push({
        species,
        plantedAt: new Date().toISOString(),
        day,
        subject: subject || undefined,
        minutes: actualMin,
        alive: false,
      });
    }

    recordSession(
      {
        startedAt: startedAtRef.current || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        day,
        plannedMinutes: planned,
        actualMinutes: actualMin,
        subject: subject || undefined,
        completed,
        treesEarned,
      },
      trees,
    );
    setPhase('done');
    setCelebrate(treesEarned);
  }

  function giveUp() {
    const now = performance.now();
    const finalMs = phase === 'running' ? baseRef.current + (now - startRef.current) : baseRef.current;
    finish(finalMs);
  }

  function reset() {
    setPhase('idle');
    setElapsedMs(0);
    setCelebrate(null);
    setSubject('');
  }

  const mm = Math.floor(remainingMs / 60_000);
  const ss = Math.floor((remainingMs % 60_000) / 1000);
  const timeStr = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  const todaysTrees = data.trees.filter((t) => t.day === todayISO() && t.alive).length;
  const livingTrees = data.trees.filter((t) => t.alive).length;
  const focusMinToday = data.sessions
    .filter((s) => s.day === todayISO())
    .reduce((a, s) => a + s.actualMinutes, 0);

  return (
    <div>
      <PageHeader
        title="Focus"
        subtitle="Plant a tree with every 30 minutes of distraction-free study."
        icon={<Timer size={22} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card flex flex-col items-center p-6 lg:col-span-2">
          {phase === 'idle' && (
            <div className="w-full">
              <div className="mb-4 flex flex-wrap gap-2">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setPlanned(m)}
                    className={`chip ${planned === m ? '!border-moss-500/60 !bg-moss-500/15 !text-moss-300' : ''}`}
                  >
                    {minutesToHm(m)}
                  </button>
                ))}
              </div>
              <input
                className="input mb-4"
                placeholder="What are you focusing on? (e.g. Organic Chemistry — Ch. 4)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <div className="grid place-items-center py-4">
                <Tree species={species} growth={0.12} size={170} />
              </div>
              <p className="mb-4 text-center text-sm text-slate-400">
                You'll grow <b className="text-moss-300">{Math.max(1, Math.floor(planned / 30))}</b>{' '}
                tree{Math.floor(planned / 30) === 1 ? '' : 's'} this session.
              </p>
              <button className="btn-primary w-full" onClick={start}>
                <Play size={18} /> Plant & start {minutesToHm(planned)}
              </button>
            </div>
          )}

          {(phase === 'running' || phase === 'paused') && (
            <div className="flex w-full flex-col items-center">
              <div className={`grid place-items-center py-2 ${phase === 'running' ? 'animate-sway' : ''}`}>
                <Tree species={species} growth={Math.max(0.12, growth)} size={200} />
              </div>
              <div className="font-mono text-5xl font-bold tabular-nums text-white">{timeStr}</div>
              <p className="mt-2 text-sm text-slate-400">
                {subject ? <span className="text-slate-300">{subject}</span> : 'Stay on task'} ·{' '}
                {treesGrowing > 0 ? `${treesGrowing} tree${treesGrowing > 1 ? 's' : ''} secured` : 'first tree growing'}
              </p>
              <div className="mt-5 flex gap-2">
                {phase === 'running' ? (
                  <button className="btn-ghost" onClick={pause}>
                    <Pause size={18} /> Pause
                  </button>
                ) : (
                  <button className="btn-primary" onClick={resume}>
                    <Play size={18} /> Resume
                  </button>
                )}
                <button className="btn-danger" onClick={giveUp}>
                  <X size={18} /> Give up
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                Leaving early withers the tree — but any full 30-minute block is still yours to keep.
              </p>
            </div>
          )}

          {phase === 'done' && (
            <div className="flex w-full flex-col items-center py-4 text-center">
              {celebrate && celebrate > 0 ? (
                <>
                  <div className="mb-2 flex items-end gap-1">
                    {Array.from({ length: Math.min(celebrate, 5) }).map((_, i) => (
                      <Tree key={i} species={randomSpecies()} growth={1} size={i === 0 ? 120 : 90} className="animate-grow" />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-lg font-bold text-moss-300">
                    <Sparkles size={20} /> {celebrate} tree{celebrate > 1 ? 's' : ''} planted!
                  </div>
                  <p className="mt-1 text-sm text-slate-400">Nice work. Your grove is growing.</p>
                </>
              ) : (
                <>
                  <Tree species={species} growth={0.5} alive={false} size={130} />
                  <div className="mt-2 text-lg font-bold text-slate-300">Session ended early</div>
                  <p className="mt-1 text-sm text-slate-500">
                    No full 30-minute block this time — try a shorter preset next round.
                  </p>
                </>
              )}
              <button className="btn-primary mt-5" onClick={reset}>
                Start another
              </button>
            </div>
          )}
        </div>

        <div className="grid content-start gap-4">
          <StatTile label="Trees today" value={todaysTrees} sub={`${minutesToHm(focusMinToday)} focused`} accent="text-moss-300" />
          <StatTile label="Grove total" value={livingTrees} sub="living trees earned" />
          <StatTile
            label="Sessions"
            value={data.sessions.length}
            sub={`${data.sessions.filter((s) => s.completed).length} completed in full`}
          />
        </div>
      </div>

      <ForestGrid trees={data.trees} />
    </div>
  );
}

function ForestGrid({ trees }: { trees: TreeT[] }) {
  const recent = useMemo(() => [...trees].slice(0, 60), [trees]);
  return (
    <div className="card mt-6 p-5">
      <div className="mb-3 flex items-center gap-2">
        <TreeDeciduous size={18} className="text-moss-400" />
        <h2 className="font-bold text-white">Your grove</h2>
        <span className="chip ml-auto">{trees.filter((t) => t.alive).length} living</span>
      </div>
      {recent.length === 0 ? (
        <EmptyState title="No trees yet" hint="Complete a focus session to plant your first tree." />
      ) : (
        <div className="flex flex-wrap gap-1">
          {recent.map((t) => (
            <div key={t.id} title={`${t.species}${t.subject ? ` · ${t.subject}` : ''} · ${t.day}`}>
              <Tree species={t.species} growth={1} alive={t.alive} size={52} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
