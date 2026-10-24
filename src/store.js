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
  };
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return { ...initialState(), ...JSON.parse(raw) };
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
