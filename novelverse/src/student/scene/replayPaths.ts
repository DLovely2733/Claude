import type { DilemmaChoice } from '../../data/types';

// Shared by the 3D and 2D replays, kept separate so the 2D view never loads three.js.

export type Replay = NonNullable<DilemmaChoice['replay']>;

/** Where a soldier is at time t (0..1) for each kind of battle. */
export function soldierPath(kind: Replay, team: 0 | 1, i: number, t: number): [number, number, number] {
  const lane = ((i % 6) - 2.5) * 0.28;
  const tier = (Math.floor(i / 6) - 1) * 0.35;
  const e = t * t * (3 - 2 * t);
  if (team === 1) {
    // The enemy advances steadily; when overrun it is pushed back.
    const z = kind === 'overrun' ? -1.7 + e * 0.6 : -1.7 + e * 1.4;
    return [lane, tier, z];
  }
  switch (kind) {
    case 'hold': return [lane * (1 - e * 0.4), tier, 1.7 - e * 1.6];
    case 'surprise': {
      const flank = i % 2 ? 1 : -1;
      return [lane + flank * Math.sin(e * Math.PI) * 1.1, tier + Math.sin(e * Math.PI) * 0.6, 1.7 - e * 3.3];
    }
    case 'rushed': return [lane + Math.sin(i * 7 + e * 9) * 0.25 * (1 - e), tier, 1.7 - e * 2.2];
    case 'overrun': return [lane * 0.5, tier * 0.5, 1.7 - e * 3.2];
  }
}
