// Priority 3: accessible lesson generation and editing.

import { h, field, select, input, textarea, checkbox, toast, modal, badge } from '../ui.js';
import { getState, update, activeVersion, getLesson, restoreDemoLessons } from '../store.js';
import { go, rerender } from '../router.js';
import { CONTENT_AREAS, STATEMENT_KEYS, STATEMENT_TYPES, findOutcome, findStatement, areasOf } from '../curriculum/model.js';
import { generateLesson } from '../generator.js';
import { activityStatementIds } from '../alignment.js';
import { suggestOutcomes, suggestStatements } from '../linking.js';
import { RESPONSE_MODES, withDefaults } from '../profile.js';
import { VISUAL_TYPES } from '../visuals.js';
import { uid, clone } from '../util.js';
import { alignmentFor, statusBadge, alignmentAlert, areaNames, pageHeader, empty, typeLabel } from './common.js';

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export function renderLessons({ studentPicker = false } = {}) {
  const s = getState();
  const byArea = CONTENT_AREAS.map((a) => ({ area: a, lessons: s.lessons.filter((l) => l.unit === a.id).sort((x, y) => (x.order || 99) - (y.order || 99)) }));
  const other = s.lessons.filter((l) => !CONTENT_AREAS.some((a) => a.id === l.unit));
  if (other.length) byArea.push({ area: { id: 'other', name: 'Not yet assigned to a content area' }, lessons: other });

  return h(
    'section',
    {},
    studentPicker
      ? pageHeader('Student view', 'Choose a lesson to open in student mode. Hand the device to the student or project it.')
      : pageHeader('Lessons', 'Every lesson must trace to official Grade 9 outcomes. Lessons without a verified connection show a warning.',
          h('a', { class: 'button', href: '#/new-lesson' }, '+ New lesson from an outcome'),
          h('button', { class: 'ghost', onclick: () => (restoreDemoLessons(), rerender()) }, 'Restore demo lessons')),
    byArea.filter((g) => g.lessons.length || !studentPicker).map((g) =>
      h('div', { class: 'area-block' },
        h('h2', {}, g.area.name),
        g.lessons.length
          ? h('div', { class: 'lesson-grid' }, g.lessons.map((l) => lessonCard(l, studentPicker)))
          : h('p', { class: 'help' }, 'No lessons yet. ', h('a', { href: '#/new-lesson' }, 'Create one from a curriculum outcome.')))
    )
  );
}

function lessonCard(l, studentPicker) {
  const r = alignmentFor(l);
  return h(
    'article',
    { class: `card lesson-card tone-${r.status}` },
    h('h3', {}, l.title),
    h('p', {}, statusBadge(r), ' ', l.origin === 'demo' ? badge('Demo', 'neutral') : null, ' ', l.draft ? badge('Draft', 'warn') : null),
    h('p', { class: 'help' }, l.curriculumVersionLabel ? `Curriculum version: ${l.curriculumVersionLabel}` : 'Curriculum version: none', l.curriculumLinks.outcomeIds.length ? ` · Outcome ${l.curriculumLinks.outcomeIds.join(', ')}` : ''),
    h('div', { class: 'row-actions' },
      h('a', { class: 'button small', href: `#/play/${l.id}` }, studentPicker ? '▶ Start' : '▶ Student view'),
      studentPicker ? null : h('a', { class: 'button small ghost', href: `#/lesson/${l.id}` }, 'Edit & align'),
      studentPicker ? null : h('a', { class: 'button small ghost', href: `#/print/lesson/${l.id}` }, 'Print'))
  );
}

// ---------------------------------------------------------------------------
// New lesson from an outcome
// ---------------------------------------------------------------------------

const draftNew = { outcomeId: null, statementIds: new Set(), goalIds: new Set(), title: '', classActivity: '' };

export function renderNewLesson(outcomeId) {
  const v = activeVersion();
  if (!v) return empty('Upload and activate the official curriculum before generating lessons. Lessons are built only from official outcomes.', h('a', { class: 'button', href: '#/curriculum' }, 'Go to Curriculum'));
  const g9 = v.outcomes.filter((o) => o.grade === 9 || o.grade == null);
  if (!g9.length) return empty('The active curriculum version has no Grade 9 outcomes. Check the review screen.', h('a', { class: 'button', href: `#/curriculum/review/${v.id}` }, 'Review curriculum'));
  if (outcomeId && draftNew.outcomeId !== outcomeId) Object.assign(draftNew, { outcomeId, statementIds: new Set(), title: '' });
  draftNew.outcomeId ||= g9[0].id;
  const o = findOutcome(v, draftNew.outcomeId) || g9[0];
  const p = withDefaults(getState().profile);

  return h(
    'section',
    {},
    pageHeader('New accessible lesson', `From ${v.label}. Select any Grade 9 learning outcome, then the statements this lesson will address.`),
    field('Learning outcome', select(g9.map((x) => ({ id: x.id, label: `${x.id}${x.verified ? '' : ' (needs review)'} – ${x.text.slice(0, 110)}` })), o.id, (id) => ((draftNew.outcomeId = id), (draftNew.statementIds = new Set()), rerender()))),
    !o.verified ? h('div', { class: 'alert warn' }, 'This outcome has not been verified against the source document. Lessons created from it will show a warning until it is verified in Curriculum → Review.') : null,
    h('div', { class: 'card' },
      o.organizingIdea ? h('p', {}, h('strong', {}, 'Organizing Idea: '), o.organizingIdea) : null,
      o.guidingQuestion ? h('p', {}, h('strong', {}, 'Guiding Question: '), o.guidingQuestion) : null,
      h('p', { class: 'lo' }, h('strong', {}, 'Learning Outcome: '), o.text),
      h('p', {}, badge(areaNames(areasOf(o)), areasOf(o).length ? 'neutral' : 'warn')),
      h('div', { class: 'grid3' }, STATEMENT_KEYS.map((k) =>
        h('div', {},
          h('h4', {}, STATEMENT_TYPES[k].label),
          o[k].length ? o[k].map((st) => checkbox(h('span', {}, h('code', {}, st.id), ' ', st.text), draftNew.statementIds.has(st.id), (val) => (val ? draftNew.statementIds.add(st.id) : draftNew.statementIds.delete(st.id)))) : h('p', { class: 'help' }, 'None extracted.'))
      ))
    ),
    h('div', { class: 'card' },
      field('Lesson title', input(draftNew.title || o.guidingQuestion || '', (val) => (draftNew.title = val))),
      field('What are classmates doing for this outcome?', textarea(draftNew.classActivity, (val) => (draftNew.classActivity = val)), 'Used to keep the student’s pathway connected to the class.'),
      p.goals.length
        ? h('div', {}, h('h4', {}, 'Attach individualized goals (optional)'), p.goals.map((g) => checkbox(g.text || '(untitled goal)', draftNew.goalIds.has(g.id), (val) => (val ? draftNew.goalIds.add(g.id) : draftNew.goalIds.delete(g.id)))))
        : h('p', { class: 'help' }, 'No individualized goals set. Add them in Student settings.')
    ),
    h('button', {
      class: 'primary',
      onclick: () => {
        if (!draftNew.statementIds.size) return toast('Select at least one knowledge, understanding or skills statement.', 'warn');
        const lesson = generateLesson({ version: v, outcomeId: o.id, statementIds: [...draftNew.statementIds], profile: p, goalIds: [...draftNew.goalIds], title: draftNew.title || o.guidingQuestion, classActivity: draftNew.classActivity });
        lesson.unit = areasOf(o)[0] || null;
        update((s) => s.lessons.push(lesson), `Generated lesson “${lesson.title}” from ${o.id}`);
        Object.assign(draftNew, { outcomeId: null, statementIds: new Set(), goalIds: new Set(), title: '', classActivity: '' });
        toast('Draft lesson created. Complete the plain-language explanations and decision options marked “teacher review”.', 'info');
        go(`lesson/${lesson.id}`);
      },
    }, 'Generate accessible lesson draft')
  );
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export function renderLessonEditor(id) {
  const lesson = getLesson(id);
  if (!lesson) return empty('Lesson not found.', h('a', { href: '#/lessons' }, 'Back to lessons'));
  const s = getState();
  const save = () => ((lesson.updatedAt = new Date().toISOString()), update(() => {}));
  const r = alignmentFor(lesson);
  const version = s.versions.find((v) => v.id === lesson.curriculumVersionId) || null;

  return h(
    'section',
    { class: 'editor' },
    pageHeader(lesson.title, null,
      h('a', { class: 'button', href: `#/play/${lesson.id}` }, '▶ Preview student view'),
      h('a', { class: 'button ghost', href: `#/print/lesson/${lesson.id}` }, 'Print'),
      h('button', { class: 'ghost', onclick: () => duplicate(lesson) }, 'Duplicate'),
      h('button', { class: 'ghost danger', onclick: () => remove(lesson) }, 'Delete')),
    alignmentAlert(r),
    h('div', { class: 'grid2' },
      field('Title', input(lesson.title, (v) => ((lesson.title = v), save()))),
      field('Content area', select([{ id: '', label: '— Unassigned —' }, ...CONTENT_AREAS.map((a) => ({ id: a.id, label: a.name }))], lesson.unit || '', (v) => ((lesson.unit = v || null), save())))),
    checkbox('Draft (still needs teacher review)', lesson.draft, (v) => ((lesson.draft = v), save())),

    section('1. Official curriculum connection', linkPanel(lesson, version, save)),
    section('2. Original curriculum expectations', expectationsPanel(lesson, version, save)),
    section('3. Essential concepts (accessible to the student)', conceptsPanel(lesson, version, save)),
    section('4. Individualized instructional goals', goalsPanel(lesson, save)),
    section('5. Adapted learning activities', stepsPanel(lesson, version, save)),
    section('6. Ways to demonstrate understanding', modesPanel(lesson, save)),
    section('7. Teacher assessment criteria', criteriaPanel(lesson, version, save)),
    section('8. Traceability', traceTable(lesson, r))
  );
}

function section(title, body) {
  return h('details', { class: 'card editor-section', open: true }, h('summary', {}, h('h2', {}, title)), body);
}

function duplicate(lesson) {
  const copy = clone(lesson);
  copy.id = uid('lesson');
  copy.title = `${lesson.title} (copy)`;
  copy.origin = 'teacher';
  update((s) => s.lessons.push(copy), `Duplicated lesson ${lesson.title}`);
  go(`lesson/${copy.id}`);
}

function remove(lesson) {
  modal('Delete lesson?', h('p', {}, `“${lesson.title}” and its settings will be deleted. Recorded evidence is kept.`), [
    { label: 'Cancel', class: 'ghost', onClick: (c) => c() },
    { label: 'Delete', class: 'danger', onClick: (c) => (update((s) => (s.lessons = s.lessons.filter((l) => l.id !== lesson.id)), `Deleted lesson ${lesson.title}`), c(), go('lessons')) },
  ]);
}

function linkPanel(lesson, version, save) {
  const s = getState();
  const v = version || activeVersion();
  if (!v) return h('div', { class: 'alert error' }, 'No curriculum uploaded. ', h('a', { href: '#/curriculum' }, 'Upload the June 2026 draft curriculum'), ' to link this lesson. The app will not create outcome wording on its own.');
  const links = lesson.curriculumLinks;
  const g9 = v.outcomes.filter((o) => o.grade === 9 || o.grade == null);
  const ensureVersion = () => {
    if (!lesson.curriculumVersionId) {
      lesson.curriculumVersionId = v.id;
      lesson.curriculumVersionLabel = v.label;
    }
  };
  const suggestions = suggestOutcomes(v, lesson, { limit: 3 });

  return h(
    'div',
    {},
    h('p', {}, 'Curriculum version: ', h('strong', {}, lesson.curriculumVersionLabel || `${v.label} (will be recorded when you link)`), version && version.id !== s.activeVersionId ? [' ', badge('Not the active version', 'warn'), ' ', h('a', { href: '#/curriculum/compare' }, 'Review changes')] : null),
    (lesson.versionHistory || []).length ? h('p', { class: 'help' }, 'History: ', lesson.versionHistory.map((x) => `${x.fromLabel || 'none'} → ${x.toLabel} (${x.at.slice(0, 10)})`).join('; ')) : null,
    !links.outcomeIds.length && suggestions.length
      ? h('div', { class: 'suggest' },
          h('p', {}, h('strong', {}, 'Possible matches (keyword suggestions – verify before linking):')),
          suggestions.map((sg) => h('div', { class: 'suggest-row' }, h('code', {}, sg.outcome.id), ' ', sg.outcome.text, ' ', h('button', { class: 'small', onclick: () => (ensureVersion(), links.outcomeIds.push(sg.outcome.id), save(), rerender()) }, 'Link'))))
      : null,
    h('h4', {}, 'Linked learning outcome(s)'),
    links.outcomeIds.map((oid) => {
      const o = findOutcome(v, oid);
      return h('div', { class: 'linked-outcome' },
        h('p', {}, h('code', {}, oid), ' ', o ? o.text : h('em', { class: 'error' }, 'Not found in this version'), ' ', o && !o.verified ? badge('Needs review', 'warn') : null, ' ',
          h('button', { class: 'tiny ghost danger', onclick: () => ((links.outcomeIds = links.outcomeIds.filter((x) => x !== oid)), save(), rerender()) }, 'Unlink')),
        o ? h('div', { class: 'grid3' }, STATEMENT_KEYS.map((k) => h('div', {}, h('h5', {}, STATEMENT_TYPES[k].label), o[k].map((st) => checkbox(h('span', {}, h('code', {}, st.id), ' ', st.text), links.statementIds.includes(st.id), (val) => {
          links.statementIds = val ? [...new Set([...links.statementIds, st.id])] : links.statementIds.filter((x) => x !== st.id);
          save();
        }))))) : null);
    }),
    h('div', { class: 'row-actions' },
      select([{ id: '', label: '+ Link another Grade 9 outcome…' }, ...g9.filter((o) => !links.outcomeIds.includes(o.id)).map((o) => ({ id: o.id, label: `${o.id} – ${o.text.slice(0, 100)}` }))], '', (oid) => oid && (ensureVersion(), links.outcomeIds.push(oid), save(), rerender())),
      h('button', { class: 'small ghost', onclick: () => rerender() }, 'Re-check alignment'))
  );
}

function expectationsPanel(lesson, version, save) {
  const links = lesson.curriculumLinks;
  return h(
    'div',
    {},
    h('p', { class: 'help' }, 'Official wording, exactly as extracted from the curriculum version above.'),
    links.outcomeIds.length && version
      ? links.outcomeIds.map((oid) => {
          const o = findOutcome(version, oid);
          if (!o) return null;
          const sel = links.statementIds.map((id) => findStatement(version, id)).filter((f) => f && f.outcome.id === oid);
          return h('blockquote', { class: 'official' },
            o.guidingQuestion ? h('p', {}, h('strong', {}, 'Guiding Question: '), o.guidingQuestion) : null,
            h('p', {}, h('strong', {}, 'Learning Outcome: '), o.text),
            STATEMENT_KEYS.map((k) => {
              const list = sel.filter((f) => f.type === k);
              return list.length ? h('div', {}, h('strong', {}, `${STATEMENT_TYPES[k].label}: `), h('ul', {}, list.map((f) => h('li', {}, f.statement.text)))) : null;
            }));
        })
      : h('p', { class: 'alert warn' }, 'No official outcome linked yet.'),
    field('What classmates are doing (class expectations)', textarea(lesson.classExpectations, (v) => ((lesson.classExpectations = v), save()))),
    field('How this pathway connects to the class', textarea(lesson.classConnection, (v) => ((lesson.classConnection = v), save())))
  );
}

function statementPicker(lesson, version, selected, onChange) {
  const ids = lesson.curriculumLinks.statementIds;
  if (!ids.length) return h('p', { class: 'help warn' }, 'Select statements in section 1 first.');
  return h('div', { class: 'stmt-picker' }, ids.map((sid) => {
    const f = version ? findStatement(version, sid) : null;
    return checkbox(h('span', { title: f?.statement.text || '' }, h('code', {}, sid), f ? ` ${typeLabel(f.type)}` : ''), selected.includes(sid), (val) => onChange(val ? [...new Set([...selected, sid])] : selected.filter((x) => x !== sid)));
  }));
}

function conceptsPanel(lesson, version, save) {
  const concepts = (lesson.essentialConcepts ||= []);
  return h(
    'div',
    {},
    h('p', { class: 'help' }, 'The essential historical, political, geographic or civic idea the student needs. Keep the concept; change only how it is presented.'),
    concepts.map((c, i) => {
      const linkedOutcomes = lesson.curriculumLinks.outcomeIds.map((id) => version && findOutcome(version, id)).filter(Boolean);
      const sugg = !c.statementIds?.length && linkedOutcomes.length ? linkedOutcomes.flatMap((o) => suggestStatements(o, c.text, 2)) : [];
      return h('div', { class: 'concept' },
        h('div', { class: 'grid2' },
          field(`Concept ${i + 1}`, textarea(c.text, (v) => ((c.text = v), save()))),
          field('Plain-language version', textarea(c.plainText, (v) => ((c.plainText = v), (c.needsReview = false), save())), c.needsReview ? '⚠ Teacher review: write the plain-language version.' : null)),
        h('div', {}, h('strong', {}, 'Curriculum statements this concept preserves: '), statementPicker(lesson, version, c.statementIds || [], (ids) => ((c.statementIds = ids), save()))),
        sugg.length ? h('p', { class: 'help' }, 'Suggested: ', sugg.map((sg) => h('button', { class: 'tiny', title: sg.statement.text, onclick: () => {
          c.statementIds = [...new Set([...(c.statementIds || []), sg.statement.id])];
          lesson.curriculumLinks.statementIds = [...new Set([...lesson.curriculumLinks.statementIds, sg.statement.id])];
          save();
          rerender();
        } }, `+ ${sg.statement.id}`))) : null,
        h('button', { class: 'tiny ghost danger', onclick: () => ((lesson.essentialConcepts = concepts.filter((x) => x !== c)), save(), rerender()) }, 'Remove concept'));
    }),
    h('button', { class: 'small', onclick: () => (concepts.push({ id: uid('c'), text: '', plainText: '', statementIds: [] }), save(), rerender()) }, '+ Add concept')
  );
}

function goalsPanel(lesson, save) {
  const p = withDefaults(getState().profile);
  lesson.individualGoals ||= [];
  return h(
    'div',
    {},
    h('p', { class: 'help' }, 'Individualized goals come from the student’s learning plan and are assessed separately from the curriculum outcome.'),
    p.goals.length
      ? p.goals.map((g) => checkbox(g.text || '(untitled goal)', lesson.individualGoals.some((x) => x.id === g.id), (val) => {
          lesson.individualGoals = val ? [...lesson.individualGoals, { id: g.id, text: g.text }] : lesson.individualGoals.filter((x) => x.id !== g.id);
          save();
        }))
      : h('p', {}, 'No goals defined. ', h('a', { href: '#/settings' }, 'Add goals in Student settings.'))
  );
}

// --- steps -----------------------------------------------------------------

const KINDS = [
  { id: 'connect', label: 'Connect to class' },
  { id: 'teach', label: 'Teach (concrete explanation)' },
  { id: 'practice', label: 'Guided practice' },
  { id: 'apply', label: 'Apply / decide' },
  { id: 'check', label: 'Check understanding' },
];
const INTERACTIONS = [
  { id: '', label: 'None' },
  { id: 'choice', label: 'Multiple choice' },
  { id: 'yesno', label: 'Yes / no' },
  { id: 'sort', label: 'Sort into groups' },
  { id: 'sequence', label: 'Put in order' },
  { id: 'decision', label: 'Make a decision + reasons' },
  { id: 'respond', label: 'Open response (any enabled mode)' },
];

const lines = (arr, fn) => (arr || []).map(fn).join('\n');
const parseLines = (text) => text.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((p) => p.some(Boolean));

function stepsPanel(lesson, version, save) {
  const steps = (lesson.steps ||= []);
  return h(
    'div',
    {},
    h('p', { class: 'help' }, 'Each activity must trace to the curriculum through its essential concepts or directly through statements.'),
    steps.map((st, i) => stepEditor(lesson, version, st, i, save)),
    h('button', { class: 'small', onclick: () => (steps.push({ id: uid('s'), kind: 'teach', title: 'New step', text: '', plainText: '', conceptIds: [], statementIds: [] }), save(), rerender()) }, '+ Add activity step')
  );
}

function stepEditor(lesson, version, st, i, save) {
  const steps = lesson.steps;
  const traced = activityStatementIds(lesson, st);
  const move = (d) => {
    const j = i + d;
    if (j < 0 || j >= steps.length) return;
    [steps[i], steps[j]] = [steps[j], steps[i]];
    save();
    rerender();
  };
  return h(
    'details',
    { class: `step-editor ${traced.length ? '' : 'untraced'}` },
    h('summary', {}, `${i + 1}. ${st.title} `, badge(KINDS.find((k) => k.id === st.kind)?.label || st.kind, 'neutral'), ' ', traced.length ? badge(`Traces to ${traced.join(', ')}`, 'ok') : badge('⚠ Not traced to curriculum', 'warn'), st.needsReview ? [' ', badge('Teacher review', 'warn')] : null),
    h('div', { class: 'grid2' },
      field('Title', input(st.title, (v) => ((st.title = v), save()))),
      field('Type', select(KINDS, st.kind, (v) => ((st.kind = v), save())))),
    h('div', { class: 'grid2' },
      field('Explanation (standard)', textarea(st.text, (v) => ((st.text = v), save()), { rows: 4 })),
      field('Plain-language version', textarea(st.plainText, (v) => ((st.plainText = v), (st.needsReview = false), save()), { rows: 4 }))),
    h('div', { class: 'grid2' },
      field('Narration script (optional – defaults to the text shown)', textarea(st.narration, (v) => ((st.narration = v), save()), { rows: 2 })),
      field('Break into small steps (one per line)', textarea((st.chunks || []).join('\n'), (v) => ((st.chunks = v.split('\n').filter((x) => x.trim())), save()), { rows: 3 }))),
    field('Key words (symbol | word | meaning, one per line)', textarea(lines(st.keywords, (k) => `${k.symbol} | ${k.word} | ${k.meaning || ''}`), (v) => ((st.keywords = parseLines(v).map(([symbol, word, meaning]) => ({ symbol, word, meaning }))), save()), { rows: 3 })),
    visualEditor(st, save),
    interactionEditor(st, save),
    h('div', { class: 'grid2' },
      h('div', {}, h('strong', {}, 'Essential concepts used: '), (lesson.essentialConcepts || []).map((c, ci) => checkbox(`Concept ${ci + 1}: ${(c.plainText || c.text).slice(0, 60)}`, (st.conceptIds || []).includes(c.id), (val) => ((st.conceptIds = val ? [...new Set([...(st.conceptIds || []), c.id])] : st.conceptIds.filter((x) => x !== c.id)), save())))),
      h('div', {}, h('strong', {}, 'Direct curriculum statements: '), statementPicker(lesson, version, st.statementIds || [], (ids) => ((st.statementIds = ids), save())))),
    h('div', { class: 'row-actions' },
      h('button', { class: 'tiny ghost', onclick: () => move(-1) }, '↑ Up'),
      h('button', { class: 'tiny ghost', onclick: () => move(1) }, '↓ Down'),
      h('button', { class: 'tiny ghost', onclick: () => rerender() }, 'Update trace'),
      h('button', { class: 'tiny ghost danger', onclick: () => ((lesson.steps = steps.filter((x) => x !== st)), save(), rerender()) }, 'Remove step'))
  );
}

function visualEditor(st, save) {
  st.visual ||= { type: 'none' };
  const v = st.visual;
  const img = h('input', { type: 'file', accept: 'image/*' });
  img.addEventListener('change', () => {
    const f = img.files[0];
    if (!f) return;
    if (f.size > 600_000) return toast('Please use an image under 600 KB so it can be saved in the browser.', 'warn');
    const r = new FileReader();
    r.onload = () => ((v.type = 'image'), (v.src = r.result), save(), rerender());
    r.readAsDataURL(f);
  });
  return h('div', { class: 'grid2' },
    field('Visual', select(VISUAL_TYPES, v.type, (x) => ((v.type = x), save(), rerender())), v.type === 'jurisdiction' || v.type === 'community' || v.type === 'steps' || v.type === 'options' ? 'Visual content for this type is edited in the lesson data (demo visuals are pre-built); key word cards use the key words above.' : null),
    h('div', {},
      field('Text alternative for the visual', input(v.alt, (x) => ((v.alt = x), save()))),
      v.type === 'image' ? field('Upload picture', img) : null));
}

function interactionEditor(st, save) {
  const it = st.interaction;
  const type = it?.type || '';
  const setType = (t) => {
    st.interaction = t ? { type: t, prompt: it?.prompt || '', options: [], categories: [], items: [], reasons: [] } : undefined;
    save();
    rerender();
  };
  const parts = [field('Interactive practice', select(INTERACTIONS, type, setType))];
  if (!it) return h('div', { class: 'interaction-editor' }, parts);
  parts.push(field('Question / prompt', input(it.prompt, (v) => ((it.prompt = v), save()))));
  if (type === 'choice') {
    parts.push(field('Options (symbol | answer | * for correct)', textarea(lines(it.options, (o) => `${o.symbol || ''} | ${o.label}${o.correct ? ' | *' : ''}`), (v) => ((it.options = parseLines(v).map(([symbol, label, c], k) => ({ id: `o${k}`, symbol, label, correct: c === '*' }))), save()), { rows: 4 })));
  }
  if (type === 'yesno') parts.push(field('Correct answer', select([{ id: 'true', label: 'Yes' }, { id: 'false', label: 'No' }], String(it.answer ?? true), (v) => ((it.answer = v === 'true'), save()))));
  if (type === 'choice' || type === 'yesno') {
    it.feedback ||= {};
    parts.push(h('div', { class: 'grid2' }, field('Feedback when correct', input(it.feedback.correct, (v) => ((it.feedback.correct = v), save()))), field('Hint when not yet', input(it.feedback.incorrect, (v) => ((it.feedback.incorrect = v), save())))));
  }
  if (type === 'sort') {
    parts.push(field('Groups (symbol | group name, one per line)', textarea(lines(it.categories, (c) => `${c.symbol || ''} | ${c.label}`), (v) => {
      const old = it.categories || [];
      it.categories = parseLines(v).map(([symbol, label], k) => ({ id: old[k]?.id || `g${k + 1}`, symbol, label }));
      save();
    }, { rows: 3 })));
    parts.push(field('Cards (symbol | card text | group number)', textarea(lines(it.items, (x) => `${x.symbol || ''} | ${x.label} | ${(it.categories || []).findIndex((c) => c.id === x.categoryId) + 1}`), (v) => ((it.items = parseLines(v).map(([symbol, label, g], k) => ({ id: `i${k}`, symbol, label, categoryId: it.categories[Number(g) - 1]?.id }))), save()), { rows: 5 })));
  }
  if (type === 'sequence') parts.push(field('Items in the correct order (symbol | text)', textarea(lines(it.items, (x) => `${x.symbol || ''} | ${x.label}`), (v) => ((it.items = parseLines(v).map(([symbol, label], k) => ({ id: `q${k}`, symbol, label }))), save()), { rows: 5 })));
  if (type === 'decision') {
    parts.push(field('Choices (symbol | choice | detail)', textarea(lines(it.options, (o) => `${o.symbol || ''} | ${o.label} | ${o.detail || ''}`), (v) => ((it.options = parseLines(v).map(([symbol, label, detail], k) => ({ id: `d${k}`, symbol, label, detail }))), save()), { rows: 4 })));
    parts.push(field('Reason question', input(it.reasonPrompt, (v) => ((it.reasonPrompt = v), save()))));
    parts.push(field('Reason cards (symbol | reason)', textarea(lines(it.reasons, (o) => `${o.symbol || ''} | ${o.label}`), (v) => ((it.reasons = parseLines(v).map(([symbol, label], k) => ({ id: `r${k}`, symbol, label }))), save()), { rows: 4 })));
    parts.push(field('Discussion prompt for the teacher', input(it.discussion, (v) => ((it.discussion = v), save()))));
  }
  return h('div', { class: 'interaction-editor' }, parts);
}

function modesPanel(lesson, save) {
  const p = withDefaults(getState().profile);
  lesson.demonstrationModes ||= [];
  return h(
    'div',
    {},
    h('p', { class: 'help' }, 'Accessible ways the student can show understanding in this lesson. Methods not enabled in Student settings are greyed out.'),
    h('div', { class: 'mode-grid' }, RESPONSE_MODES.map((m) => {
      const enabled = p.responseModes.includes(m.id);
      return h('div', { class: enabled ? '' : 'muted' }, checkbox(`${m.icon} ${m.label}${enabled ? '' : ' (not enabled for student)'}`, lesson.demonstrationModes.includes(m.id), (val) => ((lesson.demonstrationModes = val ? [...lesson.demonstrationModes, m.id] : lesson.demonstrationModes.filter((x) => x !== m.id)), save())));
    }))
  );
}

function criteriaPanel(lesson, version, save) {
  const criteria = (lesson.criteria ||= []);
  return h(
    'div',
    {},
    h('div', { class: 'alert info' }, 'Adapted-outcome criteria describe evidence of engagement with the essential concept. Meeting them does not, by itself, demonstrate full achievement of the Grade 9 outcome. Individual-goal criteria track the student’s learning-plan goals.'),
    criteria.map((cr) =>
      h('div', { class: 'criterion' },
        h('div', { class: 'grid2' },
          field('Criterion', textarea(cr.text, (v) => ((cr.text = v), save()), { rows: 2 })),
          field('Type', select([{ id: 'adapted-outcome', label: 'Adapted curriculum criterion' }, { id: 'individual-goal', label: 'Individualized goal criterion' }], cr.kind, (v) => ((cr.kind = v), save(), rerender())))),
        cr.kind === 'adapted-outcome'
          ? h('div', {}, h('strong', {}, 'Linked statements: '), statementPicker(lesson, version, cr.statementIds || [], (ids) => ((cr.statementIds = ids), save())))
          : h('div', {}, h('strong', {}, 'Goal: '), (lesson.individualGoals || []).length ? lesson.individualGoals.map((g) => checkbox(g.text, (cr.goalIds || []).includes(g.id), (val) => ((cr.goalIds = val ? [...(cr.goalIds || []), g.id] : cr.goalIds.filter((x) => x !== g.id)), save()))) : h('span', { class: 'help' }, 'Attach goals in section 4 first.')),
        h('button', { class: 'tiny ghost danger', onclick: () => ((lesson.criteria = criteria.filter((x) => x !== cr)), save(), rerender()) }, 'Remove'))
    ),
    h('button', { class: 'small', onclick: () => (criteria.push({ id: uid('cr'), kind: 'adapted-outcome', text: '', statementIds: [], goalIds: [] }), save(), rerender()) }, '+ Add criterion')
  );
}

function traceTable(lesson, r) {
  return h(
    'div',
    {},
    h('p', { class: 'help' }, 'Every adapted activity → curriculum statement → official outcome.'),
    h('table', { class: 'table trace' },
      h('thead', {}, h('tr', {}, ['Activity', 'Curriculum statements', 'Outcome'].map((t) => h('th', {}, t)))),
      h('tbody', {}, r.trace.map((row) =>
        h('tr', { class: row.statements.length ? '' : 'untraced' },
          h('td', {}, row.title),
          h('td', {}, row.statements.length ? h('ul', {}, row.statements.map((s) => h('li', {}, h('code', {}, s.id), s.text ? ` (${typeLabel(s.type)}) ${s.text}` : ' – not found in version'))) : h('span', { class: 'error' }, '⚠ No curriculum link')),
          h('td', {}, [...new Set(row.statements.map((s) => s.outcomeId).filter(Boolean))].join(', ') || '—')))))
  );
}
