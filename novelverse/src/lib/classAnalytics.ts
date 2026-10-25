import type { Mission, Novel, StepResponse, EvidenceBoardStep, DilemmaStep, CourtroomStep } from '../data/types';
import { analyzeReasoning, shortNames } from './reasoning';

// Class-level patterns for the teacher. These describe the thinking in the
// room so the teacher can plan the next lesson; they never rank students
// and are never shown to students.

export interface Pattern {
  id: string;
  title: string;
  description: string;
  nextStep: string;
  studentIds: string[];
  stepId: string;
}

export function missionResponses(all: Record<string, StepResponse>, missionId: string): StepResponse[] {
  return Object.values(all).filter((r) => r.missionId === missionId && r.studentId !== 'teacher-preview');
}

export function findPatterns(mission: Mission, novel: Novel, responses: StepResponse[]): Pattern[] {
  const names = shortNames(novel.characters.map((c) => c.name));
  const submitted = responses.filter((r) => r.status === 'submitted');
  const out: Pattern[] = [];
  const add = (p: Omit<Pattern, 'studentIds'>, ids: string[]) => ids.length && out.push({ ...p, studentIds: [...new Set(ids)] });

  for (const step of mission.steps) {
    const rs = submitted.filter((r) => r.stepId === step.id);
    if (step.type === 'dilemma') {
      add({ id: `${step.id}-noev`, stepId: step.id, title: 'Decisions without textual evidence',
        description: 'Chose a path but did not attach evidence or explain how the novel informed the choice.',
        nextStep: 'Model one justification aloud, linking a single card to a choice with “because… this shows…”.' },
        rs.filter((r) => !((r.data.evidenceIds as string[]) ?? []).length || !analyzeReasoning(String(r.data.reasoning ?? ''), names).explains).map((r) => r.studentId));
      add({ id: `${step.id}-abs`, stepId: step.id, title: 'Absolute language in reasoning',
        description: 'Used words like “always”, “never” or “everyone” where the novel is more complicated.',
        nextStep: 'Ask: “Is that true every time? Find one moment that complicates it.”' },
        rs.filter((r) => analyzeReasoning(String(r.data.reasoning ?? ''), names).absolutes.length > 0).map((r) => r.studentId));
    }
    if (step.type === 'evidence-board') {
      const s = step as EvidenceBoardStep;
      const interp = new Set(novel.evidence.filter((e) => e.kind === 'interpretation').map((e) => e.id));
      add({ id: `${step.id}-fi`, stepId: step.id, title: 'Treating interpretations as facts',
        description: 'Sorted an interpretation card as a plot fact.',
        nextStep: 'Sort two cards together as a class: “Does this happen, or is it someone’s reading of what happens?”' },
        rs.filter((r) => Object.entries((r.data.sorted as Record<string, string>) ?? {}).some(([id, k]) => interp.has(id) && k === 'fact')).map((r) => r.studentId));
      const weak = new Set(s.theories.filter((t) => !t.defensible).map((t) => t.id));
      add({ id: `${step.id}-weak`, stepId: step.id, title: 'Building on a theory the evidence strains',
        description: 'Argued a theory that most of the evidence challenges.',
        nextStep: 'Run a quick evidence showdown on that theory: which cards support it, and which challenge it?' },
        rs.filter((r) => weak.has(String(r.data.theoryId))).map((r) => r.studentId));
      add({ id: `${step.id}-nocounter`, stepId: step.id, title: 'No counter-evidence considered',
        description: 'Case reports that do not address evidence against the chosen theory.',
        nextStep: 'Teach a “Some readers might argue…, but…” move and have students add one to their report.' },
        rs.filter((r) => !String(r.data.counter ?? '').trim()).map((r) => r.studentId));
    }
    if (step.type === 'courtroom') {
      const c = step as CourtroomStep;
      add({ id: `${step.id}-exh`, stepId: step.id, title: 'Exhibits labelled as the wrong kind',
        description: 'Entered an interpretation as a fact (or the reverse) when building a case.',
        nextStep: 'Hold up two exhibits and ask: could a reader disagree that this happened? If yes, it is an interpretation.' },
        rs.filter((r) => ((r.data.exhibits as { evidenceId: string; label: string }[]) ?? []).some((x) => novel.evidence.find((e) => e.id === x.evidenceId)?.kind !== x.label)).map((r) => r.studentId));
      const objs = (r: StepResponse) => (r.data.objections as Record<string, { firstTry?: boolean; call?: string }>) ?? {};
      const flawed = c.opposing.filter((o) => o.flaw === 'speculation');
      add({ id: `${step.id}-spec`, stepId: step.id, title: 'Missed speculation presented as fact',
        description: 'Accepted or misread an argument that guesses at a character’s feelings.',
        nextStep: 'Model the question “Where does the text actually say that?” on one speculative claim.' },
        rs.filter((r) => flawed.some((o) => objs(r)[o.id]?.firstTry === false)).map((r) => r.studentId));
      const sound = c.opposing.filter((o) => o.flaw === 'sound');
      add({ id: `${step.id}-sound`, stepId: step.id, title: 'Objected to sound evidence',
        description: 'Tried to dismiss an accurate point instead of answering it.',
        nextStep: 'Teach the difference between attacking evidence and answering it: “Yes, that happened, but…”.' },
        rs.filter((r) => sound.some((o) => objs(r)[o.id]?.firstTry === false)).map((r) => r.studentId));
    }
    if (step.type === 'creative') {
      add({ id: `${step.id}-craft`, stepId: step.id, title: 'Craft notes that do not explain choices',
        description: 'The creative piece is there, but the craft note does not connect it to the novel.',
        nextStep: 'Share a strong craft note (with permission) and highlight its “because in Chapter…” move.' },
        rs.filter((r) => { const sg = analyzeReasoning(String(r.data.craftNote ?? ''), names); return !sg.explains || !sg.citesEvidence; }).map((r) => r.studentId));
    }
  }
  return out.sort((a, b) => b.studentIds.length - a.studentIds.length);
}

/** Anonymous tallies for the projector: how the class chose, without names. */
export function dilemmaTally(step: DilemmaStep, responses: StepResponse[]) {
  const rs = responses.filter((r) => r.stepId === step.id && r.data.choiceId);
  return step.choices.map((c) => ({ id: c.id, label: c.label, count: rs.filter((r) => r.data.choiceId === c.id).length }));
}

export function theoryTally(step: EvidenceBoardStep, responses: StepResponse[]) {
  const rs = responses.filter((r) => r.stepId === step.id && r.data.theoryId);
  return step.theories.map((t) => ({ id: t.id, label: t.label, count: rs.filter((r) => r.data.theoryId === t.id).length }));
}

export function evidenceUse(responses: StepResponse[], novel: Novel) {
  const counts = new Map<string, number>();
  for (const r of responses) {
    const ids = [
      ...((r.data.evidenceIds as string[]) ?? []),
      ...Object.keys((r.data.pins as Record<string, unknown>) ?? {}),
    ];
    new Set(ids).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  }
  return novel.evidence
    .map((e) => ({ evidence: e, count: counts.get(e.id) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * A draft comment for the teacher to edit. Built from what the student did,
 * phrased as a next step. Never sent without the teacher finalizing it.
 */
export function suggestFeedback(text: string, novel: Novel, evidenceCount = 0): string {
  const s = analyzeReasoning(text, shortNames(novel.characters.map((c) => c.name)));
  const parts: string[] = [];
  if (s.citesEvidence || evidenceCount) parts.push('You grounded your thinking in the novel.');
  if (s.explains) parts.push('You explained how your evidence connects to your idea.');
  if (s.counters) parts.push('You considered another point of view, which strengthens your argument.');
  const next: string[] = [];
  if (!s.citesEvidence && !evidenceCount) next.push('point to a specific moment in the chapters that supports your idea');
  if (!s.explains) next.push('explain how your evidence proves your point ("this shows…")');
  if (s.absolutes.length) next.push(`reconsider "${s.absolutes[0]}": is that true every time in the novel?`);
  if (!s.counters) next.push('address what a reader who disagrees might say');
  if (s.words < 20) next.push('develop your explanation further');
  const opener = parts.length ? parts.join(' ') : 'Thanks for sharing your thinking.';
  return next.length ? `${opener} Next step: ${next.slice(0, 2).join(', and ')}.` : `${opener} Next step: choose your single strongest piece of evidence and explain why it is stronger than the others.`;
}
