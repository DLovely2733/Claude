import { describe, it, expect } from 'vitest';
import { endersGame } from '../../src/data/novels/endersGame';
import { jekyllHyde } from '../../src/data/novels/jekyllHyde';
import { pressurePoint } from '../../src/data/missions/pressurePoint';
import { tribunal } from '../../src/data/missions/tribunal';
import { uttersonFiles } from '../../src/data/missions/uttersonFiles';
import { placeholdersIn } from '../../src/lib/generator';
import { lockedMissionChapters, visibleEvidence } from '../../src/lib/knowledge';
import type { Mission, Novel } from '../../src/data/types';

const pairs: [Mission, Novel][] = [[pressurePoint, endersGame], [tribunal, endersGame], [uttersonFiles, jekyllHyde]];

describe.each(pairs)('demo mission %#', (mission, novel) => {
  it('references only real, unlocked knowledge', () => {
    expect(mission.novelId).toBe(novel.id);
    expect(lockedMissionChapters(novel, mission.chapterNumbers)).toEqual([]);
    const ev = new Set(visibleEvidence(novel).map((e) => e.id));
    const events = new Set(novel.events.map((e) => e.id));
    const chars = new Set(novel.characters.map((c) => c.id));
    for (const s of mission.steps) {
      if (s.type === 'dilemma') s.evidenceIds.forEach((id) => expect(ev.has(id), id).toBe(true));
      if (s.type === 'evidence-board') s.cards.forEach((c) => expect(ev.has(c.evidenceId), c.evidenceId).toBe(true));
      if (s.type === 'courtroom') { s.evidenceIds.forEach((id) => expect(ev.has(id), id).toBe(true)); expect(chars.has(s.defendantId)).toBe(true); }
      if (s.type === 'reasoning-lock') s.locks.forEach((l) => l.kind === 'sequence' && l.eventIds.forEach((id) => expect(events.has(id), id).toBe(true)));
      if (s.type === 'briefing') s.vocab.forEach((id) => expect(novel.vocab.some((v) => v.id === id), id).toBe(true));
      if (s.type === 'reflection') expect(novel.themes.some((t) => t.id === s.themeId)).toBe(true);
    }
  });
  it('is complete and spoiler-safe', () => {
    expect(placeholdersIn(mission.steps)).toEqual([]);
    expect(JSON.stringify(mission)).not.toMatch(/\bp\.\s?\d+|page \d+/i);
    expect(new Set(mission.steps.map((s) => s.id)).size).toBe(mission.steps.length);
  });
});

describe('Jekyll and Hyde demo', () => {
  it('locks the revelation chapters and writes no quotations', () => {
    expect(jekyllHyde.chapters.filter((c) => !c.unlocked).map((c) => c.number)).toEqual([7, 8, 9, 10]);
    expect(jekyllHyde.evidence.every((e) => !e.quote && e.chapter <= 6)).toBe(true);
    expect(jekyllHyde.skin).toBe('noir');
  });
  it('orders its timeline by chapter', () => {
    const lock = uttersonFiles.steps.find((s) => s.type === 'reasoning-lock');
    if (lock?.type !== 'reasoning-lock' || lock.locks[0].kind !== 'sequence') throw new Error('no sequence');
    const chs = lock.locks[0].eventIds.map((id) => jekyllHyde.events.find((e) => e.id === id)!.chapter);
    expect(chs).toEqual([...chs].sort((a, b) => a - b));
  });
});
