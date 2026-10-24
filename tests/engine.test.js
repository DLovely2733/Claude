import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCurriculumText, layoutPdfPages, parseCurriculumJson, htmlToText } from '../src/curriculum/parser.js';
import { diffVersions, lessonImpact } from '../src/curriculum/diff.js';
import { checkAlignment } from '../src/alignment.js';
import { generateLesson } from '../src/generator.js';
import { suggestOutcomes, migrateLesson } from '../src/linking.js';
import { suggestContentAreas } from '../src/curriculum/model.js';
import { DEMO_LESSONS } from '../src/demo/politicalSystemUnit.js';
import { limitChoices, DEFAULT_PROFILE } from '../src/profile.js';
import { clone } from '../src/util.js';
import { SAMPLE_TEXT, samplePdfPages, officialLayoutPages } from './fixtures.js';
import { readFileSync } from 'node:fs';
import { findStatement } from '../src/curriculum/model.js';

const bundled = JSON.parse(readFileSync(new URL('../curriculum/draft-2026-06-ss7-9.json', import.meta.url)));

const version = (id, outcomes, label = id) => ({ id, label, outcomes });

test('parser keeps structure, grade and verbatim wording', () => {
  const { outcomes, stats } = parseCurriculumText(SAMPLE_TEXT);
  assert.deepEqual(stats.grades, [8, 9]);
  const g9 = outcomes.filter((o) => o.grade === 9);
  assert.equal(g9.length, 2);
  const [a, b] = g9;
  assert.equal(a.id, 'G9-LO1');
  assert.equal(a.organizingIdea, 'Fixture Idea: Test Systems');
  assert.equal(a.guidingQuestion, 'How do test governments make test decisions?');
  assert.equal(a.text, 'Students examine fixture structures of a test government.');
  assert.equal(a.knowledge.length, 3);
  assert.equal(a.knowledge[0].text, 'Fixture levels of test government include alpha, beta and gamma.');
  assert.equal(a.knowledge[2].level, 2);
  assert.equal(a.skills.length, 2);
  assert.equal(a.knowledge[0].id, 'G9-LO1-K1');
  // Unlabelled outcome after a guiding question
  assert.equal(b.text, 'Students explain the fixture law process.');
  assert.equal(b.guidingQuestion, 'How are test laws created?');
  assert.equal(b.knowledge.length, 2, 'un-bulleted capitalised lines are separate statements');
  assert.ok(outcomes.every((o) => o.verified === false), 'nothing is verified until the teacher checks it');
});

test('parser warns instead of inventing missing parts', () => {
  const { outcomes, warnings } = parseCurriculumText('Grade 9\nLearning Outcome\nStudents do a fixture thing.\nKnowledge\n• Fixture k');
  assert.equal(outcomes.length, 1);
  assert.ok(warnings.some((w) => /Understanding/.test(w)));
  assert.ok(warnings.some((w) => /Skills/.test(w)));
  assert.equal(outcomes[0].understanding.length, 0);
});

test('PDF layout separates K/U/S columns, spans pages and drops running headers', () => {
  const lines = layoutPdfPages(samplePdfPages());
  const texts = lines.map((l) => l.text);
  assert.ok(!texts.includes('Fixture Running Header'));
  assert.ok(!texts.includes('7'));
  const { outcomes } = parseCurriculumText(lines);
  assert.equal(outcomes.length, 2);
  const o = outcomes[0];
  assert.deepEqual(o.knowledge.map((s) => s.text), ['Fixture K one', 'Fixture K two continued text', 'Fixture K four', 'Fixture K three']);
  assert.deepEqual(o.understanding.map((s) => s.text), ['Fixture U one', 'Fixture U two']);
  assert.deepEqual(o.skills.map((s) => s.text), ['Fixture S one', 'Fixture S two']);
  assert.equal(o.knowledge[3].sourcePage, 2);
  assert.equal(outcomes[1].text, 'Students test a second fixture.');
});

test('html and json import', () => {
  const text = htmlToText('<h2>Grade 9</h2><h3>Learning Outcome</h3><p>Students fixture html.</p><h4>Knowledge</h4><ul><li>Fixture li</li></ul>');
  const { outcomes } = parseCurriculumText(text);
  assert.equal(outcomes[0].knowledge[0].text, 'Fixture li');
  const j = parseCurriculumJson({ outcomes: [{ id: 'X1', grade: 9, text: 'Fixture', knowledge: ['a'], understanding: [], skills: [] }] });
  assert.equal(j.outcomes[0].knowledge[0].id, 'X1-K1');
});

test('version diff classifies changes and maps ids', () => {
  const v1 = version('v1', parseCurriculumText(SAMPLE_TEXT).outcomes);
  const revised = SAMPLE_TEXT.replace('Fixture leaders are chosen by test voting.', 'Fixture leaders are chosen by test voting and appointment.').replace('• Order the fixture steps.\n', '• Order the fixture steps.\n• New fixture skill added.\n');
  const v2 = version('v2', parseCurriculumText(revised).outcomes);
  const d = diffVersions(v1, v2, { grade: 9 });
  assert.equal(d.summary.modified, 2);
  assert.equal(d.summary.added, 0);
  const lo1 = d.outcomes.find((o) => o.old.id === 'G9-LO1');
  assert.ok(lo1.statements.some((s) => s.status === 'modified' && s.old.id === 'G9-LO1-K2'));
  assert.equal(d.idMap['G9-LO1-K1'], 'G9-LO1-K1');

  const lesson = { curriculumLinks: { outcomeIds: ['G9-LO1'], statementIds: ['G9-LO1-K1', 'G9-LO1-K2'] } };
  const impact = lessonImpact(lesson, d);
  assert.equal(impact.issues.length, 1);
  assert.equal(impact.issues[0].status, 'modified');
});

function verifiedVersion() {
  const outcomes = parseCurriculumText(SAMPLE_TEXT).outcomes;
  for (const o of outcomes) {
    o.verified = true;
    for (const k of ['knowledge', 'understanding', 'skills']) for (const s of o[k]) s.verified = true;
  }
  return version('v1', outcomes, 'Fixture v1');
}

test('official PDF table layout: paragraphs, sub-item bullets, page continuation, footers', () => {
  const lines = layoutPdfPages(officialLayoutPages());
  assert.ok(!lines.some((l) => /Page \d/.test(l.text)), 'long running footer removed');
  const { outcomes } = parseCurriculumText(lines);
  assert.equal(outcomes.length, 2);
  const [o] = outcomes;
  assert.equal(o.organizingIdea, 'Fixture Idea: Exploring fixture things.');
  assert.equal(o.guidingQuestion, 'How do fixtures work?');
  assert.equal(o.text, 'Students examine fixtures.');
  assert.deepEqual(o.knowledge.map((x) => x.text), [
    'First fixture knowledge that wraps onto a second line.',
    'Fixture knowledge with a list, including\n• first item that wraps onto a second line\n• second item',
    'A statement that continues onto the next page.',
    'A final fixture statement.',
  ]);
  assert.deepEqual(o.understanding.map((x) => x.text), ['Fixture understanding.']);
  assert.deepEqual(o.skills.map((x) => x.text), ['Relate fixture skill one.', 'Explain fixture skill two.']);
  assert.equal(o.knowledge[3].sourcePage, 2);
});

test('bundled June 2026 Grade 9 extract matches the source document', () => {
  assert.equal(bundled.id, 'ab-ss79-draft-2026-06');
  assert.equal(bundled.outcomes.length, 7);
  assert.ok(bundled.outcomes.every((o) => o.grade === 9 && !o.verified));
  const counts = bundled.outcomes.map((o) => [o.knowledge.length, o.understanding.length, o.skills.length]);
  assert.deepEqual(counts, [[6, 1, 6], [6, 1, 4], [7, 1, 5], [22, 1, 9], [8, 1, 8], [23, 1, 9], [17, 1, 10]]);
  const lo6 = bundled.outcomes[5];
  assert.equal(lo6.text, 'Students analyze how power is distributed and exercised in Canada’s government, including how laws are made and how rights are protected.');
  assert.equal(lo6.guidingQuestion, 'How is power organized and exercised in Canada’s system of government?');
  assert.ok(lo6.knowledge[7].text.startsWith('Laws are created through a formal legislative process, including\n• bill drafting\n• first reading (introduction)'));
  for (const o of bundled.outcomes) for (const k of ['knowledge', 'understanding', 'skills']) for (const st of o[k]) assert.ok(!/Page \d+|©2026/.test(st.text), st.id);
});

test('demo lessons link to real G9-LO6 statements and are verified once the teacher verifies the outcome', () => {
  assert.deepEqual(DEMO_LESSONS.map((l) => l.title), [
    'Who makes decisions in Canada?',
    'What do federal and provincial governments do?',
    'How does an idea become a law?',
    'How do government decisions affect our communities?',
    'Apply your learning: Make a decision for your community',
  ]);
  const v = clone(bundled);
  for (const l of DEMO_LESSONS) {
    for (const id of l.curriculumLinks.statementIds) assert.ok(findStatement(v, id), `${l.id} links ${id}`);
    // Without curriculum: unverified. With unverified curriculum: needs review.
    assert.equal(checkAlignment(l, { versions: [], activeVersionId: null }).status, 'unverified');
    const r = checkAlignment(l, { versions: [v], activeVersionId: v.id });
    assert.equal(r.status, 'partial');
    assert.ok(r.warnings.some((w) => w.code === 'UNVERIFIED_OUTCOME'));
  }
  v.outcomes.find((o) => o.id === 'G9-LO6').verified = true;
  for (const l of DEMO_LESSONS) {
    const r = checkAlignment(l, { versions: [v], activeVersionId: v.id, profile: DEFAULT_PROFILE });
    assert.deepEqual(r.warnings.filter((w) => w.level !== 'info'), [], l.title);
    assert.equal(r.status, 'verified');
    assert.ok(r.trace.every((t) => t.statements.length && t.statements.every((x) => x.outcomeId === 'G9-LO6')));
  }
});

test('generated lesson traces every activity and is verified once statements are verified', () => {
  const v = verifiedVersion();
  const profile = { ...DEFAULT_PROFILE, goals: [{ id: 'g1', text: 'Fixture goal' }] };
  const lesson = generateLesson({ version: v, outcomeId: 'G9-LO1', statementIds: ['G9-LO1-K1', 'G9-LO1-U1', 'G9-LO1-S1'], profile, goalIds: ['g1'] });
  assert.equal(lesson.curriculumVersionId, 'v1');
  assert.ok(lesson.criteria.some((c) => c.kind === 'individual-goal'));
  assert.ok(lesson.criteria.some((c) => c.kind === 'adapted-outcome'));
  const r = checkAlignment(lesson, { versions: [v], activeVersionId: 'v1', profile });
  assert.deepEqual(r.warnings.filter((w) => w.code === 'UNTRACED_ACTIVITY'), []);
  assert.equal(r.status, 'verified', JSON.stringify(r.warnings));

  // Unverified outcome downgrades status
  const v2 = clone(v);
  v2.outcomes[1].verified = false;
  for (const s of v2.outcomes[1].knowledge) s.verified = false;
  assert.equal(checkAlignment(lesson, { versions: [v2], activeVersionId: 'v1' }).status, 'partial');
});

test('stale version warning and migration', () => {
  const v1 = verifiedVersion();
  const v2 = clone(v1);
  v2.id = 'v2';
  v2.label = 'Fixture v2';
  const lesson = generateLesson({ version: v1, outcomeId: 'G9-LO1', statementIds: ['G9-LO1-K1', 'G9-LO1-U1', 'G9-LO1-S1'], profile: DEFAULT_PROFILE });
  const r = checkAlignment(lesson, { versions: [v1, v2], activeVersionId: 'v2' });
  assert.ok(r.warnings.some((w) => w.code === 'STALE_VERSION'));
  const { lesson: moved, impact } = migrateLesson(lesson, diffVersions(v1, v2), v2);
  assert.ok(impact.clean);
  assert.equal(moved.curriculumVersionId, 'v2');
  assert.equal(moved.versionHistory.length, 1);
  assert.equal(checkAlignment(moved, { versions: [v1, v2], activeVersionId: 'v2' }).status, 'verified');
});

test('suggestions rank relevant outcomes and content areas', () => {
  const v = verifiedVersion();
  const s = suggestOutcomes(v, { title: 'How are fixture laws created', alignmentHint: 'fixture law process bill readings assent' });
  assert.equal(s[0].outcome.id, 'G9-LO2');
  const area = suggestContentAreas({ text: 'Students examine federal and provincial powers and legislation', organizingIdea: '', guidingQuestion: '', knowledge: [], understanding: [], skills: [] });
  assert.equal(area[0].areaId, 'political-system');
});

test('limitChoices always keeps the correct answer', () => {
  const opts = [{ id: 'a' }, { id: 'b', correct: true }, { id: 'c' }, { id: 'd' }];
  for (let seed = 0; seed < 4; seed++) {
    const r = limitChoices(opts, { choicesPerQuestion: 2 }, seed);
    assert.equal(r.length, 2);
    assert.ok(r.some((o) => o.correct));
  }
});

test('escape room: five rooms with four walls each, items and curriculum links are valid', async () => {
  const { ESCAPE_GAME, ITEMS } = await import('../src/site/escape/rooms.js');
  assert.equal(ESCAPE_GAME.rooms.length, 5);
  assert.deepEqual(ESCAPE_GAME.rooms.map((r) => r.lessonId), DEMO_LESSONS.map((l) => l.id));
  for (const r of ESCAPE_GAME.rooms) {
    assert.deepEqual(Object.keys(r.walls).sort(), ['E', 'N', 'S', 'W'], r.id);
    assert.equal(r.hints.length, 3, r.id);
    for (const w of Object.values(r.walls)) for (const hs of w.hotspots) assert.ok(hs.x >= 0 && hs.y >= 0 && hs.x + hs.w <= 1000 && hs.y + hs.h <= 600, `${r.id} hotspot inside scene`);
  }
  for (const id of ESCAPE_GAME.curriculumLinks.statementIds) assert.ok(findStatement(bundled, id), id);
  for (const [id, it] of Object.entries(ITEMS)) assert.ok(it.name && it.symbol, id);
});
