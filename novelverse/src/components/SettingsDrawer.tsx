import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useApp } from '../state/store';
import type { Settings } from '../data/types';
import { Icon } from './Icon';
import { hasWebGL } from '../lib/webgl';

type BoolKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

const GROUPS: { title: string; items: { key: BoolKey; label: string; help: string }[] }[] = [
  {
    title: 'Reading',
    items: [
      { key: 'plainLanguage', label: 'Plain language', help: 'Shorter sentences and everyday words. Same ideas, same challenges.' },
      { key: 'shortInstructions', label: 'Short instructions', help: 'Just the steps.' },
      { key: 'readAloud', label: 'Read-aloud buttons', help: 'Adds Listen buttons to instructions and cards.' },
      { key: 'sentenceFrames', label: 'Sentence starters', help: 'Shows starters in writing boxes.' },
    ],
  },
  {
    title: 'Display',
    items: [
      { key: 'highContrast', label: 'High contrast', help: 'Black background, bright text and outlines.' },
      { key: 'wideSpacing', label: 'Wider spacing', help: 'More space between lines, letters and words.' },
      { key: 'reducedMotion', label: 'Reduce motion', help: 'Turns off movement and animation.' },
    ],
  },
  {
    title: 'Experience',
    items: [
      { key: 'sound', label: 'Sound effects', help: 'Soft interface sounds. Off by default.' },
      { key: 'mentor', label: 'Literary Mentor', help: 'A coach that asks questions about your thinking. It never writes answers for you.' },
    ],
  },
];

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useApp((s) => s.settings);
  const set = useApp((s) => s.setSettings);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      (returnTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  const webgl = typeof document !== 'undefined' && hasWebGL();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supports-title"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="row between">
              <div>
                <div className="hud accent">Supports</div>
                <h2 id="supports-title" style={{ marginBottom: 0 }}>Make it work for you</h2>
              </div>
              <button ref={closeRef} className="btn icon ghost" onClick={onClose} aria-label="Close supports">
                <Icon name="close" />
              </button>
            </div>
            <p className="small muted" style={{ marginTop: '0.75rem' }}>
              These change how NovelVerse looks and reads. They never change your results, and anyone can use them.
            </p>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label htmlFor="text-size">Text size: {Math.round(settings.textScale * 100)}%</label>
              <input id="text-size" type="range" min={0.9} max={1.6} step={0.1} value={settings.textScale}
                onChange={(e) => set({ textScale: Number(e.target.value) })} />
            </div>

            {GROUPS.map((g) => (
              <section key={g.title} style={{ marginTop: '1.25rem' }}>
                <h3 className="hud" style={{ marginBottom: '0.25rem' }}>{g.title}</h3>
                {g.items.map((it) => (
                  <label key={it.key} className="toggle">
                    <span>
                      <span style={{ fontWeight: 700, display: 'block' }}>{it.label}</span>
                      <span className="small muted">{it.help}</span>
                    </span>
                    <input type="checkbox" role="switch" className="switch" checked={settings[it.key]}
                      onChange={(e) => set({ [it.key]: e.target.checked } as Partial<Settings>)} />
                  </label>
                ))}
              </section>
            ))}

            <section style={{ marginTop: '1.25rem' }}>
              <h3 className="hud" style={{ marginBottom: '0.5rem' }}>Interactive worlds</h3>
              <div className="segmented" role="group" aria-label="Scene mode">
                {(['auto', '3d', '2d'] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={settings.scene === m} onClick={() => set({ scene: m })}>
                    {m === 'auto' ? 'Automatic' : m === '3d' ? '3D' : '2D map'}
                  </button>
                ))}
              </div>
              <p className="small muted" style={{ marginTop: '0.5rem' }}>
                The 2D map has everything the 3D room has and runs on any device.
                {!webgl && ' This device cannot show 3D, so the 2D map is used.'}
              </p>
            </section>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
