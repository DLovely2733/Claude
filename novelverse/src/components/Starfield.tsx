import { useEffect, useRef } from 'react';
import { useApp } from '../state/store';

// A layered, slowly drifting starfield with depth parallax that follows the
// pointer. With reduced motion it renders one still frame.
export function Starfield({ density = 1, warp = false }: { density?: number; warp?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useApp((s) => s.settings.reducedMotion);
  const contrast = useApp((s) => s.settings.highContrast);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prefersReduced = reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    type Star = { x: number; y: number; z: number; tw: number };
    let stars: Star[] = [];

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((w * h) / 5200) * density);
      stars = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random() ** 2, tw: Math.random() * Math.PI * 2 }));
    };
    const accent = getComputedStyle(canvas).getPropertyValue('--accent').trim() || '#5ee7ff';

    let speed = warp ? 6 : 0.12;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      speed += ((warp ? 6 : 0.12) - speed) * 0.05;
      for (const s of stars) {
        const depth = 0.25 + s.z * 1.6;
        if (!prefersReduced) {
          s.y += speed * depth;
          if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
        }
        const px = s.x + mouse.x * depth * 18;
        const py = s.y + mouse.y * depth * 12;
        const a = contrast ? 1 : 0.35 + 0.65 * s.z * (0.75 + 0.25 * Math.sin(t / 900 + s.tw));
        const r = 0.4 + s.z * 1.5;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.z > 0.82 ? accent : '#ffffff';
        if (speed > 1) {
          ctx.fillRect(px, py, r, r * speed * 2.5);
        } else {
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (!prefersReduced) raf = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5;
      mouse.ty = e.clientY / window.innerHeight - 0.5;
    };
    resize();
    draw(0);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);
    if (prefersReduced) draw(0);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [density, warp, reduced, contrast]);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
