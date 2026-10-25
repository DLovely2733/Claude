import { motion } from 'motion/react';
import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { href } from '../lib/router';
import { unverifiedCount } from '../lib/knowledge';
import { findPatterns, missionResponses, dilemmaTally, theoryTally, evidenceUse } from '../lib/classAnalytics';
import { rangeLabel } from '../lib/generator';
import type { DilemmaStep, EvidenceBoardStep } from '../data/types';

export function Dashboard() {
  const missions = useApp((s) => s.missions);
  const novels = useApp((s) => s.novels);
  const responses = useApp((s) => s.responses);
  const roster = useApp((s) => s.roster);

  const all = Object.values(responses).filter((r) => r.studentId !== 'teacher-preview');
  const toReview = all.filter((r) => r.status === 'submitted' && !r.review?.finalized).length;
  const active = new Set(all.map((r) => r.studentId)).size;
  const unverified = Object.values(novels).reduce((n, nv) => n + unverifiedCount(nv), 0);
  const published = Object.values(missions).filter((m) => m.status === 'published');

  const stats = [
    { label: 'Missions live', value: published.length, icon: 'flag', to: '/teacher/missions' },
    { label: 'Cadets with activity', value: `${active}/${roster.length}`, icon: 'users', to: '/teacher/class' },
    { label: 'Responses to review', value: toReview, icon: 'file', to: '/teacher/review' },
    { label: 'Novel facts to check', value: unverified, icon: 'shield', to: '/teacher/novels' },
  ];

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header className="row between top">
        <div>
          <span className="hud" style={{ color: 'var(--accent-2)' }}>Mission Control</span>
          <h1>Good to see you, teacher.</h1>
          <p className="text-2" style={{ maxWidth: 680 }}>Here is the thinking happening in your class. Patterns are for planning your next move. Students never see rankings.</p>
        </div>
        <div className="row">
          <a className="btn primary" href={href('/teacher/build')}><Icon name="spark" size={18} /> Generate a mission</a>
          <a className="btn ghost" href={href('/teacher/review')}>Review work</a>
        </div>
      </header>

      <div className="grid cols-4" style={{ marginTop: '1.5rem' }}>
        {stats.map((s, i) => (
          <motion.a key={s.label} href={href(s.to)} className="stat-tile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Icon name={s.icon} size={22} />
            <span className="stat-value">{s.value}</span>
            <span className="small text-2">{s.label}</span>
          </motion.a>
        ))}
      </div>

      {unverified > 0 && (
        <p className="callout warn small" style={{ marginTop: '1rem' }}>
          <strong>{unverified} novel facts are marked “needs check”.</strong> NovelVerse drafted them; confirm each one against your copy of the book in <a href={href('/teacher/novels')}>Novels</a> so students rely only on verified information.
        </p>
      )}

      {published.map((m) => {
        const novel = novels[m.novelId];
        if (!novel) return null;
        const rs = missionResponses(responses, m.id);
        const patterns = findPatterns(m, novel, rs);
        const dilemma = m.steps.find((s) => s.type === 'dilemma') as DilemmaStep | undefined;
        const board = m.steps.find((s) => s.type === 'evidence-board') as EvidenceBoardStep | undefined;
        const ev = evidenceUse(rs, novel).slice(0, 5);
        return (
          <section key={m.id} className="panel" style={{ marginTop: '2rem' }} aria-labelledby={`dash-${m.id}`}>
            <div className="row between">
              <div>
                <span className="hud accent">{novel.title} · {rangeLabel(m.chapterNumbers)}</span>
                <h2 id={`dash-${m.id}`} style={{ margin: 0 }}>{m.title}</h2>
              </div>
              <div className="row">
                <a className="btn ghost small" href={href(`/teacher/project/${m.id}`)}><Icon name="eye" size={16} /> Projector view</a>
                <a className="btn ghost small" href={href(`/teacher/review/${m.id}`)}>Review</a>
                <a className="btn quiet small" href={href(`/teacher/mission/${m.id}`)}>Edit</a>
              </div>
            </div>

            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <table className="table">
                <thead><tr><th scope="col">Room</th><th scope="col">Logged</th><th scope="col">In progress</th><th scope="col">Revised</th><th scope="col">Used supports</th></tr></thead>
                <tbody>
                  {m.steps.map((s) => {
                    const sr = rs.filter((r) => r.stepId === s.id);
                    return (
                      <tr key={s.id}>
                        <td><a href={href(`/teacher/review/${m.id}/${s.id}`)}>{s.title}</a></td>
                        <td className="mono">{sr.filter((r) => r.status === 'submitted').length}</td>
                        <td className="mono">{sr.filter((r) => r.status === 'in-progress').length}</td>
                        <td className="mono">{sr.filter((r) => r.revisions.length).length}</td>
                        <td className="mono">{sr.filter((r) => r.supports.length).length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid cols-2" style={{ marginTop: '1.25rem' }}>
              {dilemma && <Tally title={`${dilemma.title}: decisions`} rows={dilemmaTally(dilemma, rs)} />}
              {board && <Tally title={`${board.title}: theories argued`} rows={theoryTally(board, rs)} />}
            </div>

            <div className="grid cols-2" style={{ marginTop: '1.25rem' }}>
              <div>
                <h3 className="hud">Thinking patterns to address</h3>
                {patterns.length === 0 && <p className="small muted">No patterns yet.</p>}
                <ul className="pattern-list">
                  {patterns.map((p) => (
                    <li key={p.id} className="pattern">
                      <div className="row between"><strong>{p.title}</strong><span className="chip tiny">{p.studentIds.length} cadet{p.studentIds.length > 1 ? 's' : ''}</span></div>
                      <p className="small text-2" style={{ margin: '0.2rem 0' }}>{p.description}</p>
                      <p className="small" style={{ margin: 0 }}><span className="accent-text">Try:</span> {p.nextStep}</p>
                      <p className="tiny muted" style={{ margin: '0.2rem 0 0' }}>{p.studentIds.map((id) => roster.find((r) => r.id === id)?.callSign ?? id).join(', ')}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="hud">Most-used evidence</h3>
                {ev.length === 0 && <p className="small muted">No evidence cited yet.</p>}
                <ul className="ev-use">
                  {ev.map(({ evidence, count }) => (
                    <li key={evidence.id}>
                      <span className="mono tiny muted">Ch. {evidence.chapter}</span> {evidence.text}
                      <span className="chip tiny">{count}</span>
                    </li>
                  ))}
                </ul>
                <p className="tiny muted">Evidence nobody uses can be a sign it needs teaching, or that the card needs rewording.</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function Tally({ title, rows }: { title: string; rows: { id: string; label: string; count: number }[] }) {
  const total = rows.reduce((a, r) => a + r.count, 0) || 1;
  return (
    <div>
      <h3 className="hud">{title}</h3>
      <ul className="tally">
        {rows.map((r) => (
          <li key={r.id}>
            <div className="row between small"><span>{r.label}</span><span className="mono">{r.count}</span></div>
            <div className="meter"><span style={{ width: `${(r.count / total) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
