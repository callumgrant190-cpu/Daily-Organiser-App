import { useRef, useState } from 'react';
import { Download, Settings as SettingsIcon, Trash2, Upload } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { PageHeader } from '../components/ui/common';

export function SettingsView() {
  const { data, updateSettings, resetAll, exportJSON, importJSON } = useStore();
  const s = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  function download() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grove-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJSON(String(reader.result));
      setMsg(ok ? 'Backup restored.' : 'Could not read that file.');
      setTimeout(() => setMsg(''), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Preferences and your data." icon={<SettingsIcon size={22} />} />

      <div className="card mb-4 p-5">
        <h2 className="mb-4 font-bold text-white">Preferences</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Your name</label>
            <input className="input" value={s.studentName} placeholder="optional" onChange={(e) => updateSettings({ studentName: e.target.value })} />
          </div>
          <div>
            <label className="label">Weight unit</label>
            <select className="input" value={s.weightUnit} onChange={(e) => updateSettings({ weightUnit: e.target.value as 'kg' | 'lb' })}>
              <option value="kg">Kilograms (kg)</option>
              <option value="lb">Pounds (lb)</option>
            </select>
          </div>
          <div>
            <label className="label">Default focus length (min)</label>
            <input
              className="input"
              inputMode="numeric"
              value={s.focusLengthMin}
              onChange={(e) => updateSettings({ focusLengthMin: Math.max(5, Number(e.target.value) || 30) })}
            />
          </div>
          <div>
            <label className="label">Daily study goal (min)</label>
            <input
              className="input"
              inputMode="numeric"
              value={s.dailyStudyGoalMin}
              onChange={(e) => updateSettings({ dailyStudyGoalMin: Math.max(10, Number(e.target.value) || 120) })}
            />
          </div>
        </div>
      </div>

      <div className="card mb-4 p-5">
        <h2 className="mb-1 font-bold text-white">Your data</h2>
        <p className="mb-4 text-sm text-slate-400">
          Everything is stored locally in this browser. Export a backup to keep it safe or move it to another device.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={download}>
            <Download size={16} /> Export backup
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
        </div>
        {msg && <p className="mt-3 text-sm text-moss-300">{msg}</p>}
      </div>

      <div className="card border-recover-red/20 p-5">
        <h2 className="mb-1 font-bold text-recover-red">Danger zone</h2>
        <p className="mb-4 text-sm text-slate-400">Permanently delete all trees, sessions, logs and settings.</p>
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-300">Are you sure? This can't be undone.</span>
            <button
              className="btn-danger"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
              }}
            >
              Yes, delete everything
            </button>
            <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            <Trash2 size={16} /> Reset all data
          </button>
        )}
      </div>
    </div>
  );
}
