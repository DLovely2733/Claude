// Visual supports for lesson steps. Every visual has a text alternative and
// uses large symbols + short labels so it works alongside narration.

import { h } from './ui.js';

const LEVELS = {
  federal: { symbol: '🍁', name: 'Federal', place: 'All of Canada', leader: 'Prime Minister', cls: 'lv-fed' },
  provincial: { symbol: '🏔️', name: 'Provincial', place: 'Alberta', leader: 'Premier', cls: 'lv-prov' },
  municipal: { symbol: '🏘️', name: 'Municipal', place: 'Our town or city', leader: 'Mayor or Reeve', cls: 'lv-mun' },
};

export function renderVisual(step, profile = {}) {
  const v = step.visual;
  if (!v || profile.visuals === 'minimal' && v.type === 'keyword-cards') return null;
  const wrap = (cls, ...kids) => h('figure', { class: `visual ${cls}`, role: 'img', 'aria-label': v.alt || step.title }, ...kids);
  const simple = profile.textSupport && profile.textSupport !== 'standard';

  switch (v.type) {
    case 'keyword-cards': {
      const kws = step.keywords || [];
      if (!kws.length) return null;
      return wrap('cards', kws.map((k) => h('div', { class: 'kw-card' }, h('span', { class: 'sym', 'aria-hidden': 'true' }, k.symbol || '🔹'), h('strong', {}, k.word), k.meaning && profile.textSupport !== 'keywords' ? h('small', {}, k.meaning) : null)));
    }
    case 'vote':
      return wrap(
        'flow',
        h('div', { class: 'flow-item' }, h('span', { class: 'sym' }, '🧑‍🤝‍🧑'), h('span', {}, 'People')),
        h('span', { class: 'arrow', 'aria-hidden': 'true' }, '➜'),
        h('div', { class: 'flow-item' }, h('span', { class: 'sym' }, '🗳️'), h('span', {}, 'Vote')),
        h('span', { class: 'arrow', 'aria-hidden': 'true' }, '➜'),
        h('div', { class: 'flow-item' }, h('span', { class: 'sym' }, '🧑‍💼'), h('span', {}, 'Representative')),
        h('span', { class: 'arrow', 'aria-hidden': 'true' }, '➜'),
        h('div', { class: 'flow-item' }, h('span', { class: 'sym' }, '🤔'), h('span', {}, 'Decisions'))
      );
    case 'levels':
      return wrap(
        'levels',
        Object.values(LEVELS).map((l, i) =>
          h('div', { class: `level ${l.cls}`, style: { width: `${100 - i * 14}%` } }, h('span', { class: 'sym' }, l.symbol), h('strong', {}, l.name), h('span', {}, l.place))
        ),
        h('p', { class: 'note' }, 'First Nations and Métis Settlements also have their own governments.')
      );
    case 'jurisdiction':
      return wrap(
        'jurisdiction',
        (v.columns || []).map((col) => {
          const l = LEVELS[col.level];
          return h('div', { class: `jcol ${l.cls}` }, h('div', { class: 'jhead' }, h('span', { class: 'sym' }, l.symbol), h('strong', {}, l.name), h('small', {}, l.place)), h('ul', {}, col.items.map(([sym, label]) => h('li', {}, h('span', { class: 'sym-sm' }, sym), ' ', label))));
        })
      );
    case 'steps': {
      const items = simple && v.simpleItems ? v.simpleItems : v.items || [];
      return wrap('flow steps', items.flatMap(([sym, label], i) => [i ? h('span', { class: 'arrow', 'aria-hidden': 'true' }, '➜') : null, h('div', { class: 'flow-item' }, h('span', { class: 'num' }, i + 1), h('span', { class: 'sym' }, sym), h('span', {}, label))]));
    }
    case 'community':
      return wrap(
        'community',
        (v.items || []).map(([sym, label, level]) => h('div', { class: `place ${LEVELS[level]?.cls || ''}` }, h('span', { class: 'sym' }, sym), h('strong', {}, label), level ? h('small', {}, `${LEVELS[level].symbol} ${LEVELS[level].name}`) : null))
      );
    case 'two-sides':
      return wrap('two-sides', h('div', { class: 'side good' }, h('span', { class: 'sym' }, v.left[0]), h('span', {}, v.left[1])), h('div', { class: 'side hard' }, h('span', { class: 'sym' }, v.right[0]), h('span', {}, v.right[1])));
    case 'options':
      return wrap('cards', (v.items || []).map(([sym, label, who]) => h('div', { class: 'kw-card' }, h('span', { class: 'sym' }, sym), h('strong', {}, label), who ? h('small', {}, `Helps: ${who}`) : null)));
    case 'image':
      return v.src ? h('figure', { class: 'visual image' }, h('img', { src: v.src, alt: v.alt || '' }), v.caption ? h('figcaption', {}, v.caption) : null) : null;
    default:
      return null;
  }
}

export const VISUAL_TYPES = [
  { id: 'none', label: 'No visual' },
  { id: 'keyword-cards', label: 'Key word cards' },
  { id: 'vote', label: 'Voting flow' },
  { id: 'levels', label: 'Levels of government' },
  { id: 'jurisdiction', label: 'Who does what (columns)' },
  { id: 'steps', label: 'Step sequence' },
  { id: 'community', label: 'Community places' },
  { id: 'two-sides', label: 'Two sides (helps / harder)' },
  { id: 'options', label: 'Option cards' },
  { id: 'image', label: 'Uploaded picture' },
];
