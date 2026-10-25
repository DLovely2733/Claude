import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { navigate } from '../lib/router';
import { useStudentLive } from '../live/useLive';
import { LiveResults } from '../live/LiveResults';
import { ACTIVITY_INFO, CONFIDENCE, type PublicState } from '../live/logic';
import type { ObjectionType } from '../data/types';
import { play } from '../lib/sound';

const CALL_SIGNS = ['Vega', 'Orion', 'Lyra', 'Altair', 'Nova', 'Rigel', 'Cassia', 'Draco', 'Sirius', 'Atlas', 'Juno', 'Kestrel', 'Comet', 'Quasar', 'Zephyr', 'Ember'];

export function JoinLive({ code }: { code?: string }) {
  return (
    <>
      <TopBar mode="student" />
      <main id="main" tabIndex={-1} className="join-main">
        {code ? <LiveClient key={code.toUpperCase()} code={code.toUpperCase()} /> : <EnterCode />}
      </main>
    </>
  );
}

function EnterCode() {
  const [code, setCode] = useState('');
  const valid = /^[A-Z0-9]{4,8}$/.test(code);
  return (
    <div className="wrap narrow join-card">
      <span className="hud accent">Live session</span>
      <h1>Join your class</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (valid) navigate(`/join/${code}`); }} className="stack">
        <label className="field">
          <span className="label">Session code from the screen</span>
          <input className="input code-input mono" value={code} autoFocus inputMode="text" autoComplete="off" maxLength={8}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} aria-describedby="code-help" />
          <span id="code-help" className="help">Five letters and numbers.</span>
        </label>
        <button className="btn primary" disabled={!valid}>Join <Icon name="next" size={18} /></button>
      </form>
    </div>
  );
}

function LiveClient({ code }: { code: string }) {
  const live = useStudentLive(code);
  const [name, setName] = useState('');
  const [suggest] = useState(() => [...CALL_SIGNS].sort(() => Math.random() - 0.5).slice(0, 6));

  if (live.status === 'not-found' && !live.state) {
    return (
      <div className="wrap narrow join-card">
        <h1>No session found</h1>
        <p className="text-2">Nothing is running with code <strong className="mono">{code}</strong> here. Check the code on the screen.</p>
        <p className="small muted">If your teacher is running the session on another computer, you need to open NovelVerse from the classroom address your teacher gives you (it looks like <span className="mono">http://192.168.…:8787</span>).</p>
        <button className="btn" onClick={() => navigate('/join')}>Try another code</button>
      </div>
    );
  }
  if (live.status === 'ended') {
    return <div className="wrap narrow join-card"><h1>Session ended</h1><p className="text-2">Thanks for taking part. Your teacher has your responses.</p></div>;
  }
  if (!live.state) return <div className="wrap narrow join-card"><span className="hud accent">Connecting to {code}…</span></div>;

  const s = live.state;
  if (!live.joined) {
    return (
      <div className="wrap narrow join-card">
        <span className="hud accent">{ACTIVITY_INFO[s.activity].name} · {code}</span>
        <h1>Choose a call sign</h1>
        <p className="small muted">Please don’t use your real name. Your teacher sees your call sign; the class screen never shows it.</p>
        <div className="row" style={{ gap: '0.4rem' }}>
          {suggest.map((c) => <button key={c} type="button" className="chip" aria-pressed={name === c} onClick={() => setName(c)}>{c}</button>)}
        </div>
        <form className="row" style={{ marginTop: '0.8rem' }} onSubmit={(e) => { e.preventDefault(); live.join(name); play('unlock'); }}>
          <label className="grow"><span className="sr-only">Call sign</span><input className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Or type your own" /></label>
          <button className="btn primary" disabled={!name.trim()}>Enter</button>
        </form>
        {live.callSign && <p className="tiny muted">Joining as {live.callSign}…</p>}
      </div>
    );
  }

  const responded = s.responded.includes(live.pid);
  return (
    <div className="wrap narrow live-client">
      <div className="row between">
        <span className="hud accent">{ACTIVITY_INFO[s.activity].name}</span>
        <span className="row" style={{ gap: '0.3rem' }}>
          <span className="chip">{live.callSign}</span>
          <span className="chip accent">{live.team}</span>
          {live.status === 'offline' && <span className="chip warn">reconnecting…</span>}
        </span>
      </div>
      <h1 className="live-prompt small-prompt">{s.prompt}</h1>
      {s.introduced.map((e) => <p key={e.id} className="callout amber small"><strong>New evidence · Ch. {e.chapter}:</strong> {e.text}</p>)}

      <AnimatePresence mode="wait">
        <motion.div key={`${s.phase}-${s.round}-${s.stage}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {s.phase === 'lobby' && <Waiting text="You’re in. Waiting for your teacher to start." />}
          {s.phase === 'open' && <Respond s={s} live={live} responded={responded} />}
          {s.phase === 'locked' && <Waiting text="Responses are locked. Eyes on the screen." />}
          {(s.phase === 'reveal' || (s.activity === 'courtroom' && s.phase !== 'open' && s.stage !== 'arguments')) && <LiveResults s={s} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Waiting({ text }: { text: string }) {
  return <div className="waiting" role="status"><span className="pulse-dot" aria-hidden="true" />{text}</div>;
}

type Live = ReturnType<typeof useStudentLive>;

function Respond({ s, live, responded }: { s: PublicState; live: Live; responded: boolean }) {
  const [choice, setChoice] = useState('');
  const [text, setText] = useState('');
  const [evidenceId, setEvidenceId] = useState('');
  const [target, setTarget] = useState('');
  const [objection, setObjection] = useState<ObjectionType | ''>('');
  const send = (r: Parameters<Live['respond']>[0]) => { live.respond(r); play('success'); setText(''); };
  const sent = responded && <p className="callout good small" role="status">Sent. {['wall', 'prediction'].includes(s.activity) || s.activity === 'courtroom' ? '' : 'You can change your answer until responses are locked.'}</p>;

  if (s.activity === 'four-corners' || s.activity === 'this-or-that' || s.activity === 'showdown') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); send({ choice, text }); }} className="stack">
        <div className="choice-grid" role="radiogroup" aria-label="Your answer">
          {s.options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={choice === o.id} className={`choice-card ${choice === o.id ? 'on' : ''}`} onClick={() => setChoice(o.id)}>
              <span className="choice-label">{o.label}</span>
            </button>
          ))}
        </div>
        <label className="field"><span className="label">Why? {s.activity === 'showdown' ? 'What makes this the strongest evidence?' : 'Point to the novel.'}</span>
          <textarea className="textarea" style={{ minHeight: 70 }} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} /></label>
        <button className="btn primary" disabled={!choice}>{responded ? 'Update my answer' : 'Send'}</button>
        {sent}
      </form>
    );
  }
  if (s.activity === 'wall' || s.activity === 'prediction') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); send({ text, choice: choice || undefined }); }} className="stack">
        <label className="field"><span className="label">Your response (anonymous on the screen)</span>
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} maxLength={600} /></label>
        {s.activity === 'prediction' && (
          <div className="segmented" role="group" aria-label="How confident are you?">
            {CONFIDENCE.map((c) => <button key={c.id} type="button" aria-pressed={choice === c.id} onClick={() => setChoice(c.id)}>{c.label}</button>)}
          </div>
        )}
        <button className="btn primary" disabled={!text.trim()}>{responded ? 'Replace my response' : 'Send'}</button>
        {sent}
      </form>
    );
  }
  // courtroom
  if (s.stage === 'arguments') {
    const mine = (s.arguments ?? []);
    return (
      <div className="stack">
        <p className="text-2">You are on the <strong>{live.team}</strong>. Build arguments with your team: choose an exhibit and say what it proves. You can add up to three.</p>
        <form onSubmit={(e) => { e.preventDefault(); send({ evidenceId: evidenceId || undefined, text }); }} className="stack">
          <label className="field"><span className="label">Exhibit</span>
            <select className="select" value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)}>
              <option value="">Choose evidence…</option>
              {s.evidence.map((e) => <option key={e.id} value={e.id}>Ch. {e.chapter}: {e.text}</option>)}
            </select></label>
          <label className="field"><span className="label">Argument: what does it prove?</span>
            <textarea className="textarea" style={{ minHeight: 70 }} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} /></label>
          <button className="btn primary" disabled={!text.trim() || !evidenceId}>Add to our case</button>
        </form>
        <section aria-label="Your team's case">
          <h2 className="hud">Your team’s case so far ({mine.length})</h2>
          {mine.map((a) => <p key={a.id} className="court-arg small">{a.evidence && <span className="tiny muted">{a.evidence}<br /></span>}{a.text}</p>)}
        </section>
      </div>
    );
  }
  if (s.stage === 'objections') {
    const theirs = (s.arguments ?? []).filter((a) => a.team !== live.team);
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (objection) send({ target, objection, text }); }} className="stack">
        <p className="text-2">Object to the other team’s weakest argument. Choose the argument, the type of objection, and why.</p>
        <div className="stack" role="radiogroup" aria-label="Argument to object to" style={{ ['--gap' as string]: '0.4rem' }}>
          {theirs.map((a) => (
            <button key={a.id} type="button" role="radio" aria-checked={target === a.id} className={`choice-card ${target === a.id ? 'on' : ''}`} onClick={() => setTarget(a.id)}>
              <span className="choice-label small">{a.text}</span>
            </button>
          ))}
          {theirs.length === 0 && <p className="muted">The other team has no arguments yet.</p>}
        </div>
        <div className="segmented" role="group" aria-label="Objection type">
          {(['speculation', 'ignores-evidence', 'overgeneralization'] as const).map((o) => <button key={o} type="button" aria-pressed={objection === o} onClick={() => setObjection(o)}>{o.replace('-', ' ')}</button>)}
        </div>
        <label className="field"><span className="label">Why?</span><input className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} /></label>
        <button className="btn primary" disabled={!target || !objection || !text.trim()}>Object</button>
        {sent}
      </form>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); send({ choice, text }); }} className="stack">
      <p className="text-2">Step out of your team. As a juror, which verdict does the evidence support?</p>
      <div className="choice-grid" role="radiogroup" aria-label="Verdict">
        {s.options.map((o) => <button key={o.id} type="button" role="radio" aria-checked={choice === o.id} className={`choice-card ${choice === o.id ? 'on' : ''}`} onClick={() => setChoice(o.id)}><span className="choice-label">{o.label}</span></button>)}
      </div>
      <label className="field"><span className="label">Your reason</span><textarea className="textarea" style={{ minHeight: 70 }} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} /></label>
      <button className="btn primary" disabled={!choice}>{responded ? 'Update verdict' : 'Deliver verdict'}</button>
      {sent}
    </form>
  );
}
