import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EvidenceBoardStep, Evidence } from '../../data/types';
import { useMissionCtx, useStepResponse } from '../MissionContext';
import { useReading, ReadAloud, VerifyBadge } from '../../components/Reading';
import { Icon } from '../../components/Icon';
import { Mentor } from '../../components/Mentor';
import { caseStrength, emptyBoard, type BoardState } from '../../lib/caseStrength';
import { shortNames } from '../../lib/reasoning';
import { visibleEvidence } from '../../lib/knowledge';
import { play } from '../../lib/sound';

const LINK_LABELS = ['leads to', 'contradicts', 'same pattern', 'explains'];

export function EvidenceBoard({ step, onDone }: { step: EvidenceBoardStep; onDone: (insights: string[]) => void }) {
  const { mission, novel } = useMissionCtx();
  const { data, save, response } = useStepResponse(step.id);
  const r = useReading(mission);
  const [b, setB] = useState<BoardState>(() => ({ ...emptyBoard(), ...(data as Partial<BoardState>) }));
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [linkLabel, setLinkLabel] = useState(LINK_LABELS[0]);
  const [pinFor, setPinFor] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean> | null>(null);
  const [ruling, setRuling] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)');
    const f = () => setNarrow(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  const visible = useMemo(() => new Set(visibleEvidence(novel).map((e) => e.id)), [novel]);
  const cards = step.cards.filter((c) => visible.has(c.evidenceId));
  const evidence = cards.map((c) => novel.evidence.find((e) => e.id === c.evidenceId)).filter((e): e is Evidence => !!e);
  const names = useMemo(() => shortNames(novel.characters.map((c) => c.name)), [novel]);
  const strength = caseStrength({ ...step, cards }, evidence, b, mission.thinkingLevel, names);

  // Autosave the board as the student works.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => save({ ...b }), 500);
    return () => clearTimeout(t);
  }, [b]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<BoardState>) => setB((prev) => ({ ...prev, ...patch }));
  // Default layout: three columns, rows tall enough that cards never overlap.
  const rows = Math.max(1, Math.ceil(evidence.length / 3));
  const boardHeight = rows * 330 + 30;
  const posOf = (id: string, i: number) => b.positions[id] ?? { x: 3 + (i % 3) * 33, y: (Math.floor(i / 3) * 330 + 18) / boardHeight * 100 };

  const pin = (cardId: string, theoryId: string, stance: 'supports' | 'challenges') => {
    update({ pins: { ...b.pins, [cardId]: { theoryId, stance } } });
    setPinFor(null);
    play('pin');
  };
  const unpin = (cardId: string) => {
    const pins = { ...b.pins };
    delete pins[cardId];
    update({ pins });
  };
  const toggleLink = (id: string) => {
    if (!linkFrom) { setLinkFrom(id); play('tap'); return; }
    if (linkFrom === id) { setLinkFrom(null); return; }
    const exists = b.links.some((l) => (l.a === linkFrom && l.b === id) || (l.a === id && l.b === linkFrom));
    if (!exists) update({ links: [...b.links, { a: linkFrom, b: id, label: linkLabel }] });
    setLinkFrom(null);
    play('pin');
  };

  const checkSorting = () => {
    const res: Record<string, boolean> = {};
    for (const e of evidence) if (b.sorted[e.id]) res[e.id] = b.sorted[e.id] === e.kind;
    setChecked(res);
    play(Object.values(res).every(Boolean) ? 'success' : 'soft-fail');
  };

  // Drag to move; drop on a theory folder to pin.
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (narrow || (e.target as HTMLElement).closest('button, select, textarea')) return;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    drag.current = { id, dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const board = boardRef.current;
    if (!d || !board) return;
    const br = board.getBoundingClientRect();
    const x = ((e.clientX - br.left - d.dx) / br.width) * 100;
    const y = ((e.clientY - br.top - d.dy) / br.height) * 100;
    d.moved = true;
    setB((prev) => ({ ...prev, positions: { ...prev.positions, [d.id]: { x: clamp(x, 0, 74), y: clamp(y, 0, 100 - (320 / boardHeight) * 100) } } }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    (e.currentTarget as HTMLElement).style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-theory]') as HTMLElement | null;
    (e.currentTarget as HTMLElement).style.pointerEvents = '';
    if (target) setPinFor(`${d.id}::${target.dataset.theory}`);
  };

  const fileReport = () => {
    const ins: string[] = [];
    const allSorted = evidence.every((e) => b.sorted[e.id] === e.kind);
    if (allSorted) ins.push('sorter');
    const countered = Object.values(b.pins).some((p) => p.theoryId === b.theoryId && p.stance === 'challenges');
    if (countered && b.counter.trim().split(/\s+/).length >= 6) ins.push('other-side');
    save({ ...b, band: strength.band, overall: strength.overall, insights: ins },
      { submit: true, revision: response?.status === 'submitted' ? 'Revised case report' : undefined });
    onDone(ins);
  };

  const theory = step.theories.find((t) => t.id === b.theoryId);
  const supportingPins = Object.values(b.pins).filter((p) => p.theoryId === b.theoryId && p.stance === 'supports').length;
  const reasoningWords = `${b.claim} ${b.reasoning}`.trim().split(/\s+/).filter(Boolean).length;
  const canFile = !!theory && b.claim.trim().length > 0 && reasoningWords >= 15 && supportingPins > 0;
  const pinTarget = pinFor?.split('::');

  return (
    <div className="detective">
      <header className="case-header">
        <div>
          <span className="hud" style={{ color: 'var(--accent-2)' }}>Case file · {step.caseTitle}</span>
          <h2 className="case-question">{step.caseQuestion}</h2>
        </div>
        <div className="row small">
          <span className="chip">{Object.keys(b.sorted).length}/{evidence.length} sorted</span>
          <span className="chip">{Object.keys(b.pins).length} pinned</span>
          <span className="chip">{b.links.length} links</span>
        </div>
      </header>

      <div className="detective-grid">
        {/* ------------------------------------------------ theories */}
        <aside className="theories" aria-label="Theories">
          <h3 className="hud accent">Theories</h3>
          {step.theories.map((t, i) => {
            const pins = Object.entries(b.pins).filter(([, p]) => p.theoryId === t.id);
            const sup = pins.filter(([, p]) => p.stance === 'supports').length;
            const ch = pins.filter(([, p]) => p.stance === 'challenges').length;
            const ruled = b.ruledOut[t.id] !== undefined;
            return (
              <div key={t.id} data-theory={t.id} className={`theory ${b.theoryId === t.id ? 'chosen' : ''} ${ruled ? 'ruled' : ''}`}>
                <div className="row between" style={{ gap: '0.3rem' }}>
                  <span className="theory-code mono">T{i + 1}</span>
                  <span className="tiny muted">{sup} support · {ch} challenge</span>
                </div>
                <p className="theory-text">{r.pick(t.label, t.plain)}</p>
                {ruled ? (
                  <div className="small">
                    <span className="chip bad tiny">Ruled out</span>
                    <p className="small text-2" style={{ margin: '0.3rem 0' }}>{b.ruledOut[t.id] || <em>Add your reason.</em>}</p>
                    <button className="btn quiet small" onClick={() => { const ro = { ...b.ruledOut }; delete ro[t.id]; update({ ruledOut: ro }); }}>Reopen</button>
                  </div>
                ) : (
                  <div className="row" style={{ gap: '0.3rem' }}>
                    <button className="btn small" aria-pressed={b.theoryId === t.id} onClick={() => { update({ theoryId: t.id }); play('tap'); }}>
                      {b.theoryId === t.id ? 'Arguing this' : 'Argue this'}
                    </button>
                    <button className="btn quiet small" onClick={() => setRuling(t.id)}>Rule out</button>
                  </div>
                )}
                {ruling === t.id && (
                  <div className="field" style={{ marginTop: '0.5rem' }}>
                    <label htmlFor={`rule-${t.id}`} className="small">Why doesn’t the evidence support this?</label>
                    <textarea id={`rule-${t.id}`} className="textarea" style={{ minHeight: 70 }} defaultValue={b.ruledOut[t.id] ?? ''}
                      placeholder={r.frames ? 'This theory is weak because ___.' : ''}
                      onBlur={(e) => { update({ ruledOut: { ...b.ruledOut, [t.id]: e.target.value }, theoryId: b.theoryId === t.id ? null : b.theoryId }); setRuling(null); }} />
                    <span className="help">Click outside the box to save.</span>
                  </div>
                )}
              </div>
            );
          })}
          <p className="tiny muted">Drag a card onto a theory, or use the card’s Pin button. Several theories can be defended.</p>
        </aside>

        {/* ------------------------------------------------ board */}
        <section aria-label="Evidence board" className="board-col">
          <div className="board-tools row">
            {linkFrom ? (
              <>
                <span className="chip accent">Connecting: choose another card</span>
                <label className="row small" style={{ gap: '0.3rem' }}>
                  Link type
                  <select className="select" style={{ width: 'auto', minHeight: 34 }} value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)}>
                    {LINK_LABELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </label>
                <button className="btn quiet small" onClick={() => setLinkFrom(null)}>Cancel</button>
              </>
            ) : (
              <span className="small muted">Sort every card, pin your evidence, and connect cards that relate.</span>
            )}
            <div className="grow" />
            <button className="btn ghost small" onClick={checkSorting} disabled={!Object.keys(b.sorted).length}>Check my sorting</button>
          </div>

          <div ref={boardRef} className={`board ${narrow ? 'list' : ''}`} style={narrow ? undefined : { height: boardHeight }}>
            {!narrow && (
              <svg className="board-lines" aria-hidden="true">
                {b.links.map((l, i) => {
                  const ia = evidence.findIndex((e) => e.id === l.a);
                  const ib = evidence.findIndex((e) => e.id === l.b);
                  if (ia < 0 || ib < 0) return null;
                  const pa = posOf(l.a, ia), pb = posOf(l.b, ib);
                  const dy = (150 / boardHeight) * 100;
                  const x1 = pa.x + 12, y1 = pa.y + dy, x2 = pb.x + 12, y2 = pb.y + dy;
                  return (
                    <g key={i}>
                      <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} className={`thread ${l.label === 'contradicts' ? 'red' : ''}`} />
                      <text x={`${(x1 + x2) / 2}%`} y={`${(y1 + y2) / 2}%`} className="thread-label">{l.label}</text>
                    </g>
                  );
                })}
              </svg>
            )}
            {evidence.map((e, i) => {
              const p = posOf(e.id, i);
              const pinned = b.pins[e.id];
              const tIdx = pinned ? step.theories.findIndex((t) => t.id === pinned.theoryId) : -1;
              const unusual = strength.unusual.includes(e.id);
              const check = checked?.[e.id];
              const text = r.pick(e.text, e.plain);
              return (
                <motion.article key={e.id}
                  className={`ev-card ${linkFrom === e.id ? 'linking' : ''} ${pinned ? 'pinned' : ''}`}
                  style={narrow ? undefined : { left: `${p.x}%`, top: `${p.y}%` }}
                  initial={{ opacity: 0, scale: 0.94, rotate: narrow ? 0 : ((i % 3) - 1) * 1.2 }}
                  animate={{ opacity: 1, scale: 1, rotate: narrow ? 0 : ((i % 3) - 1) * 1.2 }}
                  transition={{ delay: i * 0.04 }}
                  onPointerDown={(ev) => onPointerDown(ev, e.id)} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                  aria-label={`Evidence card, Chapter ${e.chapter}`}>
                  <span className="ev-pin" aria-hidden="true" />
                  <div className="row between" style={{ gap: '0.3rem' }}>
                    <span className="hud">Ch. {e.chapter}</span>
                    <VerifyBadge v={e.verification} />
                  </div>
                  <p className="ev-text">{text}</p>
                  {e.quote && <p className="ev-quote">“{e.quote.text}” <span className="tiny">({e.quote.edition}, p. {e.quote.page})</span></p>}
                  <div className="segmented sort" role="group" aria-label="Fact or interpretation">
                    {(['fact', 'interpretation'] as const).map((k) => (
                      <button key={k} type="button" aria-pressed={b.sorted[e.id] === k}
                        onClick={() => { update({ sorted: { ...b.sorted, [e.id]: k } }); setChecked(null); play('tap'); }}>
                        {k === 'fact' ? 'Fact' : 'Interpretation'}
                      </button>
                    ))}
                  </div>
                  {check === false && <p className="tiny" style={{ color: 'var(--warn)', fontWeight: 700, margin: '0.3rem 0 0' }}>Look again: does this card describe something that happens, or a reading of it?</p>}
                  {check === true && <p className="tiny" style={{ color: 'var(--good)', fontWeight: 700, margin: '0.3rem 0 0' }}>✓ Sorted well.</p>}
                  {pinned && (
                    <p className={`pin-tag ${pinned.stance}`}>
                      {pinned.stance === 'supports' ? 'Supports' : 'Challenges'} T{tIdx + 1}
                      <button className="btn quiet small" onClick={() => unpin(e.id)} aria-label="Unpin card">✕</button>
                    </p>
                  )}
                  {unusual && <p className="tiny" style={{ color: 'var(--accent-2)', margin: '0.2rem 0 0' }}>Unexpected link. Explain it in your report.</p>}
                  <div className="row ev-actions" style={{ gap: '0.25rem' }}>
                    <button className="btn quiet small" onClick={() => setPinFor(`${e.id}::`)}><Icon name="pin" size={14} /> Pin</button>
                    <button className="btn quiet small" aria-pressed={linkFrom === e.id} onClick={() => toggleLink(e.id)}>
                      <Icon name="link" size={14} /> {linkFrom && linkFrom !== e.id ? 'Link here' : 'Connect'}
                    </button>
                    <ReadAloud text={text} />
                  </div>
                </motion.article>
              );
            })}
          </div>
          {b.links.length > 0 && (
            <ul className="link-list small" aria-label="Connections between cards">
              {b.links.map((l, i) => (
                <li key={i}>
                  <span>{short(evidence.find((e) => e.id === l.a))} <strong className="accent-text">{l.label}</strong> {short(evidence.find((e) => e.id === l.b))}</span>
                  <button className="btn quiet small" onClick={() => update({ links: b.links.filter((_, j) => j !== i) })} aria-label="Remove connection">✕</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ------------------------------------------------ report */}
      <section className="panel report" aria-labelledby="report-h">
        <div className="report-grid">
          <div>
            <h3 id="report-h" className="hud accent">Case report</h3>
            {!theory ? (
              <p className="callout small">Choose the theory you will argue for. Press “Argue this” on a theory.</p>
            ) : (
              <p className="small"><span className="mono accent-text">Arguing T{step.theories.indexOf(theory) + 1}:</span> {r.pick(theory.label, theory.plain)}</p>
            )}
            <div className="field">
              <label htmlFor="claim">Your claim</label>
              <input id="claim" className="input" value={b.claim} onChange={(e) => update({ claim: e.target.value })}
                placeholder={r.frames ? 'I believe ___ because ___.' : 'State your answer to the case question in one sentence.'} />
            </div>
            <div className="field" style={{ marginTop: '0.8rem' }}>
              <label htmlFor="case-reasoning">Evidence and reasoning</label>
              <textarea id="case-reasoning" className="textarea" value={b.reasoning} onChange={(e) => update({ reasoning: e.target.value })}
                placeholder={r.frames ? 'When ___ happens in Chapter ___, it suggests ___. This supports my claim because ___.' : 'Explain how your pinned evidence proves your claim.'} />
            </div>
            <div className="field" style={{ marginTop: '0.8rem' }}>
              <label htmlFor="counter">The other side {mission.thinkingLevel === 'foundational' && <span className="muted">(optional)</span>}</label>
              <span className="help">What would someone who disagrees point to? How do you answer them?</span>
              <textarea id="counter" className="textarea" style={{ minHeight: 80 }} value={b.counter} onChange={(e) => update({ counter: e.target.value })}
                placeholder={r.frames ? 'Some readers might argue ___, but ___.' : ''} />
            </div>
            <div className="row between" style={{ marginTop: '0.8rem' }}>
              <Mentor text={`${b.claim} ${b.reasoning} ${b.counter}`} novel={novel} task="case" thinkingLevel={mission.thinkingLevel} evidenceCount={supportingPins} />
              <button className="btn primary" disabled={!canFile} onClick={fileReport}>File case report <Icon name="file" size={18} /></button>
            </div>
            {!canFile && <p className="tiny muted" style={{ marginTop: '0.4rem' }}>To file: choose a theory, pin at least one supporting card, write a claim and at least 15 words of reasoning.</p>}
          </div>

          <div className="strength" aria-live="polite">
            <h3 className="hud">Case strength</h3>
            <div className="strength-band">{strength.band}</div>
            <div className="meter big" role="progressbar" aria-label="Case strength" aria-valuenow={Math.round(strength.overall * 100)} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.round(strength.overall * 100)}%` }} />
            </div>
            <ul className="strength-parts">
              {strength.parts.map((p) => (
                <li key={p.id}>
                  <div className="row between small"><strong>{p.label}</strong><span className="mono">{Math.round(p.value * 100)}%</span></div>
                  <div className="meter"><span style={{ width: `${p.value * 100}%` }} /></div>
                  <p className="tiny text-2" style={{ margin: '0.2rem 0 0' }}>{p.note}</p>
                </li>
              ))}
            </ul>
            <AnimatePresence>
              {theory && supportingPins > 0 && (
                <motion.p className="callout amber small" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <strong>Investigator’s challenge:</strong> {theory.challenge}
                </motion.p>
              )}
            </AnimatePresence>
            <p className="tiny muted">Strength measures how well your case is built, not whether you picked a “right” theory.</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ pin dialog */}
      <AnimatePresence>
        {pinTarget && (
          <>
            <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPinFor(null)} />
            <motion.div className="modal" role="dialog" aria-modal="true" aria-labelledby="pin-h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 id="pin-h">Pin this card</h2>
              <p className="text-2">{r.pick(evidence.find((e) => e.id === pinTarget[0])?.text ?? '', evidence.find((e) => e.id === pinTarget[0])?.plain)}</p>
              <div className="stack" style={{ ['--gap' as string]: '0.6rem' }}>
                {step.theories.filter((t) => !pinTarget[1] || t.id === pinTarget[1]).map((t) => (
                  <div key={t.id} className="pin-row">
                    <span className="small grow"><span className="mono accent-text">T{step.theories.indexOf(t) + 1}</span> {r.pick(t.label, t.plain)}</span>
                    <div className="row" style={{ gap: '0.3rem' }}>
                      <button className="btn small" onClick={() => pin(pinTarget[0], t.id, 'supports')} autoFocus={t.id === (pinTarget[1] || step.theories[0].id)}>Supports</button>
                      <button className="btn small ghost" onClick={() => pin(pinTarget[0], t.id, 'challenges')}>Challenges</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="row end" style={{ marginTop: '1rem' }}>
                <button className="btn quiet" onClick={() => setPinFor(null)}>Cancel</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const short = (e?: Evidence) => (e ? `“${e.text.split(' ').slice(0, 6).join(' ')}…”` : '');
