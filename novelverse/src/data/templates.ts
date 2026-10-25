import type { MissionTemplate } from './types';

// Built-in mission shapes. Any of them can be applied to any novel and
// chapter range; teachers can also save their own from a mission.

const t = (x: Omit<MissionTemplate, 'builtIn' | 'overrides'> & Partial<Pick<MissionTemplate, 'overrides'>>): MissionTemplate => ({ overrides: {}, builtIn: true, ...x });

export const BUILT_IN_TEMPLATES: MissionTemplate[] = [
  t({ id: 'tpl-quick', name: 'Quick Check', description: 'A 10-minute vault: timeline, author’s craft and theme locks. A strong exit ticket.',
    engines: ['reasoning-lock'], readingLevel: 'standard', thinkingLevel: 'developing', grouping: 'independent', duration: 10, outcomeCodes: ['2.2', '2.3'] }),
  t({ id: 'tpl-decision', name: 'Decision Lab', description: 'A 20-minute dilemma with evidence-based justification and a short theme reflection.',
    engines: ['dilemma', 'reflection'], readingLevel: 'standard', thinkingLevel: 'developing', grouping: 'partner', duration: 20, outcomeCodes: ['1.2', '2.2'] }),
  t({ id: 'tpl-investigation', name: 'Full Investigation', description: 'A lesson: briefing, dilemma, evidence board and theme log.',
    engines: ['briefing', 'dilemma', 'evidence-board', 'reflection'], readingLevel: 'standard', thinkingLevel: 'developing', grouping: 'independent', duration: 45, outcomeCodes: ['2.2', '3.3', '4.1'] }),
  t({ id: 'tpl-trial', name: 'Trial Day', description: 'Put a character on trial: exhibits, objections, closing and an out-of-role verdict.',
    engines: ['briefing', 'courtroom', 'reflection'], readingLevel: 'standard', thinkingLevel: 'developing', grouping: 'group', duration: 45, outcomeCodes: ['2.2', '3.3', '5.2'] }),
  t({ id: 'tpl-studio', name: 'Maker Studio', description: 'Students choose a creative or analytical format, held to shared criteria.',
    engines: ['briefing', 'creative', 'reflection'], readingLevel: 'standard', thinkingLevel: 'developing', grouping: 'independent', duration: 45, outcomeCodes: ['2.4', '4.1'] }),
  t({ id: 'tpl-expedition', name: 'Block Expedition', description: 'An 80-minute block through every analysis engine.',
    engines: ['briefing', 'dilemma', 'evidence-board', 'reasoning-lock', 'connections', 'reflection'], readingLevel: 'standard', thinkingLevel: 'developing', grouping: 'independent', duration: 80, outcomeCodes: ['1.2', '2.2', '2.3', '3.3', '4.1'] }),
];
