import { useEffect, useRef, useState } from 'react';

/**
 * True while the element is on screen and the tab is visible. 3D scenes use it
 * to stop rendering when nobody can see them, which saves battery on student devices.
 */
export function useVisible<T extends Element>() {
  const ref = useRef<T>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const el = ref.current;
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    let io: IntersectionObserver | undefined;
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.05 });
      io.observe(el);
    }
    return () => { document.removeEventListener('visibilitychange', onVis); io?.disconnect(); };
  }, []);
  return [ref, onScreen && tabVisible] as const;
}
