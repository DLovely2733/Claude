import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { ReflectionStep } from '../../data/types';
import { useMissionCtx, useStepResponse } from '../MissionContext';
import { useApp } from '../../state/store';
import { responseKey } from '../../data/synthetic';
import { useReading, ReadAloud } from '../../components/Reading';
import { Icon } from '../../components/Icon';
import { Mentor } from '../../components/Mentor';
import { EvidenceLocker } from './EvidenceLocker';
import { visibleEvidence } from '../../lib/knowledge';
import { analyzeReasoning, shortNames } from '../../lib/reasoning';
import { play } from '../../lib/sound';

// Theme Explorer: climb from a topic to a defensible, complicated theme
// statement. Feedback names what a rung needs; it never supplies the words.

const RUNGS = [
  { label: 'Topic', help: 'One or two words.' },
  { label: 'Observation', help: 'What do these chapters show about the topic? Stay close to the story.' },
  { label: 'Theme statement', help: 'Widen it: a full sentence about people or life, not just one character.' },
  { label: 'Complication', help: 'Add tension: “…but…”, “…yet…”, “…although…”. What does it cost, or when is it not true?' },
];

function rungCheck(i: number, text: string, names: string[]) {
  const s = analyzeReasoning(text, names);
  const notes: { ok: boolean; text: string }[] = [];
  if (i === 0) notes.push({ ok: s.words > 0 && s.words <= 4, text: 'Short topic' });
  if (i === 1) {
    notes.push({ ok: s.words >= 6, text: 'A full idea' });
    notes.push({ ok: s.characters.length > 0 || s.citesEvidence, text: 'Grounded in the story' });
  }
  if (i === 2) {
    notes.push({ ok: s.words >= 8, text: 'A complete sentence' });
    notes.push({ ok: /\b(people|leaders?|someone|a person|humans?|those|anyone|we|individuals?|children|adults)\b/i.test(text), text: 'About people in general' });
    notes.push({ ok: !s.absolutes.length, text: 'Avoids absolutes' });
  }
  if (i === 3) {
    notes.push({ ok: /\b(but|yet|although|though|however|even when|unless|at the cost|while)\b/i.test(text), text: 'Adds a tension or cost' });
    notes.push({ ok: !s.absolutes.length, text: 'Avoids absolutes' });
  }
  return notes;
}

export function Reflection({ step, onDone }: { step: ReflectionStep; onDone: (insights: string[]) => void }) {
  const { mission, novel, studentId } = useMissionCtx();
  const { data, save, response } = useStepResponse(step.id);
  const r = useReading(mission);
  const responses = useApp((s) => s.responses);
  const theme = novel.themes.find((t) => t.id === step.themeId);
  const names = useMemo(() => shortNames(novel.characters.map((c) => c.name)), [novel]);
  const rungCount = mission.thinkingLevel === 'foundational' ? 3 : 4;

  const [rungs, setRungs] = useState<string[]>(() => {
    const saved = data.rungs as string[] | undefined;
    return saved ?? [theme?.topic ?? '', '', '', ''];
  });
  const [answers, setAnswers] = useState<string[]>((data.answers as string[]) ?? step.prompts.map(() => ''));
  const [evidenceIds, setEvidenceIds] = useState<string[]>((data.evidenceIds as string[]) ?? []);
  const evidence = visibleEvidence(novel).filter((e) => !theme || e.themes.includes(theme.id));

  // Earlier thinking from this mission, for the look-back.
  const earlier = mission.steps.flatMap((s) => {
    const resp = responses[responseKey(studentId, mission.id, s.id)];
    if (!resp) return [];
    const d = resp.data;
    if (s.type === 'briefing' && d.firstThought) return [{ label: 'Your first thought', text: String(d.firstThought) }];
    if (s.type === 'dilemma' && d.reasoning) return [{ label: `${s.title}: your reasoning`, text: String(d.reasoning) }];
    if (s.type === 'evidence-board' && d.claim) return [{ label: `${s.title}: your claim`, text: String(d.claim) }];
    return [];
  });

  const statement = rungs[rungCount - 1] || rungs[2];
  const setRung = (i: number, t: string) => setRungs(rungs.map((x, j) => (j === i ? t : x)));
  const climbed = rungs.slice(0, rungCount).filter((t, i) => rungCheck(i, t, names).every((n) => n.ok)).length;
  const canSubmit = rungs[2].trim().split(/\s+/).length >= 8 && answers.every((a) => a.trim().split(/\s+/).length >= 5);

  const finish = () => {
    const ins = climbed >= 3 ? ['theme'] : [];
    save({ rungs, answers, evidenceIds, statement, insights: ins }, { submit: true, revision: response?.status === 'submitted' ? 'Revised theme statement' : undefined });
    play('success');
    onDone(ins);
  };

  return (
    <div className="reflection">
      <div className="reflection-grid">
        <section className="panel ladder-panel" aria-labelledby="ladder-h">
          <div className="row between">
            <h2 id="ladder-h" className="hud accent" style={{ margin: 0 }}>Theme ladder · {theme?.topic}</h2>
            <span className="mono small">{climbed}/{rungCount} rungs</span>
          </div>
          {theme && (
            <div className="row top" style={{ flexWrap: 'nowrap', marginTop: '0.5rem' }}>
              <p className="grow text-2" style={{ margin: 0 }}><strong>Big question:</strong> {theme.question}</p>
              <ReadAloud text={theme.question} />
            </div>
          )}
          <ol className="ladder">
            {RUNGS.slice(0, rungCount).map((rung, i) => {
              const notes = rungCheck(i, rungs[i], names);
              const done = notes.every((n) => n.ok);
              return (
                <motion.li key={rung.label} className={`rung ${done ? 'done' : ''}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <span className="rung-n mono" aria-hidden="true">{i + 1}</span>
                  <div className="grow">
                    <label htmlFor={`rung-${i}`} className="label">{rung.label}</label>
                    <span className="help small muted" style={{ display: 'block' }}>{rung.help}</span>
                    {i === 0 ? (
                      <input id={`rung-${i}`} className="input" value={rungs[i]} onChange={(e) => setRung(i, e.target.value)} />
                    ) : (
                      <textarea id={`rung-${i}`} className="textarea" style={{ minHeight: 70 }} value={rungs[i]} onChange={(e) => setRung(i, e.target.value)}
                        placeholder={r.frames ? ['', 'In these chapters, ___ shows that ___.', 'The novel suggests that people/leaders ___.', 'The novel suggests that ___, but ___.'][i] : ''} />
                    )}
                    <ul className="rung-checks" aria-label={`${rung.label} checks`}>
                      {notes.map((n) => <li key={n.text} className={n.ok ? 'ok' : ''}>{n.ok ? '◆' : '◇'} {n.text}<span className="sr-only">{n.ok ? ' done' : ' not yet'}</span></li>)}
                    </ul>
                  </div>
                </motion.li>
              );
            })}
          </ol>
          <div className="row between">
            <Mentor text={statement} novel={novel} task="theme" thinkingLevel={mission.thinkingLevel} evidenceCount={evidenceIds.length} />
          </div>
          <details style={{ marginTop: '0.8rem' }}>
            <summary className="small">See a ladder for a different topic</summary>
            <ol className="small text-2">
              <li>Courage</li>
              <li>The girl speaks up for her friend even though she is scared.</li>
              <li>Courage often means acting for someone else while still afraid.</li>
              <li>Courage often means acting for someone else while still afraid, but it can cost a person their own safety or belonging.</li>
            </ol>
          </details>
        </section>

        <aside className="stack">
          <section className="panel" aria-labelledby="tether-h">
            <h2 id="tether-h" className="hud accent">Tether it to the text</h2>
            <p className="small muted">Choose evidence that supports your statement.</p>
            <EvidenceLocker novel={novel} evidence={evidence} selected={evidenceIds}
              onToggle={(id) => setEvidenceIds(evidenceIds.includes(id) ? evidenceIds.filter((x) => x !== id) : [...evidenceIds, id])} />
          </section>
        </aside>
      </div>

      <section className="panel" aria-labelledby="look-h" style={{ marginTop: '1.25rem' }}>
        <h2 id="look-h" className="hud accent">Look back</h2>
        {earlier.length > 0 ? (
          <div className="grid cols-3" style={{ marginBottom: '1rem' }}>
            {earlier.map((e) => (
              <blockquote key={e.label} className="lookback">
                <span className="hud">{e.label}</span>
                <p style={{ margin: '0.3rem 0 0' }}>{e.text}</p>
              </blockquote>
            ))}
          </div>
        ) : (
          <p className="small muted">Your earlier thinking from this mission will appear here.</p>
        )}
        {step.prompts.map((p, i) => (
          <div key={p} className="field" style={{ marginTop: '0.8rem' }}>
            <label htmlFor={`prompt-${i}`}>{p}</label>
            <textarea id={`prompt-${i}`} className="textarea" style={{ minHeight: 80 }} value={answers[i] ?? ''}
              onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
              placeholder={r.frames ? 'At first I thought ___. Now I think ___ because ___.' : ''} />
          </div>
        ))}
        <div className="row end" style={{ marginTop: '1rem' }}>
          <button className="btn primary" disabled={!canSubmit} onClick={finish}>Close the log <Icon name="check" size={18} /></button>
        </div>
      </section>
    </div>
  );
}
