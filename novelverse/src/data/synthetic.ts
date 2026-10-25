import type { Student, StepResponse } from './types';

// Synthetic class data for the demonstration. None of these are real people.
// Call signs are used instead of names; NovelVerse collects no identifying
// information in demo mode.

export const DEMO_STUDENT_ID = 'cadet-demo';

export const ROSTER: Student[] = [
  { id: DEMO_STUDENT_ID, callSign: 'Demo Cadet', synthetic: true },
  { id: 'cadet-vega', callSign: 'Vega', synthetic: true },
  { id: 'cadet-orion', callSign: 'Orion', synthetic: true, presets: { plainLanguage: true, readAloud: true } },
  { id: 'cadet-lyra', callSign: 'Lyra', synthetic: true },
  { id: 'cadet-altair', callSign: 'Altair', synthetic: true, presets: { sentenceFrames: true } },
  { id: 'cadet-nova', callSign: 'Nova', synthetic: true },
  { id: 'cadet-rigel', callSign: 'Rigel', synthetic: true, presets: { shortInstructions: true, textScale: 1.2 } },
  { id: 'cadet-cassia', callSign: 'Cassia', synthetic: true },
];

const M = 'm-pressure-point';
const day = 86_400_000;
const T0 = Date.UTC(2026, 9, 20, 15, 0);

type Seed = Omit<StepResponse, 'missionId' | 'revisions' | 'updatedAt'> & { revisions?: StepResponse['revisions']; at?: number };

const seeds: Seed[] = [
  // ---- The Dawn Battle
  { studentId: 'cadet-vega', stepId: 's-dilemma', status: 'submitted', supports: [],
    data: { choiceId: 'c-bean', followUpId: 'f3', values: ['trust', 'adaptability'], evidenceIds: ['ec-bean', 'ec-int-adapt'],
      reasoning: 'I trusted Bean because in Chapter 11 Ender gives him his own squad to try new ideas. That shows Ender thinks a good commander uses the talent in his army instead of controlling everything. It was risky, but the enemy expected the old plan.',
      compare: 'Ender also trusts Bean, but he never gets to question the schedule like I wanted to.', insights: ['anchored', 'perspective'] } },
  { studentId: 'cadet-orion', stepId: 's-dilemma', status: 'submitted', supports: ['plain language', 'read aloud'],
    data: { choiceId: 'c-protest', followUpId: 'f5', values: ['fairness'], evidenceIds: ['ec-rules'],
      reasoning: 'It is not fair. The teachers keep changing the rules so I would tell them.',
      compare: 'Ender does not complain, he just wins.', insights: ['anchored'] },
    revisions: [{ at: T0 + day * 0.5, summary: 'Added evidence after mentor question', data: { reasoning: 'It is not fair.' } }] },
  { studentId: 'cadet-lyra', stepId: 's-dilemma', status: 'submitted', supports: [],
    data: { choiceId: 'c-push', followUpId: 'f7', values: ['winning', 'control'], evidenceIds: [],
      reasoning: 'Winning is all that matters because they always win in the book.',
      compare: 'Same as Ender.', insights: [] } },
  { studentId: 'cadet-altair', stepId: 's-dilemma', status: 'submitted', supports: ['sentence frames'],
    data: { choiceId: 'c-proven', followUpId: 'f1', values: ['responsibility', 'caution'], evidenceIds: ['ec-exhausted'],
      reasoning: 'I chose the proven plan because in Chapter 11 the soldiers are exhausted. This shows that responsibility matters to me as commander, since tired soldiers make mistakes with new plans.',
      compare: 'Ender takes more risks than me. Maybe he can because he trusts Bean.', insights: ['anchored', 'perspective'] } },
  { studentId: 'cadet-nova', stepId: 's-dilemma', status: 'in-progress', supports: [],
    data: { choiceId: 'c-bean', values: ['trust'], evidenceIds: [], reasoning: '' } },
  { studentId: 'cadet-cassia', stepId: 's-dilemma', status: 'submitted', supports: [],
    data: { choiceId: 'c-protest', followUpId: 'f6', values: ['fairness', 'honesty', 'responsibility'], evidenceIds: ['ec-rules', 'ec-int-isolate'],
      reasoning: 'The teachers change the conditions every battle (Chapter 11), which suggests they are testing how much Ender can take. Speaking up might not change anything, but it shows the army their commander will stand up for them. However, it costs planning time, so it is a real trade-off.',
      compare: 'Ender never protests. Maybe the novel is showing that he has learned no adult will help him.', insights: ['anchored', 'perspective'] } },

  // ---- The Graff File
  { studentId: 'cadet-vega', stepId: 's-board', status: 'submitted', supports: [],
    data: { theoryId: 'th-cost', band: 'Solid case',
      sorted: { 'ec-rules': 'fact', 'ec-openings': 'fact', 'ec-no-rescue': 'fact', 'ec-int-weight': 'interpretation', 'ec-int-isolate': 'interpretation', 'ec-honest': 'fact' },
      pins: { 'ec-int-weight': { theoryId: 'th-cost', stance: 'supports' }, 'ec-no-rescue': { theoryId: 'th-cost', stance: 'supports' }, 'ec-honest': { theoryId: 'th-cost', stance: 'supports' } },
      ruledOut: { 'th-orders': 'He plans everything himself, like the shuttle and bringing Valentine.' }, links: [], positions: {},
      claim: 'Graff cares about Ender but thinks saving humanity is worth hurting him.',
      reasoning: 'Graff is honest with Ender in Chapter 3 that it will be hard, which shows he respects him. But in Chapter 12 the adults let Bonzo corner him, because they believe Ender has to learn nobody will save him.',
      counter: '', insights: ['sorter'] } },
  { studentId: 'cadet-lyra', stepId: 's-board', status: 'submitted', supports: [],
    data: { theoryId: 'th-orders', band: 'Developing case',
      sorted: { 'ec-rules': 'fact', 'ec-int-weight': 'fact', 'ec-int-isolate': 'fact' },
      pins: { 'ec-rules': { theoryId: 'th-orders', stance: 'supports' } }, ruledOut: {}, links: [], positions: {},
      claim: 'Graff is just following orders.', reasoning: 'The military tells him what to do.', counter: '', insights: [] } },
  { studentId: 'cadet-cassia', stepId: 's-board', status: 'submitted', supports: [],
    data: { theoryId: 'th-tool', band: 'Compelling case',
      sorted: { 'ec-rules': 'fact', 'ec-openings': 'fact', 'ec-no-rescue': 'fact', 'ec-valentine': 'fact', 'ec-lake-talk': 'fact', 'ec-honest': 'fact', 'ec-shuttle': 'fact', 'ec-int-weight': 'interpretation', 'ec-int-isolate': 'interpretation' },
      pins: { 'ec-shuttle': { theoryId: 'th-tool', stance: 'supports' }, 'ec-valentine': { theoryId: 'th-tool', stance: 'supports' }, 'ec-no-rescue': { theoryId: 'th-tool', stance: 'supports' }, 'ec-int-weight': { theoryId: 'th-tool', stance: 'challenges' } },
      ruledOut: { 'th-orders': 'The chapter openings show Graff arguing for his own plans, not taking orders.' }, links: [{ a: 'ec-shuttle', b: 'ec-no-rescue', label: 'same strategy' }], positions: {},
      claim: 'Graff treats Ender mainly as a weapon to be shaped.',
      reasoning: 'From the shuttle praise in Chapter 4 to bringing Valentine in Chapter 13, Graff uses the people and feelings around Ender to control him. This suggests Ender’s wellbeing matters to Graff only when it affects whether he can fight.',
      counter: 'Some readers might say Graff feels guilty, and he does seem to. But feeling guilty does not stop him, so his actions show what he values most.', insights: ['sorter', 'other-side'] } },
  { studentId: 'cadet-altair', stepId: 's-board', status: 'in-progress', supports: ['sentence frames'],
    data: { theoryId: 'th-protect', sorted: { 'ec-honest': 'fact' }, pins: {}, ruledOut: {}, links: [], positions: {}, claim: '', reasoning: '', counter: '' } },

  // ---- Signal Vault
  { studentId: 'cadet-vega', stepId: 's-vault', status: 'submitted', supports: [],
    data: { solved: { 'l-sequence': true, 'l-craft': true, 'l-theme': true }, hintsUsed: { 'l-sequence': 1 },
      craftExplain: 'Because we know the adults are planning to make things harder, every battle feels like a trap.',
      themeExplain: 'Ender keeps winning by adapting but he pulls away from his soldiers.', insights: ['timeline', 'craft', 'theme'] } },
  { studentId: 'cadet-orion', stepId: 's-vault', status: 'submitted', supports: ['plain language', 'hints'],
    data: { solved: { 'l-sequence': true, 'l-craft': true, 'l-theme': true }, hintsUsed: { 'l-sequence': 3, 'l-craft': 2, 'l-theme': 1 },
      craftExplain: 'We know their plan and Ender does not so it is scary.',
      themeExplain: 'He is tired and alone after he wins.', insights: ['timeline', 'craft', 'theme'] } },
  { studentId: 'cadet-rigel', stepId: 's-vault', status: 'in-progress', supports: ['short instructions'],
    data: { solved: { 'l-sequence': true }, hintsUsed: { 'l-sequence': 2 } } },

  // ---- Commander's Log
  { studentId: 'cadet-cassia', stepId: 's-log', status: 'submitted', supports: [],
    data: { rungs: ['Leadership', 'Leaders have to make choices for others.', 'Effective leaders adapt under pressure, but carrying every decision alone isolates them.'],
      answers: ['The card about the adults choosing not to step in, because it made me see that Ender is being trained to never ask for help.', 'I protested and Ender did not. I think he has already learned that no adult will save him.'],
      insights: ['theme'] } },
];

export function seedResponses(): Record<string, StepResponse> {
  const out: Record<string, StepResponse> = {};
  seeds.forEach((s, i) => {
    const r: StepResponse = {
      studentId: s.studentId, missionId: M, stepId: s.stepId, status: s.status, data: s.data,
      supports: s.supports, revisions: s.revisions ?? [], updatedAt: s.at ?? T0 + i * 3_600_000,
    };
    out[responseKey(r.studentId, r.missionId, r.stepId)] = r;
  });
  return out;
}

export const responseKey = (studentId: string, missionId: string, stepId: string) => `${studentId}|${missionId}|${stepId}`;
