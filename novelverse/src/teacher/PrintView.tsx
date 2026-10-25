import { useState } from 'react';
import { useApp, useOutcomeLookup } from '../state/store';
import { href } from '../lib/router';
import { Icon } from '../components/Icon';
import { rangeLabel } from '../lib/generator';
import { characterName, vocabById } from '../lib/knowledge';
import type { MissionStep, Novel } from '../data/types';

// A paper and projector alternative to every room: same thinking, no device.
export function PrintView({ missionId }: { missionId: string }) {
  const mission = useApp((s) => s.missions[missionId]);
  const novel = useApp((s) => (mission ? s.novels[mission.novelId] : undefined));
  const lookup = useOutcomeLookup();
  const [projector, setProjector] = useState(false);
  const [plain, setPlain] = useState(mission?.readingLevel === 'supported');
  if (!mission || !novel) return <div className="empty">Mission not found.</div>;

  return (
    <div className={`print-page ${projector ? 'projector' : ''}`}>
      <div className="print-tools no-print">
        <a className="btn quiet small" href={href(`/teacher/mission/${mission.id}`)}><Icon name="back" size={16} /> Back</a>
        <button className="btn small" aria-pressed={plain} onClick={() => setPlain(!plain)}>Plain language</button>
        <button className="btn small" aria-pressed={projector} onClick={() => setProjector(!projector)}>Projector size</button>
        <button className="btn primary small" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button>
      </div>
      <article className="paper">
        <header>
          <p className="paper-kicker">{novel.title} · {novel.author} · {rangeLabel(mission.chapterNumbers)}</p>
          <h1>{mission.title}</h1>
          <p>{mission.summary}</p>
          <p className="paper-small">Name or call sign: ____________________ &nbsp; Date: ____________</p>
          <p className="paper-small">Outcomes: {mission.outcomes.map((id) => lookup(id)).filter(Boolean).map((o) => `${o!.code} ${o!.label}`).join(' · ')}</p>
        </header>
        {mission.steps.map((s, i) => <PrintStep key={s.id} step={s} n={i + 1} novel={novel} plain={plain} />)}
      </article>
    </div>
  );
}

const lines = (n: number) => <div className="write-lines">{Array.from({ length: n }, (_, i) => <span key={i} />)}</div>;

function PrintStep({ step, n, novel, plain }: { step: MissionStep; n: number; novel: Novel; plain: boolean }) {
  const p = (a: string, b?: string) => (plain && b ? b : a);
  return (
    <section className="paper-step">
      <h2>{n}. {step.title}</h2>
      <p className="paper-small"><em>{step.skill}</em></p>
      <p>{p(step.instructions, step.plainInstructions)}</p>
      {step.type === 'briefing' && (
        <>
          {step.chunks.map((c) => <p key={c.heading}><strong>{c.heading}.</strong> {p(c.text, c.plain)}</p>)}
          <p><strong>Word bank:</strong> {step.vocab.map((id) => vocabById(novel, id)).filter(Boolean).map((v) => `${v!.term} (${v!.definition})`).join('; ')}</p>
          <p>First thought:</p>{lines(2)}
        </>
      )}
      {step.type === 'dilemma' && (
        <>
          <p className="paper-box">SIMULATION, not what happens in the book. {p(step.scenario, step.plainScenario)}</p>
          <ul>{step.hotspots.map((h) => <li key={h.id}><strong>{h.label}:</strong> {p(h.text, h.plain)}</li>)}</ul>
          <p>Circle one:</p>
          <ol type="A">{step.choices.map((c) => <li key={c.id}>{p(c.label, c.plain)}</li>)}</ol>
          <p>Values behind my choice (circle): {step.valueOptions.join(' · ')}</p>
          <p>Evidence from the novel that informed my choice:</p>{lines(2)}
          <p>Why? Connect your evidence to your choice:</p>{lines(4)}
          <p>After discussion: how does your choice compare with what happens in the novel?</p>{lines(3)}
        </>
      )}
      {step.type === 'evidence-board' && (
        <>
          <p className="paper-box"><strong>{step.caseTitle}:</strong> {step.caseQuestion}</p>
          <p><strong>Theories</strong></p>
          <ol>{step.theories.map((t) => <li key={t.id}>{p(t.label, t.plain)}</li>)}</ol>
          <table className="paper-table">
            <thead><tr><th>Evidence</th><th>Fact or interpretation?</th><th>Supports / challenges which theory?</th></tr></thead>
            <tbody>
              {step.cards.map((c) => {
                const e = novel.evidence.find((x) => x.id === c.evidenceId);
                return e ? <tr key={c.evidenceId}><td>Ch. {e.chapter}: {p(e.text, e.plain)}</td><td>F &nbsp; / &nbsp; I</td><td></td></tr> : null;
              })}
            </tbody>
          </table>
          <p>My claim:</p>{lines(2)}<p>Evidence and reasoning:</p>{lines(4)}<p>The other side, and my answer:</p>{lines(3)}<p>Theory I rule out, and why:</p>{lines(2)}
        </>
      )}
      {step.type === 'reasoning-lock' && step.locks.map((l) => (
        <div key={l.id}>
          <h3>{l.title}</h3>
          <p>{l.prompt}</p>
          {l.kind === 'sequence' && (
            <ul className="paper-seq">
              {[...l.eventIds].sort().map((id) => {
                const e = novel.events.find((x) => x.id === id);
                return e ? <li key={id}>____ {p(e.text, e.plain)}</li> : null;
              })}
            </ul>
          )}
          {l.kind !== 'sequence' && <ul>{l.options.map((o) => <li key={o.id}>☐ {o.text}</li>)}</ul>}
          {l.kind !== 'sequence' && <><p>{l.explainPrompt}</p>{lines(2)}</>}
        </div>
      ))}
      {step.type === 'connections' && (
        <>
          <p>Characters: {step.characterIds.map((id) => characterName(novel, id)).join(', ')}</p>
          <table className="paper-table">
            <thead><tr><th>Characters</th><th>Kind of connection</th><th>Chapter</th><th>Evidence</th><th>Has it changed?</th></tr></thead>
            <tbody>{Array.from({ length: 5 }, (_, i) => <tr key={i}><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>)}</tbody>
          </table>
        </>
      )}
      {step.type === 'reflection' && (
        <>
          <p>Topic: <strong>{novel.themes.find((t) => t.id === step.themeId)?.topic}</strong></p>
          <p>Observation: what do these chapters show about it?</p>{lines(2)}
          <p>Theme statement: an idea about people or life.</p>{lines(2)}
          <p>Complication: …but / …yet / …although</p>{lines(2)}
          {step.prompts.map((q) => <div key={q}><p>{q}</p>{lines(3)}</div>)}
        </>
      )}
    </section>
  );
}
