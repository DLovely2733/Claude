// Quick mission generation: turns a curriculum-linked lesson into an
// accessible six-phase mission. Runs locally from templates – no external AI
// service and no student data leaves the device. Generated missions stay
// hidden from students until the teacher approves them.

import { uid } from '../util.js';
import { WORLDS } from './worlds.js';

const PHASE_FOR_KIND = { connect: 'discover', teach: 'learn', practice: 'try', apply: 'decide', check: 'show' };

export function worldForOutcome(outcomeId) {
  return WORLDS.find((w) => w.outcomeIds[0] === outcomeId) || WORLDS.find((w) => w.outcomeIds.includes(outcomeId)) || null;
}

/** @returns mission object (custom, unapproved) */
export function generateMission(lesson, { worldId } = {}) {
  const outcomeId = lesson.curriculumLinks?.outcomeIds?.[0];
  const world = worldId ? WORLDS.find((w) => w.id === worldId) : worldForOutcome(outcomeId);
  const phases = { discover: [], learn: [], try: [], decide: [], show: [], reflect: [{ type: 'reflect' }] };
  for (const st of lesson.steps || []) {
    const phase = PHASE_FOR_KIND[st.kind] || 'learn';
    phases[phase].push({ type: 'step', lessonId: lesson.id, stepId: st.id });
  }
  // A phase with no matching lesson step gets a short transition beat.
  const order = ['discover', 'learn', 'try', 'decide', 'show'];
  for (const ph of order) if (!phases[ph].length) phases[ph].push({ type: 'goto', location: null, guide: { t: 'Let’s keep going.', p: 'Let’s keep going.' } });
  return {
    id: uid('mission'),
    custom: true,
    approved: false,
    worldId: world?.id || 'government',
    lessonId: lesson.id,
    title: lesson.title,
    icon: '🧩',
    goal: { t: lesson.classConnection || lesson.title, p: lesson.title },
    createdAt: new Date().toISOString(),
    phases,
  };
}
