import { useApp } from '../state/store';
import { href, navigate } from '../lib/router';
import { Icon } from '../components/Icon';
import { missionResponses, dilemmaTally, theoryTally, evidenceUse } from '../lib/classAnalytics';
import { Starfield } from '../components/Starfield';

// Whole-class projector view. Anonymous by design: no names, no rankings,
// just how the room is thinking.
export function Projector({ missionId, stepId }: { missionId: string; stepId?: string }) {
  const mission = useApp((s) => s.missions[missionId]);
  const novel = useApp((s) => (mission ? s.novels[mission.novelId] : undefined));
  const responses = useApp((s) => s.responses);
  if (!mission || !novel) return <div className="empty">Mission not found.</div>;
  const interesting = mission.steps.filter((s) => s.type !== 'briefing');
  const step = mission.steps.find((s) => s.id === stepId) ?? interesting[0];
  const rs = missionResponses(responses, mission.id).filter((r) => r.stepId === step?.id);

  let rows: { id: string; label: string; count: number }[] = [];
  let heading = '';
  let prompt = '';
  if (step?.type === 'dilemma') { rows = dilemmaTally(step, rs); heading = 'How the class decided'; prompt = 'Which piece of evidence would change your decision?'; }
  if (step?.type === 'evidence-board') { rows = theoryTally(step, rs); heading = 'Theories the class argued'; prompt = 'Find one card that challenges the most popular theory. Does the theory survive?'; }
  const total = rows.reduce((a, r) => a + r.count, 0);
  const statements = step?.type === 'reflection' ? rs.map((r) => String(r.data.statement ?? (r.data.rungs as string[] | undefined)?.[2] ?? '')).filter(Boolean) : [];
  const ev = evidenceUse(rs, novel).slice(0, 4);

  return (
    <div className="projector-view">
      <Starfield density={0.5} />
      <div className="projector-tools no-print">
        <a className="btn quiet small" href={href('/teacher')}><Icon name="back" size={16} /> Mission Control</a>
        <select className="select" style={{ width: 'auto' }} value={step?.id} onChange={(e) => navigate(`/teacher/project/${mission.id}/${e.target.value}`)} aria-label="Room">
          {interesting.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
      <main id="main" tabIndex={-1} className="projector-inner">
        <span className="hud accent">{novel.title} · {mission.title} · {step?.title}</span>
        <h1>{heading || step?.title}</h1>
        {rows.length > 0 && (
          <ul className="projector-bars">
            {rows.map((r) => (
              <li key={r.id}>
                <div className="projector-label">{r.label}</div>
                <div className="projector-bar"><span style={{ width: `${total ? (r.count / total) * 100 : 0}%` }} /></div>
                <div className="projector-count mono">{r.count}</div>
              </li>
            ))}
          </ul>
        )}
        {statements.length > 0 && (
          <div className="projector-quotes">
            {statements.map((s, i) => <blockquote key={i}>{s}</blockquote>)}
          </div>
        )}
        {ev.length > 0 && (
          <div className="projector-ev">
            <h2 className="hud">Evidence the class used most</h2>
            <ul>{ev.map(({ evidence, count }) => <li key={evidence.id}><span className="mono">Ch. {evidence.chapter}</span> {evidence.text} <span className="chip">{count}</span></li>)}</ul>
          </div>
        )}
        {!rows.length && !statements.length && <p className="text-2" style={{ fontSize: '1.4rem' }}>Waiting for responses…</p>}
        {prompt && <p className="projector-prompt"><Icon name="chat" size={22} /> {prompt}</p>}
        <p className="tiny muted">Anonymous class results · {rs.length} response{rs.length === 1 ? '' : 's'} · live joining by code arrives with the classroom backend</p>
      </main>
    </div>
  );
}
