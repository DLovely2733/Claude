import { h, clear } from './ui.js';
import { getState, subscribe, activeVersion, lastSaveError } from './store.js';
import { renderDashboard } from './views/dashboard.js';
import { renderCurriculum } from './views/curriculum.js';
import { renderSettings } from './views/settings.js';
import { renderLessons, renderLessonEditor, renderNewLesson } from './views/lessons.js';
import { renderPlayer } from './views/player.js';
import { renderEvidence } from './views/evidence.js';
import { renderPrint } from './views/print.js';
import { setRenderer } from './router.js';

// Navigation follows the development priority order of the project brief.
const NAV = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'curriculum', label: '1 · Curriculum' },
  { path: 'settings', label: '2 · Student settings' },
  { path: 'lessons', label: '3 · Lessons' },
  { path: 'student', label: '4 · Student view' },
  { path: 'evidence', label: '5 · Evidence' },
  { path: 'print', label: '6 · Print & reports' },
];

function parseRoute() {
  const [path = 'dashboard', ...params] = location.hash.replace(/^#\/?/, '').split('/');
  return { path: path || 'dashboard', params: params.map(decodeURIComponent) };
}

function renderNav(route) {
  const nav = clear(document.getElementById('nav'));
  for (const item of NAV) {
    const active = route.path === item.path || (item.path === 'lessons' && ['lesson', 'new-lesson'].includes(route.path)) || (item.path === 'student' && route.path === 'play');
    nav.append(h('a', { href: `#/${item.path}`, class: active ? 'active' : '', 'aria-current': active ? 'page' : null }, item.label));
  }
}

function renderBanner() {
  const el = clear(document.getElementById('banner'));
  const s = getState();
  if (lastSaveError) el.append(h('div', { class: 'alert error' }, 'Your work could not be saved in this browser (storage may be full). Export a backup from the Dashboard.'));
  if (!s.versions.length) {
    el.append(
      h('div', { class: 'alert error', role: 'alert' },
        h('strong', {}, 'No official curriculum loaded. '),
        'Lessons cannot be verified until you upload the June 2026 draft Grade 7–9 Social Studies curriculum (PDF or other authorized copy). ',
        h('a', { href: '#/curriculum' }, 'Upload curriculum →'))
    );
  } else if (!activeVersion()) {
    el.append(h('div', { class: 'alert warn' }, 'No curriculum version is set as active. ', h('a', { href: '#/curriculum' }, 'Choose one →')));
  }
}

function render() {
  const route = parseRoute();
  const app = clear(document.getElementById('app'));
  document.body.classList.toggle('student-mode', route.path === 'play' || route.path === 'student');
  renderNav(route);
  renderBanner();
  const [a, b] = route.params;
  let view;
  switch (route.path) {
    case 'curriculum': view = renderCurriculum(a, b); break;
    case 'settings': view = renderSettings(); break;
    case 'lessons': view = renderLessons(); break;
    case 'new-lesson': view = renderNewLesson(a); break;
    case 'lesson': view = renderLessonEditor(a); break;
    case 'student': view = renderLessons({ studentPicker: true }); break;
    case 'play': view = renderPlayer(a, b); break;
    case 'evidence': view = renderEvidence(a); break;
    case 'print': view = renderPrint(a, b); break;
    default: view = renderDashboard();
  }
  app.append(view);
}

// Views re-render on navigation. Store updates re-render only views that opt
// in (they call rerender()) so typing in an editor never loses focus.
setRenderer(render);

window.addEventListener('hashchange', () => {
  render();
  document.getElementById('app').focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
subscribe(() => renderBanner());
render();
