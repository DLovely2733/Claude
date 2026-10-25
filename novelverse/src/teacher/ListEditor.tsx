import { useId, useState } from 'react';
import type { Novel, Verification } from '../data/types';
import { Icon } from '../components/Icon';
import { VerifyBadge } from '../components/Reading';

// A structured editor for one kind of novel knowledge (characters, events,
// evidence…). Every item shows whether the teacher has verified it.

export type FieldKind = 'text' | 'long' | 'number' | 'select' | 'bool' | 'characters' | 'themes' | 'character' | 'strings';

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  help?: string;
}

type Item = { id: string; verification?: Verification };

export function ListEditor<T extends Item>({ title, items, fields, onChange, make, summary, novel, intro }: {
  title: string;
  items: T[];
  fields: FieldSpec[];
  onChange: (items: T[]) => void;
  make: () => T;
  summary: (item: T) => string;
  novel: Novel;
  intro?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'needs-check'>('all');
  const shown = filter === 'all' ? items : items.filter((i) => i.verification === 'needs-check');
  const pending = items.filter((i) => i.verification === 'needs-check').length;

  const patch = (id: string, p: Partial<T>) => onChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const remove = (id: string) => confirm('Delete this item?') && onChange(items.filter((i) => i.id !== id));
  const move = (id: string, d: number) => {
    const idx = items.findIndex((i) => i.id === id);
    const j = idx + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <section aria-labelledby={`le-${title}`}>
      <div className="row between">
        <h2 id={`le-${title}`} style={{ margin: 0 }}>{title} <span className="muted small">({items.length})</span></h2>
        <div className="row">
          {pending > 0 && (
            <>
              <div className="segmented" role="group" aria-label="Filter">
                <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
                <button aria-pressed={filter === 'needs-check'} onClick={() => setFilter('needs-check')}>Needs check ({pending})</button>
              </div>
              <button className="btn ghost small" onClick={() => confirm(`Mark all ${pending} items as verified? Only do this after checking them against your copy of the book.`) &&
                onChange(items.map((i) => (i.verification === 'needs-check' ? { ...i, verification: 'teacher-verified' } : i)))}>
                Verify all
              </button>
            </>
          )}
          <button className="btn primary small" onClick={() => { const n = make(); onChange([...items, n]); setOpen(n.id); }}>
            <Icon name="plus" size={16} /> Add
          </button>
        </div>
      </div>
      {intro && <p className="small muted" style={{ marginTop: '0.5rem' }}>{intro}</p>}
      <ul className="le-list">
        {shown.map((item) => {
          const isOpen = open === item.id;
          return (
            <li key={item.id} className={`le-item ${isOpen ? 'open' : ''}`}>
              <div className="le-head">
                <button className="le-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : item.id)}>
                  <span className="grow">{summary(item) || <em className="muted">Untitled</em>}</span>
                </button>
                {item.verification && <VerifyBadge v={item.verification} teacher />}
                <button className="btn quiet small" onClick={() => move(item.id, -1)} aria-label="Move up">▲</button>
                <button className="btn quiet small" onClick={() => move(item.id, 1)} aria-label="Move down">▼</button>
              </div>
              {isOpen && (
                <div className="le-body">
                  <div className="grid cols-2">
                    {fields.map((f) => (
                      <FieldInput key={f.key} spec={f} value={(item as Record<string, unknown>)[f.key]} novel={novel} onChange={(v) => patch(item.id, { [f.key]: v } as Partial<T>)} />
                    ))}
                  </div>
                  <div className="row between" style={{ marginTop: '0.75rem' }}>
                    <button className="btn danger small" onClick={() => remove(item.id)}><Icon name="trash" size={16} /> Delete</button>
                    {item.verification === 'needs-check' && (
                      <button className="btn small" onClick={() => patch(item.id, { verification: 'teacher-verified' } as Partial<T>)}>
                        <Icon name="check" size={16} /> I checked this against the book
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FieldInput({ spec, value, onChange, novel }: { spec: FieldSpec; value: unknown; onChange: (v: unknown) => void; novel: Novel }) {
  const id = useId();
  const wide = spec.kind === 'long' || spec.kind === 'characters' || spec.kind === 'themes' || spec.kind === 'strings';
  return (
    <div className="field" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <label htmlFor={id}>{spec.label}</label>
      {spec.kind === 'text' && <input id={id} className="input" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />}
      {spec.kind === 'long' && <textarea id={id} className="textarea" style={{ minHeight: 80 }} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />}
      {spec.kind === 'number' && <input id={id} className="input" type="number" value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} />}
      {spec.kind === 'bool' && <input id={id} type="checkbox" className="switch" role="switch" checked={!!value} onChange={(e) => onChange(e.target.checked)} />}
      {spec.kind === 'select' && (
        <select id={id} className="select" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {spec.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      {spec.kind === 'character' && (
        <select id={id} className="select" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {novel.characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      {(spec.kind === 'characters' || spec.kind === 'themes') && (
        <MultiPick id={id} value={(value as string[]) ?? []} onChange={onChange}
          options={spec.kind === 'characters' ? novel.characters.map((c) => ({ value: c.id, label: c.name })) : novel.themes.map((t) => ({ value: t.id, label: t.topic }))} />
      )}
      {spec.kind === 'strings' && <StringList id={id} value={(value as string[]) ?? []} onChange={onChange} />}
      {spec.help && <span className="help">{spec.help}</span>}
    </div>
  );
}

export function MultiPick({ id, value, options, onChange }: { id?: string; value: string[]; options: { value: string; label: string }[]; onChange: (v: string[]) => void }) {
  return (
    <div id={id} className="row" style={{ gap: '0.35rem' }} role="group">
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={value.includes(o.value)}
          onClick={() => onChange(value.includes(o.value) ? value.filter((x) => x !== o.value) : [...value, o.value])}>
          {o.label}
        </button>
      ))}
      {!options.length && <span className="small muted">Nothing to choose yet.</span>}
    </div>
  );
}

export function StringList({ id, value, onChange }: { id?: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div id={id} className="stack" style={{ ['--gap' as string]: '0.4rem' }}>
      {value.map((s, i) => (
        <div key={i} className="row" style={{ flexWrap: 'nowrap' }}>
          <span className="mono small muted">{i + 1}</span>
          <textarea className="textarea" style={{ minHeight: 48 }} value={s} aria-label={`Item ${i + 1}`} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className="btn quiet small" aria-label={`Remove item ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
        </div>
      ))}
      <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => onChange([...value, ''])}><Icon name="plus" size={14} /> Add line</button>
    </div>
  );
}
