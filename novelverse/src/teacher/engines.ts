import type { StepType } from '../data/types';

export const ENGINE_CATALOG: { type: StepType; name: string; desc: string; minutes: string }[] = [
  { type: 'briefing', name: 'Briefing', desc: 'Chunked recap, word bank and a first-thought prompt. Supports reading, never replaces it.', minutes: '5 min' },
  { type: 'dilemma', name: 'Moral Dilemma Simulator', desc: 'An explorable 3D or 2D scene, a decision justified with evidence, simulated consequences and a comparison with the novel.', minutes: '10–15 min' },
  { type: 'evidence-board', name: 'Literary Detective', desc: 'Sort facts from interpretations, pin evidence to competing theories, rule out weak ones and file a case report.', minutes: '15–20 min' },
  { type: 'reasoning-lock', name: 'Escape the Chapter', desc: 'A vault of reasoning locks: timeline reconstruction, author’s craft and theme statements. Hints are free.', minutes: '10–15 min' },
  { type: 'connections', name: 'Character Connections', desc: 'Build a relationship network with evidence and scrub through chapters to see it change.', minutes: '10 min' },
  { type: 'reflection', name: 'Theme Explorer', desc: 'Climb from topic to a complicated theme statement, tether it to evidence and reflect on how thinking changed.', minutes: '10 min' },
];

export const PLANNED_ENGINES = [
  { name: 'Character Courtroom', desc: 'Roles, evidence bank, objections and a jury verdict, with a projector view.' },
  { name: 'Live Classroom Challenges', desc: 'Four Corners, This-or-That and prediction polls students join with a code.' },
  { name: 'Creative Studio', desc: 'Journals, interviews, newspapers, storyboards and persuasive pieces with shared criteria.' },
];
