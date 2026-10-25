import { motion } from 'motion/react';
import { useApp } from '../state/store';
import { INSIGHTS, insightsFrom } from '../lib/insights';
import { Icon } from '../components/Icon';
import { href } from '../lib/router';
import type { Mission, MissionStep, StepResponse } from '../data/types';
import { STEP_META } from './stepMeta';
import { toast } from '../components/toast';

export function CommandersLog() {
  const studentId = useApp((s) => s.activeStudentId);
  const roster = useApp((s) => s.roster);
  const responses = useApp((s) => s.responses);
  const missions = useApp((s) => s.missions);
  const reset = useApp((s) => s.resetMissionProgress);
  const mine = Object.values(responses).filter((r) => r.studentId === studentId);
  const earned = insightsFrom(mine);
  const cadet = roster.find((r) => r.id === studentId);

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header>
        <span className="hud accent">Commander’s Log · {cadet?.callSign}</span>
        <h1>Your thinking, on record</h1>
        <p className="text-2" style={{ maxWidth: 720 }}>
          Everything you decide, argue and revise is kept here. Insights recognise ways of thinking, not speed or scores, and there is nothing to lose.
        </p>
      </header>

      <section aria-labelledby="ins-h" style={{ marginTop: '1.5rem' }}>
        <h2 id="ins-h" className="hud">Insights</h2>
        <div className="grid cols-3">
          {INSIGHTS.map((i, n) => {
            const has = earned.some((e) => e.id === i.id);
            return (
              <motion.div key={i.id} className={`insight-tile ${has ? 'earned' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.03 }}>
                <span className="insight-glyph" aria-hidden="true"><Icon name="spark" size={20} /></span>
                <div>
                  <strong>{i.name}</strong>
                  <p className="small text-2" style={{ margin: 0 }}>{has ? i.description : `Try it: ${i.description.charAt(0).toLowerCase()}${i.description.slice(1)}`}</p>
                </div>
                <span className="sr-only">{has ? 'Earned' : 'Not yet'}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {Object.values(missions).filter((m) => m.status === 'published').map((m) => {
        const rs = m.steps.map((s) => ({ step: s, r: responses[`${studentId}|${m.id}|${s.id}`] }));
        if (!rs.some((x) => x.r)) return null;
        return (
          <section key={m.id} className="panel" style={{ marginTop: '2rem' }} aria-labelledby={`log-${m.id}`}>
            <div className="row between">
              <h2 id={`log-${m.id}`} style={{ margin: 0 }}>{m.title}</h2>
              <div className="row">
                <a className="btn ghost small" href={href(`/student/mission/${m.id}`)}>Open mission</a>
                <button className="btn quiet small" onClick={() => {
                  if (confirm('Start this mission again? Your saved answers for it will be cleared.')) { reset(studentId, m.id); toast('Mission progress cleared'); }
                }}>Start fresh</button>
              </div>
            </div>
            <ol className="log-entries">
              {rs.map(({ step, r }) => r && <LogEntry key={step.id} mission={m} step={step} r={r} />)}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function LogEntry({ mission, step, r }: { mission: Mission; step: MissionStep; r: StepResponse }) {
  const d = r.data;
  let summary: string | null = null;
  if (step.type === 'briefing') summary = d.firstThought ? `First thought: ${d.firstThought}` : 'Briefed.';
  if (step.type === 'dilemma') {
    const c = step.choices.find((x) => x.id === d.choiceId);
    summary = c ? `Chose: ${c.label}${d.reasoning ? ` · “${d.reasoning}”` : ''}` : null;
  }
  if (step.type === 'evidence-board') summary = d.claim ? `Claim: ${d.claim}${d.band ? ` · ${d.band}` : ''}` : 'Investigation in progress.';
  if (step.type === 'reasoning-lock') {
    const solved = Object.values((d.solved as Record<string, boolean>) ?? {}).filter(Boolean).length;
    summary = `${solved}/${step.locks.length} locks opened.`;
  }
  if (step.type === 'connections') summary = `${((d.links as unknown[]) ?? []).length} connections mapped.`;
  if (step.type === 'reflection') summary = d.statement ? `Theme: ${d.statement}` : 'Ladder in progress.';
  return (
    <li className="log-entry">
      <span className="path-node small-node" aria-hidden="true"><Icon name={STEP_META[step.type].icon} size={16} /></span>
      <div className="grow">
        <div className="row between">
          <strong>{step.title}</strong>
          <span className="row" style={{ gap: '0.3rem' }}>
            <span className={`chip tiny ${r.status === 'submitted' ? 'good' : ''}`}>{r.status === 'submitted' ? 'Logged' : 'In progress'}</span>
            {r.revisions.length > 0 && <span className="chip tiny accent">{r.revisions.length} revision{r.revisions.length > 1 ? 's' : ''}</span>}
            {r.review?.finalized && <span className="chip tiny amber">Teacher feedback</span>}
          </span>
        </div>
        {summary && <p className="small text-2" style={{ margin: '0.25rem 0 0' }}>{summary}</p>}
        {r.review?.finalized && r.review.feedback && <p className="callout amber small" style={{ marginTop: '0.5rem' }}><strong>From your teacher:</strong> {r.review.feedback}</p>}
        <a className="btn quiet small" href={href(`/student/mission/${mission.id}/${step.id}`)}>Revisit</a>
      </div>
    </li>
  );
}
