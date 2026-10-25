import type { EvidenceBoardStep, Evidence, ThinkingLevel } from '../data/types';
import { analyzeReasoning } from './reasoning';

// Feedback for the Literary Detective board. It measures the quality of the
// case (alignment of evidence, handling of counter-evidence, fact versus
// interpretation, and reasoning), not whether the student picked a "right"
// theory. Several theories are defensible.

export interface BoardState {
  sorted: Record<string, 'fact' | 'interpretation'>;
  pins: Record<string, { theoryId: string; stance: 'supports' | 'challenges' }>;
  links: { a: string; b: string; label: string }[];
  ruledOut: Record<string, string>;
  positions: Record<string, { x: number; y: number }>;
  theoryId: string | null;
  claim: string;
  reasoning: string;
  counter: string;
}

export const emptyBoard = (): BoardState => ({
  sorted: {},
  pins: {},
  links: [],
  ruledOut: {},
  positions: {},
  theoryId: null,
  claim: '',
  reasoning: '',
  counter: '',
});

export interface StrengthPart {
  id: 'support' | 'counter' | 'sorting' | 'reasoning' | 'ruling';
  label: string;
  value: number;
  note: string;
}

export interface CaseStrength {
  parts: StrengthPart[];
  overall: number;
  band: 'Getting started' | 'Developing case' | 'Solid case' | 'Compelling case';
  /** Pins that the teacher's evidence map does not expect. Asked about, not marked wrong. */
  unusual: string[];
  challenge?: string;
}

const NEEDED: Record<ThinkingLevel, number> = { foundational: 2, developing: 3, sophisticated: 3 };

export function caseStrength(step: EvidenceBoardStep, evidence: Evidence[], b: BoardState, level: ThinkingLevel, names: string[] = []): CaseStrength {
  const theory = step.theories.find((t) => t.id === b.theoryId);
  const linkFor = (id: string) => step.cards.find((c) => c.evidenceId === id);
  const unusual: string[] = [];

  let aligned = 0;
  let countered = 0;
  for (const [cardId, pin] of Object.entries(b.pins)) {
    const link = linkFor(cardId);
    if (!link || !theory || pin.theoryId !== theory.id) continue;
    const expected = pin.stance === 'supports' ? link.supports : link.challenges;
    if (expected.includes(theory.id)) {
      if (pin.stance === 'supports') aligned += 1;
      else countered += 1;
    } else {
      unusual.push(cardId);
      if (pin.stance === 'supports') aligned += 0.5;
      else countered += 0.5;
    }
  }

  const need = NEEDED[level];
  const support = Math.min(aligned / need, 1);

  const counterSig = analyzeReasoning(b.counter, names);
  const counterValue = Math.min(1, (countered > 0 ? 0.5 : 0) + (b.counter.trim().split(/\s+/).length >= 8 || counterSig.counters ? 0.5 : 0));

  const sortedIds = Object.keys(b.sorted);
  const correct = sortedIds.filter((id) => evidence.find((e) => e.id === id)?.kind === b.sorted[id]).length;
  const sorting = step.cards.length ? correct / step.cards.length : 0;

  const r = analyzeReasoning(`${b.claim} ${b.reasoning}`, names);
  const reasoning =
    (r.explains ? 0.35 : 0) + (r.citesEvidence ? 0.25 : 0) + (r.words >= 30 ? 0.25 : r.words >= 15 ? 0.12 : 0) + (r.absolutes.length ? 0 : 0.15);

  const weak = step.theories.filter((t) => !t.defensible);
  const ruledWell = weak.filter((t) => (b.ruledOut[t.id] ?? '').trim().split(/\s+/).length >= 5).length;
  const ruling = weak.length ? ruledWell / weak.length : 1;

  const parts: StrengthPart[] = [
    { id: 'support', label: 'Supporting evidence', value: support,
      note: theory ? `${fmt(aligned)} of ${need} supporting cards pinned to your theory.` : 'Choose the theory you will argue for.' },
    { id: 'counter', label: 'Counter-evidence', value: counterValue,
      note: countered ? 'You faced evidence that challenges your theory.' : 'Strong cases answer the evidence against them. Pin a card that challenges your theory.' },
    { id: 'sorting', label: 'Fact vs interpretation', value: sorting,
      note: `${correct} of ${step.cards.length} cards sorted. ${sortedIds.length > correct ? 'Look again at one or more: is it something that happens, or a reading of it?' : ''}`.trim() },
    { id: 'reasoning', label: 'Reasoning', value: Math.min(reasoning, 1),
      note: r.explains ? 'Your report explains how evidence connects to your claim.' : 'Explain how your evidence proves your claim.' },
    { id: 'ruling', label: 'Ruling out', value: ruling,
      note: ruling >= 1 ? 'You gave reasons for ruling out the weakest theory.' : 'Is there a theory the evidence does not support? Rule it out with a reason.' },
  ];

  const weights = { support: 0.3, counter: level === 'foundational' ? 0.1 : 0.2, sorting: 0.15, reasoning: 0.25, ruling: 0.1 };
  const totalW = Object.values(weights).reduce((a, x) => a + x, 0);
  let overall = parts.reduce((acc, p) => acc + p.value * weights[p.id], 0) / totalW;
  if (theory && !theory.defensible) overall = Math.min(overall, 0.45);
  if (!theory) overall = Math.min(overall, 0.25);

  const band: CaseStrength['band'] =
    overall >= 0.8 ? 'Compelling case' : overall >= 0.6 ? 'Solid case' : overall >= 0.3 ? 'Developing case' : 'Getting started';

  return { parts, overall, band, unusual, challenge: theory ? theory.challenge : undefined };
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
