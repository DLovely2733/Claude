import { useEffect, useState } from 'react';
import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { href, navigate } from '../lib/router';
import { suggestFeedback, missionResponses } from '../lib/classAnalytics';
import { downloadFile, toCsv } from '../lib/download';
import { responseKey } from '../data/synthetic';
import type { Mission, MissionStep, Novel, StepResponse } from '../data/types';
import { toast } from '../components/toast';
import { STEP_META } from '../student/stepMeta';

export function Review({ missionId, stepId }: { missionId?: string; stepId?: string }) {
  const missions = useApp((s) => s.missions);
  const novels = useApp((s) => s.novels);
  const responses = useApp((s) => s.responses);
  const roster = useApp((s) => s.roster);
  const list = Object.values(missions);
  const mission = (missionId && missions[missionId]) || list.find((m) => m.status === 'published') || list[0];
  const novel = mission ? novels[mission.novelId] : undefined;
  const step = mission?.steps.find((s) => s.id === stepId) ?? mission?.steps.find((s) => s.type !== 'briefing') ?? mission?.steps[0];
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => setStudentId(null), [step?.id]);
  if (!mission || !novel || !step) return <div className="wrap"><div className="empty" style={{ marginTop: '2rem' }}>No missions to review yet.</div></div>;

  const rs = missionResponses(responses, mission.id);
  const stepRs = rs.filter((r) => r.stepId === step.id);
  const students = roster.filter((r) => r.id !== 'teacher-preview');
  const selected = studentId ? responses[responseKey(studentId, mission.id, step.id)] : undefined;

  const exportCsv = () => {
    const rows: (string | number)[][] = [['cadet', 'room', 'status', 'response', 'evidence', 'revisions', 'supports', ...useApp.getState().rubric.criteria.map((c) => c.name), 'teacher feedback', 'finalized']];
    for (const r of rs) {
      const s = mission.steps.find((x) => x.id === r.stepId);
      if (!s) continue;
      const v = describe(s, r, novel);
      rows.push([roster.find((x) => x.id === r.studentId)?.callSign ?? r.studentId, s.title, r.status, v.main, v.evidence.join(' | '), r.revisions.length, r.supports.join('; '),
        ...useApp.getState().rubric.criteria.map((c) => (r.review?.scores[c.id] !== undefined ? useApp.getState().rubric.levelNames[r.review.scores[c.id]] : '')),
        r.review?.feedback ?? '', r.review?.finalized ? 'yes' : 'no']);
    }
    downloadFile(`${mission.id}-evidence.csv`, toCsv(rows), 'text/csv');
  };

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header className="row between top">
        <div>
          <span className="hud" style={{ color: 'var(--accent-2)' }}>Review</span>
          <h1 style={{ marginBottom: 0 }}>Student thinking</h1>
          <p className="text-2">Decisions, evidence, reasoning and revisions. Suggested feedback is a draft; you make every assessment decision.</p>
        </div>
        <div className="row">
          <button className="btn ghost small" onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>
          <button className="btn ghost small" onClick={() => downloadFile(`${mission.id}-responses.json`, JSON.stringify(rs, null, 2))}><Icon name="download" size={16} /> Export JSON</button>
        </div>
      </header>

      <div className="row" style={{ marginTop: '1rem' }}>
        <label className="row small">Mission
          <select className="select" style={{ width: 'auto' }} value={mission.id} onChange={(e) => navigate(`/teacher/review/${e.target.value}`)}>
            {list.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </label>
      </div>
      <div className="tabs" role="tablist" aria-label="Rooms" style={{ marginTop: '1rem' }}>
        {mission.steps.map((s) => (
          <button key={s.id} role="tab" aria-selected={s.id === step.id} onClick={() => navigate(`/teacher/review/${mission.id}/${s.id}`)}>
            {s.title} <span className="chip tiny">{rs.filter((r) => r.stepId === s.id && r.status === 'submitted').length}</span>
          </button>
        ))}
      </div>

      <div className="review-grid">
        <aside className="panel" style={{ padding: '0.5rem' }} aria-label="Cadets">
          <ul className="cadet-list">
            {students.map((st) => {
              const r = stepRs.find((x) => x.studentId === st.id);
              return (
                <li key={st.id}>
                  <button className={`cadet-row ${studentId === st.id ? 'on' : ''}`} onClick={() => setStudentId(st.id)} disabled={!r} aria-pressed={studentId === st.id}>
                    <span className="grow">{st.callSign}</span>
                    {!r ? <span className="tiny muted">not started</span>
                      : r.review?.finalized ? <span className="chip tiny amber">returned</span>
                      : r.status === 'submitted' ? <span className="chip tiny good">to review</span>
                      : <span className="chip tiny">in progress</span>}
                    {r && r.revisions.length > 0 && <span className="chip tiny accent" title="Revisions">↺{r.revisions.length}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section aria-live="polite">
          {selected ? (
            <ReviewDetail key={`${selected.studentId}-${step.id}`} mission={mission} step={step} novel={novel} r={selected}
              callSign={roster.find((x) => x.id === selected.studentId)?.callSign ?? ''} />
          ) : (
            <div className="empty">
              <p>Choose a cadet to see their thinking for <strong>{step.title}</strong>.</p>
              <p className="small">{STEP_META[step.type].engine} · <a href={href(`/teacher/project/${mission.id}/${step.id}`)}>Show anonymous class results on the projector</a></p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ReviewDetail({ mission, step, novel, r, callSign }: { mission: Mission; step: MissionStep; novel: Novel; r: StepResponse; callSign: string }) {
  const rubric = useApp((s) => s.rubric);
  const reviewResponse = useApp((s) => s.reviewResponse);
  const v = describe(step, r, novel);
  const [scores, setScores] = useState<Record<string, number>>(r.review?.scores ?? {});
  const [feedback, setFeedback] = useState(r.review?.feedback ?? '');
  const suggestion = suggestFeedback(v.reasoningText, novel, v.evidence.length);

  const persist = (finalized: boolean) => {
    reviewResponse(responseKey(r.studentId, mission.id, step.id), { scores, feedback, finalized });
    toast(finalized ? `Feedback returned to ${callSign}` : 'Saved as draft');
  };

  return (
    <div className="stack">
      <div className="panel">
        <div className="row between">
          <h2 style={{ margin: 0 }}>{callSign} · {step.title}</h2>
          <span className="row" style={{ gap: '0.3rem' }}>
            {r.supports.map((s) => <span key={s} className="chip tiny">{s}</span>)}
            <span className="tiny muted">updated {new Date(r.updatedAt).toLocaleString()}</span>
          </span>
        </div>
        <dl className="resp">
          {v.rows.map(([k, val]) => (
            <div key={k}><dt>{k}</dt><dd>{val || <em className="muted">—</em>}</dd></div>
          ))}
        </dl>
        {v.evidence.length > 0 && (
          <>
            <h3 className="hud">Evidence cited</h3>
            <ul className="small">{v.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
          </>
        )}
        {r.supports.length > 0 && <p className="tiny muted">Supports used are shown for your information. They never lower a result.</p>}
      </div>

      {r.revisions.length > 0 && (
        <div className="panel">
          <h3 className="hud accent">Revision history</h3>
          <ol className="small revisions">
            {r.revisions.map((rev, i) => (
              <li key={i}>
                <strong>{new Date(rev.at).toLocaleString()}</strong>: {rev.summary}
                {typeof (rev.data as Record<string, unknown>)?.reasoning === 'string' && (
                  <p className="text-2" style={{ margin: '0.2rem 0 0' }}>Before: “{String((rev.data as Record<string, unknown>).reasoning)}”</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="panel">
        <h3 className="hud">Assessment</h3>
        <div className="table-wrap">
          <table className="table rubric-table">
            <thead><tr><th scope="col">Criterion</th>{rubric.levelNames.map((l) => <th scope="col" key={l}>{l}</th>)}</tr></thead>
            <tbody>
              {rubric.criteria.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.name}</th>
                  {c.levels.map((desc, i) => (
                    <td key={i}>
                      <button className={`rubric-cell ${scores[c.id] === i ? 'on' : ''}`} aria-pressed={scores[c.id] === i}
                        onClick={() => setScores({ ...scores, [c.id]: i })} aria-label={`${c.name}: ${rubric.levelNames[i]}`}>
                        {desc}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny muted">Leave a criterion blank if the room did not give evidence for it.</p>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="fb">Feedback to the student</label>
          <textarea id="fb" className="textarea" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <div className="callout small" style={{ marginTop: '0.6rem' }}>
          <span className="hud">Suggested draft, edit before using</span>
          <p style={{ margin: '0.3rem 0' }}>{suggestion}</p>
          <button className="btn quiet small" onClick={() => setFeedback(feedback ? `${feedback}\n${suggestion}` : suggestion)}>Use this draft</button>
        </div>
        <div className="row end" style={{ marginTop: '1rem' }}>
          <button className="btn ghost" onClick={() => persist(false)}>Save draft</button>
          <button className="btn primary" onClick={() => persist(true)}>Return to student <Icon name="next" size={18} /></button>
        </div>
      </div>
    </div>
  );
}

/** A readable summary of any response, for review and export. */
export function describe(step: MissionStep, r: StepResponse, novel: Novel) {
  const d = r.data as Record<string, unknown>;
  const ev = (ids: string[]) => ids.map((id) => {
    const e = novel.evidence.find((x) => x.id === id);
    return e ? `Ch. ${e.chapter}: ${e.text}` : id;
  });
  const rows: [string, string][] = [];
  let evidence: string[] = [];
  let reasoningText = '';
  let main = '';
  if (step.type === 'briefing') {
    rows.push(['Reading status', String(d.reading ?? '')], ['First thought', String(d.firstThought ?? '')]);
    reasoningText = String(d.firstThought ?? ''); main = reasoningText;
  }
  if (step.type === 'dilemma') {
    const c = step.choices.find((x) => x.id === d.choiceId);
    const f = c?.followUp?.choices.find((x) => x.id === d.followUpId);
    rows.push(['Decision', c?.label ?? ''], ['Follow-up', f?.label ?? ''], ['Values', ((d.values as string[]) ?? []).join(', ')],
      ['Reasoning', String(d.reasoning ?? '')], ['Comparison with the novel', String(d.compare ?? '')]);
    if ((d.explored as string[])?.length) rows.push(['Other paths explored', (d.explored as string[]).map((id) => step.choices.find((x) => x.id === id)?.label ?? id).join('; ')]);
    evidence = ev((d.evidenceIds as string[]) ?? []);
    reasoningText = `${d.reasoning ?? ''} ${d.compare ?? ''}`; main = `${c?.label ?? ''}: ${d.reasoning ?? ''}`;
  }
  if (step.type === 'evidence-board') {
    const t = step.theories.find((x) => x.id === d.theoryId);
    const sorted = (d.sorted as Record<string, string>) ?? {};
    const correct = Object.entries(sorted).filter(([id, k]) => novel.evidence.find((e) => e.id === id)?.kind === k).length;
    rows.push(['Theory argued', t ? `${t.label}${t.defensible ? '' : ' (the evidence strains this theory)'}` : ''], ['Claim', String(d.claim ?? '')],
      ['Reasoning', String(d.reasoning ?? '')], ['Other side', String(d.counter ?? '')],
      ['Fact / interpretation sorting', `${correct} of ${Object.keys(sorted).length} sorted cards match the evidence bank`],
      ['Ruled out', Object.entries((d.ruledOut as Record<string, string>) ?? {}).map(([id, why]) => `${step.theories.find((x) => x.id === id)?.label ?? id}: ${why}`).join(' · ')],
      ['Case strength (feedback meter)', String(d.band ?? '')]);
    const pins = (d.pins as Record<string, { theoryId: string; stance: string }>) ?? {};
    evidence = Object.entries(pins).map(([id, p]) => `${p.stance} T${step.theories.findIndex((x) => x.id === p.theoryId) + 1} · ${ev([id])[0]}`);
    reasoningText = `${d.claim ?? ''} ${d.reasoning ?? ''} ${d.counter ?? ''}`; main = `${d.claim ?? ''} ${d.reasoning ?? ''}`;
  }
  if (step.type === 'reasoning-lock') {
    const solved = (d.solved as Record<string, boolean>) ?? {};
    const hints = (d.hintsUsed as Record<string, number>) ?? {};
    const explain = (d.explain as Record<string, string>) ?? {};
    for (const l of step.locks) rows.push([l.title, `${solved[l.id] ? 'Opened' : 'Not yet'}${hints[l.id] ? ` · ${hints[l.id]} hint(s)` : ''}${explain[l.id] ? ` · “${explain[l.id]}”` : ''}`]);
    if (d.craftExplain) rows.push(['Craft explanation', String(d.craftExplain)]);
    if (d.themeExplain) rows.push(['Theme explanation', String(d.themeExplain)]);
    reasoningText = [...Object.values(explain), d.craftExplain ?? '', d.themeExplain ?? ''].join(' ');
    main = reasoningText;
  }
  if (step.type === 'connections') {
    const links = (d.links as { from: string; to: string; type: string; why: string; chapter: number }[]) ?? [];
    links.forEach((l, i) => rows.push([`Connection ${i + 1}`, `${nm(novel, l.from)} ↔ ${nm(novel, l.to)} (${l.type}, Ch. ${l.chapter}): ${l.why}`]));
    reasoningText = links.map((l) => l.why).join(' '); main = `${links.length} connections`;
  }
  if (step.type === 'reflection') {
    const rungs = (d.rungs as string[]) ?? [];
    rungs.forEach((t, i) => t && rows.push([['Topic', 'Observation', 'Theme statement', 'Complication'][i] ?? `Rung ${i + 1}`, t]));
    ((d.answers as string[]) ?? []).forEach((a, i) => rows.push([step.prompts[i] ?? `Prompt ${i + 1}`, a]));
    evidence = ev((d.evidenceIds as string[]) ?? []);
    reasoningText = [...rungs, ...((d.answers as string[]) ?? [])].join(' '); main = String(d.statement ?? rungs[2] ?? '');
  }
  return { rows, evidence, reasoningText, main };
}

const nm = (novel: Novel, id: string) => novel.characters.find((c) => c.id === id)?.name ?? id;
