// Stand-alone practice activities for the student site. Each is played by the
// same accessible lesson player, cites the G9-LO6 statements it practises and
// files its evidence under the lesson it supports (step.sourceLessonId).

import { DEMO_LESSONS, DEMO_VERSION_ID, DEMO_VERSION_LABEL, DEMO_OUTCOME_ID } from '../demo/politicalSystemUnit.js';
import { activityStatementIds } from '../alignment.js';

const K = (n) => `G9-LO6-K${n}`;
const S = (n) => `G9-LO6-S${n}`;

function activity({ id, title, blurb, icon, lessonId, steps }) {
  const tagged = steps.map((st, i) => ({ id: `${id}-s${i + 1}`, kind: 'practice', conceptIds: [], sourceLessonId: lessonId, ...st }));
  const statementIds = [...new Set(tagged.flatMap((st) => st.statementIds || []))];
  return {
    id,
    title,
    blurb,
    icon,
    lessonId,
    origin: 'activity',
    curriculumVersionId: DEMO_VERSION_ID,
    curriculumVersionLabel: DEMO_VERSION_LABEL,
    curriculumLinks: { outcomeIds: [DEMO_OUTCOME_ID], statementIds },
    essentialConcepts: [],
    criteria: [],
    demonstrationModes: ['tap', 'sort'],
    steps: tagged,
  };
}

const FED_PROV = [
  { id: 'federal', label: 'Federal – all of Canada', symbol: '🍁' },
  { id: 'provincial', label: 'Provincial – Alberta', symbol: '🏔️' },
];

export const ACTIVITIES = [
  activity({
    id: 'act-fed-prov',
    title: 'Federal or Provincial?',
    blurb: 'Sort ten government jobs into Canada’s government and Alberta’s government.',
    icon: '🍁',
    lessonId: 'demo-ps-2',
    steps: [
      {
        kind: 'teach', title: 'Remember the two lists',
        text: 'Canada is a federal system. The federal government and the provincial governments each have their own responsibilities.',
        plainText: 'Canada 🍁 has some jobs. Alberta 🏔️ has other jobs.',
        visual: {
          type: 'jurisdiction', alt: 'Federal and provincial responsibilities',
          columns: [
            { level: 'federal', items: [['🪖', 'Defence'], ['💵', 'Banking and money'], ['🚢', 'Trade'], ['⚖️', 'Criminal law'], ['🛂', 'Citizenship']] },
            { level: 'provincial', items: [['🏫', 'Education'], ['🏥', 'Healthcare'], ['🏠', 'Property and civil rights'], ['🏘️', 'Municipalities'], ['🛢️', 'Natural resources']] },
          ],
        },
        statementIds: [K(11), K(12), K(13)],
      },
      {
        title: 'Sort round 1',
        interaction: {
          type: 'sort', prompt: 'Whose job is it?', categories: FED_PROV,
          items: [
            { id: 'defence', label: 'Defence', symbol: '🪖', categoryId: 'federal' },
            { id: 'money', label: 'Banking and money', symbol: '💵', categoryId: 'federal' },
            { id: 'education', label: 'Education', symbol: '🏫', categoryId: 'provincial' },
            { id: 'health', label: 'Healthcare', symbol: '🏥', categoryId: 'provincial' },
            { id: 'resources', label: 'Oil and gas', symbol: '🛢️', categoryId: 'provincial' },
          ],
        },
        statementIds: [K(12), K(13), S(1)],
      },
      {
        title: 'Sort round 2',
        interaction: {
          type: 'sort', prompt: 'Whose job is it?', categories: FED_PROV,
          items: [
            { id: 'trade', label: 'Trade with other countries', symbol: '🚢', categoryId: 'federal' },
            { id: 'criminal', label: 'Criminal law', symbol: '⚖️', categoryId: 'federal' },
            { id: 'citizenship', label: 'Citizenship', symbol: '🛂', categoryId: 'federal' },
            { id: 'property', label: 'Property and civil rights', symbol: '🏠', categoryId: 'provincial' },
            { id: 'towns', label: 'Towns and cities', symbol: '🏘️', categoryId: 'provincial' },
          ],
        },
        statementIds: [K(12), K(13), S(1)],
      },
      {
        title: 'Real-life check',
        interaction: {
          type: 'choice', prompt: 'Our town needs a new hospital. Which government is responsible for healthcare?',
          options: [{ id: 'p', label: 'Alberta’s government', symbol: '🏔️', correct: true }, { id: 'f', label: 'Canada’s government', symbol: '🍁' }],
          feedback: { correct: 'Yes! Healthcare is a provincial responsibility.', incorrect: 'Look for the hospital 🏥 in the lists.' },
        },
        statementIds: [K(13)],
      },
    ],
  }),

  activity({
    id: 'act-bill-law',
    title: 'Bill to Law',
    blurb: 'Put the steps of making a law in order: first the short way, then all seven official steps.',
    icon: '📜',
    lessonId: 'demo-ps-3',
    steps: [
      {
        kind: 'teach', title: 'The road to a law',
        text: 'Laws are created through a formal legislative process: bill drafting, first reading, second reading, committee stage, third reading, approval by the Senate and royal assent by the Crown.',
        plainText: 'A bill goes through many steps. Then it becomes a law.',
        visual: { type: 'steps', alt: 'Seven steps from bill drafting to royal assent', items: [['📝', 'Bill drafting'], ['📖', 'First reading'], ['🗣️', 'Second reading'], ['🔍', 'Committee stage'], ['🗳️', 'Third reading'], ['🏛️', 'Senate approval'], ['✍️', 'Royal assent']], simpleItems: [['📝', 'Write'], ['🗣️', 'Read and talk'], ['🔍', 'Check'], ['🏛️', 'Senate'], ['✍️', 'Royal assent']] },
        statementIds: [K(8)],
      },
      {
        title: 'The short way',
        interaction: { type: 'sequence', prompt: 'Put the five big steps in order.', items: [{ id: 'w', label: 'Write the bill', symbol: '📝' }, { id: 'r', label: 'Readings and debate', symbol: '🗣️' }, { id: 'c', label: 'Committee checks it', symbol: '🔍' }, { id: 's', label: 'Senate approves', symbol: '🏛️' }, { id: 'a', label: 'Royal assent', symbol: '✍️' }] },
        statementIds: [K(8)],
      },
      {
        title: 'All seven steps',
        interaction: { type: 'sequence', prompt: 'Now put all seven official steps in order.', items: [{ id: 'd', label: 'Bill drafting', symbol: '📝' }, { id: '1', label: 'First reading', symbol: '📖' }, { id: '2', label: 'Second reading (debate)', symbol: '🗣️' }, { id: 'c', label: 'Committee stage', symbol: '🔍' }, { id: '3', label: 'Third reading (final approval)', symbol: '🗳️' }, { id: 's', label: 'Approval by the Senate', symbol: '🏛️' }, { id: 'a', label: 'Royal assent by the Crown', symbol: '✍️' }] },
        statementIds: [K(8)],
      },
      {
        title: 'Who must agree?',
        interaction: { type: 'yesno', prompt: 'Must the Senate approve a bill before it becomes a federal law?', answer: true, feedback: { correct: 'Yes! The Crown, the Senate and the House of Commons must all approve laws.', incorrect: 'Look at the steps again. Find the Senate 🏛️.' } },
        statementIds: [K(3), K(9)],
      },
    ],
  }),

  activity({
    id: 'act-elected',
    title: 'Elected or Appointed?',
    blurb: 'Find out who we vote for and who is chosen, and which part of Parliament does each job.',
    icon: '🗳️',
    lessonId: 'demo-ps-1',
    steps: [
      {
        title: 'Sort the people',
        interaction: {
          type: 'sort', prompt: 'Do people vote for them, or are they appointed?',
          categories: [{ id: 'elected', label: 'Elected – people vote', symbol: '🗳️' }, { id: 'appointed', label: 'Appointed – chosen', symbol: '✋' }],
          items: [
            { id: 'mp', label: 'Member of Parliament (MP)', symbol: '🧑‍💼', categoryId: 'elected' },
            { id: 'senator', label: 'Senator', symbol: '🏛️', categoryId: 'appointed' },
            { id: 'gg', label: 'Governor General', symbol: '👑', categoryId: 'appointed' },
          ],
        },
        statementIds: [K(4), K(5), K(7)],
      },
      {
        title: 'Royal Assent',
        interaction: {
          type: 'choice', prompt: 'Who gives Royal Assent to laws?',
          options: [{ id: 'gg', label: 'The Governor General (the Crown)', symbol: '👑', correct: true }, { id: 'mp', label: 'One MP', symbol: '🧑‍💼' }, { id: 'riding', label: 'The people in a riding', symbol: '🗺️' }],
          feedback: { correct: 'Yes! The Governor General represents the Monarch and gives Royal Assent.', incorrect: 'Think about the crown 👑.' },
        },
        statementIds: [K(4)],
      },
      {
        title: 'Reviewing laws',
        interaction: {
          type: 'choice', prompt: 'Who reviews laws passed by the House of Commons?',
          options: [{ id: 'senate', label: 'The Senate', symbol: '🏛️', correct: true }, { id: 'school', label: 'The school board', symbol: '🏫' }, { id: 'gg', label: 'Nobody', symbol: '🚫' }],
          feedback: { correct: 'Yes! The Senate reviews laws passed by the House of Commons.', incorrect: 'Try again. Which part of Parliament has appointed members?' },
        },
        statementIds: [K(7)],
      },
      {
        title: 'Our riding',
        interaction: {
          type: 'choice', prompt: 'A riding elects how many Members of Parliament?',
          options: [{ id: '1', label: 'One', symbol: '1️⃣', correct: true }, { id: '10', label: 'Ten', symbol: '🔟' }, { id: '0', label: 'None', symbol: '0️⃣' }],
          feedback: { correct: 'Yes! Each riding elects one MP to represent it.', incorrect: 'Each riding has its own MP. How many?' },
        },
        statementIds: [K(6), S(3)],
      },
    ],
  }),

  activity({
    id: 'act-rights',
    title: 'Rights and Responsibilities',
    blurb: 'Sort what citizens can do (rights) and what citizens should do (responsibilities).',
    icon: '⚖️',
    lessonId: 'demo-ps-4',
    steps: [
      {
        kind: 'teach', title: 'Rights and responsibilities',
        text: 'Canadian citizens have rights, such as freedoms, equality and legal protections. They also have responsibilities, including obeying laws, participating in democracy and respecting the rights of others.',
        plainText: 'A right is something I am allowed to have. A responsibility is something I should do.',
        keywords: [{ word: 'right', symbol: '✅', meaning: 'Something every person is allowed to have' }, { word: 'responsibility', symbol: '🤝', meaning: 'Something every person should do' }],
        visual: { type: 'keyword-cards', alt: 'Cards: right and responsibility' },
        statementIds: [K(22), K(23)],
      },
      {
        title: 'Sort the cards',
        interaction: {
          type: 'sort', prompt: 'Is this a right or a responsibility?',
          categories: [{ id: 'right', label: 'Right', symbol: '✅' }, { id: 'resp', label: 'Responsibility', symbol: '🤝' }],
          items: [
            { id: 'expression', label: 'Freedom of expression', symbol: '🗣️', categoryId: 'right' },
            { id: 'equality', label: 'Equality', symbol: '⚖️', categoryId: 'right' },
            { id: 'legal', label: 'Legal protections', symbol: '🛡️', categoryId: 'right' },
            { id: 'obey', label: 'Obeying laws', symbol: '🚦', categoryId: 'resp' },
            { id: 'democracy', label: 'Participating in democracy', symbol: '🗳️', categoryId: 'resp' },
            { id: 'respect', label: 'Respecting the rights of others', symbol: '🤝', categoryId: 'resp' },
          ],
        },
        statementIds: [K(22), K(23)],
      },
      {
        title: 'Which one?',
        interaction: {
          type: 'choice', prompt: 'Which one is a responsibility of citizens?',
          options: [{ id: 'obey', label: 'Obeying laws', symbol: '🚦', correct: true }, { id: 'speak', label: 'Freedom of expression', symbol: '🗣️' }, { id: 'eq', label: 'Equality', symbol: '⚖️' }],
          feedback: { correct: 'Yes! Obeying laws is a responsibility.', incorrect: 'That one is a right. Which one is something we should do?' },
        },
        statementIds: [K(23)],
      },
    ],
  }),
];

/** Review quiz built from the multiple-choice and yes/no steps of the lessons. */
export function reviewQuiz(lessons = DEMO_LESSONS) {
  const steps = lessons.flatMap((l) =>
    (l.steps || [])
      .filter((st) => st.interaction && ['choice', 'yesno'].includes(st.interaction.type))
      .map((st) => ({ ...st, kind: 'practice', title: `${l.title.replace(/\?$/, '')}`, statementIds: activityStatementIds(l, st), conceptIds: [], sourceLessonId: l.id }))
  );
  return activity({
    id: 'act-review',
    title: 'Review Quiz',
    blurb: `${steps.length} questions from all five lessons. Try to get each one on the first try.`,
    icon: '⭐',
    lessonId: null,
    steps,
  });
}
