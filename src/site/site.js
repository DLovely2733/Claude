// Student-facing lesson and activity site. Lessons come from the shared store
// (so teacher edits appear here) and are played by the same accessible lesson
// player as the teacher tool; responses are saved as evidence in this browser.

import { h, clear, stopSpeaking } from '../ui.js';
import { getState, update } from '../store.js';
import { renderPlayer } from '../views/player.js';
import { withDefaults, TEXT_SUPPORT_OPTIONS } from '../profile.js';
import { BUNDLED_CURRICULUM, STATEMENT_TYPES, findStatement } from '../curriculum/model.js';
import { DEMO_OUTCOME_ID } from '../demo/politicalSystemUnit.js';
import { ACTIVITIES, reviewQuiz } from './activities.js';
import { renderEscape } from './escape/engine.js';
import { ESCAPE_GAME } from './escape/rooms.js';

const app = document.getElementById('site');
let view = { name: 'home' };
let currentStep = 0;
let curriculum = null;

// --- data -------------------------------------------------------------------

function lessons() {
  return getState()
    .lessons.filter((l) => l.unit === 'political-system' && l.origin === 'demo')
    .sort((a, b) => (a.order || 99) - (b.order || 99));
}

function activities() {
  return [...ACTIVITIES, reviewQuiz(lessons())];
}

function bestStars({ lessonId, activityId }) {
  const done = getState().evidence.filter((e) => e.type === 'complete' && (activityId ? e.activityId === activityId : e.lessonId === lessonId && !e.activityId));
  return done.reduce((m, e) => Math.max(m, e.stars || 0), 0);
}

async function loadCurriculum() {
  if (curriculum) return curriculum;
  const stored = getState().versions.find((v) => v.id === BUNDLED_CURRICULUM.id);
  if (stored) return (curriculum = stored);
  try {
    const res = await fetch(BUNDLED_CURRICULUM.path);
    curriculum = res.ok ? await res.json() : null;
  } catch {
    curriculum = null;
  }
  return curriculum;
}

// --- navigation -------------------------------------------------------------

const TOKENS = {
  home: () => ({ name: 'home' }),
  activities: () => ({ name: 'home', anchor: 'activities' }),
  teachers: () => ({ name: 'teachers' }),
  escape: () => ({ name: 'escape' }),
};

function tokenFor(v) {
  if (v.name === 'lesson') return `lesson-${lessons().findIndex((l) => l.id === v.id) + 1}`;
  if (v.name === 'activity') return v.id.replace(/^act-/, '');
  if (v.name === 'teachers') return 'teachers';
  if (v.name === 'escape') return 'escape';
  return v.anchor || 'home';
}

function fromToken(token) {
  if (TOKENS[token]) return TOKENS[token]();
  const m = token.match(/^lesson-(\d)$/);
  if (m && lessons()[Number(m[1]) - 1]) return { name: 'lesson', id: lessons()[Number(m[1]) - 1].id };
  if (activities().some((a) => a.id === `act-${token}`)) return { name: 'activity', id: `act-${token}` };
  return { name: 'home' };
}

function navigate(next, { step = 0 } = {}) {
  stopSpeaking();
  view = next;
  currentStep = step;
  render();
  try {
    history.replaceState(null, '', `#${tokenFor(next)}`);
  } catch {
    /* address bar updates are optional */
  }
  if (next.anchor) document.getElementById(next.anchor)?.scrollIntoView();
  else window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => navigate(fromToken(location.hash.slice(1))));

// --- chrome -----------------------------------------------------------------

function header() {
  const link = (label, target, active) => h('button', { class: `nav-link${active ? ' is-active' : ''}`, onclick: () => navigate(target) }, label);
  return h('header', { class: 'site-head' },
    h('div', { class: 'site-head-inner' },
      h('button', { class: 'brand', onclick: () => navigate({ name: 'home' }), 'aria-label': 'Home' },
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, h('i', { class: 'm-crown' }), h('i', { class: 'm-senate' }), h('i', { class: 'm-commons' })),
        h('span', { class: 'brand-text' }, h('strong', {}, 'Canada’s Political System'), h('small', {}, 'Grade 9 Social Studies'))),
      h('nav', { class: 'site-nav', 'aria-label': 'Site' },
        link('Lessons', { name: 'home', anchor: 'lessons' }, view.name === 'lesson'),
        link('Escape room', { name: 'escape' }, view.name === 'escape'),
        link('Activities', { name: 'home', anchor: 'activities' }, view.name === 'activity'),
        link('For teachers', { name: 'teachers' }, view.name === 'teachers'),
        h('button', { class: 'supports-btn', onclick: openSupports, 'aria-haspopup': 'dialog' }, h('span', { 'aria-hidden': 'true' }, 'Aa'), ' Supports'))));
}

function stars(n, total = 3, label = true) {
  return h('span', { class: 'stars', 'aria-label': label ? `${n} of ${total} stars` : null }, Array.from({ length: total }, (_, i) => h('span', { class: i < n ? 'on' : 'off', 'aria-hidden': 'true' }, '★')));
}

// --- home -------------------------------------------------------------------

function home() {
  const ls = lessons();
  const next = ls.find((l) => !bestStars({ lessonId: l.id })) || ls[0];
  const nextIndex = ls.indexOf(next);
  return h('main', { class: 'page', id: 'main' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-copy' },
        h('p', { class: 'eyebrow' }, 'Unit · Canada’s Political System'),
        h('h1', {}, 'Who has power in Canada, and how do they use it?'),
        h('p', { class: 'lede' }, 'Five lessons and five activities about who makes decisions, how laws are made and how rights are protected.'),
        h('div', { class: 'hero-actions' },
          next ? h('button', { class: 'btn primary big', onclick: () => navigate({ name: 'lesson', id: next.id }) }, nextIndex > 0 && bestStars({ lessonId: ls[0].id }) ? `Continue: Lesson ${nextIndex + 1}` : 'Start Lesson 1', ' →') : null,
          h('button', { class: 'btn ghost big', onclick: () => navigate({ name: 'escape' }) }, 'Play the escape room'))),
      parliament()),

    escapeFeature(),

    h('section', { class: 'block', id: 'lessons', 'aria-labelledby': 'lessons-h' },
      h('div', { class: 'block-head' }, h('h2', { id: 'lessons-h' }, 'Lessons'), h('p', {}, 'Go in order. Each lesson builds on the one before.')),
      ls.length
        ? h('ol', { class: 'order-paper' }, ls.map((l, i) => lessonRow(l, i)))
        : h('p', { class: 'empty' }, 'The lessons have been removed. A teacher can restore them in the teacher tools.')),

    h('section', { class: 'block', id: 'activities', 'aria-labelledby': 'act-h' },
      h('div', { class: 'block-head' }, h('h2', { id: 'act-h' }, 'Activities'), h('p', {}, 'Practise any time. Play again to earn more stars.')),
      h('div', { class: 'activity-grid' }, activities().map(activityTile))),

    h('section', { class: 'block teacher-strip' },
      h('div', {}, h('h2', {}, 'For teachers'), h('p', {}, `Every lesson and activity is linked to Grade 9 outcome ${DEMO_OUTCOME_ID} of the June 2026 draft Social Studies (7–9) curriculum. See the official wording, or open the teacher tools to adjust supports, edit lessons and review evidence.`)),
      h('div', { class: 'strip-actions' },
        h('button', { class: 'btn ghost', onclick: () => navigate({ name: 'teachers' }) }, 'Curriculum connections'),
        h('a', { class: 'btn ghost', href: 'teacher.html' }, 'Open teacher tools'))));
}

function escapeFeature() {
  const n = bestStars({ activityId: ESCAPE_GAME.id });
  return h('section', { class: 'escape-feature', 'aria-labelledby': 'esc-feat-h' },
    h('div', { class: 'escape-feature-art', 'aria-hidden': 'true' }, h('span', {}, '🗺️'), h('span', {}, '🔐'), h('span', {}, '📜'), h('span', {}, '⚖️'), h('span', {}, '🚪')),
    h('div', { class: 'escape-feature-copy' },
      h('p', { class: 'eyebrow' }, 'Escape room · 5 rooms'),
      h('h2', { id: 'esc-feat-h' }, ESCAPE_GAME.title),
      h('p', {}, 'Locked inside Parliament! Look around each room, search for clues, fill your backpack and use what you learned to unlock the doors. No timer, and hints are always there.'),
      h('div', { class: 'hero-actions' }, n ? stars(n) : null, h('button', { class: 'btn primary big', onclick: () => navigate({ name: 'escape' }) }, n ? 'Play again' : 'Play now', ' →'))));
}

function escapeView() {
  return h('main', { class: 'page play escape-page', id: 'main' },
    h('div', { class: 'play-top' },
      h('button', { class: 'text-link back', onclick: () => navigate({ name: 'home' }) }, '← Home'),
      h('span', { class: 'play-label' }, 'Escape room')),
    renderEscape(ESCAPE_GAME, { onExit: () => navigate({ name: 'home' }) }));
}

function parliament() {
  const part = (cls, sym, name, role) => h('div', { class: `chamber ${cls}` }, h('span', { class: 'chamber-sym', 'aria-hidden': 'true' }, sym), h('strong', {}, name), h('span', {}, role));
  return h('figure', { class: 'parliament', role: 'img', 'aria-label': 'Canada’s Parliament has three parts: the Crown, the Senate and the House of Commons. All three must approve a law.' },
    h('figcaption', {}, 'Parliament has three parts'),
    h('div', { class: 'chambers' },
      part('crown', '👑', 'The Crown', 'Gives Royal Assent'),
      part('senate', '🏛️', 'Senate', 'Reviews laws'),
      part('commons', '🗳️', 'House of Commons', 'Elected MPs make laws')),
    h('p', { class: 'chamber-note' }, 'All three must approve a law.'));
}

function lessonRow(l, i) {
  const n = bestStars({ lessonId: l.id });
  const summary = (l.essentialConcepts || [])[0]?.plainText || '';
  const linkedActs = ACTIVITIES.filter((a) => a.lessonId === l.id);
  return h('li', { class: `lesson-row${n ? ' is-done' : ''}` },
    h('span', { class: 'lesson-num', 'aria-hidden': 'true' }, String(i + 1)),
    h('div', { class: 'lesson-body' },
      h('h3', {}, h('span', { class: 'sr' }, `Lesson ${i + 1}: `), l.title),
      summary ? h('p', {}, summary) : null,
      linkedActs.length ? h('p', { class: 'row-meta' }, 'Practise with: ', linkedActs.map((a, k) => [k ? ', ' : '', h('button', { class: 'text-link', onclick: () => navigate({ name: 'activity', id: a.id }) }, a.title)])) : null),
    h('div', { class: 'lesson-side' },
      n ? stars(n) : h('span', { class: 'not-started' }, 'Not started'),
      h('button', { class: `btn ${n ? 'ghost' : 'primary'}`, onclick: () => navigate({ name: 'lesson', id: l.id }) }, n ? 'Do again' : 'Start')));
}

function activityTile(a) {
  const n = bestStars({ activityId: a.id });
  const lesson = lessons().find((l) => l.id === a.lessonId);
  return h('article', { class: 'activity-tile' },
    h('span', { class: 'tile-icon', 'aria-hidden': 'true' }, a.icon),
    h('h3', {}, a.title),
    h('p', {}, a.blurb),
    h('p', { class: 'row-meta' }, lesson ? `Goes with Lesson ${lessons().indexOf(lesson) + 1}` : 'Covers all five lessons'),
    h('div', { class: 'tile-foot' }, n ? stars(n) : h('span', { class: 'not-started' }, 'New'), h('button', { class: 'btn primary', onclick: () => navigate({ name: 'activity', id: a.id }) }, n ? 'Play again' : 'Play')));
}

// --- lesson / activity ------------------------------------------------------

function playView(item, isActivity) {
  const ls = lessons();
  const idx = ls.findIndex((l) => l.id === item.id);
  const finish = (result, restart) => {
    const nextLesson = !isActivity && ls[idx + 1];
    const practice = !isActivity && ACTIVITIES.find((a) => a.lessonId === item.id);
    return h('div', { class: 'finish-card' },
      h('p', { class: 'finish-stars' }, stars(result.stars)),
      h('h2', {}, isActivity ? 'Activity complete!' : 'Lesson complete!'),
      h('p', {}, result.scored ? `You got ${result.firstTry} of ${result.scored} on the first try.` : `You finished “${item.title}”.`),
      h('div', { class: 'finish-actions' },
        h('button', { class: 'btn ghost big', onclick: restart }, 'Do it again'),
        practice ? h('button', { class: 'btn ghost big', onclick: () => navigate({ name: 'activity', id: practice.id }) }, `Practise: ${practice.title}`) : null,
        nextLesson
          ? h('button', { class: 'btn primary big', onclick: () => navigate({ name: 'lesson', id: nextLesson.id }) }, `Next: Lesson ${idx + 2} →`)
          : h('button', { class: 'btn primary big', onclick: () => navigate({ name: 'home', anchor: isActivity ? 'activities' : 'lessons' }) }, isActivity ? 'More activities →' : 'All lessons →')));
  };
  const player = renderPlayer(item.id, currentStep, { site: true, lesson: isActivity ? item : undefined, renderFinish: finish, onStep: (i) => (currentStep = i) });
  return h('main', { class: 'page play', id: 'main' },
    h('div', { class: 'play-top' },
      h('button', { class: 'text-link back', onclick: () => navigate({ name: 'home', anchor: isActivity ? 'activities' : 'lessons' }) }, '← ', isActivity ? 'All activities' : 'All lessons'),
      h('span', { class: 'play-label' }, isActivity ? 'Activity' : `Lesson ${idx + 1} of ${ls.length}`)),
    player);
}

// --- teachers ---------------------------------------------------------------

function teachers() {
  const body = h('div', { class: 'teacher-body' }, h('p', {}, 'Loading the curriculum…'));
  loadCurriculum().then((v) => {
    clear(body);
    const o = v?.outcomes.find((x) => x.id === DEMO_OUTCOME_ID);
    if (!o) {
      body.append(h('p', { class: 'notice' }, 'The curriculum file could not be loaded. Open the teacher tools and load the June 2026 draft.'));
      return;
    }
    const verified = getState().versions.find((x) => x.id === v.id)?.outcomes.find((x) => x.id === DEMO_OUTCOME_ID)?.verified;
    body.append(
      h('div', { class: verified ? 'notice ok' : 'notice' }, verified
        ? `${DEMO_OUTCOME_ID} has been checked against the source document in the teacher tools on this device.`
        : `${DEMO_OUTCOME_ID} has not yet been checked against the source document on this device. Teachers can verify it in Teacher tools → Curriculum → Review.`),
      h('blockquote', { class: 'official' },
        h('p', { class: 'src' }, `${v.label} · ${v.sourceName} · p. ${o.sourcePage}`),
        h('p', {}, h('strong', {}, 'Organizing Idea: '), o.organizingIdea),
        h('p', {}, h('strong', {}, 'Guiding Question: '), o.guidingQuestion),
        h('p', { class: 'lo' }, h('strong', {}, 'Learning Outcome: '), o.text),
        h('p', {}, h('strong', {}, 'Understanding: '), o.understanding.map((s) => s.text).join(' '))),
      h('p', { class: 'muted' }, 'The June 2026 curriculum is a draft for optional classroom piloting in 2026–27 and may be revised. Wording is shown exactly as extracted from the source.'),
      h('h3', {}, 'What each lesson and activity covers'),
      [...lessons(), ESCAPE_GAME, ...activities()].map((item) => {
        const ids = item.curriculumLinks?.statementIds || [];
        return h('details', { class: 'coverage' },
          h('summary', {}, h('strong', {}, item.title), h('span', { class: 'muted' }, ` · ${ids.length} statements`)),
          h('ul', {}, ids.map((id) => {
            const f = findStatement(v, id);
            return h('li', {}, h('code', {}, id), ' ', f ? h('span', {}, h('em', {}, `${STATEMENT_TYPES[f.type].label}: `), f.statement.text) : 'not found in this version');
          })));
      })
    );
  });
  const evidenceCount = getState().evidence.length;
  return h('main', { class: 'page', id: 'main' },
    h('section', { class: 'block' },
      h('div', { class: 'block-head' }, h('h1', {}, 'Curriculum connections'), h('p', {}, 'Official Grade 9 wording for this unit, and the statements each lesson and activity addresses.')),
      body,
      h('div', { class: 'notice' },
        `This browser has ${evidenceCount} saved response${evidenceCount === 1 ? '' : 's'}. Responses stay on this device. Review them in the teacher tools (Evidence). Lessons there are adapted pathways: completing them is not, by itself, full achievement of the Grade 9 outcome.`),
      h('div', { class: 'strip-actions' }, h('a', { class: 'btn primary', href: 'teacher.html' }, 'Open teacher tools'), h('button', { class: 'btn ghost', onclick: () => navigate({ name: 'home' }) }, 'Back to the site'))));
}

// --- supports drawer --------------------------------------------------------

function openSupports() {
  const p = withDefaults(getState().profile);
  getState().profile = p;
  const save = () => update(() => {});
  const radio = (name, value, options, onPick) =>
    h('fieldset', { class: 'seg' },
      h('legend', {}, name),
      h('div', { class: 'seg-row' }, options.map((o) => {
        const id = `sup-${name.replace(/\W+/g, '')}-${o.id}`;
        const input = h('input', { type: 'radio', name, id, value: String(o.id), checked: String(value) === String(o.id) });
        input.addEventListener('change', () => (onPick(o.id), save()));
        return h('label', { for: id }, input, h('span', {}, o.label));
      })));
  const toggle = (label, checked, onChange) => {
    const id = `sup-${label.replace(/\W+/g, '')}`;
    const cb = h('input', { type: 'checkbox', id, checked });
    cb.addEventListener('change', () => (onChange(cb.checked), save()));
    return h('label', { class: 'toggle', for: id }, cb, h('span', {}, label));
  };
  const dlg = h('dialog', { class: 'supports', 'aria-labelledby': 'sup-h' },
    h('div', { class: 'sup-head' }, h('h2', { id: 'sup-h' }, 'Supports'), h('button', { class: 'text-link', onclick: () => dlg.close() }, 'Done')),
    h('p', { class: 'muted' }, 'For the teacher or helper. These settings are shared with the teacher tools on this device and apply to every lesson.'),
    radio('Read aloud', p.narration, [{ id: 'off', label: 'Off' }, { id: 'on-demand', label: '🔊 button' }, { id: 'auto', label: 'Automatic' }], (v) => (p.narration = v)),
    radio('Text', p.textSupport, TEXT_SUPPORT_OPTIONS.map((o) => ({ id: o.id, label: o.label })), (v) => (p.textSupport = v)),
    radio('Text size', p.fontScale, [{ id: 1, label: 'Standard' }, { id: 1.2, label: 'Large' }, { id: 1.45, label: 'Extra large' }], (v) => (p.fontScale = Number(v))),
    radio('Answer choices', p.choicesPerQuestion, [{ id: 2, label: '2' }, { id: 3, label: '3' }, { id: 4, label: '4' }], (v) => (p.choicesPerQuestion = Number(v))),
    radio('Steps', p.pacing, [{ id: 'one-step', label: 'One small part at a time' }, { id: 'section', label: 'One step at a time' }], (v) => (p.pacing = v)),
    toggle('High contrast', p.highContrast, (v) => (p.highContrast = v)),
    toggle('Reduce motion', p.reduceMotion, (v) => (p.reduceMotion = v)),
    h('p', { class: 'muted' }, 'More options, including response methods and individual goals, are in Teacher tools → Student settings.'));
  dlg.addEventListener('close', () => {
    dlg.remove();
    render();
  });
  document.body.append(dlg);
  dlg.showModal();
}

// --- render -----------------------------------------------------------------

function render() {
  const p = withDefaults(getState().profile);
  document.documentElement.style.setProperty('--scale', p.fontScale);
  document.body.classList.toggle('hc', p.highContrast);
  document.body.classList.toggle('calm', p.reduceMotion);
  clear(app);
  app.append(header());
  if (view.name === 'lesson') {
    const l = lessons().find((x) => x.id === view.id);
    app.append(l ? playView(l, false) : home());
  } else if (view.name === 'activity') {
    const a = activities().find((x) => x.id === view.id);
    app.append(a ? playView(a, true) : home());
  } else if (view.name === 'escape') app.append(escapeView());
  else if (view.name === 'teachers') app.append(teachers());
  else app.append(home());
  app.append(h('footer', { class: 'site-foot' }, h('p', {}, `Aligned to Grade 9 outcome ${DEMO_OUTCOME_ID}, Draft Social Studies (7–9) Curriculum, June 2026. Progress is saved in this browser only.`)));
}

view = fromToken(location.hash.slice(1));
render();
if (view.anchor) document.getElementById(view.anchor)?.scrollIntoView();
