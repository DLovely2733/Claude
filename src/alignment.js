// Curriculum alignment engine: verifies that a lesson, and every activity and
// assessment criterion inside it, traces back to teacher-verified statements
// in a specific curriculum version.

import { findOutcome, findStatement, STATEMENT_TYPES } from './curriculum/model.js';

export const LESSON_STATUS = {
  verified: { label: 'Verified curriculum connection', tone: 'ok' },
  partial: { label: 'Curriculum connection needs review', tone: 'warn' },
  unverified: { label: 'No verified curriculum connection', tone: 'error' },
};

/** Statement ids an activity is linked to, directly or through essential concepts. */
export function activityStatementIds(lesson, activity) {
  const ids = new Set(activity.statementIds || []);
  for (const cid of activity.conceptIds || []) {
    const c = (lesson.essentialConcepts || []).find((x) => x.id === cid);
    for (const id of c?.statementIds || []) ids.add(id);
  }
  return [...ids];
}

/**
 * @param {object} lesson
 * @param {object} ctx {versions: CurriculumVersion[], activeVersionId: string, profile?: object}
 */
export function checkAlignment(lesson, { versions = [], activeVersionId = null, profile = null } = {}) {
  const warnings = [];
  const add = (level, code, message, ref) => warnings.push({ level, code, message, ref });
  const version = versions.find((v) => v.id === lesson.curriculumVersionId) || null;
  const links = lesson.curriculumLinks || { outcomeIds: [], statementIds: [] };
  const trace = [];

  if (!versions.length) {
    add('error', 'NO_CURRICULUM', 'No official curriculum has been uploaded. Upload the June 2026 draft Grade 7–9 Social Studies curriculum (PDF or authorized copy) to verify this lesson.');
  } else if (!lesson.curriculumVersionId) {
    add('error', 'NO_VERSION', 'This lesson is not linked to a curriculum version.');
  } else if (!version) {
    add('error', 'VERSION_MISSING', `The curriculum version this lesson was created from (${lesson.curriculumVersionLabel || lesson.curriculumVersionId}) is no longer stored.`);
  } else if (activeVersionId && version.id !== activeVersionId) {
    const active = versions.find((v) => v.id === activeVersionId);
    add('warn', 'STALE_VERSION', `Created from “${version.label}”. The active curriculum is “${active?.label || activeVersionId}”. Review changes in Curriculum → Compare versions.`);
  }

  if (!links.outcomeIds.length) {
    add('error', 'NO_OUTCOME', 'No official learning outcome is linked. This lesson does not have a verified curriculum connection.');
  }

  const outcomes = [];
  if (version) {
    for (const oid of links.outcomeIds) {
      const o = findOutcome(version, oid);
      if (!o) add('error', 'OUTCOME_NOT_FOUND', `Linked outcome ${oid} does not exist in “${version.label}”.`, oid);
      else {
        outcomes.push(o);
        if (!o.verified) add('warn', 'UNVERIFIED_OUTCOME', `Outcome ${oid} has not been checked against the source document by the teacher.`, oid);
        if (o.grade != null && o.grade !== 9) add('warn', 'NOT_GRADE_9', `Outcome ${oid} is a Grade ${o.grade} outcome.`, oid);
      }
    }
    const typesPresent = new Set();
    for (const sid of links.statementIds) {
      const found = findStatement(version, sid);
      if (!found) {
        add('error', 'STATEMENT_NOT_FOUND', `Linked statement ${sid} does not exist in “${version.label}”.`, sid);
        continue;
      }
      typesPresent.add(found.type);
      if (!links.outcomeIds.includes(found.outcome.id)) add('warn', 'STATEMENT_OUTSIDE_OUTCOME', `Statement ${sid} belongs to outcome ${found.outcome.id}, which is not linked to this lesson.`, sid);
      if (!found.statement.verified && !found.outcome.verified) add('warn', 'UNVERIFIED_STATEMENT', `Statement ${sid} has not been verified against the source document.`, sid);
    }
    if (outcomes.length) {
      for (const [key, t] of Object.entries(STATEMENT_TYPES)) {
        if (!typesPresent.has(key)) add('warn', `MISSING_${t.code}`, `No ${t.label} statement is selected for this lesson.`);
      }
    }
  }

  const linkedSet = new Set(links.statementIds);
  const concepts = lesson.essentialConcepts || [];
  if (!concepts.length) add('warn', 'NO_CONCEPTS', 'No essential concepts are defined.');
  for (const c of concepts) {
    if (!(c.statementIds || []).length) add('warn', 'UNTRACED_CONCEPT', `Essential concept “${c.text}” is not linked to a curriculum statement.`, c.id);
    for (const sid of c.statementIds || []) if (!linkedSet.has(sid)) add('warn', 'CONCEPT_LINK_NOT_IN_LESSON', `Essential concept “${c.text}” cites ${sid}, which is not selected for this lesson.`, c.id);
  }

  for (const step of lesson.steps || []) {
    const ids = activityStatementIds(lesson, step);
    const rows = ids.map((id) => {
      const f = version ? findStatement(version, id) : null;
      return { id, type: f?.type || null, text: f?.statement.text || null, outcomeId: f?.outcome.id || null };
    });
    trace.push({ stepId: step.id, title: step.title, kind: step.kind, statements: rows });
    if (!ids.length) add('warn', 'UNTRACED_ACTIVITY', `Activity “${step.title}” has no traceable link to the official curriculum.`, step.id);
  }

  if (!(lesson.individualGoals || []).length) add('info', 'NO_GOALS', 'No individualized learning goals are attached. Goals are separate from curriculum outcomes and are set in Student settings.');
  const criteria = lesson.criteria || [];
  if (!criteria.length) add('warn', 'NO_CRITERIA', 'No teacher assessment criteria are defined.');
  for (const cr of criteria) {
    if (cr.kind === 'adapted-outcome' && !(cr.statementIds || []).length) add('warn', 'UNTRACED_CRITERION', `Assessment criterion “${cr.text}” is not linked to a curriculum statement.`, cr.id);
    if (cr.kind === 'individual-goal' && !(cr.goalIds || []).length) add('warn', 'UNLINKED_GOAL_CRITERION', `Criterion “${cr.text}” is marked as an individual-goal criterion but names no goal.`, cr.id);
  }
  if (profile && !(lesson.demonstrationModes || []).some((m) => (profile.responseModes || []).includes(m))) {
    add('warn', 'NO_MATCHING_RESPONSE_MODE', 'None of the lesson’s ways to demonstrate understanding are enabled in the student’s response settings.');
  }

  const hasError = warnings.some((w) => w.level === 'error');
  const blocksVerification = warnings.some((w) => ['UNVERIFIED_OUTCOME', 'UNVERIFIED_STATEMENT', 'STALE_VERSION', 'NOT_GRADE_9'].includes(w.code));
  const status = hasError ? 'unverified' : blocksVerification || warnings.some((w) => w.level === 'warn') ? 'partial' : 'verified';
  return { status, warnings, trace, outcomes, version };
}
