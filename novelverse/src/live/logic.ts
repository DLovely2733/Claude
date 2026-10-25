import type { LiveActivity, LiveParticipant, LiveResponse, LiveSession, Novel, ObjectionType } from '../data/types';

// Live classroom sessions. The teacher's browser is the host and owns the
// full session (including call signs). Students only ever receive
// publicState(): anonymous, aggregated, and free of other students' names.

export const ACTIVITY_INFO: Record<LiveActivity, { name: string; blurb: string; rounds: boolean }> = {
  'four-corners': { name: 'Four Corners', blurb: 'Take a stand on a statement, see the room, add evidence, and vote again to see who moved.', rounds: true },
  'this-or-that': { name: 'This or That', blurb: 'A two-way dilemma with a reason. Introduce evidence and watch opinions shift.', rounds: true },
  showdown: { name: 'Evidence Showdown', blurb: 'Everyone picks the strongest evidence for a claim; then the class votes among the top three.', rounds: true },
  prediction: { name: 'Prediction Challenge', blurb: 'Predict what happens next and how confident you are. No right answers until you read on.', rounds: false },
  wall: { name: 'Response Wall', blurb: 'An anonymous wall of short responses that you moderate before revealing.', rounds: false },
  courtroom: { name: 'Live Courtroom', blurb: 'Two teams build arguments together, object to each other’s evidence, you rule, and the class gives a verdict.', rounds: false },
};

export const CORNERS = [
  { id: 'sa', label: 'Strongly agree' },
  { id: 'a', label: 'Agree' },
  { id: 'd', label: 'Disagree' },
  { id: 'sd', label: 'Strongly disagree' },
];
export const CONFIDENCE = [
  { id: 'sure', label: 'I’m sure' },
  { id: 'likely', label: 'Likely' },
  { id: 'guess', label: 'A guess' },
];
const SQUADS = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

export function makeCode(): string {
  // No vowels: avoids accidental words. No 0/O or 1/I confusion.
  const chars = 'BCDFGHJKLMNPQRSTVWXZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function createSession(p: {
  activity: LiveActivity; novelId: string; title: string; prompt: string; options?: { id: string; label: string }[]; evidenceIds?: string[];
}): LiveSession {
  const options = p.options?.length ? p.options : p.activity === 'four-corners' ? CORNERS : p.activity === 'prediction' ? CONFIDENCE : [];
  return {
    code: makeCode(), activity: p.activity, novelId: p.novelId, title: p.title, prompt: p.prompt,
    options, evidenceIds: p.evidenceIds ?? [], introduced: [], phase: 'lobby', round: 1,
    stage: p.activity === 'courtroom' ? 'arguments' : undefined,
    rulings: {}, hidden: [], participants: [], responses: [], createdAt: Date.now(),
  };
}

export function addParticipant(s: LiveSession, p: { id: string; callSign: string }): LiveSession {
  const existing = s.participants.find((x) => x.id === p.id);
  if (existing) return existing.callSign === p.callSign ? s : { ...s, participants: s.participants.map((x) => (x.id === p.id ? { ...x, callSign: p.callSign } : x)) };
  const teams = s.activity === 'courtroom' ? ['Prosecution', 'Defence'] : SQUADS;
  const team = teams[s.participants.length % teams.length];
  const participant: LiveParticipant = { id: p.id, callSign: p.callSign.slice(0, 24), team, joinedAt: Date.now() };
  return { ...s, participants: [...s.participants, participant] };
}

export const responseId = (r: LiveResponse) => `${r.participantId}:${r.at}`;

/** Accept a response if the session is open for it. Returns the session unchanged otherwise. */
export function addResponse(s: LiveSession, r: LiveResponse): LiveSession {
  if (s.phase !== 'open' || !s.participants.some((p) => p.id === r.participantId)) return s;
  const clean: LiveResponse = { ...r, round: s.round, text: r.text?.slice(0, 600) };
  if (s.activity === 'courtroom') {
    const mine = s.responses.filter((x) => x.participantId === r.participantId && x.round === stageRound(s.stage));
    if (s.stage === 'arguments') {
      if (!clean.text?.trim() || mine.length >= 3) return s;
    } else if (s.stage === 'objections') {
      if (!clean.target || !clean.objection || !s.responses.some((x) => responseId(x) === clean.target)) return s;
      if (mine.some((x) => x.target === clean.target)) return s;
    } else if (s.stage === 'verdict') {
      if (!s.options.some((o) => o.id === clean.choice)) return s;
      return { ...s, responses: [...s.responses.filter((x) => !(x.participantId === r.participantId && x.round === 3)), { ...clean, round: 3 }] };
    }
    return { ...s, responses: [...s.responses, { ...clean, round: stageRound(s.stage) }] };
  }
  if ((s.activity === 'four-corners' || s.activity === 'this-or-that' || s.activity === 'showdown') && !roundOptions(s).some((o) => o.id === clean.choice)) return s;
  if ((s.activity === 'wall' || s.activity === 'prediction') && !clean.text?.trim()) return s;
  // One response per student per round; a new one replaces the old.
  const others = s.responses.filter((x) => !(x.participantId === r.participantId && x.round === s.round));
  return { ...s, responses: [...others, clean] };
}

const stageRound = (stage: LiveSession['stage']) => (stage === 'arguments' ? 1 : stage === 'objections' ? 2 : 3);

/** Options that can be chosen this round (showdown narrows to the top three). */
export function roundOptions(s: LiveSession): { id: string; label: string }[] {
  if (s.activity === 'showdown') {
    const all = s.evidenceIds.map((id) => ({ id, label: id }));
    if (s.round === 1) return all;
    const top = tally(s, 1).filter((t) => t.count > 0).slice(0, 3).map((t) => t.id);
    return all.filter((o) => top.includes(o.id));
  }
  return s.options;
}

export function tally(s: LiveSession, round: number) {
  const opts = s.activity === 'showdown' ? s.evidenceIds.map((id) => ({ id, label: id })) : s.options;
  const rs = s.responses.filter((r) => r.round === round);
  return opts.map((o) => ({ id: o.id, label: o.label, count: rs.filter((r) => r.choice === o.id).length })).sort((a, b) => (s.activity === 'showdown' ? b.count - a.count : 0));
}

/** How individual opinions moved from round 1 to round 2. */
export function shifts(s: LiveSession) {
  const r1 = new Map(s.responses.filter((r) => r.round === 1).map((r) => [r.participantId, r.choice]));
  const r2 = s.responses.filter((r) => r.round === 2);
  const moves = new Map<string, number>();
  let stayed = 0;
  for (const r of r2) {
    const before = r1.get(r.participantId);
    if (!before) continue;
    if (before === r.choice) stayed += 1;
    else moves.set(`${before}>${r.choice}`, (moves.get(`${before}>${r.choice}`) ?? 0) + 1);
  }
  return {
    stayed,
    moved: [...moves.entries()].map(([k, count]) => {
      const [from, to] = k.split('>');
      return { from, to, count };
    }).sort((a, b) => b.count - a.count),
  };
}

// ---------------------------------------------------------------- public state

export interface PublicState {
  code: string;
  activity: LiveActivity;
  title: string;
  prompt: string;
  phase: LiveSession['phase'];
  round: number;
  stage?: LiveSession['stage'];
  options: { id: string; label: string }[];
  /** Evidence cards with text, so students need no access to the knowledge base. */
  evidence: { id: string; chapter: number; text: string }[];
  introduced: { id: string; chapter: number; text: string }[];
  participantCount: number;
  respondedCount: number;
  /** Participant ids that have responded this round (random ids, not names). */
  responded: string[];
  teams: Record<string, string>;
  tallies?: { round: number; rows: { id: string; label: string; count: number }[] }[];
  shift?: ReturnType<typeof shifts>;
  wall?: { id: string; text: string; choice?: string }[];
  arguments?: { id: string; team: string; evidence?: string; text: string; author: string; objections: { type: ObjectionType; text: string; ruling?: string }[] }[];
}

/**
 * The state a student device receives. For the courtroom's argument stage the
 * host sends one copy per team, so each team only sees its own work.
 */
export function publicState(s: LiveSession, novel: Novel | undefined, team?: string): PublicState {
  const ev = (id: string) => {
    const e = novel?.evidence.find((x) => x.id === id);
    return e ? { id, chapter: e.chapter, text: e.text } : { id, chapter: 0, text: id };
  };
  const teamOf = (pid: string) => s.participants.find((p) => p.id === pid)?.team ?? '';
  const current = s.activity === 'courtroom' ? stageRound(s.stage) : s.round;
  const respondedIds = [...new Set(s.responses.filter((r) => r.round === current).map((r) => r.participantId))];
  const base: PublicState = {
    code: s.code, activity: s.activity, title: s.title, prompt: s.prompt, phase: s.phase, round: s.round, stage: s.stage,
    options: s.activity === 'showdown' ? roundOptions(s).map((o) => ({ id: o.id, label: ev(o.id).text })) : s.options,
    evidence: s.evidenceIds.map(ev), introduced: s.introduced.map(ev),
    participantCount: s.participants.length, respondedCount: respondedIds.length, responded: respondedIds,
    teams: Object.fromEntries(s.participants.map((p) => [p.id, p.team])),
  };
  const reveal = s.phase === 'reveal' || s.phase === 'ended';
  if (reveal && ['four-corners', 'this-or-that', 'showdown'].includes(s.activity)) {
    const rounds = [...new Set(s.responses.map((r) => r.round))].sort();
    base.tallies = rounds.map((round) => ({ round, rows: tally(s, round).map((t) => ({ ...t, label: s.activity === 'showdown' ? ev(t.id).text : t.label })) }));
    if (rounds.includes(2) && s.activity !== 'showdown') base.shift = shifts(s);
  }
  if (reveal && (s.activity === 'wall' || s.activity === 'prediction')) {
    base.wall = s.responses.filter((r) => !s.hidden.includes(responseId(r))).map((r) => ({ id: responseId(r), text: r.text ?? '', choice: r.choice }));
  }
  if (s.activity === 'courtroom') {
    const args = s.responses.filter((r) => r.round === 1 && !s.hidden.includes(responseId(r)));
    // While building, each team sees only its own arguments.
    const visible = s.stage === 'arguments' ? args.filter((a) => team === '*' || (team !== undefined && teamOf(a.participantId) === team)) : args;
    base.arguments = visible.map((a) => ({
      id: responseId(a), team: teamOf(a.participantId), evidence: a.evidenceId ? ev(a.evidenceId).text : undefined, text: a.text ?? '',
      author: authorKey(a.participantId),
      objections: s.responses.filter((o) => o.round === 2 && o.target === responseId(a) && !s.hidden.includes(responseId(o)))
        .map((o) => ({ type: o.objection!, text: o.text ?? '', ruling: s.rulings[responseId(o)] })),
    }));
    if (reveal && s.stage === 'verdict') base.tallies = [{ round: 3, rows: s.options.map((o) => ({ ...o, count: s.responses.filter((r) => r.round === 3 && r.choice === o.id).length })) }];
  }
  return base;
}

/** A short, one-way key so a device can recognise its own arguments without exposing ids. */
export function authorKey(id: string): string {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}
