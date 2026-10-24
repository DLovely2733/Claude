// First-person, point-and-click escape room engine.
//
// Each room has four walls; the player turns left/right to look around, taps
// objects (real <button>s over an SVG scene, so keyboard and switch access
// work), collects items in a backpack and opens locks built from accessible
// puzzle widgets. There are no timers. Hints are progressive and recorded as
// the support level used; every puzzle answer is saved as evidence against
// the lesson and G9-LO6 statements it practises.

import { h, clear, speak, stopSpeaking, speechAvailable } from '../../ui.js';
import { getState, update } from '../../store.js';
import { withDefaults } from '../../profile.js';
import { uid } from '../../util.js';
import { DEMO_VERSION_ID, DEMO_VERSION_LABEL } from '../../demo/politicalSystemUnit.js';

const SAVE_KEY = 'ab-g9-escape-v1';
const WALLS = ['N', 'E', 'S', 'W'];
const WALL_NAMES = { N: 'front', E: 'right', S: 'back', W: 'left' };
const SVGNS = 'http://www.w3.org/2000/svg';

// --- SVG helpers (used by room art) ------------------------------------------

export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) el.setAttribute(k, v);
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

export function emoji(x, y, size, char, extra = {}) {
  return s('text', { x, y, 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'aria-hidden': 'true', ...extra }, char);
}

export function label(x, y, text, { size = 18, fill = '#f5efe0', weight = 700, anchor = 'middle' } = {}) {
  return s('text', { x, y, 'font-size': size, fill, 'font-weight': weight, 'text-anchor': anchor, 'font-family': 'Lexend, sans-serif' }, text);
}

/** The room box in one-point perspective: ceiling, side walls, back wall, floor. */
export function roomBase(t) {
  const lines = [];
  for (let i = 1; i < 6; i++) {
    const x = 150 + (700 / 6) * i;
    lines.push(s('line', { x1: x, y1: 470, x2: (x - 500) * 1.43 + 500, y2: 600, stroke: t.floorLine, 'stroke-width': 2 }));
  }
  return [
    s('defs', {},
      s('radialGradient', { id: 'esc-light', cx: '50%', cy: '35%', r: '65%' }, s('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.16 }), s('stop', { offset: '100%', 'stop-color': '#000000', 'stop-opacity': 0.28 }))),
    s('polygon', { points: '0,0 1000,0 850,80 150,80', fill: t.ceiling }),
    s('polygon', { points: '0,0 150,80 150,470 0,600', fill: t.side }),
    s('polygon', { points: '1000,0 850,80 850,470 1000,600', fill: t.side }),
    s('rect', { x: 150, y: 80, width: 700, height: 390, fill: t.wall }),
    s('rect', { x: 150, y: 372, width: 700, height: 98, fill: t.panel }),
    s('rect', { x: 150, y: 368, width: 700, height: 6, fill: t.trim }),
    s('polygon', { points: '0,600 150,470 850,470 1000,600', fill: t.floor }),
    ...lines,
    s('rect', { x: 150, y: 462, width: 700, height: 8, fill: t.trim }),
  ];
}

export function overlayLight() {
  return s('rect', { x: 0, y: 0, width: 1000, height: 600, fill: 'url(#esc-light)', 'pointer-events': 'none' });
}

export function door(x, { open = false, color = '#5b3a24', sign = '' } = {}) {
  return s('g', {},
    s('rect', { x: x - 8, y: 162, width: 166, height: 308, fill: '#2c1d12' }),
    open
      ? [s('rect', { x, y: 170, width: 150, height: 300, fill: '#f7e7b0' }), s('polygon', { points: `${x},170 ${x + 40},185 ${x + 40},455 ${x},470`, fill: color })]
      : [
          s('rect', { x, y: 170, width: 150, height: 300, fill: color }),
          s('rect', { x: x + 16, y: 188, width: 118, height: 110, fill: 'none', stroke: '#00000040', 'stroke-width': 4 }),
          s('rect', { x: x + 16, y: 318, width: 118, height: 130, fill: 'none', stroke: '#00000040', 'stroke-width': 4 }),
          s('circle', { cx: x + 130, cy: 330, r: 7, fill: '#d9b44a' }),
        ],
    sign ? [s('rect', { x: x + 15, y: 128, width: 120, height: 28, rx: 4, fill: '#1d2a22' }), label(x + 75, 148, sign, { size: 15 })] : null
  );
}

export function frame(x, y, w, h, inner, { color = '#c9a227' } = {}) {
  return s('g', {}, s('rect', { x: x - 8, y: y - 8, width: w + 16, height: h + 16, fill: color, rx: 3 }), s('rect', { x, y, width: w, height: h, fill: '#1b2430' }), inner);
}

export function shelf(x, y, w, h, books = []) {
  const rows = 3;
  const out = [s('rect', { x, y, width: w, height: h, fill: '#4a2f1d' }), s('rect', { x: x + 8, y: y + 8, width: w - 16, height: h - 16, fill: '#2b1b10' })];
  for (let r = 0; r < rows; r++) {
    const by = y + 8 + ((h - 16) / rows) * (r + 1);
    out.push(s('rect', { x: x + 8, y: by - 6, width: w - 16, height: 6, fill: '#4a2f1d' }));
    let bx = x + 14;
    const palette = books[r] || ['#7a2e2e', '#2e5a7a', '#7a6a2e', '#2e7a4f', '#5a2e7a'];
    for (let i = 0; bx < x + w - 30; i++) {
      const bw = 14 + ((i * 7 + r * 5) % 10);
      const bh = (h - 16) / rows - 14 - ((i * 3) % 9);
      out.push(s('rect', { x: bx, y: by - 6 - bh, width: bw, height: bh, fill: palette[i % palette.length] }));
      bx += bw + 3;
    }
  }
  return s('g', {}, out);
}

export function desk(x, w, { color = '#6b4428' } = {}) {
  return s('g', {},
    s('rect', { x, y: 352, width: w, height: 20, fill: color }),
    s('rect', { x: x + 10, y: 372, width: w - 20, height: 70, fill: color, opacity: 0.85 }),
    s('rect', { x: x + 24, y: 386, width: w - 48, height: 24, fill: 'none', stroke: '#00000050', 'stroke-width': 3 }),
    s('circle', { cx: x + w / 2, cy: 398, r: 4, fill: '#d9b44a' }));
}

export function chest(x, { color, sym, name, count = '' }) {
  return s('g', {},
    s('rect', { x, y: 372, width: 150, height: 80, rx: 6, fill: color }),
    s('rect', { x: x - 4, y: 352, width: 158, height: 28, rx: 10, fill: color, opacity: 0.85 }),
    s('rect', { x: x + 64, y: 372, width: 22, height: 26, fill: '#d9b44a' }),
    emoji(x + 75, 425, 32, sym),
    label(x + 75, 345, name, { size: 16 }),
    count ? label(x + 75, 470, count, { size: 14 }) : null);
}

export function poster(x, y, w, h, title, sym, { bg = '#f2ead3', ink = '#2b2b2b' } = {}) {
  return s('g', {}, s('rect', { x, y, width: w, height: h, fill: bg, rx: 4 }), emoji(x + w / 2, y + h * 0.48, Math.min(w, h) * 0.45, sym), label(x + w / 2, y + h - 12, title, { size: 15, fill: ink }));
}

// --- engine -----------------------------------------------------------------

function load() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || null;
  } catch {
    return null;
  }
}

function save(st) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(st));
  } catch {
    /* progress just won't persist */
  }
}

function freshState() {
  return { started: false, room: 0, wall: 'N', inventory: [], flags: {}, hints: {}, wrong: 0, answered: 0, firstTry: 0, finished: false };
}

/**
 * @param {object} game { id, title, rooms, items, intro, outro }
 * @param {object} host { onExit(), onFinish(result) }
 */
export function renderEscape(game, host) {
  let st = { ...freshState(), ...(load() || {}) };
  const p = withDefaults(getState().profile);
  const plain = p.textSupport !== 'standard';
  const T = (x) => (typeof x === 'string' ? x : plain ? x.p || x.t : x.t);
  const sessionId = uid('escape');

  const root = h('section', { class: 'escape', 'aria-label': game.title });
  let panel = null;
  let lastSaid = '';

  const room = () => game.rooms[st.room];
  const item = (id) => game.items[id];
  const persist = () => save(st);

  // ----- api given to room scripts -----
  const api = {
    get state() { return st; },
    plain,
    T,
    has: (id) => st.inventory.includes(id),
    flag: (k) => Boolean(st.flags[k]),
    setFlag: (k, v = true) => ((st.flags[k] = v), persist()),
    give(id, message) {
      if (!st.inventory.includes(id)) st.inventory.push(id);
      persist();
      say(message || `You found: ${item(id).name} ${item(id).symbol}`);
      draw();
    },
    take(id) {
      st.inventory = st.inventory.filter((x) => x !== id);
      persist();
    },
    say: (m) => say(m),
    inspect: (opts) => openPanel(opts),
    close: () => closePanel(),
    record,
    solve(message) {
      st.flags[`solved:${room().id}`] = true;
      persist();
      closePanel();
      say(message);
      draw();
    },
    nextRoom() {
      if (st.room < game.rooms.length - 1) {
        st.room += 1;
        st.wall = 'N';
        persist();
        draw();
        say(T(room().intro));
      } else finish();
    },
    redraw: () => draw(),
  };

  function record(step, data) {
    st.answered += data.correct === true || data.correct === false ? 1 : 0;
    if (data.correct === true) st.firstTry += 1;
    if (data.correct === false) st.wrong += 1;
    persist();
    const lessonId = step.lessonId || room().lessonId;
    const lesson = getState().lessons.find((l) => l.id === lessonId);
    update((s2) =>
      s2.evidence.push({
        id: uid('ev'),
        sessionId,
        lessonId,
        lessonTitle: lesson?.title || lessonId,
        activityId: game.id,
        stepId: `${room().id}:${step.id}`,
        stepTitle: `${game.title} – ${T(room().name)}: ${step.title}`,
        stepKind: 'practice',
        curriculumVersionId: DEMO_VERSION_ID,
        curriculumVersionLabel: DEMO_VERSION_LABEL,
        statementIds: step.statementIds || [],
        conceptIds: [],
        promptLevel: st.hints[room().id] ? (st.hints[room().id] >= 3 ? 'model' : 'gesture') : null,
        at: new Date().toISOString(),
        ...data,
      })
    );
  }

  // ----- message bar -----
  const sayBox = h('p', { class: 'esc-say-text' });
  const sayBar = h('div', { class: 'esc-say', 'aria-live': 'polite' },
    sayBox,
    p.narration !== 'off' && speechAvailable() ? h('button', { class: 'esc-icon', 'aria-label': 'Read aloud', onclick: () => speak(lastSaid, p.speechRate) }, '🔊') : null);
  function say(m) {
    lastSaid = m;
    sayBox.textContent = m;
    if (p.narration === 'auto') speak(m, p.speechRate);
  }

  // ----- scene -----
  const view = h('div', { class: 'esc-view' });
  const hud = h('div', { class: 'esc-hud' });
  const inv = h('div', { class: 'esc-inv', 'aria-label': 'Backpack' });

  function turn(dir) {
    const i = WALLS.indexOf(st.wall);
    st.wall = WALLS[(i + dir + 4) % 4];
    persist();
    draw(dir);
    const w = room().walls[st.wall];
    say(`You turn to the ${WALL_NAMES[st.wall]} wall. ${T(w.look)}`);
  }

  function draw(dir = 0) {
    if (!st.started) return renderIntro();
    if (st.finished) return renderOutro();
    const r = room();
    const w = r.walls[st.wall];
    const hintLevel = st.hints[r.id] || 0;
    clear(hud);
    hud.append(
      h('div', { class: 'esc-where' }, h('span', { class: 'esc-room-num' }, `Room ${st.room + 1} of ${game.rooms.length}`), h('strong', {}, T(r.name))),
      h('div', { class: 'esc-hud-actions' },
        h('button', { class: 'esc-btn', onclick: hint }, '💡 Hint'),
        h('button', { class: 'esc-btn', onclick: () => say(`${T(r.intro)} ${T(w.look)}`) }, '👀 Where am I?')));

    const svg = s('svg', { viewBox: '0 0 1000 600', class: `esc-scene${dir ? (dir > 0 ? ' slide-r' : ' slide-l') : ''}`, role: 'img', 'aria-label': `${T(r.name)}, ${WALL_NAMES[st.wall]} wall. ${T(w.look)}` }, roomBase(r.theme), w.draw(api), overlayLight());
    const spots = (w.hotspots || []).filter((hs) => !hs.visible || hs.visible(api)).map((hs) =>
      h('button', {
        class: `hotspot${hintLevel ? ' glow' : ''}`,
        style: { left: `${hs.x / 10}%`, top: `${hs.y / 6}%`, width: `${hs.w / 10}%`, height: `${hs.h / 6}%` },
        'aria-label': T(hs.label),
        title: T(hs.label),
        onclick: () => hs.use(api),
      }));
    const compass = h('div', { class: 'esc-compass', 'aria-hidden': 'true' }, WALLS.map((k) => h('span', { class: k === st.wall ? 'on' : '' }, WALL_NAMES[k][0].toUpperCase())));
    clear(view);
    view.append(
      h('div', { class: `esc-stage${panel ? ' dim' : ''}` },
        svg,
        ...spots,
        h('button', { class: 'esc-turn left', 'aria-label': 'Turn left', onclick: () => turn(-1) }, '‹'),
        h('button', { class: 'esc-turn right', 'aria-label': 'Turn right', onclick: () => turn(1) }, '›'),
        compass)
    );
    if (panel) view.append(panel);

    clear(inv);
    inv.append(h('span', { class: 'esc-inv-label' }, '🎒 Backpack'));
    if (!st.inventory.length) inv.append(h('span', { class: 'esc-inv-empty' }, 'Empty. Tap things in the room to search them.'));
    for (const id of st.inventory) inv.append(h('span', { class: 'esc-item', title: item(id).name }, h('span', { class: 'sym', 'aria-hidden': 'true' }, item(id).symbol), item(id).name));
  }

  function hint() {
    const r = room();
    const n = Math.min((st.hints[r.id] || 0) + 1, r.hints.length);
    st.hints[r.id] = n;
    persist();
    record({ id: `hint${n}`, title: `Hint ${n}`, statementIds: [] }, { type: 'hint', response: T(r.hints[n - 1]), correct: null, promptLevel: n >= 3 ? 'model' : 'gesture' });
    say(`💡 ${T(r.hints[n - 1])}`);
    draw();
  }

  // ----- inspect panel -----
  function openPanel({ title, symbol, text, body, wide }) {
    const close = h('button', { class: 'esc-btn', onclick: closePanel }, 'Back');
    panel = h('div', { class: `esc-panel${wide ? ' wide' : ''}`, role: 'dialog', 'aria-label': T(title) },
      h('div', { class: 'esc-panel-head' }, symbol ? h('span', { class: 'esc-panel-sym', 'aria-hidden': 'true' }, symbol) : null, h('h3', {}, T(title)), close),
      text ? h('p', { class: 'esc-panel-text' }, T(text)) : null,
      body || null);
    if (text) say(T(text));
    draw();
    panel.querySelector('button')?.focus();
  }

  function closePanel() {
    panel = null;
    stopSpeaking();
    draw();
  }

  // ----- intro / outro -----
  function renderIntro() {
    clear(hud);
    clear(inv);
    clear(view);
    const saved = load();
    view.append(h('div', { class: 'esc-card' },
      h('p', { class: 'esc-kicker' }, 'Escape room · 5 rooms'),
      h('h2', {}, game.title),
      h('p', {}, T(game.intro)),
      h('ul', { class: 'esc-how' }, [
        ['‹ ›', 'Turn left and right to look at all four walls.'],
        ['👆', 'Tap things in the room to search them.'],
        ['🎒', 'Things you find go in your backpack.'],
        ['💡', 'Stuck? Tap Hint. There is no timer.'],
      ].map(([a, b]) => h('li', {}, h('span', { 'aria-hidden': 'true' }, a), b))),
      h('div', { class: 'esc-card-actions' },
        saved?.started && !saved.finished ? h('button', { class: 'btn primary big', onclick: () => ((st = { ...freshState(), ...saved }), draw(), say(T(room().intro))) }, `Continue (Room ${saved.room + 1})`) : null,
        h('button', { class: `btn ${saved?.started && !saved.finished ? 'ghost' : 'primary'} big`, onclick: () => ((st = { ...freshState(), started: true }), persist(), draw(), say(T(room().intro))) }, saved?.started ? 'Start over' : 'Start the game'))));
    say(T(game.intro));
  }

  function finish() {
    const hintsUsed = Object.values(st.hints).reduce((a, b) => a + b, 0);
    const stars = hintsUsed <= 1 && st.wrong <= 2 ? 3 : hintsUsed <= 5 && st.wrong <= 8 ? 2 : 1;
    st.finished = true;
    st.stars = stars;
    persist();
    update((s2) => s2.evidence.push({ id: uid('ev'), sessionId, type: 'complete', activityId: game.id, lessonId: game.rooms[game.rooms.length - 1].lessonId, lessonTitle: game.title, stepId: null, stepTitle: `Escaped: ${game.title}`, response: `${stars} star(s); ${hintsUsed} hint(s); ${st.wrong} wrong tries`, correct: null, stars, statementIds: [], at: new Date().toISOString() }));
    host.onFinish?.({ stars });
    draw();
  }

  function renderOutro() {
    clear(hud);
    clear(inv);
    clear(view);
    const hintsUsed = Object.values(st.hints).reduce((a, b) => a + b, 0);
    view.append(h('div', { class: 'esc-card escaped' },
      h('p', { class: 'esc-kicker' }, 'You escaped!'),
      h('p', { class: 'esc-stars', 'aria-label': `${st.stars} of 3 stars` }, [1, 2, 3].map((i) => h('span', { class: i <= st.stars ? 'on' : 'off' }, '★'))),
      h('h2', {}, T(game.outro.title)),
      h('p', {}, `Hints used: ${hintsUsed}. Answers right on the first try: ${st.firstTry} of ${st.answered}.`),
      h('h3', {}, 'What you used to escape'),
      h('ul', { class: 'esc-learned' }, game.outro.learned.map((x) => h('li', {}, T(x)))),
      h('div', { class: 'esc-card-actions' },
        h('button', { class: 'btn primary big', onclick: () => ((st = { ...freshState(), started: true }), persist(), draw(), say(T(room().intro))) }, 'Play again'),
        h('button', { class: 'btn ghost big', onclick: () => host.onExit?.() }, 'Back to the site'))));
    say(T(game.outro.title));
  }

  root.append(hud, view, sayBar, inv);
  root.addEventListener('keydown', (e) => {
    if (panel || !st.started || st.finished) return;
    if (e.key === 'ArrowLeft') turn(-1);
    if (e.key === 'ArrowRight') turn(1);
  });
  draw();
  if (st.started && !st.finished) say(T(room().intro));
  return root;
}

// --- puzzle widgets -----------------------------------------------------------

/** Multiple choice. onCorrect runs once the right answer is chosen. */
export function choiceWidget(api, { step, prompt, options, feedback = {}, onCorrect }) {
  let tries = 0;
  const fb = h('p', { class: 'esc-feedback', 'aria-live': 'assertive' });
  const choices = options.map((o) =>
    h('button', { class: 'esc-choice', onclick: (e) => {
      tries++;
      if (o.correct) {
        e.currentTarget.classList.add('right');
        fb.textContent = `✅ ${api.T(feedback.correct || 'Yes!')}`;
        api.record(step, { type: 'choice', response: o.label, correct: tries === 1, attempts: tries });
        setTimeout(onCorrect, 700);
      } else {
        e.currentTarget.classList.add('nope');
        e.currentTarget.disabled = true;
        fb.textContent = `🤔 ${api.T(feedback.incorrect || 'Not quite. Try another one.')}`;
        api.say(fb.textContent);
      }
    } }, h('span', { class: 'sym', 'aria-hidden': 'true' }, o.symbol || ''), h('span', {}, o.label)));
  return h('div', { class: 'esc-widget' }, h('p', { class: 'esc-prompt' }, api.T(prompt)), h('div', { class: 'esc-choices' }, choices), fb);
}

/**
 * Put backpack items into targets (sockets, chests, scale pans). Tap an item,
 * then tap where it goes. Correct items leave the backpack; wrong ones stay.
 */
export function placeWidget(api, { step, prompt, targets, itemIds, items, onDone, wrongHint }) {
  let selected = null;
  let tries = 0;
  const placed = new Map(itemIds.filter((id) => api.state.flags[`placed:${id}`]).map((id) => [id, items[id].target]));
  const fb = h('p', { class: 'esc-feedback', 'aria-live': 'assertive' });
  const wrap = h('div', { class: 'esc-widget' });
  const missing = () => itemIds.filter((id) => !placed.has(id) && !api.has(id));

  function render() {
    clear(wrap);
    wrap.append(h('p', { class: 'esc-prompt' }, api.T(prompt)));
    const pool = itemIds.filter((id) => !placed.has(id) && api.has(id));
    wrap.append(h('div', { class: 'esc-pool' },
      pool.length ? pool.map((id) => h('button', { class: `esc-token${selected === id ? ' sel' : ''}`, 'aria-pressed': selected === id, onclick: () => ((selected = id), render()) }, h('span', { class: 'sym', 'aria-hidden': 'true' }, items[id].symbol), items[id].name)) : null,
      missing().length ? h('span', { class: 'esc-missing' }, `Still to find: ${missing().length}`) : null));
    wrap.append(h('div', { class: 'esc-targets' }, targets.map((t) =>
      h('button', { class: `esc-target${selected ? ' ready' : ''}`, disabled: !selected, onclick: () => drop(t) },
        h('span', { class: 'sym', 'aria-hidden': 'true' }, t.symbol), h('strong', {}, api.T(t.label)),
        h('span', { class: 'esc-target-items' }, itemIds.filter((id) => placed.get(id) === t.id).map((id) => h('span', {}, items[id].symbol, ' ', items[id].name)))))));
    wrap.append(fb);
  }

  function drop(t) {
    const id = selected;
    selected = null;
    tries++;
    if (items[id].target === t.id) {
      placed.set(id, t.id);
      api.setFlag(`placed:${id}`);
      api.take(id);
      api.record({ ...step, title: `${step.title}: ${items[id].name}` }, { type: 'place', response: `${items[id].name} → ${api.T(t.label)}`, correct: tries === 1, attempts: tries });
      tries = 0;
      fb.textContent = `✅ ${items[id].name} goes with ${api.T(t.label)}.`;
      if (placed.size === itemIds.length) {
        render();
        setTimeout(onDone, 800);
        return;
      }
    } else {
      fb.textContent = `🤔 ${wrongHint ? wrongHint(items[id], t) : `${items[id].name} does not go there. Try another place.`}`;
      api.say(fb.textContent);
    }
    render();
  }

  render();
  return wrap;
}

/** Put backpack items in order. Correct beginnings are kept after a mistake. */
export function orderWidget(api, { step, prompt, order, items, onDone }) {
  let chosen = [];
  let tries = 0;
  const fb = h('p', { class: 'esc-feedback', 'aria-live': 'assertive' });
  const wrap = h('div', { class: 'esc-widget' });
  function render() {
    clear(wrap);
    wrap.append(h('p', { class: 'esc-prompt' }, api.T(prompt)));
    wrap.append(h('ol', { class: 'esc-slots' }, order.map((_, i) => h('li', { class: chosen[i] ? 'filled' : '' }, chosen[i] ? [h('span', { class: 'sym', 'aria-hidden': 'true' }, items[chosen[i]].symbol), ' ', items[chosen[i]].name] : `Step ${i + 1}`))));
    const pool = order.filter((id) => !chosen.includes(id) && api.has(id));
    const missing = order.filter((id) => !api.has(id) && !chosen.includes(id)).length;
    wrap.append(h('div', { class: 'esc-pool' },
      pool.map((id) => h('button', { class: 'esc-token', onclick: () => pick(id) }, h('span', { class: 'sym', 'aria-hidden': 'true' }, items[id].symbol), items[id].name)),
      missing ? h('span', { class: 'esc-missing' }, `Still to find: ${missing}`) : null));
    wrap.append(fb);
  }
  function pick(id) {
    chosen.push(id);
    if (chosen.length < order.length) return render();
    tries++;
    const right = chosen.filter((x, i) => x === order[i]).length;
    if (right === order.length) {
      api.record(step, { type: 'sequence', response: chosen.map((x) => items[x].name).join(' → '), correct: tries === 1, attempts: tries });
      fb.textContent = '✅ Perfect order!';
      render();
      setTimeout(onDone, 900);
      return;
    }
    let keep = 0;
    while (keep < chosen.length && chosen[keep] === order[keep]) keep++;
    chosen = chosen.slice(0, keep);
    fb.textContent = `🤔 ${right} of ${order.length} are in the right place. The first ${keep} stay. Try the rest again.`;
    api.say(fb.textContent);
    render();
  }
  render();
  return wrap;
}

/** Open decision: choose an option and at least one reason. No wrong answer. */
export function decideWidget(api, { step, prompt, options, reasonPrompt, reasons, onDone }) {
  let choice = null;
  const why = new Set();
  const wrap = h('div', { class: 'esc-widget' });
  function render() {
    clear(wrap);
    wrap.append(h('p', { class: 'esc-prompt' }, api.T(prompt)));
    wrap.append(h('div', { class: 'esc-choices' }, options.map((o) => h('button', { class: `esc-choice${choice === o ? ' right' : ''}`, 'aria-pressed': choice === o, onclick: () => ((choice = o), render()) }, h('span', { class: 'sym', 'aria-hidden': 'true' }, o.symbol), h('span', {}, o.label), o.detail ? h('small', {}, o.detail) : null))));
    if (choice) {
      wrap.append(h('p', { class: 'esc-prompt' }, api.T(reasonPrompt)));
      wrap.append(h('div', { class: 'esc-choices small' }, reasons.map((r) => h('button', { class: `esc-choice${why.has(r) ? ' right' : ''}`, 'aria-pressed': why.has(r), onclick: () => (why.has(r) ? why.delete(r) : why.add(r), render()) }, h('span', { class: 'sym', 'aria-hidden': 'true' }, r.symbol), h('span', {}, r.label)))));
    }
    if (choice && why.size) {
      wrap.append(h('button', { class: 'btn primary big', onclick: () => {
        const sentence = `I chose ${choice.label} because ${[...why].map((r) => r.label.toLowerCase()).join(' and ')}.`;
        api.record(step, { type: 'decision', response: sentence, choice: choice.label, reasons: [...why].map((r) => r.label), correct: null, attempts: 1 });
        onDone(sentence);
      } }, 'This is my decision ✔'));
    }
  }
  render();
  return wrap;
}
