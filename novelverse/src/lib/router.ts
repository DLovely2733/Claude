import { useSyncExternalStore } from 'react';

// A small hash router. Hash URLs keep the build hostable anywhere static
// (GitHub Pages, a school server, a USB stick) with no rewrite rules.

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};
const snapshot = () => window.location.hash.replace(/^#/, '') || '/';

export function useRoute(): string[] {
  const path = useSyncExternalStore(subscribe, snapshot, () => '/');
  return path.split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
}

export function navigate(path: string) {
  const next = `#${path}`;
  if (window.location.hash !== next) window.location.hash = next;
  window.scrollTo({ top: 0 });
}

export const href = (path: string) => `#${path}`;
