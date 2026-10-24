// Small shared helpers. No external dependencies so modules run in both the
// browser and Node (for tests).

export function uid(prefix = 'id') {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set(
  'a an and are as at be by for from has have how in is it its of on or that the their this to was were what which who will with students student'.split(' ')
);

export function tokens(text) {
  return normalize(text)
    .split(' ')
    .filter((t) => t.length > 2 && !STOP.has(t));
}

// Jaccard similarity on content words; used for version diffing and for
// suggesting (never asserting) curriculum matches.
export function similarity(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (!ta.size && !tb.size) return 1;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
