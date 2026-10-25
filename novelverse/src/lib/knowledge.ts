import type { Novel, Evidence, StoryEvent, Character, VocabTerm } from '../data/types';

// Spoiler control. Students only ever receive knowledge from chapters the
// teacher has unlocked; everything that reaches a student screen or the
// mentor goes through these filters.

export function unlockedChapters(novel: Novel): number[] {
  return novel.chapters.filter((c) => c.unlocked).map((c) => c.number);
}

/** The furthest chapter a student may know about. */
export function readingFrontier(novel: Novel): number {
  const nums = unlockedChapters(novel);
  return nums.length ? Math.max(...nums) : 0;
}

export function visibleEvidence(novel: Novel): Evidence[] {
  const open = new Set(unlockedChapters(novel));
  return novel.evidence.filter((e) => open.has(e.chapter));
}

export function visibleEvents(novel: Novel): StoryEvent[] {
  const open = new Set(unlockedChapters(novel));
  return novel.events.filter((e) => open.has(e.chapter));
}

export function visibleCharacters(novel: Novel): Character[] {
  const frontier = readingFrontier(novel);
  return novel.characters.filter((c) => c.firstChapter <= frontier);
}

export function evidenceById(novel: Novel, id: string): Evidence | undefined {
  return novel.evidence.find((e) => e.id === id);
}

export function vocabById(novel: Novel, id: string): VocabTerm | undefined {
  return novel.vocab.find((v) => v.id === id);
}

export function characterName(novel: Novel, id: string): string {
  const c = novel.characters.find((x) => x.id === id);
  if (!c) return id;
  const quoted = c.name.match(/[“"]([^”"]+)[”"]/);
  if (quoted) return quoted[1];
  // Officers go by surname ("Graff"); everyone else by first name ("Petra").
  const titled = /^(Colonel|Major|Captain|General|Admiral|Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+/i.test(c.name);
  const parts = c.name.split(/\s+/);
  return titled ? parts[parts.length - 1] : parts[0];
}

/** Every item still waiting for the teacher to check it against the book. */
export function unverifiedCount(novel: Novel): number {
  const lists = [novel.chapters, novel.characters, novel.events, novel.evidence, novel.techniques, novel.relationships];
  return lists.reduce((n, list) => n + list.filter((x) => x.verification === 'needs-check').length, 0);
}

/** A mission is spoiler-safe when every chapter it covers is unlocked. */
export function lockedMissionChapters(novel: Novel, chapterNumbers: number[]): number[] {
  const open = new Set(unlockedChapters(novel));
  return chapterNumbers.filter((n) => !open.has(n));
}
