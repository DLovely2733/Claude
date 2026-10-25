import { motion } from 'motion/react';
import { useState } from 'react';
import type { BriefingStep } from '../../data/types';
import { useMissionCtx, useStepResponse } from '../MissionContext';
import { useReading, ReadAloud, VocabChip } from '../../components/Reading';
import { vocabById } from '../../lib/knowledge';
import { Icon } from '../../components/Icon';
import { play } from '../../lib/sound';

const READING = [
  { id: 'read', label: 'I’ve read the chapters' },
  { id: 'partway', label: 'I’m partway through' },
  { id: 'supported', label: 'I read or listened with support' },
] as const;

export function Briefing({ step, onDone }: { step: BriefingStep; onDone: (insights: string[]) => void }) {
  const { mission, novel } = useMissionCtx();
  const { data, save } = useStepResponse(step.id);
  const r = useReading(mission);
  const [shown, setShown] = useState(data.status ? step.chunks.length : 1);
  const [reading, setReading] = useState<string>((data.reading as string) ?? '');
  const [first, setFirst] = useState<string>((data.firstThought as string) ?? '');
  const vocab = step.vocab.map((id) => vocabById(novel, id)).filter((v) => !!v);

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '1.25rem' }} data-stack-mobile>
      <div className="stack" style={{ ['--gap' as string]: '0.9rem' }}>
        {step.chunks.slice(0, shown).map((c, i) => {
          const text = r.pick(c.text, c.plain);
          return (
            <motion.article key={i} className="panel brief-chunk" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="row between">
                <span className="hud accent">Transmission {i + 1}/{step.chunks.length}</span>
                <ReadAloud text={`${c.heading}. ${text}`} />
              </div>
              <h3 style={{ marginTop: '0.4rem' }}>{c.heading}</h3>
              <p style={{ margin: 0 }}>{text}</p>
            </motion.article>
          );
        })}
        {shown < step.chunks.length && (
          <button className="btn ghost" onClick={() => { setShown(shown + 1); play('tap'); }}>
            Next transmission <Icon name="next" size={18} />
          </button>
        )}

        {shown >= step.chunks.length && (
          <motion.div className="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <fieldset className="plain-fieldset">
              <legend className="label">Where are you with the reading?</legend>
              <div className="row" style={{ marginTop: '0.5rem' }}>
                {READING.map((o) => (
                  <button key={o.id} type="button" className="chip" aria-pressed={reading === o.id} onClick={() => setReading(o.id)}>{o.label}</button>
                ))}
              </div>
            </fieldset>
            {reading === 'partway' && (
              <p className="callout amber small" style={{ marginTop: '0.75rem' }}>
                You can start now. Later rooms ask for evidence from all of {mission.chapterNumbers.length > 1 ? 'these chapters' : 'this chapter'}, so you may want to finish reading first. Your progress saves either way.
              </p>
            )}
            <div className="field" style={{ marginTop: '1rem' }}>
              <label htmlFor="first-thought">First thought: what is the biggest pressure on Ender right now?</label>
              <span className="help">One sentence is enough. You will look back at this at the end.</span>
              <textarea id="first-thought" className="textarea" style={{ minHeight: 80 }} value={first} onChange={(e) => setFirst(e.target.value)}
                placeholder={r.frames ? 'The biggest pressure on Ender is ___ because ___.' : 'Your first idea…'} />
            </div>
            <div className="row end" style={{ marginTop: '1rem' }}>
              <button className="btn primary" disabled={!reading}
                onClick={() => { save({ reading, firstThought: first, status: 'briefed', insights: [] }, { submit: true }); onDone([]); }}>
                Begin the mission <Icon name="next" size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <aside className="panel" aria-labelledby="vocab-title">
        <h2 id="vocab-title" className="hud accent">Word bank</h2>
        <p className="small muted">Tap a word to see what it means.</p>
        <ul className="vocab-list">
          {vocab.map((v) => (
            <li key={v!.id}><VocabChip term={v!} /> <span className="chip tiny">{v!.kind === 'literary' ? 'literary' : 'story'}</span></li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
