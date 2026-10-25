import { useEffect, useState } from 'react';
import { useApp } from '../state/store';

// Text that arrives like an incoming transmission. Screen readers get the
// whole text at once, reduced motion shows it immediately, and anyone can skip.
export function Transmission({ text, className, speed = 18 }: { text: string; className?: string; speed?: number }) {
  const reduced = useApp((s) => s.settings.reducedMotion);
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(text.length); return; }
    setN(0);
    const id = setInterval(() => setN((x) => { if (x >= text.length) { clearInterval(id); return x; } return x + 2; }), speed);
    return () => clearInterval(id);
  }, [text, reduced, speed]);
  const done = n >= text.length;
  return (
    <p className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, n)}{!done && <span className="tx-cursor">▍</span>}</span>
      {!done && <button type="button" className="btn quiet small tx-skip" onClick={() => setN(text.length)} aria-label="Skip typing">Skip</button>}
    </p>
  );
}
