import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store';
import type { LiveResponse, LiveSession } from '../data/types';
import { addParticipant, addResponse, publicState, type PublicState } from './logic';
import { connect, type LiveMessage, type Transport } from './transport';

/** Host side: runs in the teacher's browser and owns the session. */
export function useHost(code: string) {
  const session = useApp((s) => s.sessions[code]);
  const [kind, setKind] = useState<Transport['kind'] | null>(null);
  const transport = useRef<Transport | null>(null);

  const broadcast = useCallback((s: LiveSession) => {
    const t = transport.current;
    if (!t) return;
    if (s.phase === 'ended') { t.send({ t: 'ended' }); return; }
    const novel = useApp.getState().novels[s.novelId];
    t.send({ t: 'state', s: publicState(s, novel) });
    if (s.activity === 'courtroom') {
      for (const team of new Set(s.participants.map((p) => p.team))) t.send({ t: 'state', team, s: publicState(s, novel, team) });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let t: Transport | null = null;
    const onMessage = (m: LiveMessage) => {
      const store = useApp.getState();
      const s = store.sessions[code];
      if (!s) return;
      let next = s;
      if (m.t === 'join' && s.phase !== 'ended') next = addParticipant(s, { id: m.pid, callSign: m.callSign });
      if (m.t === 'respond') next = addResponse(s, m.r);
      if (next !== s) store.saveSession(next);
      if (m.t === 'hello' || next !== s) broadcast(next);
    };
    connect(code, onMessage).then((x) => {
      if (!alive) { x.close(); return; }
      t = x;
      transport.current = x;
      setKind(x.kind);
      const s = useApp.getState().sessions[code];
      if (s) broadcast(s);
    });
    return () => { alive = false; t?.close(); transport.current = null; };
  }, [code, broadcast]);

  // Teacher actions change the session; push every change out, plus a heartbeat.
  useEffect(() => { if (session) broadcast(session); }, [session, broadcast]);
  useEffect(() => {
    const id = setInterval(() => { const s = useApp.getState().sessions[code]; if (s) broadcast(s); }, 4000);
    return () => clearInterval(id);
  }, [code, broadcast]);

  const update = (fn: (s: LiveSession) => LiveSession) => {
    const s = useApp.getState().sessions[code];
    if (s) useApp.getState().saveSession(fn(s));
  };
  return { session, kind, update };
}

function storageGet(k: string) { try { return sessionStorage.getItem(k); } catch { return null; } }
function storageSet(k: string, v: string) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } }

/** Student side: a device that joins with a code. Holds no other student's data. */
export function useStudentLive(code: string) {
  const [pid] = useState(() => {
    const k = `nv-pid-${code}`;
    const existing = storageGet(k);
    if (existing) return existing;
    const id = `p-${Math.random().toString(36).slice(2, 10)}`;
    storageSet(k, id);
    return id;
  });
  const [callSign, setCallSign] = useState(() => storageGet(`nv-cs-${code}`) ?? '');
  const [state, setState] = useState<PublicState | null>(null);
  const [status, setStatus] = useState<'connecting' | 'not-found' | 'live' | 'ended' | 'offline'>('connecting');
  const [kind, setKind] = useState<Transport['kind'] | null>(null);
  const transport = useRef<Transport | null>(null);
  const callRef = useRef(callSign);
  callRef.current = callSign;

  useEffect(() => {
    let alive = true;
    let t: Transport | null = null;
    let gotState = false;
    const onMessage = (m: LiveMessage) => {
      if (m.t === 'ended') { setStatus('ended'); return; }
      if (m.t !== 'state') return;
      const myTeam = m.s.teams[pid];
      // Team copies are for that team only; the general copy is for everyone else.
      if (m.team ? m.team !== myTeam : myTeam && m.s.activity === 'courtroom' && m.s.stage === 'arguments') return;
      gotState = true;
      setState(m.s);
      // The host may have restarted or missed the join; make sure we are on the roster.
      if (callRef.current && !(pid in m.s.teams) && m.s.phase !== 'ended') transport.current?.send({ t: 'join', pid, callSign: callRef.current });
      setStatus('live');
    };
    connect(code, onMessage, (st) => st === 'closed' && setStatus((x) => (x === 'live' ? 'offline' : x))).then((x) => {
      if (!alive) { x.close(); return; }
      t = x;
      transport.current = x;
      setKind(x.kind);
      x.send({ t: 'hello', pid });
      if (callRef.current) x.send({ t: 'join', pid, callSign: callRef.current });
    });
    const retry = setInterval(() => {
      if (gotState) return;
      transport.current?.send({ t: 'hello', pid });
    }, 1500);
    const timeout = setTimeout(() => { if (!gotState) setStatus('not-found'); }, 5000);
    return () => { alive = false; clearInterval(retry); clearTimeout(timeout); t?.close(); };
  }, [code, pid]);

  const join = (name: string) => {
    const cs = name.trim().slice(0, 24);
    if (!cs) return;
    setCallSign(cs);
    storageSet(`nv-cs-${code}`, cs);
    transport.current?.send({ t: 'join', pid, callSign: cs });
  };
  const respond = (r: Omit<LiveResponse, 'participantId' | 'at' | 'round'>) =>
    transport.current?.send({ t: 'respond', r: { ...r, participantId: pid, at: Date.now(), round: 0 } });

  const joined = !!state && pid in state.teams;
  return { pid, callSign, state, status, kind, join, respond, joined, team: state?.teams[pid] };
}
