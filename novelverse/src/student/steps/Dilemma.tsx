import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useMemo, useState } from 'react';
import type { DilemmaStep } from '../../data/types';
import { useMissionCtx, useStepResponse } from '../MissionContext';
import { useApp } from '../../state/store';
import { useReading, ReadAloud, VerifyBadge } from '../../components/Reading';
import { Icon } from '../../components/Icon';
import { Mentor } from '../../components/Mentor';
import { EvidenceLocker } from './EvidenceLocker';
import { CommandMap2D } from '../scene/CommandMap2D';
import { hasWebGL } from '../../lib/webgl';
import { visibleEvidence } from '../../lib/knowledge';
import { analyzeReasoning, shortNames } from '../../lib/reasoning';
import { play } from '../../lib/sound';

const CommandScene3D = lazy(() => import('../scene/CommandScene3D'));

type Phase = 'explore' | 'decide' | 'consequence' | 'compare';

export function Dilemma({ step, onDone }: { step: DilemmaStep; onDone: (insights: string[]) => void }) {
  const { mission, novel } = useMissionCtx();
  const { data, save, response } = useStepResponse(step.id);
  const settings = useApp((s) => s.settings);
  const r = useReading(mission);

  const [phase, setPhase] = useState<Phase>(response?.status === 'submitted' ? 'compare' : ((data.phase as Phase) ?? 'explore'));
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>((data.seen as string[]) ?? []);
  const [choiceId, setChoiceId] = useState<string | null>((data.choiceId as string) ?? null);
  const [values, setValues] = useState<string[]>((data.values as string[]) ?? []);
  const [evidenceIds, setEvidenceIds] = useState<string[]>((data.evidenceIds as string[]) ?? []);
  const [reasoning, setReasoning] = useState<string>((data.reasoning as string) ?? '');
  const [followUpId, setFollowUpId] = useState<string | null>((data.followUpId as string) ?? null);
  const [compare, setCompare] = useState<string>((data.compare as string) ?? '');
  const [explored, setExplored] = useState<string[]>((data.explored as string[]) ?? []);
  const [mentorUsed, setMentorUsed] = useState(false);

  const evidence = visibleEvidence(novel).filter((e) => step.evidenceIds.includes(e.id));
  const choice = step.choices.find((c) => c.id === choiceId);
  const follow = choice?.followUp?.choices.find((f) => f.id === followUpId);
  const names = useMemo(() => shortNames(novel.characters.map((c) => c.name)), [novel]);
  const signals = analyzeReasoning(reasoning, names);
  const ready = !!choice && values.length > 0 && evidenceIds.length > 0 && signals.words >= 8;

  const webgl = typeof document !== 'undefined' && hasWebGL();
  const [mode, setMode] = useState<'3d' | '2d'>(() =>
    settings.scene === '2d' || !webgl ? '2d' : settings.scene === '3d' ? '3d' : window.innerWidth >= 700 ? '3d' : '2d');
  const accent = typeof document !== 'undefined' ? getComputedStyle(document.querySelector('.app') ?? document.body).getPropertyValue('--accent').trim() || '#5ee7ff' : '#5ee7ff';

  const persist = (extra: Record<string, unknown>) => save({ phase, seen, choiceId, values, evidenceIds, reasoning, followUpId, compare, explored, ...extra });

  const select = (id: string) => {
    setActive(id);
    if (!seen.includes(id)) setSeen([...seen, id]);
    play('open');
  };
  const hotspot = step.hotspots.find((h) => h.id === active);

  const commit = () => {
    play('success');
    setPhase('consequence');
    persist({ phase: 'consequence' });
  };

  const finish = () => {
    const ins: string[] = [];
    if (evidenceIds.length && signals.explains) ins.push('anchored');
    if (values.length && compare.trim().split(/\s+/).length >= 8) ins.push('perspective');
    save({ phase: 'compare', seen, choiceId, values, evidenceIds, reasoning, followUpId, compare, explored, insights: ins, mentorUsed },
      { submit: true, revision: response?.status === 'submitted' ? 'Revised decision or comparison' : undefined });
    onDone(ins);
  };

  const tryAnother = () => {
    if (choiceId && !explored.includes(choiceId)) setExplored([...explored, choiceId]);
    setPhase('decide');
    setFollowUpId(null);
  };

  return (
    <div className="dilemma">
      <div className="sim-banner" role="note">
        <Icon name="cube" size={18} /> SIMULATION. This situation is inspired by the novel. What happens here is hypothetical, not what happens in the book.
      </div>

      <section className="panel scenario" aria-labelledby="scenario-h">
        <div className="row between">
          <h2 id="scenario-h" className="hud accent" style={{ margin: 0 }}>Situation report</h2>
          <ReadAloud text={r.pick(step.scenario, step.plainScenario)} />
        </div>
        <p className="scenario-text">{r.pick(step.scenario, step.plainScenario)}</p>
      </section>

      {phase === 'explore' && (
        <section aria-labelledby="deck-h">
          <div className="row between" style={{ margin: '1.25rem 0 0.6rem' }}>
            <h2 id="deck-h" style={{ margin: 0, fontSize: '1.2rem' }}>Command deck</h2>
            {webgl && (
              <div className="segmented" role="group" aria-label="View">
                <button type="button" aria-pressed={mode === '3d'} onClick={() => setMode('3d')}>3D room</button>
                <button type="button" aria-pressed={mode === '2d'} onClick={() => setMode('2d')}>2D map</button>
              </div>
            )}
          </div>
          <div className="deck-grid">
            <div className="deck-view">
              {mode === '3d' ? (
                <Suspense fallback={<div className="scene-loading"><span className="hud accent">Rendering command deck…</span></div>}>
                  <div className="scene-wrap">
                    <CommandScene3D hotspots={step.hotspots} active={active} seen={seen} onSelect={select} reduced={settings.reducedMotion} accent={accent} />
                    <p className="scene-hint small">Click a console, or use the list beside the room.</p>
                  </div>
                </Suspense>
              ) : (
                <CommandMap2D hotspots={step.hotspots} active={active} seen={seen} onSelect={select} />
              )}
            </div>
            <div className="deck-side">
              <ul className="hotspot-list" aria-label="Consoles">
                {step.hotspots.map((h) => (
                  <li key={h.id}>
                    <button type="button" className={`hotspot-btn ${active === h.id ? 'active' : ''}`} aria-pressed={active === h.id} onClick={() => select(h.id)}>
                      <span className={`dot ${seen.includes(h.id) ? 'seen' : ''}`} aria-hidden="true" />
                      {h.label}
                      {seen.includes(h.id) && <span className="tiny muted">viewed</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <AnimatePresence mode="wait">
                {hotspot ? (
                  <motion.div key={hotspot.id} className="panel intel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-live="polite">
                    <div className="row between"><span className="hud accent">{hotspot.label}</span><ReadAloud text={r.pick(hotspot.text, hotspot.plain)} /></div>
                    <p style={{ margin: '0.4rem 0 0' }}>{r.pick(hotspot.text, hotspot.plain)}</p>
                  </motion.div>
                ) : (
                  <p className="small muted">Open each console to gather what you know before you decide.</p>
                )}
              </AnimatePresence>
              <p className="small muted mono">{seen.length}/{step.hotspots.length} consoles reviewed</p>
              <button className="btn primary block" disabled={seen.length === 0} onClick={() => { setPhase('decide'); persist({ phase: 'decide' }); play('tap'); }}>
                I’m ready to decide <Icon name="next" size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === 'decide' && (
        <section className="decide" aria-labelledby="decide-h">
          <h2 id="decide-h" style={{ marginTop: '1.5rem' }}>Your orders, Commander</h2>
          <div className="choice-grid" role="radiogroup" aria-label="Choose your decision">
            {step.choices.map((c, i) => (
              <button key={c.id} type="button" role="radio" aria-checked={choiceId === c.id}
                className={`choice-card ${choiceId === c.id ? 'on' : ''}`} onClick={() => { setChoiceId(c.id); play('tap'); }}>
                <span className="choice-key mono" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                <span className="choice-label">{r.pick(c.label, c.plain)}</span>
                {explored.includes(c.id) && <span className="chip tiny sim">explored</span>}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {choice && (
              <motion.div className="justify panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="hud accent">Before you commit: justify your decision</h3>
                <fieldset className="plain-fieldset">
                  <legend className="label">1. Which values are driving this choice?</legend>
                  <div className="row" style={{ gap: '0.4rem', marginTop: '0.4rem' }}>
                    {step.valueOptions.map((v) => (
                      <button key={v} type="button" className="chip" aria-pressed={values.includes(v)}
                        onClick={() => setValues(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])}>{v}</button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="plain-fieldset" style={{ marginTop: '1rem' }}>
                  <legend className="label">2. What from the novel informed your decision? Choose at least one card.</legend>
                  <EvidenceLocker novel={novel} evidence={evidence} selected={evidenceIds}
                    onToggle={(id) => setEvidenceIds(evidenceIds.includes(id) ? evidenceIds.filter((x) => x !== id) : [...evidenceIds, id])} />
                </fieldset>
                <div className="field" style={{ marginTop: '1rem' }}>
                  <label htmlFor="reasoning">3. Why? Connect your evidence to your choice.</label>
                  <textarea id="reasoning" className="textarea" value={reasoning} onChange={(e) => setReasoning(e.target.value)}
                    placeholder={r.frames ? 'I chose ___ because in Chapter ___, ___. This shows that ___.' : 'I chose this because…'} />
                  <ReasoningHints words={signals.words} explains={signals.explains} evidence={evidenceIds.length} values={values.length} />
                </div>
                <div className="row between" style={{ marginTop: '0.75rem' }}>
                  <Mentor text={reasoning} novel={novel} task="justify" thinkingLevel={mission.thinkingLevel} evidenceCount={evidenceIds.length} onUse={() => setMentorUsed(true)} />
                  <button className="btn primary" disabled={!ready} onClick={commit}>Commit decision <Icon name="flag" size={18} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {(phase === 'consequence' || phase === 'compare') && choice && (
        <section aria-labelledby="cons-h" style={{ marginTop: '1.25rem' }}>
          <motion.div className="panel consequence" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="chip sim">Simulated outcome</span>
            <h2 id="cons-h" style={{ marginTop: '0.6rem' }}>{r.pick(choice.label, choice.plain)}</h2>
            <div className="row top" style={{ flexWrap: 'nowrap' }}>
              <p className="grow consequence-text">{r.pick(choice.consequence, choice.plainConsequence)}</p>
              <ReadAloud text={r.pick(choice.consequence, choice.plainConsequence)} />
            </div>
            {choice.followUp && (
              <div style={{ marginTop: '1rem' }}>
                <h3>{choice.followUp.prompt}</h3>
                <div className="choice-grid two" role="radiogroup" aria-label={choice.followUp.prompt}>
                  {choice.followUp.choices.map((f) => (
                    <button key={f.id} type="button" role="radio" aria-checked={followUpId === f.id}
                      className={`choice-card ${followUpId === f.id ? 'on' : ''}`} onClick={() => { setFollowUpId(f.id); play('tap'); }}>
                      <span className="choice-label">{f.label}</span>
                    </button>
                  ))}
                </div>
                {follow && <motion.p className="callout sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{follow.consequence}</motion.p>}
              </div>
            )}
            {phase === 'consequence' && (!choice.followUp || follow) && (
              <div className="row end" style={{ marginTop: '1rem' }}>
                <button className="btn ghost" onClick={tryAnother}>Explore another path</button>
                <button className="btn primary" onClick={() => { setPhase('compare'); persist({ phase: 'compare' }); play('open'); }}>
                  Compare with the novel <Icon name="book" size={18} />
                </button>
              </div>
            )}
          </motion.div>

          {phase === 'compare' && (
            <motion.div className="panel canon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem' }}>
              <div className="row between">
                <span className="hud" style={{ color: 'var(--good)' }}><Icon name="book" size={14} /> In the novel</span>
                <VerifyBadge v={step.canonVerification} />
              </div>
              <div className="row top" style={{ flexWrap: 'nowrap' }}>
                <p className="grow" style={{ marginTop: '0.5rem' }}>{step.canonNote}</p>
                <ReadAloud text={step.canonNote} />
              </div>
              <div className="your-path small">
                <strong>Your path:</strong> {choice.label} {follow ? `→ ${follow.label}` : ''} · values: {values.join(', ')}
              </div>
              <div className="field" style={{ marginTop: '1rem' }}>
                <label htmlFor="compare">How does your choice compare with what happens in the novel? What does the difference reveal about the character?</label>
                <textarea id="compare" className="textarea" value={compare} onChange={(e) => setCompare(e.target.value)}
                  placeholder={r.frames ? 'Unlike / Like the character, I ___. This suggests they ___.' : 'Compare your path with the novel…'} />
              </div>
              <div className="row between" style={{ marginTop: '0.75rem' }}>
                <div className="row">
                  <Mentor text={compare} novel={novel} task="reflect" thinkingLevel={mission.thinkingLevel} onUse={() => setMentorUsed(true)} />
                  <button className="btn quiet small" onClick={tryAnother}>Explore another path</button>
                </div>
                <button className="btn primary" disabled={compare.trim().split(/\s+/).length < 5} onClick={finish}>
                  Log decision <Icon name="check" size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </section>
      )}
    </div>
  );
}

function ReasoningHints({ words, explains, evidence, values }: { words: number; explains: boolean; evidence: number; values: number }) {
  const items = [
    { ok: values > 0, label: 'Values chosen' },
    { ok: evidence > 0, label: 'Evidence attached' },
    { ok: words >= 8, label: 'Reasoning written' },
    { ok: explains, label: 'Evidence connected to choice' },
  ];
  return (
    <ul className="checklist" aria-label="Justification checklist">
      {items.map((i) => (
        <li key={i.label} className={i.ok ? 'ok' : ''}>
          <span aria-hidden="true">{i.ok ? '◆' : '◇'}</span> {i.label}
          <span className="sr-only">{i.ok ? ' done' : ' not yet'}</span>
        </li>
      ))}
    </ul>
  );
}
