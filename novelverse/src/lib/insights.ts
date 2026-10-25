import type { StepResponse } from '../data/types';

// Insights recognise reasoning moves, not speed, volume or correctness
// streaks. There are no points, no leaderboards and nothing to lose.

export interface Insight {
  id: string;
  name: string;
  description: string;
}

export const INSIGHTS: Insight[] = [
  { id: 'anchored', name: 'Anchored in the Text', description: 'Backed a decision with evidence from the novel.' },
  { id: 'perspective', name: 'Through Their Eyes', description: 'Named the values driving a choice and compared it with a character’s.' },
  { id: 'other-side', name: 'The Other Side', description: 'Faced evidence that challenged your own theory.' },
  { id: 'sorter', name: 'Fact from Reading', description: 'Separated what happens from what it might mean.' },
  { id: 'timeline', name: 'Signal Restored', description: 'Reconstructed how events connect.' },
  { id: 'craft', name: 'Author’s Eye', description: 'Explained the effect of an author’s choice on readers.' },
  { id: 'theme', name: 'Theme Builder', description: 'Turned a topic into a statement you can defend.' },
  { id: 'network', name: 'Network Mapper', description: 'Justified a relationship between characters with evidence.' },
  { id: 'second-look', name: 'Second Look', description: 'Revised your thinking after feedback.' },
];

export function insightsFrom(responses: StepResponse[]): Insight[] {
  const ids = new Set<string>();
  for (const r of responses) {
    const list = r.data.insights;
    if (Array.isArray(list)) list.forEach((x) => typeof x === 'string' && ids.add(x));
    if (r.revisions.length > 0) ids.add('second-look');
  }
  return INSIGHTS.filter((i) => ids.has(i.id));
}
