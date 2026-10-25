import { useState } from 'react';
import type { MissionStep, Novel, Theory } from '../data/types';
import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { MultiPick, StringList } from './ListEditor';
import { uid } from '../lib/id';
import { isPlaceholder } from '../lib/generator';

// A structured editor for any mission step. It walks the step's data, so
// every generated word is editable without a bespoke form per engine.

const LABELS: Record<string, string> = {
  title: 'Room title', skill: 'Skill (student-facing)', instructions: 'Instructions', plainInstructions: 'Short / plain instructions',
  chunks: 'Briefing transmissions', heading: 'Heading', text: 'Text', plain: 'Plain-language version', vocab: 'Word bank',
  scenario: 'Situation', plainScenario: 'Situation (plain language)', hotspots: 'Consoles / clues', label: 'Label', icon: 'Icon',
  choices: 'Choices', values: 'Values this choice reflects', consequence: 'Simulated consequence', plainConsequence: 'Consequence (plain language)',
  followUp: 'Follow-up decision', prompt: 'Prompt', canonNote: 'What actually happens in the novel', canonVerification: 'Status of the novel note',
  evidenceIds: 'Evidence students may cite', valueOptions: 'Values students can choose', caseTitle: 'Case title', caseQuestion: 'Case question',
  theories: 'Theories', defensible: 'Defensible with the evidence', challenge: 'Investigator’s challenge question', cards: 'Evidence cards on the board',
  evidenceId: 'Evidence', supports: 'Supports theories', challenges: 'Challenges theories', vaultName: 'Vault name', locks: 'Locks',
  eventIds: 'Events in correct order', hints: 'Hints (shown one at a time)', options: 'Options', strong: 'Strong answer', why: 'Feedback when chosen',
  explainPrompt: 'Explain prompt', topic: 'Topic', flaw: 'Weakness', characterIds: 'Characters on the map', fromChapter: 'Map starts at chapter',
  toChapter: 'Map ends at chapter', themeId: 'Theme', prompts: 'Reflection prompts', outcomes: 'Outcomes for this room',
};
const HIDDEN = new Set(['id', 'type', 'kind']);
const humanize = (k: string) => LABELS[k] ?? k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

interface Ctx { novel: Novel; theories: Theory[] }

export function StepEditor({ step, novel, onChange }: { step: MissionStep; novel: Novel; onChange: (s: MissionStep) => void }) {
  const theories = step.type === 'evidence-board' ? step.theories : [];
  return <ObjectFields value={step as unknown as Record<string, unknown>} ctx={{ novel, theories }} onChange={(v) => onChange(v as unknown as MissionStep)} />;
}

function ObjectFields({ value, onChange, ctx }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void; ctx: Ctx }) {
  return (
    <div className="obj-fields">
      {Object.entries(value).filter(([k]) => !HIDDEN.has(k)).map(([k, v]) => (
        <Field key={k} k={k} v={v} ctx={ctx} onChange={(nv) => onChange({ ...value, [k]: nv })} />
      ))}
    </div>
  );
}

function Field({ k, v, onChange, ctx }: { k: string; v: unknown; onChange: (v: unknown) => void; ctx: Ctx }) {
  const profiles = useApp((s) => s.profiles);
  const label = humanize(k);
  const ph = typeof v === 'string' && isPlaceholder(v);

  if (k === 'outcomes') {
    const opts = profiles.flatMap((p) => p.outcomes).map((o) => ({ value: o.id, label: `${o.code} ${o.label}` }));
    return <Wrap label={label}><MultiPick value={v as string[]} options={opts} onChange={onChange} /></Wrap>;
  }
  if (k === 'evidenceIds' || k === 'evidenceId') {
    const opts = ctx.novel.evidence.map((e) => ({ value: e.id, label: `Ch.${e.chapter} ${e.text.slice(0, 50)}…` }));
    if (k === 'evidenceId') {
      return (
        <Wrap label={label}>
          <select className="select" value={String(v)} onChange={(e) => onChange(e.target.value)}>
            {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Wrap>
      );
    }
    return <Wrap label={label}><MultiPick value={v as string[]} options={opts} onChange={onChange} /></Wrap>;
  }
  if (k === 'vocab') return <Wrap label={label}><MultiPick value={v as string[]} options={ctx.novel.vocab.map((x) => ({ value: x.id, label: x.term }))} onChange={onChange} /></Wrap>;
  if (k === 'characterIds') return <Wrap label={label}><MultiPick value={v as string[]} options={ctx.novel.characters.map((x) => ({ value: x.id, label: x.name }))} onChange={onChange} /></Wrap>;
  if (k === 'eventIds') {
    const ids = v as string[];
    return (
      <Wrap label={label} help="Students see these shuffled. Order here is the answer.">
        <ol className="small">
          {ids.map((id, i) => (
            <li key={id} className="row" style={{ flexWrap: 'nowrap' }}>
              <span className="grow">{ctx.novel.events.find((e) => e.id === id)?.text ?? id}</span>
              <button type="button" className="btn quiet small" aria-label="Move up" onClick={() => { const n = [...ids]; if (i) [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); }}>▲</button>
              <button type="button" className="btn quiet small" aria-label="Remove" onClick={() => onChange(ids.filter((x) => x !== id))}>✕</button>
            </li>
          ))}
        </ol>
        <select className="select" value="" onChange={(e) => e.target.value && onChange([...ids, e.target.value])} aria-label="Add event">
          <option value="">Add an event…</option>
          {ctx.novel.events.filter((e) => !ids.includes(e.id)).map((e) => <option key={e.id} value={e.id}>Ch.{e.chapter} {e.text.slice(0, 60)}</option>)}
        </select>
      </Wrap>
    );
  }
  if (k === 'supports' || k === 'challenges') {
    return <Wrap label={label}><MultiPick value={v as string[]} options={ctx.theories.map((t, i) => ({ value: t.id, label: `T${i + 1}` }))} onChange={onChange} /></Wrap>;
  }
  if (k === 'themeId') {
    return (
      <Wrap label={label}>
        <select className="select" value={String(v)} onChange={(e) => onChange(e.target.value)}>
          {ctx.novel.themes.map((t) => <option key={t.id} value={t.id}>{t.topic}</option>)}
        </select>
      </Wrap>
    );
  }
  if (k === 'icon') return <Select label={label} v={v} options={['intel', 'squad', 'orders', 'log']} onChange={onChange} />;
  if (k === 'canonVerification') return <Select label={label} v={v} options={['needs-check', 'teacher-verified', 'teacher-added']} onChange={onChange} />;
  if (k === 'flaw') return <Select label={label} v={v ?? ''} options={['', 'too-general', 'summary', 'absolute', 'cliche']} onChange={(x) => onChange(x || undefined)} />;

  if (typeof v === 'boolean') {
    return (
      <label className="toggle"><span className="label">{label}</span>
        <input type="checkbox" className="switch" role="switch" checked={v} onChange={(e) => onChange(e.target.checked)} />
      </label>
    );
  }
  if (typeof v === 'number') return <Wrap label={label}><input type="number" className="input" value={v} onChange={(e) => onChange(Number(e.target.value))} /></Wrap>;
  if (typeof v === 'string') {
    const long = v.length > 70 || /scenario|consequence|instructions|canonNote|text|why|challenge|prompt/i.test(k);
    return (
      <Wrap label={label} placeholder={ph}>
        {long
          ? <textarea className={`textarea ${ph ? 'ph' : ''}`} style={{ minHeight: 70 }} value={v} onChange={(e) => onChange(e.target.value)} />
          : <input className={`input ${ph ? 'ph' : ''}`} value={v} onChange={(e) => onChange(e.target.value)} />}
      </Wrap>
    );
  }
  if (Array.isArray(v) && (v.length === 0 || typeof v[0] === 'string')) {
    return <Wrap label={label}><StringList value={v as string[]} onChange={onChange} /></Wrap>;
  }
  if (Array.isArray(v)) return <ArrayOfObjects label={label} items={v as Record<string, unknown>[]} ctx={ctx} onChange={onChange} />;
  if (k === 'followUp') {
    if (!v) {
      return (
        <button type="button" className="btn ghost small" onClick={() => onChange({ prompt: '', choices: [{ id: uid('f'), label: '', consequence: 'SIMULATION: ' }] })}>
          <Icon name="plus" size={14} /> Add a follow-up decision
        </button>
      );
    }
    return (
      <fieldset className="obj-nested">
        <legend className="label">{label}</legend>
        <ObjectFields value={v as Record<string, unknown>} ctx={ctx} onChange={onChange} />
        <button type="button" className="btn quiet small" onClick={() => onChange(undefined)}>Remove follow-up</button>
      </fieldset>
    );
  }
  if (v && typeof v === 'object') {
    return (
      <fieldset className="obj-nested">
        <legend className="label">{label}</legend>
        <ObjectFields value={v as Record<string, unknown>} ctx={ctx} onChange={onChange} />
      </fieldset>
    );
  }
  return null;
}

function ArrayOfObjects({ label, items, onChange, ctx }: { label: string; items: Record<string, unknown>[]; onChange: (v: unknown) => void; ctx: Ctx }) {
  const [open, setOpen] = useState<number | null>(null);
  const blank = (src: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(src).map(([k, v]) => [k,
      k === 'id' ? uid('x') : k === 'kind' ? v : typeof v === 'string' ? '' : typeof v === 'boolean' ? false : typeof v === 'number' ? v : Array.isArray(v) ? [] : v && typeof v === 'object' ? blank(v as Record<string, unknown>) : v]));
  const summary = (it: Record<string, unknown>) => String(it.title ?? it.label ?? it.heading ?? it.text ?? it.evidenceId ?? '').slice(0, 90);
  return (
    <fieldset className="obj-nested">
      <legend className="label">{label} ({items.length})</legend>
      <ul className="le-list">
        {items.map((it, i) => (
          <li key={String(it.id ?? i)} className={`le-item ${open === i ? 'open' : ''}`}>
            <div className="le-head">
              <button type="button" className="le-toggle" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span className="mono tiny muted">{i + 1}</span> <span className="grow">{summary(it) || <em className="muted">Untitled</em>}</span>
              </button>
              <button type="button" className="btn quiet small" aria-label="Move up" onClick={() => { if (!i) return; const n = [...items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); }}>▲</button>
              <button type="button" className="btn quiet small" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
            </div>
            {open === i && <div className="le-body"><ObjectFields value={it} ctx={ctx} onChange={(nv) => onChange(items.map((x, j) => (j === i ? nv : x)))} /></div>}
          </li>
        ))}
      </ul>
      {items.length > 0 && (
        <button type="button" className="btn ghost small" onClick={() => { onChange([...items, blank(items[items.length - 1])]); setOpen(items.length); }}>
          <Icon name="plus" size={14} /> Add
        </button>
      )}
    </fieldset>
  );
}

function Wrap({ label, children, help, placeholder }: { label: string; children: React.ReactNode; help?: string; placeholder?: boolean }) {
  return (
    <div className="field" role="group" aria-label={label}>
      <span className="label" aria-hidden="true">{label} {placeholder && <span className="verify">fill in</span>}</span>
      {children}
      {help && <span className="help">{help}</span>}
    </div>
  );
}

function Select({ label, v, options, onChange }: { label: string; v: unknown; options: string[]; onChange: (v: string) => void }) {
  return (
    <Wrap label={label}>
      <select className="select" value={String(v ?? '')} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o || '(none)'}</option>)}
      </select>
    </Wrap>
  );
}
