import type { Hotspot } from '../../data/types';
import { Icon } from '../../components/Icon';

// The 2D command deck: same hotspots, same information, any device.
export function CommandMap2D({ hotspots, active, seen, onSelect }: { hotspots: Hotspot[]; active: string | null; seen: string[]; onSelect: (id: string) => void }) {
  return (
    <div className="map2d" role="group" aria-label="Command deck, 2D map">
      <svg viewBox="0 0 400 300" aria-hidden="true" className="map2d-svg">
        <defs>
          <radialGradient id="deckglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="200" cy="150" rx="185" ry="135" fill="url(#deckglow)" />
        {[40, 80, 125].map((r) => <ellipse key={r} cx="200" cy="150" rx={r * 1.35} ry={r} fill="none" stroke="var(--accent)" strokeOpacity="0.3" />)}
        <g transform="translate(200 150)">
          <rect x="-28" y="-28" width="56" height="56" fill="none" stroke="var(--accent)" strokeWidth="2" transform="rotate(45)" />
          <rect x="-18" y="-18" width="36" height="36" fill="var(--accent)" fillOpacity="0.12" stroke="var(--accent)" />
        </g>
        <text x="200" y="205" textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="var(--font-mono)">BATTLEROOM HOLOGRAM</text>
      </svg>
      {hotspots.map((h, i) => {
        const a = (i / hotspots.length) * Math.PI * 2 + Math.PI / 4;
        const left = 50 + Math.sin(a) * 36;
        const top = 50 - Math.cos(a) * 34;
        return (
          <button key={h.id} type="button" className={`map2d-spot ${active === h.id ? 'active' : ''} ${seen.includes(h.id) ? 'seen' : ''}`}
            style={{ left: `${left}%`, top: `${top}%` }} onClick={() => onSelect(h.id)} aria-pressed={active === h.id}>
            <Icon name={h.icon === 'intel' ? 'spark' : h.icon === 'squad' ? 'users' : h.icon === 'orders' ? 'file' : 'log'} size={22} />
            <span>{h.label}</span>
            {seen.includes(h.id) && <span className="sr-only">(viewed)</span>}
          </button>
        );
      })}
    </div>
  );
}
