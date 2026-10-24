// Every learning experience in the app, with the official statements it
// addresses. Used by the coverage dashboard.

import { ACTIVITIES, reviewQuiz } from '../site/activities.js';
import { ESCAPE_GAME } from '../site/escape/rooms.js';
import { GOVERNMENT_MISSIONS, missionStatementIds } from './missions/government.js';
import { WORLDS } from './worlds.js';

export function collectExperiences(state) {
  const lessons = state.lessons || [];
  const custom = state.quest?.custom || [];
  const out = [];
  for (const l of lessons) {
    out.push({ id: l.id, kind: 'lesson', icon: '📘', title: l.title, href: `#/lesson/${l.id}`, worldId: WORLDS.find((w) => w.area === l.unit)?.id || null, statementIds: l.curriculumLinks?.statementIds || [], built: !l.draft && (l.curriculumLinks?.outcomeIds || []).length > 0 });
  }
  for (const a of [...ACTIVITIES, reviewQuiz(lessons.filter((l) => l.origin === 'demo'))]) {
    out.push({ id: a.id, kind: 'activity', icon: '🎯', title: a.title, href: `index.html#${a.id.replace(/^act-/, '')}`, worldId: 'government', statementIds: a.curriculumLinks.statementIds, built: true });
  }
  out.push({ id: ESCAPE_GAME.id, kind: 'game', icon: '🔐', title: ESCAPE_GAME.title, href: 'index.html#escape', worldId: 'government', statementIds: ESCAPE_GAME.curriculumLinks.statementIds, built: true });
  for (const m of [...GOVERNMENT_MISSIONS, ...custom]) {
    out.push({ id: m.id, kind: 'mission', icon: '🧭', title: `Quest: ${m.title}`, href: `index.html#mission-${m.id}`, worldId: m.worldId, statementIds: missionStatementIds(m, lessons), built: !m.custom || Boolean(m.approved) });
  }
  return out;
}
