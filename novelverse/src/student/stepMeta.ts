import type { StepType } from '../data/types';

export const STEP_META: Record<StepType, { icon: string; engine: string }> = {
  briefing: { icon: 'file', engine: 'Briefing' },
  dilemma: { icon: 'cube', engine: 'Enter the Story · Decision' },
  'evidence-board': { icon: 'pin', engine: 'Literary Detective' },
  'reasoning-lock': { icon: 'vault', engine: 'Escape the Chapter' },
  connections: { icon: 'users', engine: 'Character Connections' },
  reflection: { icon: 'log', engine: 'Theme Explorer' },
  courtroom: { icon: 'scale', engine: 'Character Courtroom' },
  creative: { icon: 'edit', engine: 'Creative Studio' },
};
