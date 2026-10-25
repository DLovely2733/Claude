import { describe, it, expect } from 'vitest';
// @ts-expect-error: plain JS server module
import { filterMentorReply } from '../../server/mentor.mjs';

describe('AI mentor reply filter', () => {
  it('keeps short coaching lines', () => {
    const out = filterMentorReply('NOTICE: You named a value.\nQUESTION: What happens in Chapter 11 that shows it?', [11, 12]);
    expect(out).toEqual([{ tone: 'notice', text: 'You named a value.' }, { tone: 'question', text: 'What happens in Chapter 11 that shows it?' }]);
  });
  it('drops quotations, page numbers, answers and locked chapters', () => {
    const raw = [
      'QUESTION: The text says "the enemy’s gate is down and nobody can tell him otherwise ever" so what?',
      'QUESTION: Look at page 212 again?',
      'NOTICE: The answer is that Graff cares.',
      'QUESTION: What happens in Chapter 15?',
      'Here is some chatter without a tag.',
    ].join('\n');
    expect(filterMentorReply(raw, [11, 12, 13])).toEqual([]);
  });
  it('requires at least one question or guard', () => {
    expect(filterMentorReply('NOTICE: Nice work.', [1])).toEqual([]);
    expect(filterMentorReply('GUARD: Chapter 15 is not unlocked yet.', [1])[0].tone).toBe('guard');
  });
});
