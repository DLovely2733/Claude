import { h, badge } from '../ui.js';
import { getState } from '../store.js';
import { checkAlignment, LESSON_STATUS } from '../alignment.js';
import { CONTENT_AREAS, STATEMENT_TYPES } from '../curriculum/model.js';

export function alignmentFor(lesson) {
  const s = getState();
  return checkAlignment(lesson, { versions: s.versions, activeVersionId: s.activeVersionId, profile: s.profile });
}

export function statusBadge(result) {
  const st = LESSON_STATUS[result.status];
  const icon = { ok: '✔', warn: '⚠', error: '⛔' }[st.tone];
  return badge(`${icon} ${st.label}`, st.tone);
}

export function warningList(result, { max = Infinity } = {}) {
  const items = result.warnings.filter((w) => w.level !== 'info').slice(0, max);
  if (!items.length) return null;
  return h('ul', { class: 'warnings' }, items.map((w) => h('li', { class: w.level }, w.message)));
}

/** Prominent warning shown on any lesson without a verified connection. */
export function alignmentAlert(result) {
  if (result.status === 'verified') return null;
  const tone = result.status === 'unverified' ? 'error' : 'warn';
  return h(
    'div',
    { class: `alert ${tone}`, role: 'alert' },
    h('strong', {}, result.status === 'unverified' ? '⛔ This lesson does not have a verified curriculum connection.' : '⚠ This lesson’s curriculum connection needs review.'),
    warningList(result, { max: 6 })
  );
}

export function areaName(id) {
  return CONTENT_AREAS.find((a) => a.id === id)?.name || 'Unassigned';
}

export function typeLabel(key) {
  return STATEMENT_TYPES[key]?.label || key;
}

export function pageHeader(title, subtitle, ...actions) {
  return h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, title), subtitle ? h('p', { class: 'lede' }, subtitle) : null), actions.length ? h('div', { class: 'actions' }, actions) : null);
}

export function empty(message, action) {
  return h('div', { class: 'empty' }, h('p', {}, message), action || null);
}
