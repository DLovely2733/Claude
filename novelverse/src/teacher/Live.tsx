import { motion } from 'motion/react';
import { ask } from '../components/Dialog';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { href, navigate } from '../lib/router';
import { visibleEvidence } from '../lib/knowledge';
import { ACTIVITY_INFO, createSession, publicState, responseId, roundOptions } from '../live/logic';
import { relayAvailable } from '../live/transport';
import { useHost } from '../live/useLive';
import { LiveResults } from '../live/LiveResults';
import { MultiPick } from './ListEditor';
import type { CourtroomStep, DilemmaStep, EvidenceBoardStep, LiveActivity, LiveSession } from '../data/types';
import { toast } from '../components/toast';
import { downloadFile, toCsv } from '../lib/download';

export function Live({ code }: { code?: string }) {
  return code ? <Console code={code} /> : <Setup />;
}

// ---------------------------------------------------------------- setup

function Setup() {
  const novels = useApp((s) => s.novels);
  const missions = useApp((s) => s.missions);
  const sessions = useApp((s) => s.sessions);
  const saveSession = useApp((s) => s.saveSession);
  const [activity, setActivity] = useState<LiveActivity>('four-corners');
  const [novelId, setNovelId] = useState(Object.keys(novels)[0] ?? '');
  const novel = novels[novelId];
  const evidence = novel ? visibleEvidence(novel) : [];
  const [prompt, setPrompt] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [relay, setRelay] = useState<boolean | null>(null);
  useEffect(() => { relayAvailable().then(setRelay); }, []);

  // Suggestions drawn from the novel's knowledge and missions.
  const steps = Object.values(missions).filter((m) => m.novelId === novelId).flatMap((m) => m.steps);
  const suggestions = useMemo(() => {
    if (!novel) return [];
    if (activity === 'four-corners') return novel.themes.flatMap((t) => t.ladder.slice(2, 3)).concat(['Graff is a good leader.', 'Ender is responsible for what happened with Bonzo.'].filter(() => novel.id === 'enders-game'));
    if (activity === 'this-or-that') return (steps.filter((s) => s.type === 'dilemma') as DilemmaStep[]).map((d) => d.scenario);
    if (activity === 'showdown') return (steps.filter((s) => s.type === 'evidence-board') as EvidenceBoardStep[]).flatMap((b) => b.theories.filter((t) => t.defensible).map((t) => t.label));
    if (activity === 'courtroom') return (steps.filter((s) => s.type === 'courtroom') as CourtroomStep[]).map((c) => c.charge);
    if (activity === 'prediction') return ['What will happen to Ender next, and why do you think so?'].filter(() => novel.id === 'enders-game').concat(['What will happen next, and which clue makes you think so?']);
    return novel.themes.map((t) => t.question).filter(Boolean);
  }, [activity, novel, steps]);

  const dilemma = (steps.find((s) => s.type === 'dilemma') as DilemmaStep | undefined);
  const needsEvidence = activity === 'showdown' || activity === 'courtroom';
  const ready = !!prompt.trim() && (activity !== 'this-or-that' || (optA.trim() && optB.trim())) && (!needsEvidence || evidenceIds.length >= (activity === 'showdown' ? 3 : 2));

  const start = () => {
    const options = activity === 'this-or-that' ? [{ id: 'a', label: optA.trim() }, { id: 'b', label: optB.trim() }]
      : activity === 'courtroom' ? [{ id: 'r', label: 'Responsible' }, { id: 'p', label: 'Partly responsible' }, { id: 'n', label: 'Not responsible' }] : undefined;
    const s = createSession({ activity, novelId, title: ACTIVITY_INFO[activity].name, prompt: prompt.trim(), options, evidenceIds });
    saveSession(s);
    navigate(`/teacher/live/${s.code}`);
  };

  const past = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <span className="hud" style={{ color: 'var(--accent-2)' }}>Live classroom</span>
      <h1>Run a live challenge</h1>
      <p className="text-2" style={{ maxWidth: 760 }}>Students join with a code and a call sign. You control the pace; the projector only ever shows anonymous class results.</p>

      <ConnectionNote relay={relay} />

      <div className="format-grid" style={{ marginTop: '1.25rem' }} role="radiogroup" aria-label="Activity">
        {(Object.keys(ACTIVITY_INFO) as LiveActivity[]).map((a) => (
          <button key={a} type="button" role="radio" aria-checked={activity === a} className={`format-card ${activity === a ? 'on' : ''}`}
            onClick={() => { setActivity(a); setPrompt(''); setEvidenceIds([]); }}>
            <Icon name={a === 'courtroom' ? 'scale' : a === 'showdown' ? 'pin' : a === 'wall' ? 'grid' : a === 'prediction' ? 'compass' : 'users'} size={24} />
            <strong>{ACTIVITY_INFO[a].name}</strong>
            <span className="small text-2">{ACTIVITY_INFO[a].blurb}</span>
          </button>
        ))}
      </div>

      <section className="panel stack" style={{ marginTop: '1.25rem' }}>
        <div className="field">
          <label htmlFor="lv-novel">Novel</label>
          <select id="lv-novel" className="select" value={novelId} onChange={(e) => setNovelId(e.target.value)}>
            {Object.values(novels).map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="lv-prompt">{activity === 'four-corners' ? 'Statement to take a stand on' : activity === 'showdown' ? 'Claim to find evidence for' : activity === 'courtroom' ? 'Charge' : activity === 'this-or-that' ? 'Dilemma' : 'Question'}</label>
          <textarea id="lv-prompt" className="textarea" style={{ minHeight: 70 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          {suggestions.length > 0 && (
            <div className="row" style={{ gap: '0.35rem' }}>
              <span className="tiny muted">From your unit:</span>
              {suggestions.slice(0, 4).map((sg) => <button key={sg} type="button" className="chip wrap-chip" onClick={() => setPrompt(sg)}>{sg.length > 70 ? `${sg.slice(0, 70)}…` : sg}</button>)}
            </div>
          )}
        </div>
        {activity === 'this-or-that' && (
          <div className="grid cols-2">
            <div className="field"><label htmlFor="lv-a">This</label><input id="lv-a" className="input" value={optA} onChange={(e) => setOptA(e.target.value)} /></div>
            <div className="field"><label htmlFor="lv-b">That</label><input id="lv-b" className="input" value={optB} onChange={(e) => setOptB(e.target.value)} /></div>
            {dilemma && <button type="button" className="chip" style={{ justifySelf: 'start' }} onClick={() => { setOptA(dilemma.choices[0]?.label ?? ''); setOptB(dilemma.choices[1]?.label ?? ''); }}>Use choices from “{dilemma.title}”</button>}
          </div>
        )}
        {(activity === 'four-corners' || activity === 'this-or-that' || needsEvidence) && (
          <div className="field" role="group" aria-label="Evidence">
            <span className="label">{activity === 'showdown' ? 'Evidence cards students choose from (3 or more)' : activity === 'courtroom' ? 'Exhibits available to both teams (2 or more)' : 'Evidence you may introduce between rounds (optional)'}</span>
            <MultiPick value={evidenceIds} onChange={setEvidenceIds} options={evidence.map((e) => ({ value: e.id, label: `Ch.${e.chapter} ${e.text.slice(0, 60)}…` }))} />
          </div>
        )}
        <div className="row end">
          <button className="btn primary" disabled={!ready} onClick={start}><Icon name="play" size={18} /> Open session</button>
        </div>
      </section>

      {past.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Sessions</h2>
          <ul className="le-list">
            {past.map((p) => (
              <li key={p.code} className="le-item">
                <div className="le-head" style={{ padding: '0.5rem 0.8rem' }}>
                  <span className="grow"><strong>{ACTIVITY_INFO[p.activity].name}</strong> · {p.prompt.slice(0, 80)} <span className="tiny muted">· {p.participants.length} joined · {new Date(p.createdAt).toLocaleString()}</span></span>
                  <span className={`chip tiny ${p.phase === 'ended' ? '' : 'good'}`}>{p.phase === 'ended' ? 'ended' : 'running'}</span>
                  <a className="btn quiet small" href={href(`/teacher/live/${p.code}`)}>{p.phase === 'ended' ? 'Results' : 'Resume'}</a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ConnectionNote({ relay }: { relay: boolean | null }) {
  if (relay === null) return null;
  return relay ? (
    <p className="callout good small"><strong>Classroom network mode.</strong> This page is served by the NovelVerse classroom server, so students on the same network can join from their own devices.</p>
  ) : (
    <p className="callout warn small">
      <strong>Same-browser mode.</strong> Without the classroom server, students can only join from other tabs of this browser (useful for a projector-only lesson or a demo).
      For student devices, run <span className="mono">npm run classroom</span> on a school laptop and open the address it prints. Multi-device joining needs that server; nothing is sent to the internet.
    </p>
  );
}

// ---------------------------------------------------------------- console

function Console({ code }: { code: string }) {
  const { session, kind, update } = useHost(code);
  const novel = useApp((s) => (session ? s.novels[session.novelId] : undefined));
  const [present, setPresent] = useState(false);
  const [intro, setIntro] = useState('');
  useEffect(() => {
    document.body.classList.toggle('presenting', present);
    return () => document.body.classList.remove('presenting');
  }, [present]);
  if (!session) return <div className="wrap"><div className="empty" style={{ marginTop: '2rem' }}>No session with code {code}. <a href={href('/teacher/live')}>Start one</a></div></div>;

  const s = session;
  const pub = publicState(s, novel, '*');
  const set = (patch: Partial<LiveSession>) => update((x) => ({ ...x, ...patch }));
  const isCourt = s.activity === 'courtroom';
  const currentRound = isCourt ? (s.stage === 'arguments' ? 1 : s.stage === 'objections' ? 2 : 3) : s.round;
  const roundResponses = s.responses.filter((r) => r.round === currentRound);

  const exportCsv = () => {
    const rows: (string | number)[][] = [['call sign', 'team', 'round', 'choice', 'evidence', 'text', 'objection', 'ruling', 'hidden']];
    for (const r of s.responses) {
      const p = s.participants.find((x) => x.id === r.participantId);
      const choice = s.options.find((o) => o.id === r.choice)?.label ?? r.choice ?? '';
      rows.push([p?.callSign ?? '', p?.team ?? '', r.round, choice, r.evidenceId ?? '', r.text ?? '', r.objection ?? '', s.rulings[responseId(r)] ?? '', s.hidden.includes(responseId(r)) ? 'yes' : '']);
    }
    downloadFile(`live-${s.code}.csv`, toCsv(rows), 'text/csv');
  };

  return (
    <div className={`live-console ${present ? 'present' : ''}`}>
      <div className="live-top">
        <div className="wrap row between">
          <div className="row">
            {!present && <a className="btn quiet small" href={href('/teacher/live')}><Icon name="back" size={16} /> Live</a>}
            <span className="hud accent">{ACTIVITY_INFO[s.activity].name}</span>
            <span className={`chip tiny ${kind === 'relay' ? 'good' : 'warn'}`} title={kind === 'relay' ? 'Students can join from their devices on this network' : 'Students can join from tabs of this browser only'}>
              {kind === 'relay' ? 'classroom network' : kind === 'local' ? 'same-browser mode' : 'connecting…'}
            </span>
          </div>
          <div className="join-code" aria-label={`Join code ${s.code.split('').join(' ')}`}>
            <span className="small muted">Join at <span className="mono">{location.host}{location.pathname}#/join</span></span>
            <strong className="mono">{s.code}</strong>
          </div>
          <div className="row">
            <button className="btn ghost small" aria-pressed={present} onClick={() => setPresent(!present)}><Icon name="eye" size={16} /> {present ? 'Exit present mode' : 'Present'}</button>
          </div>
        </div>
      </div>

      <div className="wrap live-grid">
        <main className="live-stage" aria-live="polite">
          <motion.h1 key={s.prompt} className="live-prompt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{s.prompt}</motion.h1>
          {isCourt && <p className="hud" style={{ color: 'var(--accent-2)' }}>Stage: {s.stage}</p>}
          {s.introduced.length > 0 && (
            <div className="introduced">
              {s.introduced.map((id) => {
                const e = novel?.evidence.find((x) => x.id === id);
                return e ? <p key={id} className="callout amber"><strong>New evidence · Ch. {e.chapter}:</strong> {e.text}</p> : null;
              })}
            </div>
          )}
          {s.phase === 'lobby' && (
            <div className="lobby">
              <p className="lobby-count"><span className="mono">{s.participants.length}</span> joined</p>
              <p className="text-2">Open <strong>{location.host}</strong> and enter code <strong className="mono">{s.code}</strong>.</p>
            </div>
          )}
          {(s.phase === 'open' || s.phase === 'locked') && (
            <div className="lobby">
              <p className="lobby-count"><span className="mono">{roundResponses.length ? new Set(roundResponses.map((r) => r.participantId)).size : 0}</span> / {s.participants.length} responded</p>
              <p className="text-2">{s.phase === 'open' ? (isCourt && s.stage === 'arguments' ? 'Teams are building their arguments.' : 'Responses are open.') : 'Responses are locked.'}</p>
              {s.activity === 'showdown' && s.round === 2 && <p className="small">Final vote among the top cards.</p>}
            </div>
          )}
          {(s.phase === 'reveal' || s.phase === 'ended' || (isCourt && s.stage !== 'arguments')) && <LiveResults s={pub} big={present} />}
          {s.phase === 'ended' && <p className="callout small" style={{ marginTop: '1rem' }}>Session ended. Results are saved in this browser.</p>}
        </main>

        {!present && (
          <aside className="live-side" aria-label="Teacher controls">
            <section className="panel">
              <h2 className="hud accent">Controls</h2>
              <div className="stack" style={{ ['--gap' as string]: '0.5rem' }}>
                {s.phase === 'lobby' && <button className="btn primary block" onClick={() => set({ phase: 'open' })}>{isCourt ? 'Open argument building' : 'Open round 1'}</button>}
                {s.phase === 'open' && <button className="btn primary block" onClick={() => set({ phase: 'locked' })}>Lock responses</button>}
                {s.phase === 'locked' && !isCourt && <button className="btn primary block" onClick={() => set({ phase: 'reveal' })}>Reveal results</button>}
                {s.phase === 'locked' && isCourt && s.stage === 'arguments' && <button className="btn primary block" onClick={() => set({ stage: 'objections', phase: 'open' })}>Show arguments · open objections</button>}
                {s.phase === 'locked' && isCourt && s.stage === 'objections' && <button className="btn primary block" onClick={() => set({ stage: 'verdict', phase: 'open' })}>Rulings done · open verdict</button>}
                {s.phase === 'locked' && isCourt && s.stage === 'verdict' && <button className="btn primary block" onClick={() => set({ phase: 'reveal' })}>Reveal verdict</button>}
                {s.phase === 'reveal' && ACTIVITY_INFO[s.activity].rounds && s.round === 1 && (
                  <>
                    {s.activity !== 'showdown' && s.evidenceIds.length > 0 && (
                      <div className="field">
                        <label htmlFor="intro" className="small">Introduce evidence before round 2</label>
                        <select id="intro" className="select" value={intro} onChange={(e) => setIntro(e.target.value)}>
                          <option value="">Choose evidence…</option>
                          {s.evidenceIds.map((id) => <option key={id} value={id}>{novel?.evidence.find((e) => e.id === id)?.text.slice(0, 70) ?? id}</option>)}
                        </select>
                        <button className="btn small" disabled={!intro} onClick={() => { set({ introduced: [...new Set([...s.introduced, intro])] }); toast('Evidence shown to the class'); }}>Show to class</button>
                      </div>
                    )}
                    <button className="btn block" onClick={() => set({ round: 2, phase: 'open' })}>
                      {s.activity === 'showdown' ? `Open final vote (top ${roundOptions({ ...s, round: 2 }).length})` : 'Open round 2: vote again'}
                    </button>
                  </>
                )}
                {s.phase !== 'ended' && <button className="btn ghost block" onClick={() => ask({ title: 'End this session for everyone?', body: 'Students see that it has ended. Results stay saved in this browser.', confirmLabel: 'End session', danger: true }).then((ok) => ok && set({ phase: 'ended', endedAt: Date.now() }))}>End session</button>}
                <button className="btn quiet small" onClick={exportCsv}><Icon name="download" size={16} /> Export responses (CSV)</button>
              </div>
            </section>

            {(s.activity === 'wall' || s.activity === 'prediction' || isCourt) && (
              <section className="panel">
                <h2 className="hud accent">Moderation</h2>
                <p className="tiny muted">Hidden responses never reach the projector or student screens.</p>
                <ul className="mod-list">
                  {s.responses.filter((r) => r.text).map((r) => {
                    const id = responseId(r);
                    const hidden = s.hidden.includes(id);
                    const isObj = isCourt && r.round === 2;
                    return (
                      <li key={id} className={hidden ? 'hidden' : ''}>
                        <span className="small grow">{isObj && <strong>Objection ({r.objection}): </strong>}{r.text}</span>
                        {isObj && (
                          <span className="row" style={{ gap: '0.2rem' }}>
                            <button className="btn small" aria-pressed={s.rulings[id] === 'sustained'} onClick={() => set({ rulings: { ...s.rulings, [id]: 'sustained' } })}>Sustain</button>
                            <button className="btn small" aria-pressed={s.rulings[id] === 'overruled'} onClick={() => set({ rulings: { ...s.rulings, [id]: 'overruled' } })}>Overrule</button>
                          </span>
                        )}
                        <button className="btn quiet small" onClick={() => set({ hidden: hidden ? s.hidden.filter((x) => x !== id) : [...s.hidden, id] })}>{hidden ? 'Show' : 'Hide'}</button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="panel">
              <h2 className="hud">Roster <span className="tiny muted">(teacher only)</span></h2>
              {s.participants.length === 0 && <p className="small muted">Nobody yet.</p>}
              <ul className="roster">
                {s.participants.map((p) => {
                  const done = roundResponses.some((r) => r.participantId === p.id);
                  return <li key={p.id}><span className="grow">{p.callSign}</span><span className="chip tiny">{p.team}</span>{done && <span className="chip tiny good" aria-label="responded">✓</span>}</li>;
                })}
              </ul>
            </section>
          </aside>
        )}
      </div>
      {present && (
        <div className="present-bar no-print">
          {s.phase === 'open' && <button className="btn small" onClick={() => set({ phase: 'locked' })}>Lock</button>}
          {s.phase === 'locked' && !isCourt && <button className="btn small" onClick={() => set({ phase: 'reveal' })}>Reveal</button>}
          {s.phase === 'lobby' && <button className="btn small" onClick={() => set({ phase: 'open' })}>Open</button>}
          <button className="btn small ghost" onClick={() => setPresent(false)}>Controls</button>
        </div>
      )}
    </div>
  );
}
