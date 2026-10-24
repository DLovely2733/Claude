// Priority 5: assessment and learning evidence.

import { h, field, select, textarea, badge, toast } from '../ui.js';
import { getState, update, getLesson } from '../store.js';
import { go, rerender } from '../router.js';
import { PROMPT_LEVELS, withDefaults } from '../profile.js';
import { uid } from '../util.js';
import { alignmentFor, alignmentAlert, pageHeader, empty } from './common.js';

export const RATINGS = [
  { id: 'not-observed', label: 'Not yet observed' },
  { id: 'emerging', label: 'Emerging' },
  { id: 'developing', label: 'Developing' },
  { id: 'with-support', label: 'Demonstrated with support' },
  { id: 'independent', label: 'Demonstrated independently' },
];

// The teacher's separate professional judgement about the Grade 9 outcome as
// written. It is never derived automatically from adapted-task results.
export const OUTCOME_JUDGEMENTS = [
  { id: 'not-assessed', label: 'Not assessed against the outcome as written' },
  { id: 'adapted-only', label: 'Working on an adapted pathway (outcome not assessed as written)' },
  { id: 'partial', label: 'Some aspects of the outcome as written demonstrated' },
  { id: 'met', label: 'Outcome as written demonstrated' },
];

export const ratingLabel = (id) => RATINGS.find((r) => r.id === id)?.label || '—';
export const promptLabel = (id) => PROMPT_LEVELS.find((r) => r.id === id)?.label || '—';

export function latestRating(lessonId, criterionId) {
  return getState().ratings.filter((r) => r.lessonId === lessonId && r.criterionId === criterionId).sort((a, b) => b.at.localeCompare(a.at))[0] || null;
}

export function renderEvidence(lessonId) {
  const s = getState();
  if (!s.lessons.length) return empty('No lessons yet.');
  const lesson = getLesson(lessonId) || null;
  return h(
    'section',
    {},
    pageHeader('Assessment & learning evidence', 'Responses are captured automatically in the student view. Add your ratings and observations here.'),
    field('Lesson', select([{ id: '', label: 'Choose a lesson…' }, ...s.lessons.map((l) => ({ id: l.id, label: `${l.title} (${s.evidence.filter((e) => e.lessonId === l.id).length} records)` }))], lesson?.id || '', (id) => go(`evidence/${id}`))),
    lesson ? lessonEvidence(lesson) : overview()
  );
}

function overview() {
  const s = getState();
  const rows = s.lessons.map((l) => {
    const ev = s.evidence.filter((e) => e.lessonId === l.id);
    const rated = (l.criteria || []).filter((c) => latestRating(l.id, c.id)).length;
    return { l, ev, rated };
  });
  return h('table', { class: 'table' },
    h('thead', {}, h('tr', {}, ['Lesson', 'Evidence records', 'Last activity', 'Criteria rated', ''].map((t) => h('th', {}, t)))),
    h('tbody', {}, rows.map(({ l, ev, rated }) => h('tr', {},
      h('td', {}, l.title),
      h('td', {}, String(ev.length)),
      h('td', {}, ev.length ? ev[ev.length - 1].at.slice(0, 16).replace('T', ' ') : '—'),
      h('td', {}, `${rated} / ${(l.criteria || []).length}`),
      h('td', {}, h('a', { class: 'button small', href: `#/evidence/${l.id}` }, 'Open'))))));
}

function lessonEvidence(lesson) {
  const s = getState();
  const r = alignmentFor(lesson);
  const p = withDefaults(s.profile);
  const ev = s.evidence.filter((e) => e.lessonId === lesson.id).sort((a, b) => b.at.localeCompare(a.at));
  lesson.outcomeJudgement ||= { value: 'not-assessed', note: '' };

  return h(
    'div',
    {},
    alignmentAlert(r),
    h('div', { class: 'card' },
      h('h2', {}, 'Teacher assessment criteria'),
      h('div', { class: 'alert info' }, 'Ratings on adapted criteria show progress with the essential concept through an adapted task. They are not, by themselves, evidence of full achievement of the Grade 9 learning outcome.'),
      (lesson.criteria || []).length ? (lesson.criteria || []).map((cr) => criterionRow(lesson, cr, ev, p)) : h('p', {}, 'No criteria defined for this lesson. ', h('a', { href: `#/lesson/${lesson.id}` }, 'Add criteria.'))),
    h('div', { class: 'card' },
      h('h2', {}, 'Grade 9 outcome as written – teacher judgement'),
      h('p', { class: 'help' }, 'Optional and separate. Record this only from your professional judgement against the official outcome wording.'),
      field('Judgement', select(OUTCOME_JUDGEMENTS, lesson.outcomeJudgement.value, (v) => ((lesson.outcomeJudgement.value = v), (lesson.outcomeJudgement.at = new Date().toISOString()), update(() => {}, `Outcome judgement for ${lesson.title}: ${v}`)))),
      field('Evidence / rationale', textarea(lesson.outcomeJudgement.note, (v) => ((lesson.outcomeJudgement.note = v), update(() => {})), { rows: 2 }))),
    h('div', { class: 'card' },
      h('h2', {}, `Captured evidence (${ev.length})`),
      ev.length ? evidenceTable(ev) : h('p', {}, 'No responses yet. ', h('a', { href: `#/play/${lesson.id}` }, 'Open the student view.')))
  );
}

function criterionRow(lesson, cr, ev, p) {
  const last = latestRating(lesson.id, cr.id);
  let rating = last?.rating || 'not-observed';
  let promptLevel = last?.promptLevel || '';
  let note = '';
  const related = ev.filter((e) => (cr.statementIds || []).some((id) => e.statementIds?.includes(id)));
  const history = getState().ratings.filter((x) => x.lessonId === lesson.id && x.criterionId === cr.id);
  return h('div', { class: 'criterion-row' },
    h('p', {}, cr.kind === 'individual-goal' ? badge('Individualized goal', 'neutral') : badge('Adapted curriculum criterion', 'neutral'), ' ', h('strong', {}, cr.text || '(no text)')),
    cr.statementIds?.length ? h('p', { class: 'help' }, `Linked statements: ${cr.statementIds.join(', ')} · ${related.length} related evidence record(s)`) : null,
    h('div', { class: 'grid3' },
      field('Rating', select(RATINGS, rating, (v) => (rating = v))),
      field('Support level', select([{ id: '', label: '—' }, ...PROMPT_LEVELS], promptLevel, (v) => (promptLevel = v)), `Target: ${promptLabel(p.targetPromptLevel)}`),
      field('Observation note', textarea('', (v) => (note = v), { rows: 1 }))),
    h('button', { class: 'small', onclick: () => {
      update((s) => s.ratings.push({ id: uid('rt'), lessonId: lesson.id, criterionId: cr.id, criterionText: cr.text, kind: cr.kind, statementIds: cr.statementIds || [], goalIds: cr.goalIds || [], rating, promptLevel, note, at: new Date().toISOString(), curriculumVersionId: lesson.curriculumVersionId, curriculumVersionLabel: lesson.curriculumVersionLabel }), `Rated criterion in ${lesson.title}`);
      toast('Rating saved.', 'info');
      rerender();
    } }, 'Save rating'),
    history.length ? h('details', {}, h('summary', {}, `History (${history.length})`), h('ul', {}, history.map((x) => h('li', {}, `${x.at.slice(0, 10)}: ${ratingLabel(x.rating)}${x.promptLevel ? ` · ${promptLabel(x.promptLevel)}` : ''}${x.note ? ` – ${x.note}` : ''}`)))) : null);
}

function evidenceTable(ev) {
  return h('table', { class: 'table evidence' },
    h('thead', {}, h('tr', {}, ['When', 'Activity', 'Response', 'Result', 'Support', 'Curriculum', ''].map((t) => h('th', {}, t)))),
    h('tbody', {}, ev.map((e) => h('tr', {},
      h('td', {}, e.at.slice(0, 16).replace('T', ' ')),
      h('td', {}, e.stepTitle, e.round > 1 ? ` (round ${e.round})` : ''),
      h('td', {}, e.media ? h('img', { src: e.media, class: 'thumb', alt: `${e.response} evidence` }) : null, e.response, e.mode ? h('small', {}, ` · ${e.mode}`) : null),
      h('td', {}, e.correct === true ? '✔ first try' : e.correct === false ? `✔ after ${e.attempts} tries` : '—', e.score ? ` (${e.score})` : ''),
      h('td', {}, select([{ id: '', label: '—' }, ...PROMPT_LEVELS], e.promptLevel || '', (v) => ((e.promptLevel = v || null), update(() => {})))),
      h('td', {}, e.statementIds?.length ? e.statementIds.join(', ') : h('span', { class: 'error' }, 'none'), h('br'), h('small', {}, e.curriculumVersionLabel || 'no version')),
      h('td', {}, h('button', { class: 'tiny ghost danger', onclick: () => (update((s) => (s.evidence = s.evidence.filter((x) => x.id !== e.id))), rerender()) }, 'Delete'))))));
}
