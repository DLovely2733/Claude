import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { href, navigate } from '../lib/router';
import { createSession } from '../live/logic';
import { rangeLabel } from '../lib/generator';
import { visibleEvidence } from '../lib/knowledge';
import type { CourtroomStep, EvidenceBoardStep, LiveActivity, Mission, ReflectionStep } from '../data/types';

// "Tomorrow's lesson" in four moves: warm-up, mission, debate, exit ticket.
// Each button opens a ready-made live session drawn from the unit's content.

export function LessonPlaybook({ mission }: { mission: Mission }) {
  const novel = useApp((s) => s.novels[mission.novelId]);
  const missions = useApp((s) => s.missions);
  const saveSession = useApp((s) => s.saveSession);
  if (!novel) return null;

  const chapters = new Set(mission.chapterNumbers);
  const evidence = visibleEvidence(novel).filter((e) => chapters.has(e.chapter));
  const sameNovel = Object.values(missions).filter((m) => m.novelId === novel.id && m.status === 'published');
  const court = sameNovel.flatMap((m) => m.steps).find((s) => s.type === 'courtroom') as CourtroomStep | undefined;
  const board = mission.steps.find((s) => s.type === 'evidence-board') as EvidenceBoardStep | undefined;
  const reflection = mission.steps.find((s) => s.type === 'reflection') as ReflectionStep | undefined;
  const theme = novel.themes.find((t) => t.id === reflection?.themeId) ?? novel.themes[0];

  const start = (activity: LiveActivity, prompt: string, extra: { evidenceIds?: string[]; options?: { id: string; label: string }[] } = {}) => {
    const s = createSession({ activity, novelId: novel.id, title: activity, prompt, ...extra });
    saveSession(s);
    navigate(`/teacher/live/${s.code}`);
  };

  const warmup = theme?.ladder[2] ?? `${novel.title} is mostly about ${theme?.topic.toLowerCase() ?? 'power'}.`;
  const moves = [
    { min: 5, title: 'Warm-up: take a stand', desc: `Four Corners on “${warmup}”, with a re-vote after new evidence.`,
      action: () => start('four-corners', warmup, { evidenceIds: evidence.map((e) => e.id).slice(0, 8) }), label: 'Start warm-up' },
    { min: mission.duration >= 45 ? 25 : 15, title: `Mission: ${mission.title}`, desc: `Students open the Story Map and play ${rangeLabel(mission.chapterNumbers)}. Watch progress on the dashboard.`,
      action: () => navigate(`/teacher/project/${mission.id}`), label: 'Open projector view' },
    court
      ? { min: 15, title: 'Debate: live courtroom', desc: `Two teams argue “${court.charge}”, you rule on objections, the class gives a verdict.`,
          action: () => start('courtroom', court.charge, { evidenceIds: court.evidenceIds, options: court.verdicts.map((v, i) => ({ id: `v${i}`, label: v })) }), label: 'Start courtroom' }
      : { min: 10, title: 'Debate: evidence showdown', desc: `Which card best answers “${board?.caseQuestion ?? theme?.question}”?`,
          action: () => start('showdown', board?.caseQuestion ?? theme?.question ?? 'Which evidence matters most?', { evidenceIds: evidence.map((e) => e.id).slice(0, 8) }), label: 'Start showdown' },
    { min: 5, title: 'Exit ticket', desc: 'An anonymous wall: which piece of evidence changed your thinking today?',
      action: () => start('wall', 'Which piece of evidence changed your thinking today, and how?'), label: 'Start exit ticket' },
  ];
  const total = moves.reduce((a, m) => a + m.min, 0);

  return (
    <section className="panel playbook" aria-labelledby="pb-h">
      <div className="row between">
        <div>
          <span className="hud" style={{ color: 'var(--accent-2)' }}>Lesson playbook · about {total} minutes</span>
          <h2 id="pb-h" style={{ margin: 0 }}>{novel.title}, {rangeLabel(mission.chapterNumbers)}</h2>
        </div>
        <a className="btn quiet small" href={href('/teacher/live')}>All live activities</a>
      </div>
      <ol className="playbook-moves">
        {moves.map((m, i) => (
          <li key={m.title}>
            <span className="playbook-n mono" aria-hidden="true">{i + 1}</span>
            <div className="grow">
              <strong>{m.title}</strong> <span className="chip tiny">{m.min} min</span>
              <p className="small text-2" style={{ margin: '0.2rem 0 0' }}>{m.desc}</p>
            </div>
            <button className="btn small" onClick={m.action}><Icon name={i === 1 ? 'eye' : 'play'} size={16} /> {m.label}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
