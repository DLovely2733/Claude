import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { CourtroomStep, Evidence, ObjectionType, OpposingArgument } from '../../data/types';
import { useMissionCtx, useStepResponse } from '../MissionContext';
import { useReading, ReadAloud, VerifyBadge } from '../../components/Reading';
import { Icon } from '../../components/Icon';
import { Mentor } from '../../components/Mentor';
import { characterName, visibleEvidence } from '../../lib/knowledge';
import { analyzeReasoning, shortNames } from '../../lib/reasoning';
import { play } from '../../lib/sound';

// Character Courtroom: advocacy, then judgement. Students argue one side,
// learn to separate facts from interpretations by objecting to misused
// evidence, and finish by stepping out of their role to weigh both sides.

type Side = 'prosecution' | 'defence';
type Stage = 'side' | 'exhibits' | 'cross' | 'closing' | 'verdict';
interface Exhibit { evidenceId: string; label: 'fact' | 'interpretation' | ''; point: string }
interface Objection { call: ObjectionType | 'accept' | ''; reason: string; ruled?: boolean; firstTry?: boolean }

export const OBJECTIONS: { id: ObjectionType | 'accept'; label: string; help: string }[] = [
  { id: 'speculation', label: 'Objection: speculation', help: 'It states a guess about thoughts or feelings as if it were fact.' },
  { id: 'ignores-evidence', label: 'Objection: ignores evidence', help: 'It leaves out evidence that clearly points the other way.' },
  { id: 'overgeneralization', label: 'Objection: overgeneralization', help: 'It claims too much: “every”, “only”, “always”.' },
  { id: 'accept', label: 'No objection: the point is sound', help: 'It matches the evidence. You will need to answer it instead.' },
];

const STAGES: { id: Stage; label: string }[] = [
  { id: 'side', label: 'Choose a side' },
  { id: 'exhibits', label: 'Exhibits' },
  { id: 'cross', label: 'Cross-examination' },
  { id: 'closing', label: 'Closing' },
  { id: 'verdict', label: 'Verdict' },
];

export function Courtroom({ step, onDone }: { step: CourtroomStep; onDone: (insights: string[]) => void }) {
  const { mission, novel } = useMissionCtx();
  const { data, save, response } = useStepResponse(step.id);
  const r = useReading(mission);
  const names = useMemo(() => shortNames(novel.characters.map((c) => c.name)), [novel]);
  const visible = new Set(visibleEvidence(novel).map((e) => e.id));
  const evidence = step.evidenceIds.map((id) => novel.evidence.find((e) => e.id === id)).filter((e): e is Evidence => !!e && visible.has(e.id));

  const [stage, setStage] = useState<Stage>((data.stage as Stage) ?? 'side');
  const [side, setSide] = useState<Side | null>((data.side as Side) ?? null);
  const [exhibits, setExhibits] = useState<Exhibit[]>((data.exhibits as Exhibit[]) ?? []);
  const [objections, setObjections] = useState<Record<string, Objection>>((data.objections as Record<string, Objection>) ?? {});
  const [rebuttalTarget, setRebuttalTarget] = useState<string>((data.rebuttalTarget as string) ?? '');
  const [closing, setClosing] = useState<string>((data.closing as string) ?? '');
  const [verdict, setVerdict] = useState<string>((data.verdict as string) ?? '');
  const [verdictReason, setVerdictReason] = useState<string>((data.verdictReason as string) ?? '');

  const defendant = characterName(novel, step.defendantId);
  const other: Side = side === 'prosecution' ? 'defence' : 'prosecution';
  const opposing = step.opposing.filter((o) => o.side === other);
  const snapshot = (extra: Record<string, unknown> = {}) => ({ stage, side, exhibits, objections, rebuttalTarget, closing, verdict, verdictReason, ...extra });
  const go = (s: Stage) => { setStage(s); save(snapshot({ stage: s })); play('open'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const exhibitsReady = exhibits.length >= 2 && exhibits.every((x) => x.label && analyzeReasoning(x.point).words >= 6);
  const crossReady = opposing.every((o) => objections[o.id]?.ruled);
  const closingReady = analyzeReasoning(closing, names).words >= 25 && !!rebuttalTarget;
  const verdictReady = !!verdict && analyzeReasoning(verdictReason, names).words >= 15;
  const stageIdx = STAGES.findIndex((s) => s.id === stage);

  const finish = () => {
    const ins: string[] = [];
    if (exhibits.every((x) => evidence.find((e) => e.id === x.evidenceId)?.kind === x.label)) ins.push('sorter');
    // Count first attempts: retrying after the judge's explanation is learning, not scoring.
    const correct = opposing.filter((o) => objections[o.id]?.firstTry).length;
    if (correct >= 2) ins.push('objection');
    if (analyzeReasoning(verdictReason, names).counters) ins.push('other-side');
    save(snapshot({ stage: 'verdict', correctRulings: correct, insights: ins }), { submit: true, revision: response?.status === 'submitted' ? 'Revised trial' : undefined });
    onDone(ins);
  };

  return (
    <div className="court">
      <header className="court-banner">
        <CourtSeal initial={defendant.slice(0, 1)} />
        <div className="grow">
          <span className="hud" style={{ color: 'var(--accent-2)' }}>{step.caseTitle}</span>
          <h2 className="court-charge">{step.charge}</h2>
          <div className="row" style={{ gap: '0.35rem' }}>
            <span className="chip">Defendant: {defendant}</span>
            {side && <span className={`chip ${side === 'prosecution' ? 'bad' : 'good'}`}>You: {side === 'prosecution' ? 'Prosecution' : 'Defence'}</span>}
          </div>
        </div>
        <ReadAloud text={step.charge} />
      </header>

      <ol className="court-stages" aria-label="Trial stages">
        {STAGES.map((s, i) => (
          <li key={s.id} className={i < stageIdx ? 'past' : i === stageIdx ? 'current' : ''} aria-current={i === stageIdx ? 'step' : undefined}>
            <span className="mono">{i + 1}</span> {s.label}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.section key={stage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="court-stage">
          {stage === 'side' && (
            <div>
              <h3>Which side will you argue?</h3>
              <p className="text-2">You are arguing a position, not confessing your opinion. At the end you will step out of your role and decide what the evidence really supports.</p>
              <div className="choice-grid two" role="radiogroup" aria-label="Side">
                {(['prosecution', 'defence'] as const).map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={side === s} className={`choice-card side-card ${side === s ? 'on' : ''} ${s}`}
                    onClick={() => { setSide(s); play('tap'); }}>
                    <Icon name={s === 'prosecution' ? 'scale' : 'shield'} size={28} />
                    <span className="choice-label">
                      {s === 'prosecution' ? 'Prosecution' : 'Defence'}
                      <span className="small text-2" style={{ display: 'block', fontWeight: 400, fontFamily: 'var(--font-body)' }}>
                        {s === 'prosecution' ? `Prove that ${defendant} is responsible.` : `Show that ${defendant} is not responsible, or less responsible than claimed.`}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="row end"><button className="btn primary" disabled={!side} onClick={() => go('exhibits')}>Enter the courtroom <Icon name="next" size={18} /></button></div>
            </div>
          )}

          {stage === 'exhibits' && (
            <div>
              <h3>Enter your exhibits (2 to 4)</h3>
              <p className="text-2">Label each exhibit honestly: is it a <strong>fact</strong> (something that happens) or an <strong>interpretation</strong> (a reading of it)? Then say what it proves for your side.</p>
              <ul className="exhibit-bank">
                {evidence.map((e) => {
                  const idx = exhibits.findIndex((x) => x.evidenceId === e.id);
                  const on = idx >= 0;
                  const ex = exhibits[idx];
                  const text = r.pick(e.text, e.plain);
                  return (
                    <li key={e.id} className={`exhibit ${on ? 'on' : ''}`}>
                      <div className="row top" style={{ flexWrap: 'nowrap' }}>
                        <button type="button" className="locker-toggle" aria-pressed={on} disabled={!on && exhibits.length >= 4}
                          onClick={() => { setExhibits(on ? exhibits.filter((x) => x.evidenceId !== e.id) : [...exhibits, { evidenceId: e.id, label: '', point: '' }]); play('pin'); }}>
                          <span className="locker-check" aria-hidden="true">{on ? <span className="mono">{String.fromCharCode(65 + idx)}</span> : <Icon name="plus" size={16} />}</span>
                          <span className="grow">
                            <span className="row" style={{ gap: '0.35rem' }}><span className="hud">Ch. {e.chapter}</span><VerifyBadge v={e.verification} /></span>
                            <span>{text}</span>
                          </span>
                        </button>
                        <ReadAloud text={text} />
                      </div>
                      {on && ex && (
                        <div className="exhibit-form">
                          <div className="segmented" role="group" aria-label={`Exhibit ${String.fromCharCode(65 + idx)}: fact or interpretation`}>
                            {(['fact', 'interpretation'] as const).map((k) => (
                              <button key={k} type="button" aria-pressed={ex.label === k}
                                onClick={() => setExhibits(exhibits.map((x) => (x.evidenceId === e.id ? { ...x, label: k } : x)))}>{k === 'fact' ? 'Fact' : 'Interpretation'}</button>
                            ))}
                          </div>
                          {ex.label && ex.label !== e.kind && (
                            <p className="tiny" style={{ color: 'var(--warn)', margin: '0.3rem 0 0' }}>The court clerk asks: is this something that happens, or a reading of what happens?</p>
                          )}
                          <label className="field" style={{ marginTop: '0.5rem' }}>
                            <span className="small">What does Exhibit {String.fromCharCode(65 + idx)} prove for the {side}?</span>
                            <textarea className="textarea" style={{ minHeight: 64 }} value={ex.point}
                              onChange={(ev) => setExhibits(exhibits.map((x) => (x.evidenceId === e.id ? { ...x, point: ev.target.value } : x)))}
                              placeholder={r.frames ? 'This proves ___ because ___.' : ''} />
                          </label>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="row between">
                <button className="btn quiet" onClick={() => go('side')}><Icon name="back" size={16} /> Side</button>
                <button className="btn primary" disabled={!exhibitsReady} onClick={() => go('cross')}>Begin cross-examination <Icon name="next" size={18} /></button>
              </div>
            </div>
          )}

          {stage === 'cross' && (
            <div>
              <h3>Cross-examination</h3>
              <p className="text-2">The {other} makes these arguments. Object when evidence is misused, and accept a point when it is sound. A good lawyer knows the difference.</p>
              <div className="stack">
                {opposing.map((o, i) => (
                  <CrossItem key={o.id} n={i + 1} arg={o} value={objections[o.id] ?? { call: '', reason: '' }} frames={r.frames}
                    onChange={(v) => setObjections({ ...objections, [o.id]: v })}
                    onRule={() => { const cur = objections[o.id]; const next = { ...objections, [o.id]: { ...cur, ruled: true, firstTry: cur.firstTry ?? isCorrect(o, cur) } }; setObjections(next); save(snapshot({ objections: next })); play(isCorrect(o, objections[o.id]) ? 'success' : 'soft-fail'); }} />
                ))}
              </div>
              <div className="row between" style={{ marginTop: '1rem' }}>
                <button className="btn quiet" onClick={() => go('exhibits')}><Icon name="back" size={16} /> Exhibits</button>
                <button className="btn primary" disabled={!crossReady} onClick={() => go('closing')}>Prepare closing <Icon name="next" size={18} /></button>
              </div>
            </div>
          )}

          {stage === 'closing' && (
            <div>
              <h3>Closing argument</h3>
              <fieldset className="plain-fieldset">
                <legend className="label">Which of the other side’s points is hardest for you to answer? Your closing must answer it.</legend>
                <div className="stack" style={{ ['--gap' as string]: '0.4rem', marginTop: '0.5rem' }}>
                  {opposing.map((o) => (
                    <label key={o.id} className={`engine-option ${rebuttalTarget === o.id ? 'on' : ''}`}>
                      <input type="radio" name="rebut" checked={rebuttalTarget === o.id} onChange={() => setRebuttalTarget(o.id)} />
                      <span>{o.text} {o.flaw === 'sound' && <span className="chip tiny">sound point</span>}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="field" style={{ marginTop: '1rem' }}>
                <label htmlFor="closing">Your closing: make your case using your exhibits, and answer that point.</label>
                <textarea id="closing" className="textarea" style={{ minHeight: 150 }} value={closing} onChange={(e) => setClosing(e.target.value)}
                  placeholder={r.frames ? `Members of the jury, the evidence shows ___. Exhibit A proves ___. The ${other} says ___, but ___.` : ''} />
                <span className="help">{analyzeReasoning(closing).words} words · at least 25</span>
              </div>
              <div className="row between" style={{ marginTop: '0.8rem' }}>
                <div className="row">
                  <button className="btn quiet" onClick={() => go('cross')}><Icon name="back" size={16} /> Cross</button>
                  <Mentor text={closing} novel={novel} task="case" thinkingLevel={mission.thinkingLevel} evidenceCount={exhibits.length} />
                </div>
                <button className="btn primary" disabled={!closingReady} onClick={() => go('verdict')}>Rest your case <Icon name="next" size={18} /></button>
              </div>
            </div>
          )}

          {stage === 'verdict' && (
            <div>
              <h3>Step out of your role</h3>
              <p className="text-2">You argued for the {side}. Now you are on the jury. Which verdict does the evidence actually support?</p>
              <div className="choice-grid" role="radiogroup" aria-label="Verdict">
                {step.verdicts.map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={verdict === v} className={`choice-card ${verdict === v ? 'on' : ''}`} onClick={() => { setVerdict(v); play('tap'); }}>
                    <Icon name="scale" size={22} /><span className="choice-label">{v}</span>
                  </button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="vreason">Why? Weigh the strongest evidence on both sides.</label>
                <textarea id="vreason" className="textarea" value={verdictReason} onChange={(e) => setVerdictReason(e.target.value)}
                  placeholder={r.frames ? 'The strongest evidence against is ___, but ___. So I find ___.' : ''} />
              </div>
              <div className="row between" style={{ marginTop: '0.8rem' }}>
                <div className="row">
                  <button className="btn quiet" onClick={() => go('closing')}><Icon name="back" size={16} /> Closing</button>
                  <Mentor text={verdictReason} novel={novel} task="case" thinkingLevel={mission.thinkingLevel} />
                </div>
                <button className="btn primary" disabled={!verdictReady} onClick={finish}>Deliver verdict <Icon name="scale" size={18} /></button>
              </div>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

export function isCorrect(o: OpposingArgument, v?: Objection) {
  if (!v?.call) return false;
  return o.flaw === 'sound' ? v.call === 'accept' : v.call === o.flaw;
}

function CrossItem({ n, arg, value, onChange, onRule, frames }: { n: number; arg: OpposingArgument; value: Objection; onChange: (v: Objection) => void; onRule: () => void; frames: boolean }) {
  const ruled = !!value.ruled;
  const ok = isCorrect(arg, value);
  return (
    <article className={`cross ${ruled ? (ok ? 'sustained' : 'overruled') : ''}`}>
      <div className="row between">
        <span className="hud">Argument {n} · {arg.side}</span>
        <ReadAloud text={arg.text} />
      </div>
      <p className="cross-text">“{arg.text}”</p>
      <div className="objection-grid" role="radiogroup" aria-label={`Your response to argument ${n}`}>
        {OBJECTIONS.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value.call === o.id} disabled={ruled}
            className={`objection ${value.call === o.id ? 'on' : ''}`} onClick={() => onChange({ ...value, call: o.id })}>
            <strong>{o.label}</strong><span className="tiny">{o.help}</span>
          </button>
        ))}
      </div>
      <label className="field" style={{ marginTop: '0.5rem' }}>
        <span className="small">Your reason</span>
        <input className="input" value={value.reason} disabled={ruled} onChange={(e) => onChange({ ...value, reason: e.target.value })}
          placeholder={frames ? 'This is ___ because the text actually shows ___.' : ''} />
      </label>
      {!ruled ? (
        <div className="row end" style={{ marginTop: '0.5rem' }}>
          <button className="btn small" disabled={!value.call || analyzeReasoning(value.reason).words < 4} onClick={onRule}>Put it to the judge</button>
        </div>
      ) : (
        <motion.div className={`ruling ${ok ? 'good' : 'warn'}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} role="status">
          <strong>{ok ? (value.call === 'accept' ? 'Agreed: this point stands.' : 'Sustained.') : value.call === 'accept' ? 'The judge disagrees: there is a problem with this argument.' : 'Overruled.'}</strong> {arg.why}
          {!ok && <button className="btn quiet small" onClick={() => onChange({ ...value, ruled: false })}>Try again</button>}
        </motion.div>
      )}
    </article>
  );
}

function CourtSeal({ initial }: { initial: string }) {
  return (
    <svg className="court-seal" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--accent-2)" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--accent-2)" strokeWidth="1" strokeDasharray="2 3" />
      <path d="M30 40 h40 M50 28 v44 M34 40 l-6 14 h12 z M66 40 l-6 14 h12 z M38 72 h24" stroke="var(--accent-2)" strokeWidth="2" fill="none" />
      <text x="50" y="94" textAnchor="middle" fontSize="9" fill="var(--accent-2)" fontFamily="var(--font-mono)">{initial}</text>
    </svg>
  );
}
