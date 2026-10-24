// Canada Quest application shell: 3D viewport + accessible side panel.
// Views: hub (five world gateways) → world (mission map, places, exhibits)
// → mission (runner). Guided Adventure moves the camera for the student;
// Free Exploration lets them walk. The 2D mode shows the same panel without
// the 3D view, so all essential learning works without 3D navigation.

import { h, clear, speak, stopSpeaking, speechAvailable } from '../ui.js';
import { getState, update } from '../store.js';
import { withDefaults, TEXT_SUPPORT_OPTIONS } from '../profile.js';
import { BUNDLED_CURRICULUM } from '../curriculum/model.js';
import { loadThree, webglAvailable } from './three-loader.js';
import { World } from './engine.js';
import { kit } from './builders.js';
import { WORLDS, WORLD_STATUS, worldById } from './worlds.js';
import { HUB_SCENE } from './scenes/hub.js';
import { GOVERNMENT_SCENE } from './scenes/government.js';
import { GOVERNMENT_MISSIONS, EXHIBITS, LOCATION_INFO, PHASES } from './missions/government.js';
import { runMission, missionProgress, questState } from './runner.js';

/** Built-in missions plus teacher-generated ones (stored on this device). */
export function allMissions() {
  return [...GOVERNMENT_MISSIONS, ...(questState().custom || [])];
}
const SCENES = { hub: HUB_SCENE, government: GOVERNMENT_SCENE };
const LOCATION_LABELS = {
  overview: '🗺️ Overview',
  'parliament-front': '🏛️ Parliament',
  chambers: '🟩🟥 Chambers',
  lawpath: '📜 Law path',
  map: '🍁 Map of Canada',
  services: '🏫 Services street',
  riding: '🗳️ Riding office',
  community: '🏘️ Community square',
  justice: '⚖️ Courts and the Charter',
  cabinet: '🗂️ Cabinet office',
};

// Labels shown at each place, so the scene never shows every label at once.
const PLACE_LABELS = {
  overview: ['parliament', 'commons', 'senate', 'riding-office', 'town-hall', 'guide'],
  'parliament-front': ['parliament', 'commons', 'senate'],
  chambers: ['commons', 'senate', 'throne'],
  lawpath: ['law-1', 'law-2', 'law-3', 'law-4', 'law-5', 'law-6', 'law-7'],
  map: ['prov:BC', 'prov:AB', 'prov:SK', 'prov:MB', 'prov:ON', 'prov:QC', 'prov:NU'],
  services: ['svc:defence', 'svc:bank', 'svc:trade', 'svc:courts', 'svc:citizenship', 'svc:school', 'svc:hospital', 'svc:town', 'svc:oil'],
  riding: ['riding-office', 'ballot-box'],
  community: ['town-hall', 'notice-board', 'project-board'],
  justice: ['court-supreme', 'court-lower', 'court-appeal', 'charter', 'citizenship-act'],
  cabinet: ['cabinet'],
};

const fill = (el, ...kids) => el.append(...kids.flat(Infinity).filter((x) => x != null && x !== false));

let curriculumCache = null;
async function outcomesById() {
  if (!curriculumCache) {
    const stored = getState().versions.find((v) => v.id === BUNDLED_CURRICULUM.id);
    try {
      curriculumCache = stored || (await (await fetch(BUNDLED_CURRICULUM.path)).json());
    } catch {
      curriculumCache = { outcomes: [] };
    }
  }
  return Object.fromEntries(curriculumCache.outcomes.map((o) => [o.id, o]));
}

/** Missions a student can see: assigned, and approved if teacher-generated. */
export function assignedMissions() {
  const q = questState();
  return allMissions().filter((m) => q.assigned[m.id] !== false && (!m.custom || m.approved));
}

/**
 * @param {object} o { start: {view, worldId?, missionId?}, onHome() }
 */
export function renderQuest({ start = { view: 'hub' }, onHome } = {}) {
  let p = withDefaults(getState().profile);
  const canGL = webglAvailable();
  let use3d = p.quest3d !== false && canGL;
  let world = null;
  let THREE = null;
  let k = null;
  let sceneId = null;
  let actions = {};
  let runner = null;
  let onSelect = () => {};
  let view = start;

  const caption = h('p', { class: 'q-caption', hidden: true, 'aria-hidden': 'true' });
  const notice = h('div', { class: 'q-notice', hidden: true });
  const pad = h('div', { class: 'q-pad', hidden: true, 'aria-label': 'Walking controls' },
    ...[['forward', '▲', 'Walk forward'], ['left', '◀', 'Turn left'], ['back', '▼', 'Walk back'], ['right', '▶', 'Turn right']].map(([dir, sym, lbl]) => {
      const b = h('button', { class: `q-pad-${dir}`, 'aria-label': lbl }, sym);
      const on = (e) => (e.preventDefault(), world?.hold(dir, true));
      const off = () => world?.hold(dir, false);
      b.addEventListener('pointerdown', on);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, off));
      return b;
    }));
  const viewport = h('div', { class: 'q-viewport', tabindex: '0', 'aria-label': '3D view. Use the panel buttons, or tap labels in the scene.' }, notice, caption, pad);
  const panel = h('aside', { class: 'q-panel', 'aria-label': 'Quest panel' });
  const crumbs = h('span', { class: 'q-crumbs' });
  const modeBtn = h('button', { class: 'q-bar-btn', onclick: () => setMode(p.questMode === 'free' ? 'guided' : 'free') });
  const dimBtn = h('button', { class: 'q-bar-btn', onclick: () => toggle3d() });
  const bar = h('div', { class: 'q-bar' },
    h('button', { class: 'q-bar-btn home', onclick: () => (dispose(), onHome?.()) }, '🏠 Home'),
    h('div', { class: 'q-title' }, h('strong', {}, 'Canada Quest'), crumbs),
    h('div', { class: 'q-bar-actions' }, modeBtn, dimBtn, h('button', { class: 'q-bar-btn', onclick: openSettings }, '⚙ Settings')));
  const layout = h('div', { class: 'q-layout' }, viewport, panel);
  const root = h('section', { class: 'quest', 'aria-label': 'Canada Quest' }, bar, layout);

  function updateBar() {
    modeBtn.textContent = p.questMode === 'free' ? '🧭 Guided adventure' : '🚶 Explore freely';
    modeBtn.hidden = !use3d;
    dimBtn.textContent = use3d ? '▭ 2D mode' : '🧊 3D mode';
    dimBtn.hidden = !canGL;
    layout.classList.toggle('q-2d', !use3d);
    pad.hidden = !(use3d && p.questMode === 'free');
  }

  function say(text) {
    caption.textContent = text;
    caption.hidden = !use3d || p.subtitles === false || !text;
    if (p.narration === 'auto') speak(text, p.speechRate);
  }

  function quality() {
    if (p.graphicsQuality !== 'auto') return p.graphicsQuality;
    const weak = (navigator.hardwareConcurrency || 4) <= 4 || /Mobi|Android|iPad|CrOS/i.test(navigator.userAgent);
    return weak ? 'low' : 'high';
  }

  async function ensureScene(id) {
    if (!use3d) return null;
    try {
      if (!THREE) {
        notice.hidden = false;
        notice.textContent = 'Loading the 3D world…';
        THREE = await loadThree();
        k = kit(THREE);
      }
      if (!world) world = new World(THREE, viewport, { quality: quality(), reducedMotion: p.reduceMotion, sensitivity: p.cameraSensitivity, onSelect: (sid) => onSelect(sid) });
      if (sceneId !== id) {
        const built = world.load(SCENES[id], { kit: k });
        actions = built.actions || {};
        sceneId = id;
        world.goTo('overview', { instant: true });
      }
      world.setWalking(p.questMode === 'free');
      notice.hidden = true;
      return world;
    } catch (e) {
      console.error(e);
      use3d = false;
      updateBar();
      notice.hidden = true;
      panel.prepend(h('p', { class: 'q-status' }, '3D could not start on this device, so Canada Quest is in 2D mode. Everything still works.'));
      return null;
    }
  }

  // ---------------------------------------------------------------- hub
  async function showHub(focusId) {
    view = { view: 'hub' };
    runner?.dispose();
    runner = null;
    crumbs.textContent = ' · Hub';
    const w = await ensureScene('hub');
    world?.showLabels(null);
    world?.highlight(WORLDS.filter((x) => x.status === 'playable').map((x) => `portal:${x.id}`));
    onSelect = (sid) => {
      if (sid.startsWith('portal:')) focusWorld(sid.slice(7));
      if (sid === 'guide') say('Hi, I’m Jordan, your guide. Tap a gateway to visit a world. The green gateway is open now.');
    };
    clear(panel);
    fill(panel,
      h('p', { class: 'q-kicker' }, 'Canada Quest'),
      h('h2', {}, 'Explore, discover, learn'),
      h('p', {}, use3d ? 'Five worlds about Canada. Tap a gateway in the scene, or choose a world below.' : 'Five worlds about Canada. Choose a world below.'),
      !canGL ? h('p', { class: 'q-status' }, 'This device cannot show 3D graphics, so Canada Quest is in 2D mode. Everything still works.') : null,
      h('div', { class: 'q-worlds' }, WORLDS.map((wd) => worldButton(wd))),
      use3d ? h('p', { class: 'q-help' }, p.questMode === 'free' ? 'Walk with the arrow keys or the on-screen buttons. Drag to look around. Tap labels to interact.' : 'Guided adventure: the camera moves for you. Tap labels or use the buttons in this panel.') : null);
    say('Welcome to Canada Quest. Tap a gateway to visit a world.');
    if (focusId) focusWorld(focusId);
    else w?.goTo('overview');
  }

  function worldButton(wd) {
    const st = WORLD_STATUS[wd.status];
    const done = assignedMissions().filter((m) => m.worldId === wd.id && missionProgress(m.id)?.done).length;
    const total = assignedMissions().filter((m) => m.worldId === wd.id).length;
    return h('button', { class: `q-world${wd.status === 'playable' ? ' open' : ''}`, style: { '--wc': wd.color }, onclick: () => focusWorld(wd.id) },
      h('span', { class: 'q-world-icon', 'aria-hidden': 'true' }, wd.icon),
      h('span', { class: 'q-world-text' }, h('strong', {}, wd.name), h('small', {}, total ? `${done} of ${total} missions done` : 'Coming soon')),
      h('span', { class: `q-badge ${st.tone}` }, st.label));
  }

  async function focusWorld(id) {
    const wd = worldById(id);
    world?.goTo(`portal:${id}`);
    world?.highlight([`portal:${id}`]);
    const outcomes = await outcomesById();
    clear(panel);
    fill(panel,
      h('button', { class: 'text-link', onclick: () => showHub() }, '← All worlds'),
      h('p', { class: 'q-kicker' }, `${wd.icon} World`),
      h('h2', {}, wd.name),
      h('p', {}, wd.summary),
      wd.status === 'playable'
        ? h('button', { class: 'btn primary big', onclick: () => showWorld(id) }, 'Enter this world →')
        : h('div', { class: 'q-status warn' }, 'This world is still being built. Its missions are not playable yet.'),
      h('h3', {}, 'Grade 9 outcomes'),
      h('ul', { class: 'q-outcomes' }, wd.outcomeIds.map((oid) => h('li', {}, h('code', {}, oid), ' ', outcomes[oid]?.guidingQuestion || ''))),
      wd.status !== 'playable' && assignedMissions().some((m) => m.worldId === id)
        ? [h('h3', {}, 'Missions you can play now (2D)'), h('div', { class: 'q-worlds' }, assignedMissions().filter((m) => m.worldId === id).map((m) => h('button', { class: 'q-world', style: { '--wc': wd.color }, onclick: () => startMission(m.id) }, h('span', { class: 'q-world-icon', 'aria-hidden': 'true' }, m.icon), h('span', { class: 'q-world-text' }, h('strong', {}, m.title), h('small', {}, missionProgress(m.id)?.done ? 'Completed' : 'Teacher-made mission')), h('span', { class: 'q-badge ok' }, 'Play'))))]
        : null,
      wd.status !== 'playable' ? [h('h3', {}, 'Planned missions'), h('ul', { class: 'q-planned' }, wd.planned.map((x) => h('li', {}, x)))] : null,
      wd.sensitive ? h('p', { class: 'q-help' }, wd.sensitive) : null);
    say(`${wd.name}. ${wd.status === 'playable' ? 'This world is open.' : 'This world is still being built.'}`);
  }

  // ---------------------------------------------------------------- world
  async function showWorld(id, { place } = {}) {
    const wd = worldById(id);
    if (wd.status !== 'playable') return focusWorld(id);
    view = { view: 'world', worldId: id };
    runner?.dispose();
    runner = null;
    crumbs.textContent = ` · ${wd.name}`;
    const w = await ensureScene(id);
    w?.showLabels(PLACE_LABELS[place || 'overview']);
    w?.highlight([]);
    w?.goTo(place || 'overview');
    const exhibitBox = h('div', {});
    onSelect = (sid) => {
      const ex = EXHIBITS[sid] || (sid.startsWith('prov:') ? { title: sid.slice(5), symbol: '🗺️', t: 'A province or territory of Canada.', p: 'A province or territory.' } : null);
      if (!ex) return;
      const text = p.textSupport === 'standard' ? ex.t : ex.p;
      exhibitBox.replaceChildren(h('div', { class: 'q-exhibit' }, h('div', { class: 'q-exhibit-head' }, h('span', { class: 'q-exhibit-sym', 'aria-hidden': 'true' }, ex.symbol), h('h4', {}, ex.title), speechAvailable() && p.narration !== 'off' ? h('button', { class: 'q-icon', 'aria-label': 'Read aloud', onclick: () => speak(text, p.speechRate) }, '🔊') : null), h('p', {}, text)));
      say(text);
      exhibitBox.scrollIntoView({ block: 'nearest' });
    };
    const missions = assignedMissions().filter((m) => m.worldId === id);
    clear(panel);
    fill(panel,
      h('button', { class: 'text-link', onclick: () => showHub(id) }, '← All worlds'),
      h('p', { class: 'q-kicker' }, `${wd.icon} World 4`),
      h('h2', {}, wd.name),
      exhibitBox,
      h('h3', {}, 'Mission map'),
      h('ol', { class: 'q-missionmap' }, missions.map((m, i) => {
        const pr = missionProgress(m.id);
        const label = pr?.done ? 'Play again' : pr?.index ? 'Continue' : 'Start';
        return h('li', { class: pr?.done ? 'done' : '' },
          h('span', { class: 'q-mm-num', 'aria-hidden': 'true' }, pr?.done ? '✔' : String(i + 1)),
          h('div', { class: 'q-mm-text' }, h('strong', {}, `${m.icon} ${m.title}`), h('small', {}, pr?.done ? `Completed · ${'★'.repeat(pr.stars || 0)}` : pr?.index ? 'In progress' : PHASES.map((x) => x.label).join(' · '))),
          h('button', { class: `btn ${pr?.done ? 'ghost' : 'primary'}`, onclick: () => startMission(m.id) }, label));
      })),
      use3d ? [h('h3', {}, 'Go to a place'), h('div', { class: 'q-places' }, Object.entries(LOCATION_LABELS).map(([loc, lbl]) => h('button', { class: 'q-chip', onclick: () => { setMode('guided'); world?.goTo(loc); world?.showLabels(PLACE_LABELS[loc]); say(LOCATION_INFO[loc] || ''); } }, lbl)))] : null,
      h('h3', {}, 'Coming next in this world'),
      h('ul', { class: 'q-planned' }, wd.planned.map((x) => h('li', {}, x, ' ', h('span', { class: 'q-badge warn' }, 'Not built yet')))));
    say(`${wd.name}. Choose a mission, or tap things in the world to explore.`);
  }

  // ---------------------------------------------------------------- mission
  async function startMission(id) {
    const m = allMissions().find((x) => x.id === id);
    if (!m) return showHub();
    const hasScene = Boolean(SCENES[m.worldId]);
    view = { view: 'mission', missionId: id };
    runner?.dispose();
    crumbs.textContent = ` · ${worldById(m.worldId).name} · ${m.title}`;
    updateBar();
    if (hasScene) await ensureScene(m.worldId);
    else layout.classList.add('q-2d');
    if (p.questMode === 'free') setMode('guided');
    const list = assignedMissions().filter((x) => x.worldId === m.worldId);
    const nextMission = list[list.indexOf(m) + 1] || null;
    runner = runMission({
      mission: m,
      world: hasScene ? world : null,
      actions: hasScene ? actions : {},
      panel,
      caption: use3d && hasScene ? caption : null,
      nextMission,
      onExit: () => (worldById(m.worldId).status === 'playable' ? showWorld(m.worldId) : showHub(m.worldId)),
      onNext: (mid) => startMission(mid),
    });
    onSelect = (sid) => runner?.handleSelect(sid);
  }

  // ---------------------------------------------------------------- modes / settings
  function setMode(mode) {
    p.questMode = mode;
    update((s) => (s.profile = { ...withDefaults(s.profile), questMode: mode }));
    world?.setWalking(mode === 'free');
    if (mode === 'free') {
      say('Explore freely: use the arrow keys or the on-screen buttons to walk. Drag to look around. Tap labels to interact.');
      viewport.focus({ preventScroll: true });
    }
    updateBar();
  }

  function toggle3d() {
    p.quest3d = !use3d;
    update((s) => (s.profile = { ...withDefaults(s.profile), quest3d: p.quest3d }));
    use3d = p.quest3d && canGL;
    if (!use3d) disposeWorld();
    updateBar();
    rerenderView();
  }

  function rerenderView() {
    if (view.view === 'mission') startMission(view.missionId);
    else if (view.view === 'world') showWorld(view.worldId);
    else showHub();
  }

  function disposeWorld() {
    world?.dispose();
    world = null;
    sceneId = null;
    actions = {};
  }

  function openSettings() {
    const prof = withDefaults(getState().profile);
    getState().profile = prof;
    const before = { q: prof.graphicsQuality, rm: prof.reduceMotion };
    const save = () => update(() => {});
    const seg = (name, value, options, onPick) =>
      h('fieldset', { class: 'seg' }, h('legend', {}, name), h('div', { class: 'seg-row' }, options.map((o) => {
        const id = `qs-${name.replace(/\W+/g, '')}-${String(o.id).replace(/\W+/g, '')}`;
        const input = h('input', { type: 'radio', name: `qs-${name}`, id, checked: String(value) === String(o.id) });
        input.addEventListener('change', () => (onPick(o.id), save()));
        return h('label', { for: id }, input, h('span', {}, o.label));
      })));
    const toggleEl = (label, checked, onChange) => {
      const id = `qs-${label.replace(/\W+/g, '')}`;
      const cb = h('input', { type: 'checkbox', id, checked });
      cb.addEventListener('change', () => (onChange(cb.checked), save()));
      return h('label', { class: 'toggle', for: id }, cb, h('span', {}, label));
    };
    const dlg = h('dialog', { class: 'supports', 'aria-labelledby': 'qs-h' },
      h('div', { class: 'sup-head' }, h('h2', { id: 'qs-h' }, 'Canada Quest settings'), h('button', { class: 'text-link', onclick: () => dlg.close() }, 'Done')),
      h('p', { class: 'muted' }, 'For the teacher or helper. Saved on this device and shared with the teacher tools.'),
      seg('Read aloud', prof.narration, [{ id: 'off', label: 'Off' }, { id: 'on-demand', label: '🔊 button' }, { id: 'auto', label: 'Automatic' }], (v) => (prof.narration = v)),
      seg('Text', prof.textSupport, TEXT_SUPPORT_OPTIONS.map((o) => ({ id: o.id, label: o.label })), (v) => (prof.textSupport = v)),
      seg('Answer choices', prof.choicesPerQuestion, [{ id: 2, label: '2' }, { id: 3, label: '3' }, { id: 4, label: '4' }], (v) => (prof.choicesPerQuestion = Number(v))),
      seg('Camera speed', prof.cameraSensitivity, [{ id: 0.5, label: 'Slow' }, { id: 1, label: 'Normal' }, { id: 1.6, label: 'Fast' }], (v) => (prof.cameraSensitivity = Number(v))),
      seg('Graphics', prof.graphicsQuality, [{ id: 'auto', label: 'Automatic' }, { id: 'low', label: 'Fast (Chromebooks)' }, { id: 'high', label: 'Detailed' }], (v) => (prof.graphicsQuality = v)),
      toggleEl('Subtitles for the guide', prof.subtitles !== false, (v) => (prof.subtitles = v)),
      toggleEl('Reduce motion (no camera flights or pulsing)', prof.reduceMotion, (v) => (prof.reduceMotion = v)),
      toggleEl('Adult-assisted mode (“we did this together” button)', prof.adultAssisted, (v) => (prof.adultAssisted = v)),
      toggleEl('High contrast', prof.highContrast, (v) => (prof.highContrast = v)));
    dlg.addEventListener('close', () => {
      dlg.remove();
      p = withDefaults(getState().profile);
      document.body.classList.toggle('hc', p.highContrast);
      if (before.q !== p.graphicsQuality || before.rm !== p.reduceMotion) disposeWorld();
      else if (world) Object.assign(world.opts, { sensitivity: p.cameraSensitivity, reducedMotion: p.reduceMotion });
      rerenderView();
    });
    document.body.append(dlg);
    dlg.showModal();
  }

  function dispose() {
    stopSpeaking();
    runner?.dispose();
    disposeWorld();
  }

  // Free up the GPU when the shell leaves the page.
  const observer = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      dispose();
      observer.disconnect();
    }
  });
  queueMicrotask(() => observer.observe(document.body, { childList: true, subtree: true }));

  updateBar();
  if (start.view === 'mission') startMission(start.missionId);
  else if (start.view === 'world') showWorld(start.worldId);
  else showHub(start.worldId);
  return root;
}
