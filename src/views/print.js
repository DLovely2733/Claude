// Priority 6: printable resources and progress reporting.

import { h, field, select, input } from '../ui.js';
import { getState, getLesson } from '../store.js';
import { go, rerender } from '../router.js';
import { findOutcome, findStatement, STATEMENT_KEYS, STATEMENT_TYPES, TARGET_CURRICULUM } from '../curriculum/model.js';
import { renderVisual } from '../visuals.js';
import { withDefaults, textForStep, RESPONSE_MODES } from '../profile.js';
import { alignmentFor, statusBadge, warningList, areaName, pageHeader, empty, typeLabel } from './common.js';
import { latestRating, ratingLabel, promptLabel, OUTCOME_JUDGEMENTS } from './evidence.js';

export function renderPrint(kind, id) {
  if (kind === 'lesson') return printWrap(lessonPlan(id));
  if (kind === 'handout') return printWrap(handout(id));
  if (kind === 'report') return printWrap(report());
  return menu();
}

function printWrap(content) {
  return h('div', { class: 'print-view' },
    h('div', { class: 'no-print row-actions print-tools' }, h('button', { class: 'primary', onclick: () => window.print() }, '🖨 Print'), h('a', { class: 'button ghost', href: '#/print' }, '← Print menu')),
    content);
}

function menu() {
  const s = getState();
  return h('section', {},
    pageHeader('Print & reports', 'Printable lesson plans, student handouts and progress reports.'),
    h('div', { class: 'card' }, h('h2', {}, 'Progress report'), h('p', {}, 'All lessons, ratings and evidence, with curriculum adaptations and individualized goals reported separately.'), h('a', { class: 'button', href: '#/print/report' }, 'Open progress report')),
    h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, ['Lesson', 'Curriculum status', ''].map((t) => h('th', {}, t)))),
      h('tbody', {}, s.lessons.map((l) => h('tr', {},
        h('td', {}, l.title),
        h('td', {}, statusBadge(alignmentFor(l))),
        h('td', { class: 'row-actions' }, h('a', { class: 'button small', href: `#/print/lesson/${l.id}` }, 'Teacher lesson plan'), h('a', { class: 'button small ghost', href: `#/print/handout/${l.id}` }, 'Student handout')))))));
}

function officialBlock(lesson) {
  const s = getState();
  const v = s.versions.find((x) => x.id === lesson.curriculumVersionId);
  if (!v || !lesson.curriculumLinks.outcomeIds.length) return h('p', { class: 'alert error' }, '⛔ No verified curriculum connection.');
  return lesson.curriculumLinks.outcomeIds.map((oid) => {
    const o = findOutcome(v, oid);
    if (!o) return h('p', { class: 'alert error' }, `${oid} not found in ${v.label}`);
    const sel = lesson.curriculumLinks.statementIds.map((id) => findStatement(v, id)).filter((f) => f && f.outcome.id === oid);
    return h('blockquote', { class: 'official' },
      h('p', {}, h('strong', {}, `${oid} – Learning Outcome: `), o.text),
      STATEMENT_KEYS.map((k) => {
        const list = sel.filter((f) => f.type === k);
        return list.length ? h('div', {}, h('strong', {}, STATEMENT_TYPES[k].label), h('ul', {}, list.map((f) => h('li', {}, `${f.statement.id}: ${f.statement.text}`)))) : null;
      }));
  });
}

function lessonPlan(id) {
  const l = getLesson(id);
  if (!l) return empty('Lesson not found.');
  const r = alignmentFor(l);
  const p = withDefaults(getState().profile);
  return h('article', { class: 'printable' },
    h('h1', {}, l.title),
    h('p', {}, `${TARGET_CURRICULUM.title} · ${areaName(l.unit)} · Curriculum version: ${l.curriculumVersionLabel || 'none'}`),
    h('p', {}, statusBadge(r)),
    warningList(r, { max: 8 }),
    h('h2', {}, 'Official curriculum connection'),
    officialBlock(l),
    h('h2', {}, 'Class expectations and connection'),
    h('p', {}, l.classExpectations || '—'),
    h('p', {}, l.classConnection || ''),
    h('h2', {}, 'Essential concepts'),
    h('ol', {}, (l.essentialConcepts || []).map((c) => h('li', {}, c.text, c.plainText ? h('div', { class: 'help' }, `Plain language: ${c.plainText}`) : null, h('div', { class: 'help' }, `Curriculum: ${(c.statementIds || []).join(', ') || 'not linked'}`)))),
    h('h2', {}, 'Individualized goals'),
    (l.individualGoals || []).length ? h('ul', {}, l.individualGoals.map((g) => h('li', {}, g.text))) : h('p', {}, 'None attached.'),
    h('h2', {}, 'Adapted learning activities'),
    h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, ['#', 'Activity', 'What happens', 'Curriculum trace'].map((t) => h('th', {}, t)))),
      h('tbody', {}, (l.steps || []).map((st, i) => {
        const trace = r.trace.find((t) => t.stepId === st.id);
        return h('tr', {}, h('td', {}, String(i + 1)), h('td', {}, h('strong', {}, st.title), h('br'), h('small', {}, st.kind)), h('td', {}, textForStep(st, p), st.interaction ? h('div', { class: 'help' }, `Interaction: ${st.interaction.type}${st.interaction.prompt ? ` – ${st.interaction.prompt}` : ''}`) : null), h('td', {}, trace?.statements.map((x) => x.id).join(', ') || '⚠ none'));
      }))),
    h('h2', {}, 'Ways to demonstrate understanding'),
    h('p', {}, (l.demonstrationModes || []).map((m) => RESPONSE_MODES.find((x) => x.id === m)?.label).filter(Boolean).join(' · ') || '—'),
    h('h2', {}, 'Assessment criteria'),
    h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, ['Criterion', 'Type', 'Linked to', 'Rating'].map((t) => h('th', {}, t)))),
      h('tbody', {}, (l.criteria || []).map((cr) => h('tr', {}, h('td', {}, cr.text), h('td', {}, cr.kind === 'individual-goal' ? 'Individualized goal' : 'Adapted curriculum'), h('td', {}, (cr.statementIds || []).join(', ') || '—'), h('td', { class: 'blank' }, ' '))))),
    h('p', { class: 'help' }, 'Completing adapted tasks shows engagement with the essential concept; it does not by itself demonstrate full achievement of the Grade 9 outcome.'));
}

function handout(id) {
  const l = getLesson(id);
  if (!l) return empty('Lesson not found.');
  const p = withDefaults(getState().profile);
  return h('article', { class: 'printable handout' },
    h('h1', {}, l.title),
    h('p', {}, 'Name: ____________________   Date: ____________'),
    (l.steps || []).map((st, i) => h('section', { class: 'handout-step' },
      h('h2', {}, `${i + 1}. ${st.title}`),
      renderVisual(st, { ...p, visuals: 'rich' }),
      h('p', { class: 'text' }, textForStep(st, { ...p, textSupport: p.textSupport === 'standard' ? 'plain' : p.textSupport })),
      st.chunks?.length ? h('ol', {}, st.chunks.map((c) => h('li', {}, '☐ ', c))) : null,
      handoutInteraction(st.interaction))),
    cutOutCards(l));
}

function handoutInteraction(it) {
  if (!it) return null;
  const opts = (list) => h('div', { class: 'print-options' }, (list || []).map((o) => h('div', { class: 'print-opt' }, '☐ ', h('span', { class: 'sym' }, o.symbol || ''), ' ', o.label)));
  switch (it.type) {
    case 'choice':
    case 'decision':
      return h('div', {}, h('p', { class: 'prompt' }, it.prompt), opts(it.options), it.reasons?.length ? [h('p', {}, it.reasonPrompt || 'Why?'), opts(it.reasons)] : null);
    case 'yesno':
      return h('div', {}, h('p', { class: 'prompt' }, it.prompt), h('p', {}, '☐ 👍 Yes     ☐ 👎 No'));
    case 'sort':
      return h('div', {}, h('p', { class: 'prompt' }, `${it.prompt} (cut out the cards at the end and glue them in the boxes)`), h('div', { class: 'print-groups' }, (it.categories || []).map((c) => h('div', { class: 'print-group' }, h('strong', {}, c.symbol, ' ', c.label)))));
    case 'sequence':
      return h('div', {}, h('p', { class: 'prompt' }, `${it.prompt} Number the boxes 1, 2, 3…`), opts(it.items));
    default:
      return h('div', {}, h('p', { class: 'prompt' }, it.prompt), h('div', { class: 'draw-box' }, 'Draw, write or glue here'));
  }
}

function cutOutCards(l) {
  const cards = (l.steps || []).flatMap((st) => (st.interaction?.type === 'sort' ? st.interaction.items : []));
  if (!cards.length) return null;
  return h('section', { class: 'cutouts' }, h('h2', {}, '✂ Cut-out cards'), h('div', { class: 'cut-grid' }, cards.map((c) => h('div', { class: 'cut-card' }, h('span', { class: 'sym' }, c.symbol || ''), h('span', {}, c.label)))));
}

const reportRange = { from: '', to: '' };

function report() {
  const s = getState();
  const p = withDefaults(s.profile);
  const inRange = (at) => (!reportRange.from || at >= reportRange.from) && (!reportRange.to || at.slice(0, 10) <= reportRange.to);
  const lessons = s.lessons.filter((l) => s.evidence.some((e) => e.lessonId === l.id && inRange(e.at)) || s.ratings.some((r) => r.lessonId === l.id && inRange(r.at)));

  return h('article', { class: 'printable report' },
    h('div', { class: 'no-print filters' },
      field('From', input(reportRange.from, (v) => (reportRange.from = v), { type: 'date' })),
      field('To', input(reportRange.to, (v) => (reportRange.to = v), { type: 'date' })),
      h('button', { class: 'small', onclick: () => rerender() }, 'Apply')),
    h('h1', {}, 'Progress report – Grade 9 Social Studies'),
    h('p', {}, `Student: ${p.studentName || '__________'} · Generated ${new Date().toISOString().slice(0, 10)} · ${TARGET_CURRICULUM.title}`),
    h('div', { class: 'alert info' }, 'This report separates (1) progress on adapted curriculum tasks linked to official Grade 9 outcomes, (2) the teacher’s separate judgement on the outcome as written, and (3) progress on individualized goals. Completing adapted tasks is not reported as full achievement of a Grade 9 outcome.'),
    lessons.length ? null : h('p', {}, 'No evidence recorded in this period.'),
    lessons.map((l) => {
      const r = alignmentFor(l);
      const ev = s.evidence.filter((e) => e.lessonId === l.id && inRange(e.at));
      const firstTry = ev.filter((e) => e.correct === true).length;
      const scored = ev.filter((e) => e.correct !== null && e.correct !== undefined).length;
      const adapted = (l.criteria || []).filter((c) => c.kind !== 'individual-goal');
      const judgement = OUTCOME_JUDGEMENTS.find((j) => j.id === l.outcomeJudgement?.value) || OUTCOME_JUDGEMENTS[0];
      return h('section', { class: 'report-lesson' },
        h('h2', {}, l.title),
        h('p', {}, `${areaName(l.unit)} · Curriculum version: ${l.curriculumVersionLabel || 'none'} · `, statusBadge(r)),
        officialBlock(l),
        h('h3', {}, '1. Adapted curriculum criteria'),
        h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, ['Criterion', 'Rating', 'Support', 'Date', 'Note'].map((t) => h('th', {}, t)))),
          h('tbody', {}, adapted.map((cr) => {
            const lr = latestRating(l.id, cr.id);
            return h('tr', {}, h('td', {}, cr.text), h('td', {}, lr ? ratingLabel(lr.rating) : 'Not rated'), h('td', {}, lr ? promptLabel(lr.promptLevel) : ''), h('td', {}, lr?.at.slice(0, 10) || ''), h('td', {}, lr?.note || ''));
          }))),
        h('p', {}, `Activity evidence: ${ev.length} record(s); ${firstTry} of ${scored} scored practice items correct on the first try.`),
        h('h3', {}, '2. Grade 9 outcome as written (teacher judgement)'),
        h('p', {}, judgement.label, l.outcomeJudgement?.note ? ` – ${l.outcomeJudgement.note}` : ''));
    }),
    h('h2', {}, '3. Individualized goals'),
    p.goals.length
      ? h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, ['Goal', 'Lessons', 'Latest rating', 'Support'].map((t) => h('th', {}, t)))),
          h('tbody', {}, p.goals.map((g) => {
            const ratings = s.ratings.filter((r) => r.kind === 'individual-goal' && r.goalIds?.includes(g.id) && inRange(r.at)).sort((a, b) => b.at.localeCompare(a.at));
            const lessonsFor = s.lessons.filter((l) => (l.individualGoals || []).some((x) => x.id === g.id)).map((l) => l.title);
            return h('tr', {}, h('td', {}, g.text), h('td', {}, lessonsFor.join('; ') || '—'), h('td', {}, ratings[0] ? ratingLabel(ratings[0].rating) : 'Not rated'), h('td', {}, ratings[0] ? promptLabel(ratings[0].promptLevel) : ''));
          })))
      : h('p', {}, 'No individualized goals recorded.'),
    h('p', { class: 'signature' }, 'Teacher: ____________________   Date: ____________'));
}
