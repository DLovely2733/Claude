import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useMissionCtx } from './MissionContext';
import { useOutcomeLookup } from '../state/store';
import { Icon } from '../components/Icon';
import { href, navigate } from '../lib/router';
import { STEP_META } from './stepMeta';
import { useReading, ReadAloud } from '../components/Reading';
import { INSIGHTS } from '../lib/insights';
import { play } from '../lib/sound';
import { Briefing } from './steps/Briefing';
import { Dilemma } from './steps/Dilemma';
import { EvidenceBoard } from './steps/EvidenceBoard';
import { ReasoningVault } from './steps/ReasoningVault';
import { Connections } from './steps/Connections';
import { Reflection } from './steps/Reflection';

export function StepPlayer({ stepId }: { stepId: string }) {
  const { mission, base } = useMissionCtx();
  const idx = mission.steps.findIndex((s) => s.id === stepId);
  const step = mission.steps[idx];
  const lookup = useOutcomeLookup();
  const r = useReading(mission);
  const [cleared, setCleared] = useState<string[] | null>(null);

  useEffect(() => setCleared(null), [stepId]);
  if (!step) {
    return (
      <div className="wrap" style={{ padding: '3rem 1rem' }}>
        <div className="empty">This room no longer exists. <a href={href(base)}>Back to the mission</a></div>
      </div>
    );
  }

  const next = mission.steps[idx + 1];
  const onDone = (insights: string[]) => {
    play('unlock');
    setCleared(insights);
  };
  const advance = () => navigate(next ? `${base}/${next.id}` : base);
  const instructions = r.instructions(step.instructions, step.plainInstructions);
  const meta = STEP_META[step.type];

  return (
    <div className="step-shell">
      <div className="wrap">
        <div className="step-head">
          <a className="btn quiet small" href={href(base)}><Icon name="back" size={16} /> Mission path</a>
          <ol className="step-dots" aria-label={`Room ${idx + 1} of ${mission.steps.length}`}>
            {mission.steps.map((s, i) => (
              <li key={s.id} className={i === idx ? 'current' : i < idx ? 'past' : ''} aria-current={i === idx ? 'step' : undefined}>
                <span className="sr-only">{s.title}</span>
              </li>
            ))}
          </ol>
        </div>

        <motion.header key={step.id} className="step-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <span className="hud accent"><Icon name={meta.icon} size={14} /> Room {idx + 1} · {meta.engine}</span>
          <h1>{step.title}</h1>
          <p className="step-skill">{step.skill}</p>
          <div className="step-instructions">
            <p style={{ margin: 0 }}>{instructions}</p>
            <ReadAloud text={instructions} label="Read instructions" />
          </div>
          <div className="row" style={{ gap: '0.35rem', marginTop: '0.6rem' }}>
            {step.outcomes.map((id) => {
              const o = lookup(id);
              return o ? <span key={id} className="chip" title={`${o.group}: ${o.label}`}>ELA {o.code} · {o.label}</span> : null;
            })}
          </div>
        </motion.header>

        <div className="step-body">
          {step.type === 'briefing' && <Briefing step={step} onDone={onDone} />}
          {step.type === 'dilemma' && <Dilemma step={step} onDone={onDone} />}
          {step.type === 'evidence-board' && <EvidenceBoard step={step} onDone={onDone} />}
          {step.type === 'reasoning-lock' && <ReasoningVault step={step} onDone={onDone} />}
          {step.type === 'connections' && <Connections step={step} onDone={onDone} />}
          {step.type === 'reflection' && <Reflection step={step} onDone={onDone} />}
        </div>
      </div>

      <AnimatePresence>
        {cleared && (
          <motion.div className="cleared" role="dialog" aria-modal="true" aria-labelledby="cleared-title"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="cleared-card" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 18 }}>
              <div className="cleared-ring" aria-hidden="true"><Icon name="check" size={40} /></div>
              <span className="hud accent">Room {idx + 1} cleared</span>
              <h2 id="cleared-title">{step.title}: logged</h2>
              <p className="text-2">Your thinking has been saved to your Commander’s Log{mission.steps.length > 1 ? ' and sent to your teacher' : ''}. You can come back and revise it any time.</p>
              {cleared.length > 0 && (
                <div className="insight-list">
                  {cleared.map((id) => {
                    const ins = INSIGHTS.find((x) => x.id === id);
                    return ins ? (
                      <div key={id} className="insight">
                        <Icon name="spark" size={18} />
                        <div><strong>{ins.name}</strong><br /><span className="small text-2">{ins.description}</span></div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <div className="row center" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                <button className="btn ghost" onClick={() => setCleared(null)}>Stay and revise</button>
                <button className="btn primary" autoFocus onClick={advance}>
                  {next ? <>Next room: {next.title} <Icon name="next" size={18} /></> : <>Mission complete <Icon name="check" size={18} /></>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
