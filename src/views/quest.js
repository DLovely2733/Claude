// Teacher tools for Canada Quest: curriculum coverage dashboard and mission
// management (assign, preview, approve, generate, review evidence).

import { h, field, select, badge, toast } from '../ui.js';
import { getState, update, activeVersion } from '../store.js';
import { rerender } from '../router.js';
import { STATEMENT_TYPES, findOutcome } from '../curriculum/model.js';
import { computeCoverage, COVERAGE_STATUS } from '../quest/coverage.js';
import { collectExperiences } from '../quest/experiences.js';
import { WORLDS, WORLD_STATUS, worldById } from '../quest/worlds.js';
import { GOVERNMENT_MISSIONS, missionStatementIds, PHASES } from '../quest/missions/government.js';
import { generateMission, worldForOutcome } from '../quest/generate.js';
import { pageHeader, empty } from './common.js';

function quest() {
  const s = getState();
  s.quest ||= { missions: {}, assigned: {}, approved: {} };
  s.quest.custom ||= [];
  return s.quest;
}

const statusBadge = (st) => badge(COVERAGE_STATUS[st].label, COVERAGE_STATUS[st].tone === 'info' ? 'neutral' : COVERAGE_STATUS[st].tone);

function evidenceFor(statementId) {
  const ev = getState().evidence.filter((e) => (e.statementIds || []).includes(statementId) && e.type !== 'hint');
  const independent = ev.filter((e) => e.correct === true && (!e.promptLevel || e.promptLevel === 'independent')).length;
  const supported = ev.filter((e) => e.promptLevel && e.promptLevel !== 'independent').length;
  return { total: ev.length, independent, supported };
}

// ---------------------------------------------------------------------------
// Coverage dashboard
// ---------------------------------------------------------------------------

const covFilter = { outcome: 'all', status: 'all' };

export function renderCoverage() {
  const s = getState();
  const v = activeVersion();
  if (!v) return empty('Load the June 2026 draft curriculum first (Curriculum → Load the June 2026 draft).', h('a', { class: 'button', href: '#/curriculum' }, 'Go to Curriculum'));
  const q = quest();
  const cov = computeCoverage(v, collectExperiences(s), { approvals: q.approved, worlds: WORLDS });
  const t = cov.totals;
  const pct = (n) => (t.statements ? Math.round((n / t.statements) * 100) : 0);
  const lessonsById = new Map(s.lessons.map((l) => [l.id, l]));

  const outcomes = cov.outcomes.filter((o) => covFilter.outcome === 'all' || o.outcome.id === covFilter.outcome);
  return h('section', {},
    pageHeader('Curriculum coverage', `${v.label}. Every Grade 9 knowledge, understanding and skills statement, and the learning experiences that address it.`),
    h('div', { class: `alert ${cov.complete ? 'info' : 'warn'}` },
      cov.complete
        ? 'Every Grade 9 statement has teacher-approved learning experiences.'
        : `Coverage is not complete. ${t['not-built']} of ${t.statements} statements have no learning experience yet, and ${t.statements - t.approved} are not yet teacher-approved. Do not report full coverage until every statement is approved.`),
    h('div', { class: 'stat-row' },
      ['not-built', 'in-development', 'ready', 'approved'].map((k) => h('div', { class: 'card stat' }, h('small', {}, COVERAGE_STATUS[k].label), h('strong', {}, `${t[k]} of ${t.statements}`), h('span', {}, `${pct(t[k])}% of statements`)))),
    h('div', { class: 'filters' },
      field('Outcome', select([{ id: 'all', label: 'All Grade 9 outcomes' }, ...cov.outcomes.map((o) => ({ id: o.outcome.id, label: `${o.outcome.id} – ${o.outcome.text.slice(0, 70)}` }))], covFilter.outcome, (x) => ((covFilter.outcome = x), rerender()))),
      field('Show statements', select([{ id: 'all', label: 'All' }, ...Object.entries(COVERAGE_STATUS).map(([id, x]) => ({ id, label: x.label }))], covFilter.status, (x) => ((covFilter.status = x), rerender())))),
    outcomes.map((o) => {
      const rows = o.statements.filter((x) => covFilter.status === 'all' || x.status === covFilter.status);
      const readyIds = o.statements.filter((x) => x.status === 'ready').map((x) => x.statement.id);
      return h('details', { class: 'card coverage-outcome', open: covFilter.outcome !== 'all' || o.outcome.id === 'G9-LO6' },
        h('summary', {},
          h('strong', {}, o.outcome.id), ' ', statusBadge(o.status), ' ',
          h('span', {}, o.outcome.text), ' ',
          h('small', { class: 'help' }, `· ${o.counts.approved} approved, ${o.counts.ready} ready, ${o.counts['in-development']} in development, ${o.counts['not-built']} not built · World: ${o.worldIds.map((id) => worldById(id).name).join(', ') || '—'}`)),
        h('p', { class: 'help' }, h('strong', {}, 'Guiding question: '), o.outcome.guidingQuestion),
        readyIds.length ? h('button', { class: 'small', onclick: () => {
          update((st) => { for (const id of readyIds) st.quest.approved[id] = { at: new Date().toISOString() }; }, `Approved ${readyIds.length} statements in ${o.outcome.id}`);
          toast(`${readyIds.length} statements approved.`, 'info');
          rerender();
        } }, `Approve all ${readyIds.length} statements that are ready for review`) : null,
        rows.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table coverage' },
          h('thead', {}, h('tr', {}, ['Statement', 'Learning experiences', 'Adapted pathway', 'Evidence', 'Status'].map((x) => h('th', {}, x)))),
          h('tbody', {}, rows.map((row) => {
            const st = row.statement;
            const concepts = [...new Set(row.experiences.filter((e) => e.kind === 'lesson').flatMap((e) => (lessonsById.get(e.id)?.essentialConcepts || []).filter((c) => (c.statementIds || []).includes(st.id)).map((c) => c.plainText || c.text)))];
            const ev = evidenceFor(st.id);
            const canApprove = row.status === 'ready' || row.status === 'approved';
            const cb = h('input', { type: 'checkbox', checked: row.status === 'approved', disabled: !canApprove, 'aria-label': `Approve ${st.id}` });
            cb.addEventListener('change', () => {
              update((x) => (cb.checked ? (x.quest.approved[st.id] = { at: new Date().toISOString() }) : delete x.quest.approved[st.id]), `${cb.checked ? 'Approved' : 'Un-approved'} ${st.id}`);
              rerender();
            });
            return h('tr', { class: `cov-${row.status}` },
              h('td', {}, h('code', {}, st.id), ' ', h('em', {}, STATEMENT_TYPES[row.type].label), h('div', { class: 'stmt-text' }, st.text)),
              h('td', {}, row.experiences.length ? h('ul', { class: 'mini' }, row.experiences.map((e) => h('li', {}, e.icon, ' ', h('a', { href: e.href, target: e.href.startsWith('index') ? '_blank' : null }, e.title), e.built ? '' : ' (draft)'))) : h('span', { class: 'error' }, 'None yet')),
              h('td', {}, concepts.length ? h('ul', { class: 'mini' }, concepts.map((c) => h('li', {}, c))) : '—'),
              h('td', {}, ev.total ? `${ev.total} records · ${ev.independent} independent · ${ev.supported} with support` : '—'),
              h('td', {}, statusBadge(row.status), h('label', { class: 'check' }, cb, ' Approved')));
          })))) : h('p', { class: 'help' }, 'No statements match this filter.'));
    }));
}

// ---------------------------------------------------------------------------
// Canada Quest missions
// ---------------------------------------------------------------------------

const gen = { outcomeId: null, lessonId: null };

export function renderQuestMissions() {
  const s = getState();
  const q = quest();
  const v = activeVersion();
  const missions = [...GOVERNMENT_MISSIONS, ...q.custom];

  const missionRow = (m) => {
    const lesson = s.lessons.find((l) => l.id === m.lessonId);
    const ids = missionStatementIds(m, s.lessons);
    const ev = s.evidence.filter((e) => e.activityId === m.id && e.type !== 'complete' && e.type !== 'hint');
    const indep = ev.filter((e) => e.correct === true && !e.promptLevel).length;
    const supported = ev.filter((e) => e.promptLevel).length;
    const pr = q.missions[m.id];
    const assigned = q.assigned[m.id] !== false;
    const toggle = h('input', { type: 'checkbox', checked: assigned, 'aria-label': `Assign ${m.title}` });
    toggle.addEventListener('change', () => (update((x) => (x.quest.assigned[m.id] = toggle.checked)), rerender()));
    return h('tr', {},
      h('td', {}, h('strong', {}, `${m.icon} ${m.title}`), h('br'), h('small', {}, worldById(m.worldId)?.name), m.custom ? [' ', badge(m.approved ? 'Teacher approved' : 'Awaiting approval', m.approved ? 'ok' : 'warn')] : [' ', badge('Built-in 3D', 'neutral')]),
      h('td', {}, lesson ? h('a', { href: `#/lesson/${lesson.id}` }, lesson.title) : m.lessonId ? h('span', { class: 'error' }, 'Lesson missing') : h('span', { class: 'help' }, 'Mission only (no linked lesson)')),
      h('td', {}, h('details', {}, h('summary', {}, `${ids.length} statements`), h('p', { class: 'help' }, ids.join(', ')))),
      h('td', {}, pr?.done ? `Completed (${'★'.repeat(pr.stars || 0)})` : pr?.index ? 'In progress' : 'Not started', h('br'), h('small', {}, `${ev.length} responses · ${indep} independent · ${supported} with support`)),
      h('td', { class: 'row-actions' },
        h('label', { class: 'check' }, toggle, ' Assigned'),
        h('a', { class: 'button small', href: `index.html#mission-${m.id}`, target: '_blank', rel: 'noopener' }, 'Preview as student'),
        m.custom && !m.approved ? h('button', { class: 'small', onclick: () => (update((x) => (x.quest.custom.find((c) => c.id === m.id).approved = true), `Approved mission ${m.title}`), rerender()) }, 'Approve') : null,
        m.custom ? h('button', { class: 'small ghost danger', onclick: () => (update((x) => (x.quest.custom = x.quest.custom.filter((c) => c.id !== m.id)), `Deleted mission ${m.title}`), rerender()) }, 'Delete') : null));
  };

  const g9 = v ? v.outcomes.filter((o) => o.grade === 9) : [];
  gen.outcomeId ||= g9[0]?.id || null;
  const outcomeLessons = s.lessons.filter((l) => (l.curriculumLinks?.outcomeIds || []).includes(gen.outcomeId));
  if (!outcomeLessons.some((l) => l.id === gen.lessonId)) gen.lessonId = outcomeLessons[0]?.id || null;
  const o = v && gen.outcomeId ? findOutcome(v, gen.outcomeId) : null;

  return h('section', {},
    pageHeader('Canada Quest', 'The 3D learning world. Assign missions, preview them as the student, approve teacher-made missions and review what the student did independently or with support.',
      h('a', { class: 'button', href: 'index.html#quest', target: '_blank', rel: 'noopener' }, 'Open Canada Quest')),
    h('h2', {}, 'Worlds'),
    h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, ['World', 'Status', 'Grade 9 outcomes', 'Missions'].map((x) => h('th', {}, x)))),
      h('tbody', {}, WORLDS.map((w) => h('tr', {},
        h('td', {}, `${w.icon} ${w.name}`),
        h('td', {}, badge(WORLD_STATUS[w.status].label === 'Open' ? '3D world built' : 'No 3D scene yet', WORLD_STATUS[w.status].tone)),
        h('td', {}, w.outcomeIds.join(', ')),
        h('td', {}, String(missions.filter((m) => m.worldId === w.id).length)))))),
    h('h2', {}, 'Missions'),
    h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, ['Mission', 'Lesson', 'Curriculum', 'Student progress', ''].map((x) => h('th', {}, x)))),
      h('tbody', {}, missions.map(missionRow)))),
    h('div', { class: 'card' },
      h('h2', {}, 'Create an accessible learning mission for a curriculum outcome'),
      h('p', { class: 'help' }, `Builds a six-phase mission (${PHASES.map((x) => x.label).join(', ')}) from a curriculum-linked lesson. It is generated on this device from templates; no AI service is used and no student information leaves the device. New missions stay hidden from the student until you approve them. Worlds without a 3D scene run the mission in 2D.`),
      !v ? h('p', { class: 'alert warn' }, 'Load the curriculum first.') : [
        field('Grade 9 outcome', select(g9.map((x) => ({ id: x.id, label: `${x.id} – ${x.text.slice(0, 90)}` })), gen.outcomeId, (x) => ((gen.outcomeId = x), (gen.lessonId = null), rerender()))),
        o ? h('p', { class: 'help' }, `World: ${worldForOutcome(o.id)?.name || '—'} · ${o.guidingQuestion}`) : null,
        outcomeLessons.length
          ? [field('Lesson to build from', select(outcomeLessons.map((l) => ({ id: l.id, label: `${l.title}${l.draft ? ' (draft)' : ''}` })), gen.lessonId, (x) => (gen.lessonId = x))),
             h('button', { class: 'primary', onclick: () => {
               const lesson = s.lessons.find((l) => l.id === gen.lessonId);
               const m = generateMission(lesson);
               update((x) => x.quest.custom.push(m), `Generated mission “${m.title}”`);
               toast('Mission created. Preview it, then approve it to make it available.', 'info');
               rerender();
             } }, 'Create mission')]
          : h('p', { class: 'alert warn' }, 'No lesson is linked to this outcome yet. ', h('a', { href: `#/new-lesson/${encodeURIComponent(gen.outcomeId || '')}` }, 'Create an accessible lesson for it first →'))]));
}
