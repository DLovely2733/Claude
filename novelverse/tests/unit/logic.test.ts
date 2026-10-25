import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeReasoning, shortNames } from '../../src/lib/reasoning';
import { mentorRespond } from '../../src/lib/mentor';
import { caseStrength, emptyBoard } from '../../src/lib/caseStrength';
import { generateMission, placeholdersIn, rangeLabel } from '../../src/lib/generator';
import { visibleEvidence, visibleCharacters, readingFrontier, characterName, lockedMissionChapters } from '../../src/lib/knowledge';
import { findPatterns, suggestFeedback } from '../../src/lib/classAnalytics';
import { parseOutcomes, ALBERTA_ELA_HEADINGS } from '../../src/data/curriculum';
import { parseChapterNotes } from '../../src/teacher/NovelLibrary';
import { endersGame } from '../../src/data/novels/endersGame';
import { pressurePoint } from '../../src/data/missions/pressurePoint';
import { seedResponses } from '../../src/data/synthetic';
import type { EvidenceBoardStep, Novel } from '../../src/data/types';

const names = shortNames(endersGame.characters.map((c) => c.name));

describe('reasoning signals', () => {
  it('detects evidence, explanation, counters and absolutes', () => {
    const s = analyzeReasoning('In Chapter 11 the teachers always change the rules, which shows Graff is testing Ender. However, he may care.', names);
    expect(s.chapters).toEqual([11]);
    expect(s.citesEvidence).toBe(true);
    expect(s.explains).toBe(true);
    expect(s.counters).toBe(true);
    expect(s.absolutes).toContain('always');
    expect(s.characters).toEqual(expect.arrayContaining(['Graff', 'Ender']));
  });
  it('derives the names students actually type', () => {
    expect(names).toEqual(expect.arrayContaining(['Ender', 'Graff', 'Bean', 'Bonzo', 'Valentine']));
  });
});

describe('literary mentor', () => {
  const ctx = { task: 'justify' as const, thinkingLevel: 'developing' as const, unlockedChapters: [1, 2, 11, 12, 13], depth: 0 };
  it('asks for evidence when a claim has none, and never writes an answer', () => {
    const text = 'Graff is bad.';
    const msgs = mentorRespond(text, analyzeReasoning(text, names), ctx);
    expect(msgs.some((m) => m.tone === 'question' && /What happened in the chapter/.test(m.text))).toBe(true);
    expect(msgs.every((m) => !m.text.includes('Graff cares about Ender'))).toBe(true);
  });
  it('goes deeper on repeated asks: question, then frame, then a model from a different story', () => {
    const text = 'I chose it because it was good.';
    const deep = mentorRespond(text, analyzeReasoning(text, names), { ...ctx, depth: 2 });
    expect(deep.map((m) => m.tone)).toEqual(expect.arrayContaining(['question', 'frame', 'model']));
    expect(deep.find((m) => m.tone === 'model')!.text).toMatch(/different story/);
  });
  it('guards spoilers for locked chapters', () => {
    const text = 'In Chapter 15 Ender finds out the truth.';
    const msgs = mentorRespond(text, analyzeReasoning(text, names), ctx);
    expect(msgs[0].tone).toBe('guard');
  });
});

describe('case strength', () => {
  const step = pressurePoint.steps.find((s) => s.type === 'evidence-board') as EvidenceBoardStep;
  const evidence = endersGame.evidence;
  it('rewards a well-built case for any defensible theory', () => {
    for (const theoryId of ['th-tool', 'th-cost']) {
      const supporting = step.cards.filter((c) => c.supports.includes(theoryId)).slice(0, 3);
      const challenging = step.cards.find((c) => c.challenges.includes(theoryId));
      const b = {
        ...emptyBoard(), theoryId,
        sorted: Object.fromEntries(evidence.map((e) => [e.id, e.kind])),
        pins: {
          ...Object.fromEntries(supporting.map((c) => [c.evidenceId, { theoryId, stance: 'supports' as const }])),
          ...(challenging ? { [challenging.evidenceId]: { theoryId, stance: 'challenges' as const } } : {}),
        },
        ruledOut: { 'th-orders': 'Graff designs the plans himself, he is not just following orders.' },
        claim: 'My claim about Graff.',
        reasoning: 'When the teachers change the rules in Chapter 11, it shows Graff pushes Ender on purpose, because he believes the war depends on it and he designs each test.',
        counter: 'Some readers might argue otherwise, but the evidence of his choices outweighs it.',
      };
      expect(caseStrength(step, evidence, b, 'developing').overall).toBeGreaterThan(0.8);
    }
  });
  it('caps a case built on a theory the evidence strains, without calling it wrong', () => {
    const b = { ...emptyBoard(), theoryId: 'th-orders', claim: 'He follows orders.', reasoning: 'The military tells him what to do because he is a soldier in chapter 11.' };
    const r = caseStrength(step, evidence, b, 'developing');
    expect(r.overall).toBeLessThanOrEqual(0.45);
    expect(r.challenge).toMatch(/Does the evidence show/);
  });
});

describe('spoiler control', () => {
  it('only exposes unlocked knowledge', () => {
    expect(readingFrontier(endersGame)).toBe(13);
    expect(visibleCharacters(endersGame).some((c) => c.id === 'mazer')).toBe(false);
    const locked: Novel = { ...endersGame, chapters: endersGame.chapters.map((c) => ({ ...c, unlocked: c.number <= 12 })) };
    expect(visibleEvidence(locked).some((e) => e.chapter === 13)).toBe(false);
    expect(lockedMissionChapters(locked, [11, 12, 13])).toEqual([13]);
  });
  it('uses the names students know', () => {
    expect(characterName(endersGame, 'graff')).toBe('Graff');
    expect(characterName(endersGame, 'ender')).toBe('Ender');
    expect(characterName(endersGame, 'petra')).toBe('Petra');
  });
});

describe('demo content integrity', () => {
  it('contains no quotations or page numbers written by NovelVerse', () => {
    expect(endersGame.evidence.every((e) => !e.quote)).toBe(true);
    expect(JSON.stringify(endersGame)).not.toMatch(/\bp\.\s?\d+|page \d+/i);
  });
  it('marks every drafted fact for teacher verification', () => {
    for (const list of [endersGame.chapters, endersGame.characters, endersGame.events, endersGame.evidence]) {
      expect(list.every((x) => x.verification === 'needs-check')).toBe(true);
    }
  });
  it('references only real ids', () => {
    const ev = new Set(endersGame.evidence.map((e) => e.id));
    const events = new Set(endersGame.events.map((e) => e.id));
    for (const s of pressurePoint.steps) {
      if (s.type === 'dilemma') s.evidenceIds.forEach((id) => expect(ev.has(id)).toBe(true));
      if (s.type === 'evidence-board') s.cards.forEach((c) => expect(ev.has(c.evidenceId)).toBe(true));
      if (s.type === 'reasoning-lock') s.locks.forEach((l) => l.kind === 'sequence' && l.eventIds.forEach((id) => expect(events.has(id)).toBe(true)));
    }
  });
  it('uses only outcome headings from the curriculum profile', () => {
    const ids = new Set(ALBERTA_ELA_HEADINGS.outcomes.map((o) => o.id));
    pressurePoint.steps.flatMap((s) => s.outcomes).forEach((id) => expect(ids.has(id)).toBe(true));
    expect(ALBERTA_ELA_HEADINGS.outcomes.every((o) => o.status === 'unverified')).toBe(true);
  });
  it('has a placeholder-free demo mission', () => {
    expect(placeholdersIn(pressurePoint.steps)).toEqual([]);
  });
});

describe('mission generator', () => {
  const base = { chapters: [11, 12, 13], themeId: 'leadership', outcomes: ['ab-ela-k9-headings-2.2'], readingLevel: 'standard' as const, thinkingLevel: 'developing' as const, grouping: 'independent' as const, duration: 80 as const };
  it('drafts every engine from the knowledge base and flags what it cannot write', () => {
    const { mission, gaps } = generateMission(endersGame, { ...base, engines: ['briefing', 'dilemma', 'evidence-board', 'reasoning-lock', 'connections', 'reflection'] });
    expect(mission.status).toBe('draft');
    expect(mission.steps.map((s) => s.type)).toEqual(['briefing', 'dilemma', 'evidence-board', 'reasoning-lock', 'connections', 'reflection']);
    expect(placeholdersIn(mission.steps).length).toBeGreaterThan(0);
    expect(gaps.some((g) => /Dilemma/.test(g))).toBe(true);
  });
  it('works for a brand-new novel with almost no knowledge, without inventing content', () => {
    const blank: Novel = {
      id: 'n', title: 'New Novel', author: 'Someone', skin: 'noir', tagline: '', setting: '', contentNotes: [],
      chapters: [{ id: 'c1', number: 1, title: 'One', summary: 'Teacher summary.', unlocked: true, verification: 'teacher-added' }],
      characters: [], events: [], evidence: [], vocab: [], techniques: [], relationships: [], themes: [], createdBy: 'teacher',
    };
    const { mission, gaps } = generateMission(blank, { ...base, chapters: [1], themeId: '', engines: ['briefing', 'dilemma', 'evidence-board', 'reasoning-lock'] });
    expect(mission.steps).toHaveLength(4);
    expect(gaps.length).toBeGreaterThan(3);
    const ev = mission.steps.find((s) => s.type === 'evidence-board') as EvidenceBoardStep;
    expect(ev.cards).toEqual([]);
  });
  it('labels chapter ranges', () => {
    expect(rangeLabel([13, 11, 12])).toBe('Chapters 11–13');
    expect(rangeLabel([3, 7])).toBe('Chapters 3, 7');
  });
});

describe('teacher analytics', () => {
  it('finds thinking patterns in the synthetic class without ranking', () => {
    const rs = Object.values(seedResponses());
    const patterns = findPatterns(pressurePoint, endersGame, rs);
    expect(patterns.find((p) => /theory the evidence strains/.test(p.title))?.studentIds).toEqual(['cadet-lyra']);
    expect(patterns.find((p) => /interpretations as facts/.test(p.title))?.studentIds).toContain('cadet-lyra');
  });
  it('drafts feedback as a next step', () => {
    expect(suggestFeedback('Winning is all that matters because they always win.', endersGame)).toMatch(/Next step/);
  });
});

describe('importers', () => {
  it('parses pasted outcomes into groups', () => {
    const o = parseOutcomes('Reading\n2.2 | Respond to texts\nWriting\n4.1 - Enhance and improve', 'p');
    expect(o.map((x) => [x.code, x.group])).toEqual([['2.2', 'Reading'], ['4.1', 'Writing']]);
  });
  it('parses chapter notes in either format', () => {
    expect(parseChapterNotes('1 | Arrival | They arrive.\nChapter 2: The Letter - A letter comes.')).toEqual([
      { number: 1, title: 'Arrival', summary: 'They arrive.' },
      { number: 2, title: 'The Letter', summary: 'A letter comes.' },
    ]);
  });
});

describe('store', () => {
  beforeEach(() => localStorage.clear());
  it('keeps revisions when a submitted response changes', async () => {
    const { useApp } = await import('../../src/state/store');
    const s = useApp.getState();
    s.resetDemo();
    s.saveResponse('m-pressure-point', 's-dilemma', { reasoning: 'first' }, { submit: true });
    s.saveResponse('m-pressure-point', 's-dilemma', { reasoning: 'second' }, { submit: true, revision: 'Revised' });
    const r = useApp.getState().responses['cadet-demo|m-pressure-point|s-dilemma'];
    expect(r.data.reasoning).toBe('second');
    expect(r.revisions).toHaveLength(1);
    expect((r.revisions[0].data as { reasoning: string }).reasoning).toBe('first');
  });
});
