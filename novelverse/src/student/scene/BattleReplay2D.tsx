import { useEffect, useState } from 'react';
import { soldierPath, type Replay } from './replayPaths';

// The same simulated replay as a top-down 2D diagram, for any device.
export function BattleReplay2D({ kind, reduced }: { kind: Replay; reduced: boolean }) {
  const [t, setT] = useState(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) { setT(1); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT(Math.min((((now - start) / 6000) % 1.25), 1));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, kind]);
  const pts = (team: 0 | 1) => Array.from({ length: 18 }, (_, i) => soldierPath(kind, team, i, t));
  // Map z (-2..2) to x across the room and x (-1.2..1.2) to y.
  const X = (z: number) => 200 - z * 90;
  const Y = (x: number) => 80 + x * 55;
  return (
    <svg viewBox="0 0 400 160" className="replay2d" role="img" aria-label="Simulated replay of the battle, seen from above">
      <rect x="20" y="10" width="360" height="140" rx="6" fill="none" stroke="var(--accent)" strokeOpacity="0.6" />
      <rect x="14" y="65" width="10" height="30" fill="var(--accent)" opacity="0.5" />
      <rect x="376" y="65" width="10" height="30" fill="var(--accent-2)" opacity="0.6" />
      {pts(0).map(([x, , z], i) => <circle key={`a${i}`} cx={X(z)} cy={Y(x)} r="4" fill="var(--accent)" />)}
      {pts(1).map(([x, , z], i) => <circle key={`b${i}`} cx={X(z)} cy={Y(x)} r="4" fill="var(--accent-2)" />)}
    </svg>
  );
}
