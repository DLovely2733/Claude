import { MotionConfig } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { useApp } from '../state/store';
import { setSoundEnabled } from '../lib/sound';
import { useToasts } from './toast';
import type { Skin } from '../data/types';

// Applies the viewer's supports and the active novel's skin to the whole app.
export function Shell({ skin = 'holo', children }: { skin?: Skin; children: ReactNode }) {
  const s = useApp((st) => st.settings);
  const toasts = useToasts((t) => t.items);
  useEffect(() => setSoundEnabled(s.sound), [s.sound]);
  useEffect(() => {
    document.documentElement.style.setProperty('--scale', String(s.textScale));
  }, [s.textScale]);

  return (
    <MotionConfig reducedMotion={s.reducedMotion ? 'always' : 'user'}>
      <div
        className="app"
        data-skin={skin}
        data-contrast={s.highContrast ? 'high' : 'normal'}
        data-spacing={s.wideSpacing ? 'wide' : 'normal'}
        data-motion={s.reducedMotion ? 'reduced' : 'full'}
      >
        <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
          Skip to main content
        </a>
        {children}
        <div className="toast-host" role="status" aria-live="polite">
          {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
        </div>
      </div>
    </MotionConfig>
  );
}
