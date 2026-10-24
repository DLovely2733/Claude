// Accessible lesson generation.
//
// The generator builds a structured draft from the *verbatim* statements the
// teacher selected. It does not invent curriculum content: anything that needs
// subject knowledge (plain-language explanations, decision options) is left as
// a clearly marked draft for the teacher to complete in the editor.

import { findOutcome, findStatement, areasOf } from './curriculum/model.js';
import { withDefaults, RESPONSE_MODES } from './profile.js';
import { uid } from './util.js';

const SYMBOLS = {
  government: '🏛️', federal: '🍁', provincial: '🏔️', municipal: '🏘️', law: '📜', laws: '📜', vote: '🗳️', citizen: '🧑', citizens: '🧑‍🤝‍🧑',
  rights: '⚖️', responsibilities: '🤝', war: '🎖️', trade: '🚢', city: '🏙️', cities: '🏙️', immigration: '✈️', population: '👥',
  industry: '🏭', industries: '🏭', constitution: '📘', community: '🏘️', decision: '🤔', decisions: '🤔', parliament: '🏛️', peace: '🕊️',
  school: '🏫', schools: '🏫', map: '🗺️', money: '💲', economy: '💲', family: '👪', culture: '🎨', multiculturalism: '🌍', treaty: '📜', treaties: '📜',
};

export function symbolFor(word) {
  return SYMBOLS[String(word).toLowerCase()] || '🔹';
}

const COMMON = new Set('about after also among because before between canada canadian canadians could during each effect effects examples including influence other over people should such their these those through under understanding various within would which while where what how and the for with that this from into time ways way been were being'.split(' '));

/** Pick candidate key vocabulary from a curriculum statement (draft only). */
export function extractKeywords(text, max = 3) {
  const words = String(text).match(/[A-Za-z][A-Za-z'’-]+/g) || [];
  const scored = new Map();
  words.forEach((w, i) => {
    const lw = w.toLowerCase().replace(/[’']s$/, '');
    if (lw.length < 5 || COMMON.has(lw)) return;
    const score = (SYMBOLS[lw] ? 3 : 0) + (/^[A-Z]/.test(w) && i > 0 ? 1 : 0) + lw.length / 10;
    scored.set(lw, Math.max(scored.get(lw) || 0, score));
  });
  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => ({ word, symbol: symbolFor(word), meaning: '' }));
}

/**
 * @param {object} opts
 * @param {object} opts.version curriculum version
 * @param {string} opts.outcomeId
 * @param {string[]} opts.statementIds selected K/U/S statement ids
 * @param {object} opts.profile individualization profile
 * @param {string[]} [opts.goalIds] profile goals to attach
 * @param {string} [opts.title]
 * @param {string} [opts.classActivity] what classmates are doing
 */
export function generateLesson({ version, outcomeId, statementIds, profile, goalIds = [], title, classActivity = '' }) {
  const outcome = findOutcome(version, outcomeId);
  if (!outcome) throw new Error(`Outcome ${outcomeId} not found in ${version?.label}`);
  const p = withDefaults(profile);
  const selected = statementIds.map((id) => findStatement(version, id)).filter(Boolean);
  const byType = (t) => selected.filter((s) => s.type === t);

  const concepts = [...byType('understanding'), ...byType('knowledge')].map((s) => ({
    id: uid('c'),
    text: s.statement.text,
    plainText: '',
    statementIds: [s.statement.id],
    keywords: extractKeywords(s.statement.text),
    needsReview: true,
  }));

  const steps = [];
  steps.push({
    id: uid('s'),
    kind: 'connect',
    title: 'What my class is learning',
    text: `My class is working on this learning outcome: “${outcome.text}”`,
    plainText: '',
    narration: '',
    visual: { type: 'keyword-cards', alt: 'Key words for this lesson' },
    keywords: concepts.flatMap((c) => c.keywords).slice(0, 4),
    statementIds: [],
    conceptIds: concepts.map((c) => c.id),
    needsReview: true,
  });

  for (const c of concepts) {
    steps.push({
      id: uid('s'),
      kind: 'teach',
      title: c.keywords[0] ? `Learn: ${c.keywords[0].word}` : 'Learn',
      text: c.text,
      plainText: '',
      narration: '',
      visual: { type: 'keyword-cards', alt: `Key words: ${c.keywords.map((k) => k.word).join(', ')}` },
      keywords: c.keywords,
      chunks: [],
      statementIds: [],
      conceptIds: [c.id],
      needsReview: true,
    });
  }

  // Vocabulary practice built only from the selected statements' wording.
  const vocab = concepts.flatMap((c) => c.keywords.slice(0, 2).map((k) => ({ ...k, conceptId: c.id })));
  if (concepts.length >= 2 && vocab.length >= 2) {
    steps.push({
      id: uid('s'),
      kind: 'practice',
      title: 'Practice: sort the words',
      text: 'Put each word with the idea it belongs to.',
      plainText: '',
      narration: '',
      repeat: p.practiceRounds,
      interaction: {
        type: 'sort',
        prompt: 'Which idea does each word go with?',
        categories: concepts.slice(0, 3).map((c, i) => ({ id: c.id, label: `Idea ${i + 1}`, detail: c.text, symbol: c.keywords[0]?.symbol || '🔹' })),
        items: vocab.filter((v) => concepts.slice(0, 3).some((c) => c.id === v.conceptId)).map((v) => ({ id: uid('i'), label: v.word, symbol: v.symbol, categoryId: v.conceptId })),
      },
      statementIds: [],
      conceptIds: concepts.slice(0, 3).map((c) => c.id),
      needsReview: true,
    });
  }

  for (const s of byType('skills')) {
    steps.push({
      id: uid('s'),
      kind: 'practice',
      title: 'Guided practice',
      text: s.statement.text,
      plainText: '',
      narration: '',
      chunks: ['I watch my teacher do it.', 'We do it together.', 'I try it myself.'],
      repeat: p.practiceRounds,
      interaction: { type: 'respond', prompt: 'Show what you did.' },
      statementIds: [s.statement.id],
      conceptIds: [],
      needsReview: true,
    });
  }

  steps.push({
    id: uid('s'),
    kind: 'apply',
    title: 'Use what you learned',
    text: 'Teacher: describe a real situation connected to this outcome and the choices the student can make.',
    plainText: '',
    narration: '',
    interaction: {
      type: 'decision',
      prompt: 'What would you choose?',
      options: [
        { id: uid('o'), label: 'Option A (teacher to edit)', symbol: '🅰️', detail: '' },
        { id: uid('o'), label: 'Option B (teacher to edit)', symbol: '🅱️', detail: '' },
      ],
      reasonPrompt: 'Why?',
      reasons: [],
    },
    statementIds: selected.filter((s) => s.type !== 'knowledge').map((s) => s.statement.id).slice(0, 2),
    conceptIds: concepts.slice(0, 1).map((c) => c.id),
    needsReview: true,
  });

  const modes = RESPONSE_MODES.map((m) => m.id).filter((m) => p.responseModes.includes(m));
  steps.push({
    id: uid('s'),
    kind: 'check',
    title: 'Show what you know',
    text: 'Show one thing you learned today.',
    plainText: '',
    narration: '',
    interaction: { type: 'respond', prompt: 'Show one thing you learned.' },
    statementIds: [],
    conceptIds: concepts.map((c) => c.id),
  });

  const goals = p.goals.filter((g) => goalIds.includes(g.id));
  const criteria = [
    ...concepts.map((c) => ({
      id: uid('cr'),
      kind: 'adapted-outcome',
      text: `Demonstrates the essential concept (with the support level recorded): ${c.plainText || c.text}`,
      statementIds: c.statementIds,
      goalIds: [],
    })),
    ...goals.map((g) => ({ id: uid('cr'), kind: 'individual-goal', text: g.text, statementIds: [], goalIds: [g.id] })),
  ];

  return {
    id: uid('lesson'),
    title: title || `Lesson: ${outcome.guidingQuestion || outcome.text.slice(0, 60)}`,
    unit: areasOf(outcome)[0] || null,
    curriculumVersionId: version.id,
    curriculumVersionLabel: version.label,
    curriculumLinks: { outcomeIds: [outcome.id], statementIds: selected.map((s) => s.statement.id) },
    classExpectations: classActivity,
    essentialConcepts: concepts,
    individualGoals: goals.map((g) => ({ id: g.id, text: g.text })),
    steps,
    demonstrationModes: modes,
    criteria,
    classConnection: classActivity,
    origin: 'generated',
    draft: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
