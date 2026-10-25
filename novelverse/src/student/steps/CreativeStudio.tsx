import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { CreativeFormat, CreativeStep, Novel } from '../../data/types';
import { useMissionCtx, useStepResponse } from '../MissionContext';
import { useReading } from '../../components/Reading';
import { Icon } from '../../components/Icon';
import { Mentor } from '../../components/Mentor';
import { EvidenceLocker } from './EvidenceLocker';
import { characterName, unlockedChapters, visibleEvents, visibleEvidence } from '../../lib/knowledge';
import { analyzeReasoning } from '../../lib/reasoning';
import { play } from '../../lib/sound';

// Creative Studio: different ways to show the same understanding. Every
// format is held to the same success criteria and ends in a craft note, so
// choosing a creative form never removes the analytical writing.

type FieldKind = 'text' | 'long' | 'character' | 'chapter' | 'event';
interface FieldDef { key: string; label: string; kind: FieldKind; placeholder?: string }
interface FormatDef { id: CreativeFormat; name: string; icon: string; blurb: string; fields: FieldDef[] }

const pairs = (n: number, q: string, a: string): FieldDef[] =>
  Array.from({ length: n }, (_, i) => [
    { key: `q${i + 1}`, label: `${q} ${i + 1}`, kind: 'text' as const },
    { key: `a${i + 1}`, label: `${a} ${i + 1}`, kind: 'long' as const },
  ]).flat();

export const FORMATS: FormatDef[] = [
  { id: 'journal', name: 'Character journal', icon: 'book', blurb: 'Write a private entry in a character’s voice.',
    fields: [{ key: 'character', label: 'Whose journal?', kind: 'character' }, { key: 'chapter', label: 'Written after chapter', kind: 'chapter' },
      { key: 'entry', label: 'Journal entry', kind: 'long', placeholder: 'Write as the character. What do they feel but never say aloud?' }] },
  { id: 'interview', name: 'Mock interview', icon: 'chat', blurb: 'Interview a character. Their answers must fit the novel.',
    fields: [{ key: 'character', label: 'Interviewee', kind: 'character' }, ...pairs(3, 'Question', 'Answer')] },
  { id: 'perspective', name: 'Another perspective', icon: 'eye', blurb: 'Retell a key moment through a different character’s eyes.',
    fields: [{ key: 'character', label: 'Narrator', kind: 'character' }, { key: 'event', label: 'Moment to retell', kind: 'event' },
      { key: 'retelling', label: 'The retelling', kind: 'long', placeholder: 'What does this character notice that the original telling leaves out?' }] },
  { id: 'newspaper', name: 'Digital newspaper', icon: 'file', blurb: 'Report events as a journalist would, and explain why they matter.',
    fields: [{ key: 'paper', label: 'Newspaper name', kind: 'text', placeholder: 'The Battle School Bulletin' }, { key: 'headline', label: 'Headline', kind: 'text' },
      { key: 'subhead', label: 'Subheadline', kind: 'text' }, { key: 'byline', label: 'Byline (a pen name)', kind: 'text' },
      { key: 'body', label: 'Article', kind: 'long' }, { key: 'sidebar', label: 'Sidebar: what readers should notice', kind: 'long' }] },
  { id: 'profile', name: 'Character profile', icon: 'users', blurb: 'A fictional social profile as a character study, not real social media.',
    fields: [{ key: 'character', label: 'Character', kind: 'character' }, { key: 'handle', label: 'Handle', kind: 'text' }, { key: 'bio', label: 'Bio', kind: 'text' },
      { key: 'p1', label: 'Post 1', kind: 'long' }, { key: 'p2', label: 'Post 2', kind: 'long' }, { key: 'p3', label: 'Post 3', kind: 'long' }] },
  { id: 'storyboard', name: 'Storyboard', icon: 'grid', blurb: 'Plan four frames of a scene, each with a caption that interprets it.',
    fields: [1, 2, 3, 4].flatMap((n) => [
      { key: `s${n}`, label: `Frame ${n}: what we see`, kind: 'text' as const },
      { key: `c${n}`, label: `Frame ${n}: caption (what it means)`, kind: 'text' as const },
    ]) },
  { id: 'argument', name: 'Persuasive argument', icon: 'scale', blurb: 'Argue a position with reasons, evidence and a counter-argument.',
    fields: [{ key: 'claim', label: 'Claim', kind: 'text' }, { key: 'r1', label: 'Reason 1', kind: 'long' }, { key: 'r2', label: 'Reason 2', kind: 'long' },
      { key: 'r3', label: 'Reason 3', kind: 'long' }, { key: 'counter', label: 'Counter-argument and response', kind: 'long' }, { key: 'conclusion', label: 'Conclusion', kind: 'long' }] },
  { id: 'analysis', name: 'Analytical paragraph', icon: 'edit', blurb: 'A focused literary paragraph: claim, evidence, analysis.',
    fields: [{ key: 'topic', label: 'Topic sentence (your claim)', kind: 'long' }, { key: 'evidence', label: 'Evidence from the novel', kind: 'long' },
      { key: 'analysis', label: 'Analysis: how the evidence proves your claim', kind: 'long' }, { key: 'link', label: 'Concluding sentence', kind: 'long' }] },
];

export function CreativeStudio({ step, onDone }: { step: CreativeStep; onDone: (insights: string[]) => void }) {
  const { mission, novel } = useMissionCtx();
  const { data, save, response } = useStepResponse(step.id);
  const r = useReading(mission);
  const [format, setFormat] = useState<CreativeFormat | null>((data.format as CreativeFormat) ?? null);
  const [fields, setFields] = useState<Record<string, string>>((data.fields as Record<string, string>) ?? {});
  const [evidenceIds, setEvidenceIds] = useState<string[]>((data.evidenceIds as string[]) ?? []);
  const [craftNote, setCraftNote] = useState<string>((data.craftNote as string) ?? '');
  const [checks, setChecks] = useState<boolean[]>((data.checks as boolean[]) ?? step.criteria.map(() => false));
  const def = FORMATS.find((f) => f.id === format);
  const formats = FORMATS.filter((f) => step.formats.includes(f.id));
  const words = useMemo(() => Object.values(fields).join(' ').trim().split(/\s+/).filter(Boolean).length, [fields]);
  const craftWords = analyzeReasoning(craftNote).words;
  const canSubmit = !!def && words >= 60 && evidenceIds.length > 0 && craftWords >= 20;

  const set = (k: string, v: string) => setFields({ ...fields, [k]: v });
  const finish = () => {
    const ins = ['craft-note'];
    if (evidenceIds.length) ins.push('anchored');
    save({ format, fields, evidenceIds, craftNote, checks, words, insights: ins }, { submit: true, revision: response?.status === 'submitted' ? 'Revised creative piece' : undefined });
    onDone(ins);
  };

  return (
    <div className="studio">
      <section className="panel" aria-labelledby="brief-h">
        <h2 id="brief-h" className="hud accent">The brief</h2>
        <p className="studio-prompt">{step.prompt}</p>
        <h3 className="hud" style={{ marginTop: '0.8rem' }}>Every format is assessed on</h3>
        <ul className="criteria">{step.criteria.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>

      <fieldset className="plain-fieldset" style={{ marginTop: '1.25rem' }}>
        <legend className="label" style={{ fontSize: '1.1rem' }}>Choose your format</legend>
        <div className="format-grid">
          {formats.map((f) => (
            <button key={f.id} type="button" className={`format-card ${format === f.id ? 'on' : ''}`} aria-pressed={format === f.id}
              onClick={() => { setFormat(f.id); save({ format: f.id, fields }); play('tap'); }}>
              <Icon name={f.icon} size={24} />
              <strong>{f.name}</strong>
              <span className="small text-2">{f.blurb}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <AnimatePresence mode="wait">
        {def && (
          <motion.div key={def.id} className="studio-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <section className="panel" aria-labelledby="editor-h">
              <h2 id="editor-h" className="hud accent">{def.name} · editor</h2>
              <div className="stack" style={{ ['--gap' as string]: '0.8rem' }}>
                {def.fields.map((f) => <StudioField key={f.key} def={f} value={fields[f.key] ?? ''} onChange={(v) => set(f.key, v)} novel={novel} step={step} />)}
              </div>
              <p className="small muted" style={{ marginTop: '0.6rem' }}>{words} words · at least 60</p>
              {r.frames && <p className="callout small">Tip: show feelings through what a character does and notices, not only by naming emotions.</p>}
            </section>
            <section aria-label="Live preview" className="preview-col">
              <span className="hud">Live preview</span>
              <Preview format={def.id} f={fields} novel={novel} />
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {def && (
        <div className="grid cols-2" style={{ marginTop: '1.25rem', alignItems: 'start' }}>
          <section className="panel" aria-labelledby="ev-h">
            <h2 id="ev-h" className="hud accent">Evidence behind your piece</h2>
            <p className="small muted">Choose the moments from the novel your piece is built on.</p>
            <EvidenceLocker novel={novel} evidence={visibleEvidence(novel)} selected={evidenceIds}
              onToggle={(id) => setEvidenceIds(evidenceIds.includes(id) ? evidenceIds.filter((x) => x !== id) : [...evidenceIds, id])} />
          </section>
          <section className="panel" aria-labelledby="craft-h">
            <h2 id="craft-h" className="hud accent">Craft note</h2>
            <label htmlFor="craft" className="label">Explain your choices: what does your piece show about the character or theme, and which evidence shaped it?</label>
            <textarea id="craft" className="textarea" style={{ minHeight: 150, marginTop: '0.4rem' }} value={craftNote} onChange={(e) => setCraftNote(e.target.value)}
              placeholder={r.frames ? 'I chose to ___ because in Chapter ___, ___. This shows that ___.' : ''} />
            <p className="help small muted">{craftWords} words · at least 20</p>
            <fieldset className="plain-fieldset" style={{ marginTop: '0.8rem' }}>
              <legend className="label">Check your piece against the criteria</legend>
              {step.criteria.map((c, i) => (
                <label key={c} className="row small" style={{ flexWrap: 'nowrap', alignItems: 'flex-start', marginTop: '0.3rem' }}>
                  <input type="checkbox" checked={checks[i] ?? false} onChange={(e) => setChecks(checks.map((x, j) => (j === i ? e.target.checked : x)))} />
                  <span>{c}</span>
                </label>
              ))}
            </fieldset>
            <div className="row between" style={{ marginTop: '0.8rem' }}>
              <Mentor text={craftNote} novel={novel} task="reflect" thinkingLevel={mission.thinkingLevel} evidenceCount={evidenceIds.length} />
              <button className="btn primary" disabled={!canSubmit} onClick={finish}>Publish to the log <Icon name="check" size={18} /></button>
            </div>
            {!canSubmit && <p className="tiny muted">To publish: 60+ words in your piece, at least one evidence card, and a craft note of 20+ words.</p>}
          </section>
        </div>
      )}
    </div>
  );
}

function StudioField({ def, value, onChange, novel, step }: { def: FieldDef; value: string; onChange: (v: string) => void; novel: Novel; step: CreativeStep }) {
  const id = `cf-${def.key}`;
  return (
    <div className="field">
      <label htmlFor={id}>{def.label}</label>
      {def.kind === 'text' && <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} />}
      {def.kind === 'long' && <textarea id={id} className="textarea" style={{ minHeight: 90 }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} />}
      {def.kind === 'character' && (
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {step.characterIds.map((c) => <option key={c} value={c}>{characterName(novel, c)}</option>)}
        </select>
      )}
      {def.kind === 'chapter' && (
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {unlockedChapters(novel).map((n) => <option key={n} value={n}>Chapter {n}</option>)}
        </select>
      )}
      {def.kind === 'event' && (
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {visibleEvents(novel).map((ev) => <option key={ev.id} value={ev.id}>Ch. {ev.chapter}: {ev.text.slice(0, 70)}</option>)}
        </select>
      )}
    </div>
  );
}

/** Format-specific rendering, so each choice feels like its own medium. */
export function Preview({ format, f, novel }: { format: CreativeFormat; f: Record<string, string>; novel: Novel }) {
  const who = f.character ? characterName(novel, f.character) : '…';
  const p = (t?: string) => (t ? t.split(/\n+/).map((x, i) => <p key={i}>{x}</p>) : <p className="ghost">…</p>);
  switch (format) {
    case 'journal':
      return <div className="pv pv-journal"><div className="pv-date">{who}’s journal{f.chapter ? ` · after Chapter ${f.chapter}` : ''}</div>{p(f.entry)}</div>;
    case 'interview':
      return (
        <div className="pv pv-interview">
          <div className="pv-kicker">Transcript · Interview with {who}</div>
          {[1, 2, 3].map((n) => (f[`q${n}`] || f[`a${n}`]) && (
            <div key={n} className="pv-qa"><p><strong>Q:</strong> {f[`q${n}`]}</p><p><strong>{who.toUpperCase()}:</strong> {f[`a${n}`]}</p></div>
          ))}
        </div>
      );
    case 'perspective': {
      const ev = novel.events.find((e) => e.id === f.event);
      return <div className="pv pv-book"><div className="pv-kicker">As told by {who}</div>{ev && <div className="pv-scene">Ch. {ev.chapter} · {ev.text}</div>}{p(f.retelling)}</div>;
    }
    case 'newspaper':
      return (
        <div className="pv pv-news">
          <div className="pv-masthead">{f.paper || 'The Daily Dispatch'}</div>
          <h3 className="pv-headline">{f.headline || 'Headline'}</h3>
          {f.subhead && <div className="pv-subhead">{f.subhead}</div>}
          <div className="pv-byline">By {f.byline || '…'}</div>
          <div className="pv-columns">{p(f.body)}</div>
          {f.sidebar && <aside className="pv-sidebar"><strong>What readers should notice</strong>{p(f.sidebar)}</aside>}
        </div>
      );
    case 'profile':
      return (
        <div className="pv pv-profile">
          <div className="pv-profile-head"><span className="pv-avatar">{who.slice(0, 1)}</span><div><strong>{who}</strong><div className="tiny">@{f.handle || 'handle'}</div></div></div>
          <p className="small">{f.bio}</p>
          {['p1', 'p2', 'p3'].map((k) => f[k] && <div key={k} className="pv-post">{f[k]}</div>)}
          <div className="tiny pv-note">Fictional profile · a character study</div>
        </div>
      );
    case 'storyboard':
      return (
        <div className="pv pv-board">
          {[1, 2, 3, 4].map((n) => (
            <figure key={n} className="pv-frame">
              <div className="pv-frame-art"><span className="mono">{n}</span><span>{f[`s${n}`] || '…'}</span></div>
              <figcaption>{f[`c${n}`]}</figcaption>
            </figure>
          ))}
        </div>
      );
    case 'argument':
      return (
        <div className="pv pv-essay">
          <h3>{f.claim || 'Your claim'}</h3>
          <ol>{['r1', 'r2', 'r3'].map((k) => f[k] && <li key={k}>{f[k]}</li>)}</ol>
          {f.counter && <p><em>{f.counter}</em></p>}
          {f.conclusion && <p><strong>{f.conclusion}</strong></p>}
        </div>
      );
    case 'analysis':
      return <div className="pv pv-essay"><p className="pv-para">{[f.topic, f.evidence, f.analysis, f.link].filter(Boolean).join(' ') || '…'}</p></div>;
  }
}
