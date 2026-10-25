// Reads a student's written reasoning for signals of analytical thinking.
// These signals drive coaching questions and teacher-facing notes. They are
// never turned into a grade: the teacher assesses, NovelVerse only notices.

export interface ReasoningSignals {
  words: number;
  /** Mentions a chapter, a scene or a linked evidence card. */
  citesEvidence: boolean;
  /** Connects evidence to a claim: because, shows, suggests… */
  explains: boolean;
  /** Uses careful, qualified language: might, seems, suggests… */
  qualifies: boolean;
  /** Absolute words that the text probably complicates. */
  absolutes: string[];
  /** Acknowledges another reading or a complication. */
  counters: boolean;
  /** Character names mentioned. */
  characters: string[];
  /** Chapter numbers mentioned. */
  chapters: number[];
}

const EXPLAIN = /\b(because|shows?|showing|suggests?|reveals?|which means|this means|so that|therefore|proves?|demonstrates?|implies|indicates?|that is why|this is why|explains?)\b/i;
const QUALIFY = /\b(might|may|perhaps|seems?|probably|possibly|could|likely|appears?|suggests?|i think|i believe)\b/i;
const COUNTER = /\b(however|although|though|on the other hand|but|even though|some (readers|people) (might|could|would)|could argue|another reader|it could also|at the same time|unless)\b/i;
const ABSOLUTES = ['always', 'never', 'everyone', 'nobody', 'no one', 'completely', 'totally', 'everything', 'nothing', 'definitely', '100%'];
const EVIDENCE_HINT = /\b(chapter|when|after|before|scene|in the (book|novel|text)|the text|the author|card)\b/i;

export function analyzeReasoning(text: string, characterNames: string[] = []): ReasoningSignals {
  const t = text.trim();
  const words = t ? t.split(/\s+/).length : 0;
  const lower = ` ${t.toLowerCase()} `;
  const chapters = [...t.matchAll(/\bch(?:apter|\.)?\s*(\d{1,3})\b/gi)].map((m) => Number(m[1]));
  const characters = characterNames.filter((n) => new RegExp(`\\b${escapeRe(n)}\\b`, 'i').test(t));
  return {
    words,
    citesEvidence: chapters.length > 0 || EVIDENCE_HINT.test(t),
    explains: EXPLAIN.test(t),
    qualifies: QUALIFY.test(t),
    absolutes: ABSOLUTES.filter((a) => lower.includes(` ${a} `) || lower.includes(` ${a}.`) || lower.includes(` ${a},`)),
    counters: COUNTER.test(t),
    characters,
    chapters,
  };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Short names that students actually type ("Ender", "Graff", "Bean"). */
export function shortNames(fullNames: string[]): string[] {
  const out = new Set<string>();
  for (const n of fullNames) {
    const quoted = n.match(/[“"]([^”"]+)[”"]/);
    if (quoted) out.add(quoted[1]);
    const parts = n.replace(/[“”"]/g, '').split(/\s+/).filter((p) => !/^(colonel|major|the)$/i.test(p));
    if (parts.length) out.add(parts[parts.length - 1]);
    if (parts.length && !quoted) out.add(parts[0]);
  }
  return [...out].filter((n) => n.length > 2);
}
