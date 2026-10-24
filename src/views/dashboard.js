import { h, toast, modal, download, badge } from '../ui.js';
import { getState, activeVersion, exportBackup, importBackup, resetAll } from '../store.js';
import { rerender } from '../router.js';
import { loadBundledCurriculum } from './curriculum.js';
import { CONTENT_AREAS, TARGET_CURRICULUM, OFFICIAL_SOURCES, areasOf } from '../curriculum/model.js';
import { alignmentFor, statusBadge, pageHeader } from './common.js';

export function renderDashboard() {
  const s = getState();
  const v = activeVersion();
  const results = s.lessons.map((l) => ({ l, r: alignmentFor(l) }));
  const counts = { verified: 0, partial: 0, unverified: 0 };
  for (const { r } of results) counts[r.status]++;
  const g9 = v ? v.outcomes.filter((o) => o.grade === 9 || o.grade == null) : [];

  const fileInput = h('input', { type: 'file', accept: '.json', hidden: true });
  fileInput.addEventListener('change', async () => {
    try {
      importBackup(await fileInput.files[0].text());
      toast('Backup restored.', 'info');
      rerender();
    } catch (e) {
      toast(e.message, 'error');
    }
  });

  return h(
    'section',
    {},
    pageHeader('Teacher dashboard', `${TARGET_CURRICULUM.title} – ${TARGET_CURRICULUM.status}`),
    h('div', { class: 'stat-row' },
      stat('Curriculum', v ? v.label : 'Not uploaded', v ? 'ok' : 'error', v ? `${g9.filter((o) => o.verified).length}/${g9.length} Grade 9 outcomes verified` : 'Upload the official draft', '#/curriculum'),
      stat('Lessons', String(s.lessons.length), 'neutral', `${counts.verified} verified · ${counts.partial} need review · ${counts.unverified} unlinked`, '#/lessons'),
      stat('Evidence', String(s.evidence.length), 'neutral', `${s.ratings.length} teacher ratings`, '#/evidence'),
      stat('Student settings', s.profile.studentName || 'Not personalised', 'neutral', `${(s.profile.goals || []).length} individualized goal(s)`, '#/settings')),

    h('div', { class: 'card' },
      h('h2', {}, 'Getting started'),
      h('ol', { class: 'checklist' },
        step(Boolean(s.versions.length), h('span', {}, 'Load the June 2026 draft Grade 7–9 Social Studies curriculum (', OFFICIAL_SOURCES.map((x, i) => [i ? ', ' : '', h('a', { href: x.url, target: '_blank', rel: 'noopener' }, x.label)]), '). ', s.versions.length ? null : h('button', { class: 'small', onclick: loadBundledCurriculum }, 'Load June 2026 draft'))),
        step(g9.length > 0 && g9.every((o) => o.verified), h('span', {}, 'Review extracted Grade 9 outcomes against the source and assign content areas. ', v ? h('a', { href: `#/curriculum/review/${v.id}` }, 'Review →') : null)),
        step(Boolean(s.profile.studentName || (s.profile.goals || []).length), h('span', {}, 'Set the student’s supports and individualized goals. ', h('a', { href: '#/settings' }, 'Settings →'))),
        step(results.some(({ l, r }) => l.origin === 'demo' && r.status === 'verified'), h('span', {}, 'Verify G9-LO6 so the five “Canada’s Political System” demo lessons have a verified connection. ', h('a', { href: '#/lessons' }, 'Lessons →'))),
        step(s.lessons.some((l) => l.origin === 'generated'), h('span', {}, 'Create a lesson from any Grade 9 outcome. ', h('a', { href: '#/new-lesson' }, 'New lesson →'))))),

    h('h2', {}, 'Content areas'),
    h('div', { class: 'area-grid' }, CONTENT_AREAS.map((a) => {
      const ls = results.filter(({ l }) => l.unit === a.id);
      const outs = g9.filter((o) => areasOf(o).includes(a.id));
      return h('div', { class: 'card area' },
        h('h3', {}, a.name),
        h('p', { class: 'help' }, a.scope),
        h('p', {}, badge(`${outs.length} outcome(s)`, outs.length ? 'ok' : 'warn'), ' ', badge(`${ls.length} lesson(s)`, 'neutral')),
        ls.length ? h('ul', { class: 'mini' }, ls.map(({ l, r }) => h('li', {}, h('a', { href: `#/lesson/${l.id}` }, l.title), ' ', statusBadge(r)))) : null);
    })),

    h('div', { class: 'card' },
      h('h2', {}, 'Data'),
      h('p', { class: 'help' }, 'Everything is stored in this browser only. Export a backup regularly, and to move to another device.'),
      h('div', { class: 'row-actions' },
        h('button', { onclick: () => download(`grade9-ss-backup-${new Date().toISOString().slice(0, 10)}.json`, exportBackup()) }, 'Export backup'),
        h('button', { class: 'ghost', onclick: () => fileInput.click() }, 'Import backup'),
        fileInput,
        h('button', { class: 'ghost danger', onclick: () => modal('Reset everything?', h('p', {}, 'All curriculum versions, lessons, settings and evidence in this browser will be deleted.'), [
          { label: 'Cancel', class: 'ghost', onClick: (c) => c() },
          { label: 'Reset', class: 'danger', onClick: (c) => (resetAll(), c(), rerender()) },
        ]) }, 'Reset all data'))),

    s.log.length ? h('details', { class: 'card' }, h('summary', {}, 'Activity log'), h('ul', {}, s.log.slice(0, 30).map((x) => h('li', {}, `${x.at.slice(0, 16).replace('T', ' ')} – ${x.message}`)))) : null
  );
}

function stat(label, value, tone, detail, href) {
  return h('a', { class: `stat card tone-${tone}`, href }, h('small', {}, label), h('strong', {}, value), h('span', {}, detail));
}

function step(done, content) {
  return h('li', { class: done ? 'done' : '' }, h('span', { class: 'tick', 'aria-label': done ? 'Done' : 'To do' }, done ? '✔' : '○'), ' ', content);
}
