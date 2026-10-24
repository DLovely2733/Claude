import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GOVERNMENT_MISSIONS, EXHIBITS, PHASES, missionStatementIds } from '../src/quest/missions/government.js';
import { SERVICES, LAW_STATIONS } from '../src/quest/scenes/government.js';
import { PROVINCES } from '../src/quest/scenes/common.js';
import { WORLDS } from '../src/quest/worlds.js';
import { computeCoverage } from '../src/quest/coverage.js';
import { collectExperiences } from '../src/quest/experiences.js';
import { generateMission } from '../src/quest/generate.js';
import { generateLesson } from '../src/generator.js';
import { DEMO_LESSONS } from '../src/demo/politicalSystemUnit.js';
import { findStatement } from '../src/curriculum/model.js';
import { DEFAULT_PROFILE } from '../src/profile.js';

const bundled = JSON.parse(readFileSync(new URL('../curriculum/draft-2026-06-ss7-9.json', import.meta.url)));
const BEATS = new Set(['goto', 'explore', 'select', 'map', 'sort3d', 'sequence3d', 'step', 'reflect']);

test('every government mission is complete, valid and curriculum-linked', () => {
  assert.equal(GOVERNMENT_MISSIONS.length, 6);
  for (const m of GOVERNMENT_MISSIONS) {
    assert.deepEqual(Object.keys(m.phases).sort(), PHASES.map((p) => p.id).sort(), m.id);
    if (m.lessonId) assert.ok(DEMO_LESSONS.find((l) => l.id === m.lessonId), m.id);
    else assert.ok(m.concepts?.length, `${m.id} has its own concepts`);
    for (const [phase, beats] of Object.entries(m.phases)) {
      assert.ok(beats.length, `${m.id}/${phase} has beats`);
      for (const b of beats) {
        assert.ok(BEATS.has(b.type), `${m.id}: ${b.type}`);
        if (b.type === 'step') assert.ok(DEMO_LESSONS.find((l) => l.id === b.lessonId)?.steps.some((s) => s.id === b.stepId), `${m.id}: ${b.stepId}`);
        if (b.type === 'explore') for (const id of b.ids) assert.ok(EXHIBITS[id], `${m.id}: exhibit ${id}`);
        if (b.type === 'select') assert.ok(b.targets.includes(b.correct) && b.targets.every((id) => EXHIBITS[id]), m.id);
        if (b.type === 'map') assert.ok(PROVINCES.some((p) => p.id === b.correct), m.id);
        if (b.type === 'sort3d') assert.ok(b.items.every((id) => SERVICES.some((s) => s.id === id)), m.id);
      }
    }
    const ids = missionStatementIds(m, DEMO_LESSONS);
    assert.ok(ids.length >= 3, `${m.id} cites statements`);
    for (const id of ids) assert.ok(findStatement(bundled, id), `${m.id}: ${id} exists`);
  }
  for (const ex of Object.values(EXHIBITS)) for (const id of ex.statementIds) assert.ok(findStatement(bundled, id), id);
  assert.equal(LAW_STATIONS.length, 7);
  assert.equal(WORLDS.length, 5);
  assert.equal(WORLDS.filter((w) => w.status === 'playable').length, 1);
});

test('coverage is computed honestly from real links', () => {
  const state = { lessons: structuredClone(DEMO_LESSONS), quest: {} };
  const cov = computeCoverage(bundled, collectExperiences(state), { worlds: WORLDS });
  assert.equal(cov.totals.statements, 147);
  assert.equal(cov.complete, false);
  const lo6 = cov.outcomes.find((o) => o.outcome.id === 'G9-LO6');
  assert.equal(lo6.counts.ready, lo6.counts.total, 'every G9-LO6 statement has a finished experience');
  for (const o of cov.outcomes.filter((x) => x.outcome.id !== 'G9-LO6')) assert.equal(o.status, 'not-built', o.outcome.id);
  // Approval only applies to statements with finished experiences.
  const someReady = lo6.statements.find((x) => x.status === 'ready').statement.id;
  const notBuilt = cov.outcomes[0].statements[0].statement.id;
  const cov2 = computeCoverage(bundled, collectExperiences(state), { worlds: WORLDS, approvals: { [someReady]: {}, [notBuilt]: {} } });
  assert.equal(cov2.totals.approved, 1);
});

test('generated missions need approval and keep curriculum links', () => {
  const v = structuredClone(bundled);
  const lesson = generateLesson({ version: v, outcomeId: 'G9-LO1', statementIds: ['G9-LO1-K1', 'G9-LO1-U1', 'G9-LO1-S1'], profile: DEFAULT_PROFILE });
  const m = generateMission(lesson);
  assert.equal(m.custom, true);
  assert.equal(m.approved, false);
  assert.equal(m.worldId, 'cities');
  for (const ph of PHASES) assert.ok(m.phases[ph.id].length, ph.id);
  const ids = missionStatementIds(m, [lesson]);
  for (const id of ['G9-LO1-K1', 'G9-LO1-U1', 'G9-LO1-S1']) assert.ok(ids.includes(id), id);
  const state = { lessons: [lesson], quest: { custom: [m] } };
  const draftCov = computeCoverage(v, collectExperiences(state), { worlds: WORLDS }).outcomes[0];
  assert.ok(draftCov.statements.find((x) => x.statement.id === 'G9-LO1-S1').status !== 'not-built');
});
