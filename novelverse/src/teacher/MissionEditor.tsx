import { useMemo, useState } from 'react';
import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { href, navigate } from '../lib/router';
import { generateMission, placeholdersIn, rangeLabel, templateFromMission } from '../lib/generator';
import { lockedMissionChapters } from '../lib/knowledge';
import { uid } from '../lib/id';
import type { Mission, MissionStep, StepType } from '../data/types';
import { StepEditor } from './StepEditor';
import { MultiPick } from './ListEditor';
import { ENGINE_CATALOG } from './engines';
import { STEP_META } from '../student/stepMeta';
import { toast } from '../components/toast';

function readGaps(id: string): string[] {
  try { return JSON.parse(sessionStorage.getItem(`gaps:${id}`) ?? '[]'); } catch { return []; }
}

export function MissionEditor({ missionId }: { missionId: string }) {
  const mission = useApp((s) => s.missions[missionId]);
  const novel = useApp((s) => (mission ? s.novels[mission.novelId] : undefined));
  const profiles = useApp((s) => s.profiles);
  const saveMission = useApp((s) => s.saveMission);
  const deleteMission = useApp((s) => s.deleteMission);
  const saveTemplate = useApp((s) => s.saveTemplate);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState<StepType | ''>('');
  const gaps = useMemo(() => readGaps(missionId), [missionId]);

  if (!mission || !novel) return <div className="wrap"><div className="empty" style={{ marginTop: '2rem' }}>Mission not found. <a href={href('/teacher/missions')}>Back</a></div></div>;
  const set = (p: Partial<Mission>) => saveMission({ ...mission, ...p });
  const setStep = (s: MissionStep) => set({ steps: mission.steps.map((x) => (x.id === s.id ? s : x)) });

  const placeholders = placeholdersIn(mission.steps);
  const locked = lockedMissionChapters(novel, mission.chapterNumbers);
  const usedEvidence = new Set(mission.steps.flatMap((s) =>
    s.type === 'dilemma' ? s.evidenceIds : s.type === 'evidence-board' ? s.cards.map((c) => c.evidenceId) : []));
  const unchecked = novel.evidence.filter((e) => usedEvidence.has(e.id) && e.verification === 'needs-check').length
    + novel.events.filter((e) => mission.steps.some((s) => s.type === 'reasoning-lock' && s.locks.some((l) => l.kind === 'sequence' && l.eventIds.includes(e.id))) && e.verification === 'needs-check').length;
  const allOutcomes = profiles.flatMap((p) => p.outcomes);
  const unverifiedOutcomes = mission.outcomes.filter((id) => allOutcomes.find((o) => o.id === id)?.status === 'unverified').length;
  const blockers = [
    placeholders.length ? `${placeholders.length} placeholder${placeholders.length > 1 ? 's' : ''} still need your words.` : '',
    locked.length ? `Chapter ${locked.join(', ')} ${locked.length > 1 ? 'are' : 'is'} locked. Unlock in the knowledge base first.` : '',
    !mission.steps.length ? 'Add at least one room.' : '',
  ].filter(Boolean);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= mission.steps.length) return;
    const steps = [...mission.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    set({ steps });
  };
  const addStep = (type: StepType) => {
    const { mission: draft } = generateMission(novel, {
      chapters: mission.chapterNumbers, engines: [type], themeId: novel.themes[0]?.id ?? '', outcomes: mission.outcomes,
      readingLevel: mission.readingLevel, thinkingLevel: mission.thinkingLevel, grouping: mission.grouping, duration: mission.duration,
    });
    if (draft.steps[0]) { set({ steps: [...mission.steps, draft.steps[0]] }); setOpen(draft.steps[0].id); toast('Room added. Review its content.'); }
    setAdding('');
  };

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <a className="btn quiet small" href={href('/teacher/missions')}><Icon name="back" size={16} /> Missions</a>
      <header className="row between top" style={{ marginTop: '0.5rem' }}>
        <div>
          <span className="hud accent">{novel.title} · {rangeLabel(mission.chapterNumbers)} · {mission.status === 'published' ? 'Live' : 'Draft'}</span>
          <h1 style={{ marginBottom: 0 }}>{mission.title}</h1>
        </div>
        <div className="row">
          <a className="btn ghost" href={href(`/teacher/preview/${mission.id}`)}><Icon name="eye" size={18} /> Preview as student</a>
          <a className="btn ghost" href={href(`/teacher/print/${mission.id}`)}><Icon name="print" size={18} /> Print / project</a>
          {mission.status === 'published'
            ? <button className="btn" onClick={() => { set({ status: 'draft' }); toast('Mission taken offline'); }}>Unpublish</button>
            : <button className="btn primary" disabled={blockers.length > 0} onClick={() => { set({ status: 'published' }); toast('Mission launched to students'); }}><Icon name="flag" size={18} /> Publish</button>}
        </div>
      </header>

      <section className={`panel publish-check ${blockers.length ? 'blocked' : 'ready'}`} style={{ marginTop: '1.25rem' }} aria-labelledby="pc-h">
        <h2 id="pc-h" className="hud">Publish check</h2>
        {blockers.length ? (
          <ul className="small">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
        ) : <p className="small" style={{ margin: 0 }}><Icon name="check" size={16} /> Ready to publish.</p>}
        {(unchecked > 0 || unverifiedOutcomes > 0) && (
          <ul className="small" style={{ color: 'var(--warn)' }}>
            {unchecked > 0 && <li>{unchecked} novel facts used in this mission still need your check. Students see a “teacher check pending” badge on them.</li>}
            {unverifiedOutcomes > 0 && <li>{unverifiedOutcomes} selected outcome{unverifiedOutcomes > 1 ? 's are' : ' is'} not yet verified against the official curriculum.</li>}
          </ul>
        )}
        {gaps.length > 0 && (
          <details>
            <summary className="small">What the generator could not draft ({gaps.length})</summary>
            <ul className="small">{gaps.map((g) => <li key={g}>{g}</li>)}</ul>
          </details>
        )}
      </section>

      <section className="panel" style={{ marginTop: '1.25rem' }} aria-labelledby="ms-h">
        <h2 id="ms-h" className="hud">Mission settings</h2>
        <div className="grid cols-2">
          <div className="field"><label htmlFor="me-title">Title</label><input id="me-title" className="input" value={mission.title} onChange={(e) => set({ title: e.target.value })} /></div>
          <div className="field"><label htmlFor="me-code">Codename</label><input id="me-code" className="input" value={mission.codename} onChange={(e) => set({ codename: e.target.value.toUpperCase() })} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="me-sum">Student-facing summary</label><textarea id="me-sum" className="textarea" style={{ minHeight: 64 }} value={mission.summary} onChange={(e) => set({ summary: e.target.value })} /></div>
          <Sel id="me-read" label="Reading demand" value={mission.readingLevel} options={['supported', 'standard', 'extended']} onChange={(v) => set({ readingLevel: v as Mission['readingLevel'] })} />
          <Sel id="me-think" label="Thinking demand" value={mission.thinkingLevel} options={['foundational', 'developing', 'sophisticated']} onChange={(v) => set({ thinkingLevel: v as Mission['thinkingLevel'] })} />
          <Sel id="me-group" label="Grouping" value={mission.grouping} options={['independent', 'partner', 'group', 'whole-class']} onChange={(v) => set({ grouping: v as Mission['grouping'] })} />
          <Sel id="me-dur" label="Length (minutes)" value={String(mission.duration)} options={['10', '20', '45', '80']} onChange={(v) => set({ duration: Number(v) as Mission['duration'] })} />
        </div>
        <div className="field" style={{ marginTop: '0.8rem' }} role="group" aria-label="Chapters">
          <span className="label">Chapters</span>
          <MultiPick value={mission.chapterNumbers.map(String)} options={novel.chapters.map((c) => ({ value: String(c.number), label: `${c.number}${c.unlocked ? '' : ' 🔒'}` }))}
            onChange={(v) => set({ chapterNumbers: v.map(Number).sort((a, b) => a - b) })} />
        </div>
        <div className="field" style={{ marginTop: '0.8rem' }} role="group" aria-label="Mission outcomes">
          <span className="label">Outcomes</span>
          <MultiPick value={mission.outcomes} options={allOutcomes.map((o) => ({ value: o.id, label: `${o.code} ${o.label}` }))} onChange={(outcomes) => set({ outcomes })} />
        </div>
      </section>

      <section style={{ marginTop: '1.5rem' }} aria-labelledby="rooms-h">
        <div className="row between">
          <h2 id="rooms-h" style={{ margin: 0 }}>Rooms</h2>
          <div className="row">
            <select className="select" style={{ width: 'auto' }} value={adding} onChange={(e) => setAdding(e.target.value as StepType)} aria-label="Room type to add">
              <option value="">Add a room…</option>
              {ENGINE_CATALOG.map((e) => <option key={e.type} value={e.type}>{e.name}</option>)}
            </select>
            <button className="btn small" disabled={!adding} onClick={() => adding && addStep(adding)}><Icon name="plus" size={16} /> Add</button>
          </div>
        </div>
        <ol className="room-list">
          {mission.steps.map((s, i) => {
            const ph = placeholdersIn(s).length;
            return (
              <li key={s.id} className={`room-item ${open === s.id ? 'open' : ''}`}>
                <div className="le-head">
                  <span className="path-node small-node" aria-hidden="true"><Icon name={STEP_META[s.type].icon} size={16} /></span>
                  <button className="le-toggle" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
                    <span className="grow"><strong>{i + 1}. {s.title}</strong> <span className="tiny muted">{STEP_META[s.type].engine}</span></span>
                  </button>
                  {ph > 0 && <span className="verify">{ph} to fill</span>}
                  <a className="btn quiet small" href={href(`/teacher/preview/${mission.id}/${s.id}`)}>Preview</a>
                  <button className="btn quiet small" onClick={() => move(i, -1)} aria-label="Move room up">▲</button>
                  <button className="btn quiet small" onClick={() => move(i, 1)} aria-label="Move room down">▼</button>
                  <button className="btn quiet small" onClick={() => confirm('Remove this room?') && set({ steps: mission.steps.filter((x) => x.id !== s.id) })} aria-label="Remove room"><Icon name="trash" size={14} /></button>
                </div>
                {open === s.id && <div className="le-body"><StepEditor step={s} novel={novel} onChange={setStep} /></div>}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="row between" style={{ marginTop: '2rem' }}>
        <div className="row">
        <button className="btn ghost small" onClick={() => {
          const copy = { ...structuredClone(mission), id: uid('m'), title: `${mission.title} (copy)`, status: 'draft' as const, createdBy: 'teacher' as const };
          saveMission(copy);
          navigate(`/teacher/mission/${copy.id}`);
        }}>Duplicate</button>
        <button className="btn ghost small" disabled={!mission.steps.length} onClick={() => {
          const name = prompt('Template name', `${mission.title} template`);
          if (!name) return;
          const code = (id: string) => allOutcomes.find((o) => o.id === id)?.code;
          saveTemplate(templateFromMission(mission, name, `${mission.steps.length} rooms · saved from “${mission.title}”`, code));
          toast('Saved as a template. Use it from Generate a mission.');
        }}><Icon name="layers" size={16} /> Save as template</button>
        </div>
        <button className="btn danger small" onClick={() => { if (confirm('Delete this mission? Student responses stay in the export.')) { deleteMission(mission.id); navigate('/teacher/missions'); } }}><Icon name="trash" size={16} /> Delete mission</button>
      </div>
    </div>
  );
}

function Sel({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
