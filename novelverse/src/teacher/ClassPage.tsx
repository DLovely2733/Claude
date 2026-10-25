import { useApp, DEFAULT_SETTINGS } from '../state/store';
import { Icon } from '../components/Icon';
import type { Settings } from '../data/types';
import { toast } from '../components/toast';
import { navigate } from '../lib/router';

const PRESETS: { key: keyof Settings; label: string; on: unknown }[] = [
  { key: 'plainLanguage', label: 'Plain language', on: true },
  { key: 'shortInstructions', label: 'Short instructions', on: true },
  { key: 'readAloud', label: 'Read-aloud', on: true },
  { key: 'sentenceFrames', label: 'Sentence starters', on: true },
  { key: 'textScale', label: 'Larger text', on: 1.2 },
  { key: 'highContrast', label: 'High contrast', on: true },
  { key: 'reducedMotion', label: 'Reduced motion', on: true },
];

export function ClassPage() {
  const roster = useApp((s) => s.roster);
  const savePresets = useApp((s) => s.saveStudentPresets);
  const resetDemo = useApp((s) => s.resetDemo);

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <span className="hud" style={{ color: 'var(--accent-2)' }}>Class</span>
      <h1>Cadets and default supports</h1>
      <p className="text-2" style={{ maxWidth: 760 }}>
        Set the supports a cadet starts with. Students can always change their own settings, and anyone can use any support. NovelVerse never labels students by ability or infers needs from their answers.
      </p>

      <div className="table-wrap panel" style={{ padding: 0, marginTop: '1rem' }}>
        <table className="table">
          <thead><tr><th scope="col">Cadet</th><th scope="col">Default supports</th></tr></thead>
          <tbody>
            {roster.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.callSign}</strong><br /><span className="tiny muted">synthetic</span></td>
                <td>
                  <div className="row" style={{ gap: '0.3rem' }}>
                    {PRESETS.map((p) => {
                      const on = s.presets?.[p.key] !== undefined && s.presets[p.key] !== DEFAULT_SETTINGS[p.key];
                      return (
                        <button key={p.key} type="button" className="chip" aria-pressed={on} onClick={() => {
                          const next = { ...s.presets };
                          if (on) delete next[p.key]; else (next as Record<string, unknown>)[p.key] = p.on;
                          savePresets(s.id, next);
                        }}>{p.label}</button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="panel" style={{ marginTop: '1.5rem' }}>
        <h2 className="hud accent"><Icon name="shield" size={16} /> Privacy</h2>
        <ul className="small">
          <li>Demo mode uses synthetic call signs only. There are no accounts, names, emails or recordings.</li>
          <li>All data stays in this browser’s local storage. Nothing is sent to a server.</li>
          <li>Real classroom use needs a school-approved, access-controlled backend designed around Alberta’s privacy obligations for schools (see the project README). Do not type real student names into the demo.</li>
        </ul>
        <button className="btn danger small" onClick={() => {
          if (confirm('Reset the whole demo? This restores the original novel, mission and synthetic class, and clears your edits.')) { resetDemo(); toast('Demo reset'); navigate('/teacher'); }
        }}>Reset demo data</button>
      </section>
    </div>
  );
}
