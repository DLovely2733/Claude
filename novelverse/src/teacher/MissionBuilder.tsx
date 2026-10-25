import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { navigate } from '../lib/router';
import { generateMission, DURATION_ENGINES } from '../lib/generator';
import { lockedMissionChapters } from '../lib/knowledge';
import type { Duration, Grouping, ReadingLevel, StepType, ThinkingLevel } from '../data/types';
import { ENGINE_CATALOG } from './engines';
import { href } from '../lib/router';
import { MultiPick } from './ListEditor';
import { toast } from '../components/toast';

const READING: { id: ReadingLevel; label: string; desc: string }[] = [
  { id: 'supported', label: 'Supported', desc: 'Plain-language text shown by default.' },
  { id: 'standard', label: 'Standard', desc: 'Grade-level wording; students can switch on plain language.' },
  { id: 'extended', label: 'Extended', desc: 'Full wording; for enrichment.' },
];
const THINKING: { id: ThinkingLevel; label: string; desc: string }[] = [
  { id: 'foundational', label: 'Foundational', desc: 'Sentence starters on; counter-arguments optional; 2 supporting cards.' },
  { id: 'developing', label: 'Developing', desc: 'Counter-evidence encouraged; 3 supporting cards.' },
  { id: 'sophisticated', label: 'Sophisticated', desc: 'Counter-evidence expected; qualified claims; complications in themes.' },
];
const GROUPING: { id: Grouping; label: string }[] = [
  { id: 'independent', label: 'Independent' }, { id: 'partner', label: 'Partners' }, { id: 'group', label: 'Small group' }, { id: 'whole-class', label: 'Whole class' },
];
const DURATIONS: { id: Duration; label: string }[] = [
  { id: 10, label: '10-min activity' }, { id: 20, label: '20-min mission' }, { id: 45, label: '40–50 min lesson' }, { id: 80, label: '80-min block' },
];

export function MissionBuilder({ novelId, templateId }: { novelId?: string; templateId?: string }) {
  const novels = useApp((s) => s.novels);
  const profiles = useApp((s) => s.profiles);
  const activeProfileId = useApp((s) => s.activeProfileId);
  const saveMission = useApp((s) => s.saveMission);
  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const templates = useApp((s) => s.templates);

  const [nid, setNid] = useState(novelId && novels[novelId] ? novelId : Object.keys(novels)[0]);
  const novel = novels[nid];
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState<number[]>(() => novel ? novel.chapters.filter((c) => c.unlocked).slice(-2).map((c) => c.number) : []);
  const [themeId, setThemeId] = useState(novel?.themes[0]?.id ?? '');
  const [duration, setDuration] = useState<Duration>(45);
  const [engines, setEngines] = useState<StepType[]>(DURATION_ENGINES[45]);
  const [outcomes, setOutcomes] = useState<string[]>(profile?.outcomes.filter((o) => ['2.2', '2.3'].includes(o.code)).map((o) => o.id) ?? []);
  const [reading, setReading] = useState<ReadingLevel>('standard');
  const [thinking, setThinking] = useState<ThinkingLevel>('developing');
  const [grouping, setGrouping] = useState<Grouping>('independent');
  const [tplId, setTplId] = useState<string>('');
  const template = templates.find((t) => t.id === tplId);

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    setTplId(id);
    if (!t) return;
    setEngines(t.engines); setDuration(t.duration); setReading(t.readingLevel); setThinking(t.thinkingLevel); setGrouping(t.grouping);
    setOutcomes(profile?.outcomes.filter((o) => t.outcomeCodes.includes(o.code)).map((o) => o.id) ?? []);
  };
  useEffect(() => { if (templateId) applyTemplate(templateId); }, [templateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const locked = useMemo(() => (novel ? lockedMissionChapters(novel, chapters) : []), [novel, chapters]);
  if (!novel) return <div className="wrap"><div className="empty" style={{ marginTop: '2rem' }}>Add a novel first.</div></div>;

  const generate = () => {
    const { mission, gaps } = generateMission(novel, { title, chapters, engines, themeId, outcomes, readingLevel: reading, thinkingLevel: thinking, grouping, duration, overrides: template?.overrides });
    saveMission(mission);
    sessionStorage.setItem(`gaps:${mission.id}`, JSON.stringify(gaps));
    toast(gaps.length ? `Draft created with ${gaps.length} things to fill in` : 'Draft created');
    navigate(`/teacher/mission/${mission.id}`);
  };

  return (
    <div className="wrap narrow" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <span className="hud" style={{ color: 'var(--accent-2)' }}>Mission generator</span>
      <h1>Generate a mission</h1>
      <p className="text-2">NovelVerse drafts activities only from your knowledge base. Anything it cannot draft from your notes is left as a <span className="mono">[Teacher: …]</span> placeholder for you. Nothing reaches students until you review and publish it.</p>

      <div className="stack" style={{ ['--gap' as string]: '1.25rem', marginTop: '1.5rem' }}>
        <section className="panel" aria-labelledby="tpl-h">
          <h2 id="tpl-h" className="hud accent">Start from a template (optional)</h2>
          <div className="template-grid">
            {templates.map((t) => (
              <button key={t.id} type="button" className={`template-card ${tplId === t.id ? 'on' : ''}`} aria-pressed={tplId === t.id} onClick={() => applyTemplate(t.id)}>
                <span className="row between"><strong>{t.name}</strong><span className="chip tiny">{t.duration} min</span></span>
                <span className="small text-2">{t.description}</span>
                {!t.builtIn && <span className="chip tiny amber">yours</span>}
              </button>
            ))}
          </div>
        </section>
        <section className="panel stack">
          <div className="grid cols-2">
            <div className="field">
              <label htmlFor="mb-novel">Novel</label>
              <select id="mb-novel" className="select" value={nid} onChange={(e) => { setNid(e.target.value); setChapters([]); setThemeId(novels[e.target.value]?.themes[0]?.id ?? ''); }}>
                {Object.values(novels).map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="mb-title">Mission title (optional)</label>
              <input id="mb-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Generated from theme and chapters" />
            </div>
          </div>
          <fieldset className="plain-fieldset">
            <legend className="label">Chapters</legend>
            <MultiPick value={chapters.map(String)} onChange={(v) => setChapters(v.map(Number))}
              options={novel.chapters.map((c) => ({ value: String(c.number), label: `${c.number}${c.unlocked ? '' : ' 🔒'}` }))} />
            {locked.length > 0 && <p className="callout warn small" style={{ marginTop: '0.5rem' }}>Chapter {locked.join(', ')} {locked.length > 1 ? 'are' : 'is'} locked. Students will not see that knowledge until you unlock it.</p>}
          </fieldset>
          <fieldset className="plain-fieldset">
            <legend className="label">Theme to explore</legend>
            <div className="row" style={{ gap: '0.35rem' }}>
              {novel.themes.map((t) => <button key={t.id} type="button" className="chip" aria-pressed={themeId === t.id} onClick={() => setThemeId(t.id)}>{t.topic}</button>)}
              {!novel.themes.length && <span className="small muted">Add themes to the knowledge base first.</span>}
            </div>
          </fieldset>
        </section>

        <section className="panel stack">
          <fieldset className="plain-fieldset">
            <legend className="label">Length</legend>
            <div className="segmented" role="group">
              {DURATIONS.map((d) => <button key={d.id} type="button" aria-pressed={duration === d.id} onClick={() => { setDuration(d.id); setEngines(DURATION_ENGINES[d.id]); }}>{d.label}</button>)}
            </div>
          </fieldset>
          <fieldset className="plain-fieldset">
            <legend className="label">Gameplay engines, in order</legend>
            <ul className="engine-pick">
              {ENGINE_CATALOG.map((e) => {
                const on = engines.includes(e.type);
                return (
                  <li key={e.type}>
                    <label className={`engine-option ${on ? 'on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => setEngines(on ? engines.filter((x) => x !== e.type) : ENGINE_CATALOG.map((c) => c.type).filter((t) => engines.includes(t) || t === e.type))} />
                      <span className="grow"><strong>{e.name}</strong> <span className="chip tiny">{e.minutes}</span><br /><span className="small text-2">{e.desc}</span></span>
                    </label>
                  </li>
                );
              })}
              <li className="small muted">Whole-class activities (Four Corners, This-or-That, Evidence Showdown, live trials) run from <a href={href('/teacher/live')}>Live</a>.</li>
            </ul>
          </fieldset>
        </section>

        <section className="panel stack">
          <p className="small muted" style={{ margin: 0 }}>Reading demand and thinking demand are set separately: a student can tackle sophisticated ideas through supported text.</p>
          <div className="grid cols-2">
            <Choice legend="Reading demand" items={READING} value={reading} onChange={setReading} />
            <Choice legend="Thinking demand" items={THINKING} value={thinking} onChange={setThinking} />
          </div>
          <fieldset className="plain-fieldset">
            <legend className="label">Grouping</legend>
            <div className="segmented" role="group">
              {GROUPING.map((g) => <button key={g.id} type="button" aria-pressed={grouping === g.id} onClick={() => setGrouping(g.id)}>{g.label}</button>)}
            </div>
          </fieldset>
        </section>

        <section className="panel">
          <fieldset className="plain-fieldset">
            <legend className="label">Learning outcomes · {profile?.name}</legend>
            <ul className="outcome-pick">
              {profile?.outcomes.map((o) => (
                <li key={o.id}>
                  <label className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={outcomes.includes(o.id)} onChange={() => setOutcomes(outcomes.includes(o.id) ? outcomes.filter((x) => x !== o.id) : [...outcomes, o.id])} />
                    <span><span className="mono accent-text">{o.code}</span> {o.label} {o.status === 'unverified' && <span className="verify">unverified</span>}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </section>

        <div className="row end">
          <button className="btn primary" disabled={!chapters.length || !engines.length} onClick={generate}><Icon name="spark" size={18} /> Generate draft</button>
        </div>
      </div>
    </div>
  );
}

function Choice<T extends string>({ legend, items, value, onChange }: { legend: string; items: { id: T; label: string; desc: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="plain-fieldset">
      <legend className="label">{legend}</legend>
      <div className="stack" style={{ ['--gap' as string]: '0.4rem', marginTop: '0.4rem' }}>
        {items.map((i) => (
          <label key={i.id} className={`engine-option ${value === i.id ? 'on' : ''}`}>
            <input type="radio" name={legend} checked={value === i.id} onChange={() => onChange(i.id)} />
            <span><strong>{i.label}</strong><br /><span className="small text-2">{i.desc}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
