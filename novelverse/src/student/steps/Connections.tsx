import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { ConnectionsStep, RelationshipType } from '../../data/types';
import { useMissionCtx, useStepResponse } from '../MissionContext';
import { useReading } from '../../components/Reading';
import { Icon } from '../../components/Icon';
import { Mentor } from '../../components/Mentor';
import { characterName, unlockedChapters, visibleCharacters } from '../../lib/knowledge';
import { analyzeReasoning } from '../../lib/reasoning';
import { play } from '../../lib/sound';

interface Link {
  id: string;
  from: string;
  to: string;
  type: RelationshipType;
  chapter: number;
  why: string;
  /** Optional earlier state, so the map can show change over time. */
  earlier?: { type: RelationshipType; chapter: number };
}

const TYPES: { id: RelationshipType; label: string; color: string }[] = [
  { id: 'alliance', label: 'Alliance', color: 'var(--good)' },
  { id: 'conflict', label: 'Conflict', color: 'var(--bad)' },
  { id: 'mentor', label: 'Mentor', color: 'var(--accent)' },
  { id: 'manipulation', label: 'Manipulation', color: 'var(--sim)' },
  { id: 'family', label: 'Family', color: 'var(--accent-2)' },
  { id: 'rivalry', label: 'Rivalry', color: 'var(--warn)' },
];
const typeOf = (t: RelationshipType) => TYPES.find((x) => x.id === t)!;

export function Connections({ step, onDone }: { step: ConnectionsStep; onDone: (insights: string[]) => void }) {
  const { mission, novel } = useMissionCtx();
  const { data, save, response } = useStepResponse(step.id);
  const r = useReading(mission);
  const visible = new Set(visibleCharacters(novel).map((c) => c.id));
  const chars = step.characterIds.filter((id) => visible.has(id));
  const chapters = unlockedChapters(novel).filter((n) => n <= step.toChapter).sort((a, b) => a - b);

  const [links, setLinks] = useState<Link[]>((data.links as Link[]) ?? []);
  const [from, setFrom] = useState<string | null>(null);
  const [draft, setDraft] = useState<Link | null>(null);
  const [asOf, setAsOf] = useState(step.toChapter);
  const [showRef, setShowRef] = useState(false);

  const pos = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    chars.forEach((id, i) => {
      if (i === 0) { out[id] = { x: 50, y: 50 }; return; }
      const a = ((i - 1) / (chars.length - 1)) * Math.PI * 2 - Math.PI / 2;
      out[id] = { x: 50 + Math.cos(a) * 38, y: 50 + Math.sin(a) * 38 };
    });
    return out;
  }, [chars.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (next: Link[]) => { setLinks(next); save({ links: next }); };

  const pick = (id: string) => {
    if (!from) { setFrom(id); play('tap'); return; }
    if (from === id) { setFrom(null); return; }
    const existing = links.find((l) => (l.from === from && l.to === id) || (l.from === id && l.to === from));
    setDraft(existing ?? { id: `${from}-${id}-${Date.now()}`, from, to: id, type: 'alliance', chapter: chapters[chapters.length - 1] ?? step.toChapter, why: '' });
    setFrom(null);
    play('open');
  };

  const saveDraft = () => {
    if (!draft) return;
    persist([...links.filter((l) => l.id !== draft.id), draft]);
    setDraft(null);
    play('pin');
  };

  const stateAt = (l: Link) => {
    if (l.earlier && asOf < l.chapter && asOf >= l.earlier.chapter) return { type: l.earlier.type, active: true };
    return { type: l.type, active: asOf >= (l.earlier ? l.earlier.chapter : l.chapter) };
  };

  const justified = links.filter((l) => analyzeReasoning(l.why).words >= 6);
  const canSubmit = justified.length >= 3;
  const refLinks = novel.relationships.filter((x) => chapters.includes(x.chapter) && chars.includes(x.from) && chars.includes(x.to));
  const samePair = (a: { from: string; to: string }, b: { from: string; to: string }) => (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from);

  const finish = () => {
    const ins = canSubmit ? ['network'] : [];
    save({ links, insights: ins }, { submit: true, revision: response?.status === 'submitted' ? 'Revised relationship map' : undefined });
    onDone(ins);
  };

  return (
    <div className="connections">
      <div className="connections-grid">
        <section className="panel net-panel" aria-labelledby="net-h">
          <div className="row between">
            <h2 id="net-h" className="hud accent" style={{ margin: 0 }}>Relationship network</h2>
            <span className="small muted">{from ? `Now choose who ${characterName(novel, from)} is connected to.` : 'Choose two characters to connect them.'}</span>
          </div>
          <div className="net" role="group" aria-label="Characters">
            <svg className="net-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {links.map((l) => {
                const a = pos[l.from], b = pos[l.to];
                if (!a || !b) return null;
                const st = stateAt(l);
                return (
                  <motion.line key={l.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    animate={{ stroke: typeOf(st.type).color, opacity: st.active ? 0.9 : 0.08, strokeWidth: st.active ? 0.7 : 0.3 }}
                    transition={{ duration: 0.6 }} strokeDasharray={st.type === 'manipulation' ? '1.5 1' : undefined} vectorEffect="non-scaling-stroke" />
                );
              })}
              {showRef && refLinks.map((x) => {
                const a = pos[x.from], b = pos[x.to];
                return a && b ? <line key={x.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="ref-line" vectorEffect="non-scaling-stroke" /> : null;
              })}
            </svg>
            {chars.map((id, i) => (
              <button key={id} type="button" className={`net-node ${from === id ? 'from' : ''} ${i === 0 ? 'hub' : ''}`}
                style={{ left: `${pos[id].x}%`, top: `${pos[id].y}%` }} aria-pressed={from === id} onClick={() => pick(id)}>
                <span className="net-initial" aria-hidden="true">{characterName(novel, id).slice(0, 1)}</span>
                <span className="net-name">{characterName(novel, id)}</span>
              </button>
            ))}
          </div>
          <div className="field" style={{ marginTop: '0.5rem' }}>
            <label htmlFor="asof">Show the network as of Chapter {asOf}</label>
            <input id="asof" type="range" min={step.fromChapter} max={step.toChapter} value={asOf} onChange={(e) => setAsOf(Number(e.target.value))} />
            <span className="help">Slide back to see how the relationships looked earlier. Links you marked as changed shift colour.</span>
          </div>
          <div className="legend" aria-label="Legend">
            {TYPES.map((t) => <span key={t.id} className="legend-item"><span style={{ background: t.color }} aria-hidden="true" /> {t.label}</span>)}
          </div>
        </section>

        <aside className="panel" aria-labelledby="links-h">
          <h2 id="links-h" className="hud accent">Your connections ({links.length})</h2>
          {!links.length && <p className="small muted">No connections yet. Choose two characters on the map.</p>}
          <ul className="conn-list">
            {links.map((l) => {
              const ok = analyzeReasoning(l.why).words >= 6;
              return (
                <li key={l.id} className="conn-item">
                  <div className="row between" style={{ gap: '0.3rem' }}>
                    <strong>{characterName(novel, l.from)} ↔ {characterName(novel, l.to)}</strong>
                    <span className="chip tiny" style={{ color: typeOf(l.type).color, borderColor: typeOf(l.type).color }}>{typeOf(l.type).label}</span>
                  </div>
                  {l.earlier && <p className="tiny muted" style={{ margin: 0 }}>Changed: {typeOf(l.earlier.type).label} (Ch. {l.earlier.chapter}) → {typeOf(l.type).label} (Ch. {l.chapter})</p>}
                  <p className="small" style={{ margin: '0.25rem 0' }}>{l.why || <em className="muted">Needs evidence</em>}</p>
                  {!ok && <p className="tiny" style={{ color: 'var(--warn)', margin: 0 }}>Add evidence (at least a sentence) to justify this link.</p>}
                  <div className="row" style={{ gap: '0.25rem' }}>
                    <button className="btn quiet small" onClick={() => setDraft(l)}><Icon name="edit" size={14} /> Edit</button>
                    <button className="btn quiet small" onClick={() => persist(links.filter((x) => x.id !== l.id))}><Icon name="trash" size={14} /> Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>

          {links.length >= 3 && (
            <div style={{ marginTop: '1rem' }}>
              <button className="btn ghost small" aria-pressed={showRef} onClick={() => setShowRef(!showRef)}>
                <Icon name="eye" size={16} /> {showRef ? 'Hide' : 'Compare with'} your teacher’s reference map
              </button>
              {showRef && (
                <div className="small" style={{ marginTop: '0.6rem' }}>
                  <p className="muted" style={{ margin: '0 0 0.3rem' }}>Dotted lines show your teacher’s reference connections. Differences are worth discussing, not mistakes.</p>
                  <ul className="ref-diff">
                    {refLinks.map((x) => {
                      const mine = links.find((l) => samePair(l, x));
                      return (
                        <li key={x.id}>
                          {characterName(novel, x.from)} ↔ {characterName(novel, x.to)}: <em>{typeOf(x.type).label}</em>{' '}
                          {mine ? (mine.type === x.type ? <span className="chip tiny good">you agree</span> : <span className="chip tiny amber">you said {typeOf(mine.type).label}</span>) : <span className="chip tiny">not on your map</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          <hr className="divider" />
          <p className="small muted">{justified.length}/3 justified connections needed.</p>
          <button className="btn primary block" disabled={!canSubmit} onClick={finish}>Log the network <Icon name="check" size={18} /></button>
        </aside>
      </div>

      <AnimatePresence>
        {draft && (
          <>
            <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDraft(null)} />
            <motion.div className="modal" role="dialog" aria-modal="true" aria-labelledby="link-h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 id="link-h">{characterName(novel, draft.from)} ↔ {characterName(novel, draft.to)}</h2>
              <fieldset className="plain-fieldset">
                <legend className="label">What kind of connection is it, by Chapter {draft.chapter}?</legend>
                <div className="row" style={{ gap: '0.4rem', marginTop: '0.4rem' }}>
                  {TYPES.map((t) => (
                    <button key={t.id} type="button" className="chip" aria-pressed={draft.type === t.id} onClick={() => setDraft({ ...draft, type: t.id })} autoFocus={draft.type === t.id}>{t.label}</button>
                  ))}
                </div>
              </fieldset>
              <div className="row" style={{ marginTop: '0.8rem' }}>
                <label className="field" style={{ flex: 1 }}>
                  <span className="label">Most important chapter</span>
                  <select className="select" value={draft.chapter} onChange={(e) => setDraft({ ...draft, chapter: Number(e.target.value) })}>
                    {chapters.map((c) => <option key={c} value={c}>Chapter {c}</option>)}
                  </select>
                </label>
              </div>
              <div className="field" style={{ marginTop: '0.8rem' }}>
                <label htmlFor="why">Evidence: what happens that shows this connection?</label>
                <textarea id="why" className="textarea" value={draft.why} onChange={(e) => setDraft({ ...draft, why: e.target.value })}
                  placeholder={r.frames ? '___ and ___ are connected because in Chapter ___, ___.' : ''} />
              </div>
              <label className="toggle" style={{ marginTop: '0.4rem' }}>
                <span><strong>This relationship changed</strong><br /><span className="small muted">Record what it was like earlier.</span></span>
                <input type="checkbox" className="switch" role="switch" checked={!!draft.earlier}
                  onChange={(e) => setDraft({ ...draft, earlier: e.target.checked ? { type: 'alliance', chapter: chapters[0] ?? step.fromChapter } : undefined })} />
              </label>
              {draft.earlier && (
                <div className="row" style={{ marginTop: '0.5rem' }}>
                  <label className="field" style={{ flex: 1 }}>
                    <span className="label">Earlier it was</span>
                    <select className="select" value={draft.earlier.type} onChange={(e) => setDraft({ ...draft, earlier: { ...draft.earlier!, type: e.target.value as RelationshipType } })}>
                      {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </label>
                  <label className="field" style={{ flex: 1 }}>
                    <span className="label">around</span>
                    <select className="select" value={draft.earlier.chapter} onChange={(e) => setDraft({ ...draft, earlier: { ...draft.earlier!, chapter: Number(e.target.value) } })}>
                      {chapters.filter((c) => c < draft.chapter).map((c) => <option key={c} value={c}>Chapter {c}</option>)}
                    </select>
                  </label>
                </div>
              )}
              <div className="row between" style={{ marginTop: '1rem' }}>
                <Mentor text={draft.why} novel={novel} task="connection" thinkingLevel={mission.thinkingLevel} />
                <div className="row">
                  <button className="btn quiet" onClick={() => setDraft(null)}>Cancel</button>
                  <button className="btn primary" onClick={saveDraft}>Save connection</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
