// Application state, persisted in the browser (localStorage). Teachers can
// export/import a full backup as JSON. No data leaves the device.

import { DEFAULT_PROFILE } from './profile.js';
import { DEMO_LESSONS } from './demo/politicalSystemUnit.js';
import { clone } from './util.js';

const KEY = 'ab-g9-ss-accessible-v1';

function initialState() {
  return {
    schema: 1,
    versions: [], // CurriculumVersion[]
    activeVersionId: null,
    profile: clone(DEFAULT_PROFILE),
    lessons: clone(DEMO_LESSONS),
    evidence: [], // student responses captured in the player
    ratings: [], // teacher ratings against criteria
    log: [],
    quest: { missions: {}, assigned: {}, approved: {}, custom: [] }, // Canada Quest progress, assignment and approvals
  };
}

let state = load();
const listeners = new Set();

// Demo lessons saved by an earlier build (before they were linked to the
// official curriculum) are replaced unless the teacher has edited them.
function migrate(s) {
  const fresh = new Map(DEMO_LESSONS.map((l) => [l.id, l]));
  s.lessons = s.lessons.map((l) => (l.origin === 'demo' && !l.curriculumVersionId && l.updatedAt === '2026-10-23T00:00:00.000Z' && fresh.has(l.id) ? clone(fresh.get(l.id)) : l));
  return s;
}

function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return migrate({ ...initialState(), ...JSON.parse(raw) });
  } catch (e) {
    console.warn('Could not read saved data', e);
  }
  return initialState();
}

export let lastSaveError = null;

function persist() {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
    lastSaveError = null;
  } catch (e) {
    lastSaveError = e;
    console.error('Save failed', e);
  }
}

export function getState() {
  return state;
}

/** Apply a mutation and persist. */
export function update(fn, logMessage) {
  fn(state);
  if (logMessage) state.log = [{ at: new Date().toISOString(), message: logMessage }, ...state.log].slice(0, 200);
  persist();
  for (const l of listeners) l(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function activeVersion() {
  return state.versions.find((v) => v.id === state.activeVersionId) || null;
}

export function getLesson(id) {
  return state.lessons.find((l) => l.id === id) || null;
}

export function exportBackup() {
  return JSON.stringify({ exportedAt: new Date().toISOString(), app: KEY, state }, null, 2);
}

export function importBackup(json) {
  const data = JSON.parse(json);
  if (data.app !== KEY || !data.state) throw new Error('This file is not a backup from this app.');
  state = { ...initialState(), ...data.state };
  persist();
  for (const l of listeners) l(state);
}

/** Add a curriculum version (e.g. the bundled June 2026 extract). */
export function addVersion(version, logMessage) {
  if (state.versions.some((v) => v.id === version.id)) return false;
  update((s) => {
    s.versions.push(version);
    if (!s.activeVersionId) s.activeVersionId = version.id;
  }, logMessage || `Added curriculum version ${version.label}`);
  return true;
}

export function restoreDemoLessons() {
  update((s) => {
    const existing = new Set(s.lessons.map((l) => l.id));
    for (const l of clone(DEMO_LESSONS)) if (!existing.has(l.id)) s.lessons.push(l);
  }, 'Restored demonstration lessons');
}

export function resetAll() {
  state = initialState();
  persist();
  for (const l of listeners) l(state);
}
