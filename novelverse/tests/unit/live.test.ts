import { describe, it, expect } from 'vitest';
import { addParticipant, addResponse, createSession, publicState, responseId, roundOptions, shifts, tally, authorKey } from '../../src/live/logic';
import { endersGame } from '../../src/data/novels/endersGame';
import { generateMission, templateFromMission } from '../../src/lib/generator';
import { BUILT_IN_TEMPLATES } from '../../src/data/templates';
import { tribunal } from '../../src/data/missions/tribunal';
import { placeholdersIn } from '../../src/lib/generator';
import type { LiveSession } from '../../src/data/types';

const join = (s: LiveSession, ...ids: string[]) => ids.reduce((acc, id) => addParticipant(acc, { id, callSign: id.toUpperCase() }), s);
const vote = (s: LiveSession, pid: string, choice: string, text = '') => addResponse(s, { participantId: pid, choice, text, round: 0, at: Math.random() });

describe('live sessions', () => {
  it('only accepts responses while open, one per student per round', () => {
    let s = join(createSession({ activity: 'four-corners', novelId: 'enders-game', title: 'FC', prompt: 'Graff is a good leader.' }), 'a', 'b');
    s = vote(s, 'a', 'sa');
    expect(s.responses).toHaveLength(0);
    s = { ...s, phase: 'open' };
    s = vote(vote(vote(s, 'a', 'sa'), 'a', 'd'), 'b', 'nope');
    expect(s.responses).toHaveLength(1);
    expect(s.responses[0].choice).toBe('d');
    expect(vote(s, 'stranger', 'a')).toBe(s);
  });

  it('measures how opinions shift after new evidence', () => {
    let s = join(createSession({ activity: 'four-corners', novelId: 'enders-game', title: 'FC', prompt: 'p' }), 'a', 'b', 'c');
    s = { ...s, phase: 'open' };
    s = vote(vote(vote(s, 'a', 'sa'), 'b', 'a'), 'c', 'd');
    s = { ...s, round: 2 };
    s = vote(vote(vote(s, 'a', 'd'), 'b', 'a'), 'c', 'sd');
    const sh = shifts(s);
    expect(sh.stayed).toBe(1);
    expect(sh.moved).toEqual(expect.arrayContaining([{ from: 'sa', to: 'd', count: 1 }, { from: 'd', to: 'sd', count: 1 }]));
    expect(tally(s, 2).find((t) => t.id === 'd')?.count).toBe(1);
  });

  it('never sends call signs to students and hides responses until reveal', () => {
    let s = join(createSession({ activity: 'wall', novelId: 'enders-game', title: 'W', prompt: 'p' }), 'a', 'b');
    s = { ...s, phase: 'open' };
    s = addResponse(s, { participantId: 'a', text: 'Graff is lonely too', round: 0, at: 1 });
    s = addResponse(s, { participantId: 'b', text: 'something unkind', round: 0, at: 2 });
    expect(publicState(s, endersGame).wall).toBeUndefined();
    s = { ...s, phase: 'reveal', hidden: [responseId(s.responses[1])] };
    const pub = publicState(s, endersGame);
    expect(pub.wall?.map((w) => w.text)).toEqual(['Graff is lonely too']);
    expect(JSON.stringify(pub)).not.toMatch(/"A"|"B"|callSign/);
  });

  it('narrows the showdown to the top three cards', () => {
    let s = join(createSession({ activity: 'showdown', novelId: 'enders-game', title: 'S', prompt: 'p', evidenceIds: ['ec-rules', 'ec-honest', 'ec-shuttle', 'ec-valentine'] }), 'a', 'b', 'c', 'd');
    s = { ...s, phase: 'open' };
    s = vote(vote(vote(vote(s, 'a', 'ec-rules'), 'b', 'ec-rules'), 'c', 'ec-honest'), 'd', 'ec-shuttle');
    const r2 = roundOptions({ ...s, round: 2 }).map((o) => o.id);
    expect(r2).toEqual(['ec-rules', 'ec-honest', 'ec-shuttle']);
  });

  it('runs a courtroom: team-private arguments, objections, verdict', () => {
    let s = join(createSession({ activity: 'courtroom', novelId: 'enders-game', title: 'C', prompt: 'charge', evidenceIds: ['ec-rules'], options: [{ id: 'r', label: 'Responsible' }] }), 'p1', 'd1');
    expect(s.participants.map((p) => p.team)).toEqual(['Prosecution', 'Defence']);
    s = { ...s, phase: 'open' };
    s = addResponse(s, { participantId: 'p1', text: 'He changes the rules', evidenceId: 'ec-rules', round: 0, at: 1 });
    s = addResponse(s, { participantId: 'd1', text: 'He was honest', round: 0, at: 2 });
    expect(publicState(s, endersGame, 'Defence').arguments?.map((a) => a.text)).toEqual(['He was honest']);
    expect(publicState(s, endersGame).arguments).toEqual([]);
    expect(publicState(s, endersGame, 'Prosecution').arguments?.[0].author).toBe(authorKey('p1'));
    s = { ...s, stage: 'objections' };
    const target = responseId(s.responses[0]);
    s = addResponse(s, { participantId: 'd1', target, objection: 'speculation', text: 'guessing', round: 0, at: 3 });
    s = addResponse(s, { participantId: 'd1', target, objection: 'speculation', text: 'again', round: 0, at: 4 });
    expect(s.responses.filter((r) => r.round === 2)).toHaveLength(1);
    s = { ...s, stage: 'verdict', rulings: { [responseId(s.responses[2])]: 'sustained' } };
    s = addResponse(s, { participantId: 'p1', choice: 'r', round: 0, at: 5 });
    const pub = publicState({ ...s, phase: 'reveal' }, endersGame);
    expect(pub.tallies?.[0].rows[0].count).toBe(1);
    expect(pub.arguments?.[0].objections[0].ruling).toBe('sustained');
  });
});

describe('templates and new engines', () => {
  it('applies every built-in template to the demo novel', () => {
    for (const t of BUILT_IN_TEMPLATES) {
      const { mission } = generateMission(endersGame, { chapters: [11, 12, 13], engines: t.engines, themeId: 'leadership', outcomes: [], readingLevel: t.readingLevel, thinkingLevel: t.thinkingLevel, grouping: t.grouping, duration: t.duration, overrides: t.overrides });
      expect(mission.steps.map((s) => s.type)).toEqual(t.engines);
    }
  });
  it('round-trips a mission through a template, keeping teacher wording', () => {
    const t = templateFromMission(tribunal, 'Trial', 'd', (id) => id.split('-').pop());
    expect(t.engines).toEqual(['briefing', 'courtroom', 'creative', 'reflection']);
    const { mission } = generateMission(endersGame, { chapters: [11], engines: t.engines, themeId: 'responsibility', outcomes: [], readingLevel: 'standard', thinkingLevel: 'developing', grouping: 'group', duration: 45, overrides: t.overrides });
    expect(mission.steps[1].title).toBe('The People v. Colonel Graff');
  });
  it('ships a complete Tribunal mission with a sound and flawed argument on each side', () => {
    expect(placeholdersIn(tribunal.steps)).toEqual([]);
    const court = tribunal.steps.find((s) => s.type === 'courtroom');
    if (court?.type !== 'courtroom') throw new Error('no courtroom');
    for (const side of ['prosecution', 'defence'] as const) {
      const args = court.opposing.filter((o) => o.side === side);
      expect(args.some((a) => a.flaw === 'sound')).toBe(true);
      expect(args.some((a) => a.flaw !== 'sound')).toBe(true);
    }
    const ids = new Set(endersGame.evidence.map((e) => e.id));
    court.evidenceIds.forEach((id) => expect(ids.has(id)).toBe(true));
  });
});

describe('store migration', () => {
  it('upgrades a version-1 save without losing teacher edits', async () => {
    const { endersGame: eg } = await import('../../src/data/novels/endersGame');
    const { pressurePoint } = await import('../../src/data/missions/pressurePoint');
    const edited = { ...pressurePoint, title: 'My renamed mission' };
    const v1 = { novels: { 'enders-game': { ...eg, vocab: eg.vocab.filter((v) => !['v-objection', 'v-speculation'].includes(v.id)) } }, missions: { [edited.id]: edited } };
    localStorage.setItem('novelverse:v1', JSON.stringify({ state: v1, version: 1 }));
    const { useApp } = await import('../../src/state/store');
    await useApp.persist.rehydrate();
    const s = useApp.getState();
    expect(s.missions['m-pressure-point'].title).toBe('My renamed mission');
    expect(s.missions['m-tribunal']).toBeDefined();
    expect(s.templates.length).toBeGreaterThan(0);
    expect(s.novels['enders-game'].vocab.some((v) => v.id === 'v-objection')).toBe(true);
  });
});
