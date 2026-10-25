import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { ReasoningLockStep, Lock, SequenceLock, CraftLock, ThemeLock } from '../../data/types';
import { useMissionCtx, useStepResponse } from '../MissionContext';
import { useReading, ReadAloud } from '../../components/Reading';
import { Icon } from '../../components/Icon';
import { Mentor } from '../../components/Mentor';
import { play } from '../../lib/sound';

type VaultData = {
  solved: Record<string, boolean>;
  hintsUsed: Record<string, number>;
  attempts: Record<string, number>;
  sequence: Record<string, string[]>;
  selected: Record<string, string[]>;
  explain: Record<string, string>;
};

const INSIGHT_FOR: Record<Lock['kind'], string> = { sequence: 'timeline', craft: 'craft', theme: 'theme' };

export function ReasoningVault({ step, onDone }: { step: ReasoningLockStep; onDone: (insights: string[]) => void }) {
  const { data, save, response } = useStepResponse(step.id);
  const [v, setV] = useState<VaultData>(() => ({
    solved: {}, hintsUsed: {}, attempts: {}, sequence: {}, selected: {}, explain: {},
    ...(data as Partial<VaultData>),
  }));
  const firstOpen = step.locks.findIndex((l) => !v.solved[l.id]);
  const [active, setActive] = useState(firstOpen < 0 ? 0 : firstOpen);
  const allSolved = step.locks.every((l) => v.solved[l.id]);

  const patch = (p: Partial<VaultData>) => {
    const next = { ...v, ...p };
    setV(next);
    save(next);
  };
  const lock = step.locks[active];

  const solve = (id: string) => {
    const solved = { ...v.solved, [id]: true };
    patch({ solved });
    play('unlock');
    const nextIdx = step.locks.findIndex((l) => !solved[l.id]);
    if (nextIdx >= 0) setTimeout(() => setActive(nextIdx), 900);
  };

  const finish = () => {
    const ins = step.locks.filter((l) => v.solved[l.id]).map((l) => INSIGHT_FOR[l.kind]);
    save({ ...v, insights: ins }, { submit: true, revision: response?.status === 'submitted' ? 'Revisited vault' : undefined });
    onDone(ins);
  };

  return (
    <div className="vault">
      <div className="vault-door-row" role="tablist" aria-label="Locks">
        {step.locks.map((l, i) => (
          <button key={l.id} role="tab" aria-selected={active === i} className={`vault-lock-tab ${v.solved[l.id] ? 'solved' : ''} ${active === i ? 'active' : ''}`}
            onClick={() => setActive(i)}>
            <span className="vault-dial" aria-hidden="true">{v.solved[l.id] ? <Icon name="unlock" size={20} /> : <Icon name="lock" size={20} />}</span>
            <span className="small">{l.title}</span>
            <span className="sr-only">{v.solved[l.id] ? '(open)' : '(locked)'}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!allSolved || active < step.locks.length ? (
          <motion.section key={lock.id} role="tabpanel" className="panel lock-panel corners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {lock.kind === 'sequence' && <SequencePuzzle lock={lock} v={v} patch={patch} onSolve={() => solve(lock.id)} />}
            {lock.kind === 'craft' && <ChoicePuzzle lock={lock} v={v} patch={patch} onSolve={() => solve(lock.id)} multi />}
            {lock.kind === 'theme' && <ChoicePuzzle lock={lock} v={v} patch={patch} onSolve={() => solve(lock.id)} />}
            <Hints lock={lock} used={v.hintsUsed[lock.id] ?? 0} onUse={() => patch({ hintsUsed: { ...v.hintsUsed, [lock.id]: (v.hintsUsed[lock.id] ?? 0) + 1 } })} />
          </motion.section>
        ) : null}
      </AnimatePresence>

      {allSolved && (
        <motion.div className="vault-open panel glow" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="vault-burst" aria-hidden="true" />
          <span className="hud accent">{step.vaultName} · open</span>
          <h2>Signal decoded</h2>
          <p className="text-2">You rebuilt the timeline, read the author’s design, and found the theme hidden in the noise. Carry that theme into your Commander’s Log.</p>
          <button className="btn primary" onClick={finish}>Log the decoded signal <Icon name="check" size={18} /></button>
        </motion.div>
      )}
    </div>
  );
}

function Hints({ lock, used, onUse }: { lock: Lock; used: number; onUse: () => void }) {
  if (!lock.hints.length) return null;
  return (
    <div className="hints">
      {lock.hints.slice(0, used).map((h, i) => (
        <motion.p key={i} className="callout small" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Icon name="hint" size={16} /> {h}
        </motion.p>
      ))}
      {used < lock.hints.length && (
        <button className="btn quiet small" onClick={onUse}>
          <Icon name="hint" size={16} /> Hint ({lock.hints.length - used} left). Hints never count against you.
        </button>
      )}
    </div>
  );
}

// --------------------------------------------------------------- sequence

function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Never start already solved.
  if (out.every((x, i) => x === arr[i]) && out.length > 1) [out[0], out[1]] = [out[1], out[0]];
  return out;
}

function SequencePuzzle({ lock, v, patch, onSolve }: { lock: SequenceLock; v: VaultData; patch: (p: Partial<VaultData>) => void; onSolve: () => void }) {
  const { mission, novel } = useMissionCtx();
  const r = useReading(mission);
  const events = lock.eventIds.map((id) => novel.events.find((e) => e.id === id)).filter((e) => !!e);
  const initial = useMemo(() => seededShuffle(events.map((e) => e!.id), lock.id), [lock.id, events.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const order = v.sequence[lock.id] ?? initial;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const solved = v.solved[lock.id];

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || solved) return;
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    patch({ sequence: { ...v.sequence, [lock.id]: next } });
    setFeedback(null);
    play('tap');
  };

  const check = () => {
    const correct = order.filter((id, i) => id === lock.eventIds[i]).length;
    patch({ attempts: { ...v.attempts, [lock.id]: (v.attempts[lock.id] ?? 0) + 1 } });
    if (correct === order.length) {
      setFeedback('Signal restored. Every event is in place.');
      onSolve();
    } else {
      setFeedback(`${correct} of ${order.length} in the right place. Think about cause and effect: which event makes the next one possible?`);
      play('soft-fail');
    }
  };

  return (
    <div>
      <h2>{lock.title}</h2>
      <div className="row top" style={{ flexWrap: 'nowrap' }}><p className="grow">{lock.prompt}</p><ReadAloud text={lock.prompt} /></div>
      <ol className={`seq ${solved ? 'solved' : ''}`} aria-label="Events, in your order">
        {order.map((id, i) => {
          const e = novel.events.find((x) => x.id === id);
          if (!e) return null;
          return (
            <li key={id} className={`seq-item ${dragIdx === i ? 'dragging' : ''}`} draggable={!solved}
              onDragStart={() => setDragIdx(i)} onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => { if (dragIdx !== null) move(dragIdx, i); setDragIdx(null); }} onDragEnd={() => setDragIdx(null)}>
              <span className="seq-n mono" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="grow">{r.pick(e.text, e.plain)}</span>
              {!solved && (
                <span className="seq-btns">
                  <button className="btn quiet small" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move up: ${e.text}`}>▲</button>
                  <button className="btn quiet small" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label={`Move down: ${e.text}`}>▼</button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {feedback && <p className={`callout ${solved ? 'good' : 'warn'} small`} role="status">{feedback}</p>}
      {!solved && <div className="row end"><button className="btn primary" onClick={check}>Transmit sequence</button></div>}
      <p className="tiny muted">Drag events, or use the arrow buttons.</p>
    </div>
  );
}

// --------------------------------------------------------------- choice locks

function ChoicePuzzle({ lock, v, patch, onSolve, multi = false }: { lock: CraftLock | ThemeLock; v: VaultData; patch: (p: Partial<VaultData>) => void; onSolve: () => void; multi?: boolean }) {
  const { mission, novel } = useMissionCtx();
  const r = useReading(mission);
  const selected = v.selected[lock.id] ?? [];
  const [checked, setChecked] = useState(v.solved[lock.id] ?? false);
  const [explain, setExplain] = useState(v.explain[lock.id] ?? '');
  const solved = v.solved[lock.id];
  const strongIds = lock.options.filter((o) => o.strong).map((o) => o.id);
  const correct = multi
    ? strongIds.every((id) => selected.includes(id)) && selected.every((id) => strongIds.includes(id))
    : selected.length === 1 && strongIds.includes(selected[0]);

  const toggle = (id: string) => {
    if (solved) return;
    const next = multi ? (selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]) : [id];
    patch({ selected: { ...v.selected, [lock.id]: next } });
    setChecked(false);
    play('tap');
  };
  const check = () => {
    setChecked(true);
    patch({ attempts: { ...v.attempts, [lock.id]: (v.attempts[lock.id] ?? 0) + 1 } });
    play(correct ? 'success' : 'soft-fail');
  };
  const words = explain.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <h2>{lock.title}</h2>
      {lock.kind === 'theme' && <p className="theme-topic"><span className="hud">Topic</span> <strong>{lock.topic}</strong> <Icon name="next" size={14} /> <span className="hud">Theme statement</span> <strong>?</strong></p>}
      <div className="row top" style={{ flexWrap: 'nowrap' }}><p className="grow">{lock.prompt}</p><ReadAloud text={lock.prompt} /></div>
      <div className="opt-list" role={multi ? 'group' : 'radiogroup'} aria-label="Options">
        {lock.options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <div key={o.id} className={`opt ${on ? 'on' : ''} ${checked && on ? (o.strong ? 'good' : 'weak') : ''}`}>
              <button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={on} onClick={() => toggle(o.id)} className="opt-btn">
                <span className="opt-box" aria-hidden="true">{on ? '◆' : '◇'}</span>
                <span>{o.text}</span>
              </button>
              {checked && on && <p className="opt-why small">{o.why}</p>}
            </div>
          );
        })}
      </div>
      {!solved && !(checked && correct) && (
        <div className="row between">
          <span className="small muted">{multi ? 'Select every strong answer.' : 'Choose one.'}</span>
          <button className="btn primary" onClick={check} disabled={!selected.length}>Test the lock</button>
        </div>
      )}
      {checked && !correct && !solved && (
        <p className="callout warn small" role="status">
          {multi && selected.some((id) => strongIds.includes(id)) ? 'Close. Read the notes on your choices, then look for any strong answer you have not selected, or one that overstates.' : 'Not yet. Read the note on your choice and try again.'}
        </p>
      )}
      {(checked && correct) || solved ? (
        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor={`exp-${lock.id}`}>{lock.explainPrompt}</label>
          <textarea id={`exp-${lock.id}`} className="textarea" value={explain} readOnly={solved}
            onChange={(e) => setExplain(e.target.value)} onBlur={() => patch({ explain: { ...v.explain, [lock.id]: explain } })}
            placeholder={r.frames ? (lock.kind === 'theme' ? 'In Chapter ___, ___, which supports this theme because ___.' : 'Because readers know ___, the chapter feels ___.') : ''} />
          {!solved && (
            <div className="row between" style={{ marginTop: '0.6rem' }}>
              <Mentor text={explain} novel={novel} task={lock.kind === 'theme' ? 'theme' : 'explain'} thinkingLevel={mission.thinkingLevel} />
              <button className="btn primary" disabled={words < 6} onClick={() => { patch({ explain: { ...v.explain, [lock.id]: explain } }); onSolve(); }}>
                Open the lock <Icon name="unlock" size={18} />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
