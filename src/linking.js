// Suggest (never auto-apply) curriculum links for a lesson, and carry a
// lesson forward to a revised curriculum version.

import { tokens } from './util.js';
import { statementsOf } from './curriculum/model.js';
import { lessonImpact } from './curriculum/diff.js';

function overlap(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.min(ta.size, tb.size);
}

export function lessonQueryText(lesson) {
  return [lesson.title, lesson.alignmentHint, ...(lesson.essentialConcepts || []).map((c) => c.text)].filter(Boolean).join(' ');
}

/** Rank outcomes in a version against a lesson. */
export function suggestOutcomes(version, lesson, { grade = 9, limit = 5 } = {}) {
  const q = lessonQueryText(lesson);
  return (version?.outcomes || [])
    .filter((o) => grade == null || o.grade === grade || o.grade == null)
    .map((o) => {
      const body = [o.organizingIdea, o.guidingQuestion, o.text, ...[...statementsOf(o)].map((s) => s.text)].join(' ');
      return { outcome: o, score: overlap(q, body) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Rank statements of an outcome against a piece of text (e.g. an essential concept). */
export function suggestStatements(outcome, text, limit = 3) {
  return [...statementsOf(outcome)]
    .map((s) => ({ statement: s, score: overlap(text, s.text) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Re-point a lesson at a new curriculum version using a diff idMap. The lesson
 * keeps a history entry so the teacher can see which version it came from.
 */
export function migrateLesson(lesson, diff, newVersion) {
  const impact = lessonImpact(lesson, diff);
  const map = (ids) => ids.map((id) => diff.idMap[id]).filter(Boolean);
  const out = {
    ...lesson,
    curriculumVersionId: newVersion.id,
    curriculumVersionLabel: newVersion.label,
    curriculumLinks: impact.remapped,
    essentialConcepts: (lesson.essentialConcepts || []).map((c) => ({ ...c, statementIds: map(c.statementIds || []) })),
    steps: (lesson.steps || []).map((s) => ({ ...s, statementIds: map(s.statementIds || []) })),
    criteria: (lesson.criteria || []).map((c) => ({ ...c, statementIds: map(c.statementIds || []) })),
    versionHistory: [
      ...(lesson.versionHistory || []),
      { from: lesson.curriculumVersionId, fromLabel: lesson.curriculumVersionLabel, to: newVersion.id, toLabel: newVersion.label, at: new Date().toISOString(), issues: impact.issues },
    ],
    updatedAt: new Date().toISOString(),
  };
  return { lesson: out, impact };
}
