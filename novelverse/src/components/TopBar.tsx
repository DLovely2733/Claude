import { useState, type ReactNode } from 'react';
import { href } from '../lib/router';
import { useApp } from '../state/store';
import { Icon } from './Icon';
import { SettingsDrawer } from './SettingsDrawer';

export function TopBar({ nav, right, mode }: { nav?: { to: string; label: string; current?: boolean }[]; right?: ReactNode; mode: 'student' | 'teacher' }) {
  const [open, setOpen] = useState(false);
  const sound = useApp((s) => s.settings.sound);
  const set = useApp((s) => s.setSettings);
  return (
    <header className="topbar no-print">
      <div className="wrap">
        <a className="brand" href={href('/')} aria-label="NovelVerse home">
          <span className="brand-mark" aria-hidden="true" />
          <span>NOVELVERSE</span>
        </a>
        <span className="hud topbar-mode" style={{ borderLeft: '1px solid var(--line)', paddingLeft: '0.8rem' }}>
          {mode === 'student' ? 'Enter the Story' : 'Mission Control'}
        </span>
        {nav && (
          <nav className="nav" aria-label={mode === 'student' ? 'Student' : 'Teacher'}>
            {nav.map((n) => (
              <a key={n.to} href={href(n.to)} aria-current={n.current ? 'page' : undefined}>{n.label}</a>
            ))}
          </nav>
        )}
        <div className="grow" />
        {right && <span className="topbar-extra">{right}</span>}
        <button className="btn icon ghost" onClick={() => set({ sound: !sound })} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
          <Icon name={sound ? 'sound' : 'mute'} />
        </button>
        <button className="btn ghost small" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Supports">
          <Icon name="settings" size={18} /> <span className="supports-label">Supports</span>
        </button>
      </div>
      <SettingsDrawer open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
