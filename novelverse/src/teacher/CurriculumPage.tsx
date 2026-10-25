import { useState } from 'react';
import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { parseOutcomes } from '../data/curriculum';
import { uid } from '../lib/id';
import type { CurriculumProfile } from '../data/types';
import { toast } from '../components/toast';

export function CurriculumPage() {
  const profiles = useApp((s) => s.profiles);
  const activeId = useApp((s) => s.activeProfileId);
  const setActive = useApp((s) => s.setActiveProfile);
  const saveProfile = useApp((s) => s.saveProfile);
  const profile = profiles.find((p) => p.id === activeId) ?? profiles[0];
  const [paste, setPaste] = useState('');
  const [name, setName] = useState('');

  const set = (p: Partial<CurriculumProfile>) => saveProfile({ ...profile, ...p });
  const groups = [...new Set(profile.outcomes.map((o) => o.group))];
  const unverified = profile.outcomes.filter((o) => o.status === 'unverified').length;

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <span className="hud" style={{ color: 'var(--accent-2)' }}>Curriculum profiles</span>
      <h1>Learning outcomes</h1>
      <p className="text-2" style={{ maxWidth: 760 }}>
        Missions tag their rooms with outcomes from the active profile. NovelVerse does not invent outcome codes: the built-in profile lists only the general and specific outcome headings, marked unverified until you check them against the current Alberta document. You can paste your own outcomes as a new profile at any time.
      </p>

      <div className="row" style={{ marginTop: '1rem' }}>
        <label className="row small" style={{ flex: '1 1 320px', minWidth: 0 }}>Active profile
          <select className="select" style={{ flex: 1, minWidth: 0, maxWidth: 560 }} value={profile.id} onChange={(e) => setActive(e.target.value)}>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        {unverified > 0 && <span className="verify">{unverified} unverified</span>}
      </div>

      <section className="panel" style={{ marginTop: '1rem' }}>
        <div className="grid cols-2">
          <div className="field"><label htmlFor="cp-name">Profile name</label><input id="cp-name" className="input" value={profile.name} onChange={(e) => set({ name: e.target.value })} /></div>
          <div className="field"><label htmlFor="cp-src">Source</label><input id="cp-src" className="input" value={profile.source} onChange={(e) => set({ source: e.target.value })} /></div>
        </div>
        <p className="small muted">{profile.note}</p>
        {groups.map((g) => (
          <div key={g} style={{ marginTop: '1rem' }}>
            <h2 className="h3" style={{ fontSize: '1rem' }}>{g}</h2>
            <ul className="le-list">
              {profile.outcomes.filter((o) => o.group === g).map((o) => (
                <li key={o.id} className="le-item">
                  <div className="le-head" style={{ gap: '0.5rem' }}>
                    <input className="input mono" style={{ width: 90 }} aria-label="Code" value={o.code} onChange={(e) => set({ outcomes: profile.outcomes.map((x) => (x.id === o.id ? { ...x, code: e.target.value } : x)) })} />
                    <input className="input grow" aria-label="Outcome" value={o.label} onChange={(e) => set({ outcomes: profile.outcomes.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })} />
                    {o.status === 'unverified'
                      ? <button className="btn small" onClick={() => set({ outcomes: profile.outcomes.map((x) => (x.id === o.id ? { ...x, status: 'verified' } : x)) })}>Mark verified</button>
                      : <span className="verify ok">Verified</span>}
                    <button className="btn quiet small" aria-label="Delete outcome" onClick={() => set({ outcomes: profile.outcomes.filter((x) => x.id !== o.id) })}><Icon name="trash" size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button className="btn ghost small" style={{ marginTop: '0.75rem' }} onClick={() => set({ outcomes: [...profile.outcomes, { id: uid('o'), code: '', label: '', group: groups[groups.length - 1] ?? 'Outcomes', status: 'verified' }] })}>
          <Icon name="plus" size={14} /> Add outcome
        </button>
      </section>

      <OutcomeCoverage profile={profile} />

      <section className="panel" style={{ marginTop: '1.5rem' }}>
        <h2 className="hud accent">Import outcomes as a new profile</h2>
        <p className="small muted">Paste from your official document. One outcome per line as <span className="mono">CODE | description</span>. A line without a separator starts a new group.</p>
        <div className="field"><label htmlFor="cp-new">New profile name</label><input id="cp-new" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ELA 9 — school outcomes 2026–27" /></div>
        <textarea className="textarea" style={{ marginTop: '0.5rem' }} aria-label="Outcomes to import" value={paste} onChange={(e) => setPaste(e.target.value)} />
        <div className="row end" style={{ marginTop: '0.5rem' }}>
          <button className="btn small" disabled={!paste.trim() || !name.trim()} onClick={() => {
            const id = uid('profile');
            const outcomes = parseOutcomes(paste, id);
            if (!outcomes.length) { toast('No outcomes found. Use CODE | description'); return; }
            saveProfile({ id, name: name.trim(), source: 'Imported by teacher', note: 'Imported from the teacher’s document.', outcomes });
            setActive(id);
            setPaste(''); setName('');
            toast(`${outcomes.length} outcomes imported`);
          }}>Import</button>
        </div>
      </section>

      <RubricEditor />
    </div>
  );
}

function RubricEditor() {
  const rubric = useApp((s) => s.rubric);
  const save = useApp((s) => s.saveRubric);
  return (
    <section className="panel" style={{ marginTop: '1.5rem' }} aria-labelledby="rub-h">
      <h2 id="rub-h" className="hud accent">Assessment rubric</h2>
      <p className="small muted">Used in Review for every room. Game progress never feeds into these levels; you assess the thinking.</p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Criterion</th>
              {rubric.levelNames.map((l, i) => (
                <th scope="col" key={i}><input className="input small" aria-label={`Level ${i + 1} name`} value={l}
                  onChange={(e) => save({ ...rubric, levelNames: rubric.levelNames.map((x, j) => (j === i ? e.target.value : x)) })} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map((c) => (
              <tr key={c.id}>
                <th scope="row"><input className="input" aria-label="Criterion name" value={c.name} onChange={(e) => save({ ...rubric, criteria: rubric.criteria.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)) })} /></th>
                {c.levels.map((d, i) => (
                  <td key={i}><textarea className="textarea" style={{ minHeight: 80 }} aria-label={`${c.name}, ${rubric.levelNames[i]}`} value={d}
                    onChange={(e) => save({ ...rubric, criteria: rubric.criteria.map((x) => (x.id === c.id ? { ...x, levels: x.levels.map((y, j) => (j === i ? e.target.value : y)) } : x)) })} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Which rooms address each outcome, and how much assessed evidence exists. */
function OutcomeCoverage({ profile }: { profile: CurriculumProfile }) {
  const missions = Object.values(useApp((s) => s.missions));
  const responses = Object.values(useApp((s) => s.responses)).filter((r) => r.studentId !== 'teacher-preview');
  return (
    <section className="panel" style={{ marginTop: '1.5rem' }} aria-labelledby="cov-h">
      <h2 id="cov-h" className="hud accent">Outcome coverage</h2>
      <p className="small muted">Rooms that address each outcome, with logged responses and teacher-assessed responses. Gaps show where to plan next.</p>
      <div className="table-wrap">
        <table className="table coverage">
          <thead>
            <tr>
              <th scope="col">Outcome</th>
              {missions.map((m) => <th scope="col" key={m.id}>{m.title}{m.status !== 'published' && <span className="tiny muted"> (draft)</span>}</th>)}
              <th scope="col">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {profile.outcomes.map((o) => {
              let logged = 0, assessed = 0;
              return (
                <tr key={o.id}>
                  <th scope="row"><span className="mono accent-text">{o.code}</span> {o.label}</th>
                  {missions.map((m) => {
                    const rooms = m.steps.filter((st) => st.outcomes.includes(o.id) || (m.outcomes.includes(o.id) && !st.outcomes.length));
                    const rs = responses.filter((r) => r.missionId === m.id && rooms.some((st) => st.id === r.stepId) && r.status === 'submitted');
                    logged += rs.length;
                    assessed += rs.filter((r) => r.review?.finalized).length;
                    return (
                      <td key={m.id}>
                        {rooms.length ? <span className="cov-cell on" title={rooms.map((x) => x.title).join(', ')}>{rooms.length} room{rooms.length > 1 ? 's' : ''}</span>
                          : m.outcomes.includes(o.id) ? <span className="cov-cell part">mission</span> : <span className="cov-cell" aria-label="not covered">·</span>}
                      </td>
                    );
                  })}
                  <td className="small">{logged ? `${logged} logged · ${assessed} assessed` : <span className="muted">none yet</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
