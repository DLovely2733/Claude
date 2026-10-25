import { motion } from 'motion/react';
import { useApp, useOutcomeLookup } from '../state/store';
import { useMissionCtx, stepStates } from './MissionContext';
import { Icon } from '../components/Icon';
import { href } from '../lib/router';
import { rangeLabel } from '../lib/generator';
import { STEP_META } from './stepMeta';
import { useReading, ReadAloud } from '../components/Reading';
import { play } from '../lib/sound';

export function MissionHub() {
  const { mission, novel, studentId, preview, base } = useMissionCtx();
  const responses = useApp((s) => s.responses);
  const lookup = useOutcomeLookup();
  const states = stepStates(mission, responses, studentId, preview);
  const nextIdx = states.findIndex((s) => s === 'available' || s === 'in-progress');
  const r = useReading(mission);

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {!preview && (
        <a className="btn quiet small" href={href('/student')}><Icon name="back" size={16} /> Story Map</a>
      )}
      <motion.header className="mission-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="hud accent">{novel.title} · {rangeLabel(mission.chapterNumbers)} · Operation {mission.codename}</span>
        <h1>{mission.title}</h1>
        <div className="row top" style={{ flexWrap: 'nowrap', maxWidth: 760 }}>
          <p className="text-2 grow" style={{ fontSize: '1.1rem' }}>{mission.summary}</p>
          <ReadAloud text={mission.summary} />
        </div>
        <div className="row" style={{ gap: '0.4rem' }}>
          <span className="chip">{mission.duration} min</span>
          <span className="chip">No timer</span>
          <span className="chip">Hints never count against you</span>
          {r.plain && <span className="chip accent">Plain language on</span>}
        </div>
      </motion.header>

      <ol className="mission-path" aria-label="Mission rooms">
        {mission.steps.map((step, i) => {
          const st = states[i];
          const meta = STEP_META[step.type];
          const locked = st === 'locked';
          return (
            <motion.li key={step.id} className={`path-room ${st}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <span className="path-node" aria-hidden="true">
                {st === 'done' ? <Icon name="check" /> : locked ? <Icon name="lock" size={16} /> : <Icon name={meta.icon} />}
              </span>
              <div className="path-body">
                <span className="hud">Room {i + 1} · {meta.engine}</span>
                <h2 className="path-title">{step.title}</h2>
                <p className="text-2 small" style={{ margin: 0 }}>{step.skill}</p>
              </div>
              <div className="path-action">
                {locked ? (
                  <span className="small muted">Clear room {i} to open</span>
                ) : (
                  <a className={`btn ${i === nextIdx ? 'primary' : 'ghost'} small`} href={href(`${base}/${step.id}`)} onClick={() => play('open')}
                    aria-label={`${st === 'done' ? 'Revisit' : st === 'in-progress' ? 'Continue' : 'Enter'} room ${i + 1}: ${step.title}`}>
                    {st === 'done' ? 'Revisit' : st === 'in-progress' ? 'Continue' : 'Enter'} <Icon name="next" size={16} />
                  </a>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>

      <section className="panel" style={{ marginTop: '2rem' }}>
        <h2 className="hud">What you are practising</h2>
        <ul className="outcome-list">
          {mission.outcomes.map((id) => {
            const o = lookup(id);
            return o ? <li key={id}><span className="mono accent-text">{o.code}</span> {o.label}</li> : null;
          })}
        </ul>
        <p className="small muted" style={{ margin: 0 }}>
          There are no points or rankings here. What counts is how well you use the novel to explain your thinking.
        </p>
      </section>
    </div>
  );
}
