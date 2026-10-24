// Mission runner: plays a data-driven mission in the side panel and drives the
// 3D world (camera moves, highlights, scene reactions). Every beat can be
// completed from the panel alone, so nothing depends on 3D navigation or
// precise movement. Works with world = null (2D mode).

import { h, clear, speak, stopSpeaking, speechAvailable } from '../ui.js';
import { getState, update, getLesson } from '../store.js';
import { withDefaults, limitChoices } from '../profile.js';
import { renderPlayer } from '../views/player.js';
import { uid } from '../util.js';
import { DEMO_VERSION_ID, DEMO_VERSION_LABEL } from '../demo/politicalSystemUnit.js';
import { PHASES, EXHIBITS, LOCATION_INFO } from './missions/government.js';
import { SERVICES, LAW_STATIONS } from './scenes/government.js';
import { PROVINCES } from './scenes/common.js';

export function questState() {
  const s = getState();
  s.quest ||= { missions: {}, assigned: {}, approved: {} };
  return s.quest;
}

export function missionProgress(id) {
  return questState().missions[id] || null;
}

function shuffle(a, seed = 1) {
  const r = [...a];
  let x = seed;
  for (let i = r.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * @param {object} o { mission, world, actions, panel, caption, onExit(), onNext(missionId|null) }
 */
export function runMission({ mission, world, actions = {}, panel, caption, onExit, onNext, nextMission }) {
  const p = withDefaults(getState().profile);
  const plain = p.textSupport !== 'standard';
  const T = (x) => (x == null ? '' : typeof x === 'string' ? x : plain ? x.p || x.t : x.t);
  const sessionId = uid('quest');
  const flat = PHASES.flatMap((ph) => (mission.phases[ph.id] || []).map((beat, i) => ({ phase: ph.id, beat, i })));
  const saved = missionProgress(mission.id);
  let index = saved && !saved.done ? Math.min(saved.index || 0, flat.length - 1) : 0;
  const results = [];
  let ready = false;
  let selectHandler = null;
  let lastLine = '';

  function save(extra = {}) {
    update((s) => {
      s.quest ||= { missions: {}, assigned: {}, approved: {} };
      s.quest.missions[mission.id] = { ...(s.quest.missions[mission.id] || {}), index, updatedAt: new Date().toISOString(), ...extra };
    });
  }

  function record(beat, data) {
    if (data.correct === true || data.correct === false) results.push(data.correct);
    const lesson = getLesson(mission.lessonId);
    update((s) =>
      s.evidence.push({
        id: uid('ev'),
        sessionId,
        lessonId: mission.lessonId,
        lessonTitle: lesson?.title || mission.title,
        activityId: mission.id,
        stepId: `${mission.id}:${flat[index].phase}:${flat[index].i}`,
        stepTitle: `Canada Quest – ${mission.title}: ${PHASES.find((x) => x.id === flat[index].phase).label}`,
        stepKind: flat[index].phase,
        curriculumVersionId: DEMO_VERSION_ID,
        curriculumVersionLabel: DEMO_VERSION_LABEL,
        statementIds: beat.statementIds || [],
        conceptIds: [],
        promptLevel: null,
        at: new Date().toISOString(),
        ...data,
      })
    );
  }

  function say(line) {
    lastLine = line;
    if (caption) {
      caption.textContent = line;
      caption.hidden = p.subtitles === false || !line;
    }
    if (p.narration === 'auto') speak(line, p.speechRate);
  }

  const guideText = h('p', { class: 'q-guide-text', 'aria-live': 'polite' });
  const body = h('div', { class: 'q-beat' });
  const nextBtn = h('button', { class: 'btn primary big q-next', onclick: () => advance() }, 'Next →');
  const assistBtn = p.adultAssisted ? h('button', { class: 'btn ghost', onclick: () => assisted() }, 'Adult: we did this together') : null;

  function guide(line) {
    guideText.textContent = line;
    say(line);
  }

  function setReady(v = true) {
    ready = v;
    nextBtn.disabled = !v;
  }

  function assisted() {
    record(flat[index].beat, { type: 'assisted', response: 'Completed with adult support', correct: null, promptLevel: 'model' });
    advance(true);
  }

  function missionConcepts() {
    if (mission.concepts) return mission.concepts.map(T);
    const lesson = getLesson(mission.lessonId);
    return (lesson?.essentialConcepts || []).map((c) => (plain ? c.plainText || c.text : c.text));
  }

  // ----- beat renderers -------------------------------------------------------

  function exhibitCard(id) {
    const ex = EXHIBITS[id];
    if (!ex) return null;
    const text = plain ? ex.p : ex.t;
    say(text);
    return h('div', { class: 'q-exhibit', role: 'region', 'aria-label': ex.title },
      h('div', { class: 'q-exhibit-head' }, h('span', { class: 'q-exhibit-sym', 'aria-hidden': 'true' }, ex.symbol), h('h4', {}, ex.title),
        p.narration !== 'off' && speechAvailable() ? h('button', { class: 'q-icon', 'aria-label': 'Read aloud', onclick: () => speak(text, p.speechRate) }, '🔊') : null),
      h('p', {}, text));
  }

  const R = {
    goto(beat) {
      if (beat.location) {
        world?.goTo(beat.location);
        world?.showLabels([]);
        if (LOCATION_INFO[beat.location]) body.append(h('p', { class: 'q-where' }, '📍 ', LOCATION_INFO[beat.location]));
      }
      setReady(true);
    },

    explore(beat) {
      world?.goTo(beat.location);
      const seen = new Set();
      const list = h('div', { class: 'q-chiplist' });
      const card = h('div', {});
      const status = h('p', { class: 'q-status' });
      const draw = () => {
        clear(list);
        for (const id of beat.ids) {
          const ex = EXHIBITS[id];
          list.append(h('button', { class: `q-chip${seen.has(id) ? ' done' : ''}`, onclick: () => open(id) }, h('span', { 'aria-hidden': 'true' }, seen.has(id) ? '✔' : ex.symbol), ex.title));
        }
        status.textContent = `Explored ${seen.size} of ${beat.min}${beat.ids.length > beat.min ? ` (${beat.ids.length} to find)` : ''}`;
        world?.showLabels(beat.ids);
        world?.highlight(beat.ids.filter((id) => !seen.has(id)));
        setReady(seen.size >= beat.min);
      };
      const open = (id) => {
        seen.add(id);
        card.replaceChildren(exhibitCard(id) || '');
        draw();
      };
      selectHandler = (id) => beat.ids.includes(id) && open(id);
      body.append(status, list, card);
      draw();
    },

    select(beat) {
      world?.goTo(beat.location);
      const fb = h('p', { class: 'q-feedback', 'aria-live': 'assertive' });
      let tries = 0;
      let done = false;
      const options = limitChoices(beat.targets.map((id) => ({ id, correct: id === beat.correct })), p, index);
      world?.showLabels(options.map((o) => o.id));
      world?.highlight([]);
      const choose = (id) => {
        if (done || !options.some((o) => o.id === id)) return;
        tries++;
        if (id === beat.correct) {
          done = true;
          fb.textContent = `✅ ${T(beat.feedback)}`;
          fb.className = 'q-feedback good';
          say(fb.textContent);
          world?.highlight([id]);
          record(beat, { type: 'select3d', response: EXHIBITS[id]?.title || id, correct: tries === 1, attempts: tries });
          setReady(true);
        } else {
          fb.textContent = `🤔 Not that one. ${EXHIBITS[id]?.title || id}: ${plain ? EXHIBITS[id]?.p : EXHIBITS[id]?.t}`;
          fb.className = 'q-feedback try';
          say(fb.textContent);
        }
      };
      selectHandler = choose;
      body.append(
        h('p', { class: 'q-prompt' }, T(beat.prompt)),
        h('p', { class: 'q-help' }, world ? 'Tap it in the scene, or choose below.' : 'Choose below.'),
        h('div', { class: 'q-options' }, options.map((o) => h('button', { class: 'q-option', onclick: () => choose(o.id) }, h('span', { class: 'sym', 'aria-hidden': 'true' }, EXHIBITS[o.id].symbol), EXHIBITS[o.id].title))),
        fb
      );
      say(T(beat.prompt));
    },

    map(beat) {
      world?.goTo(beat.location);
      const fb = h('p', { class: 'q-feedback', 'aria-live': 'assertive' });
      let tries = 0;
      let done = false;
      const distractors = shuffle(PROVINCES.filter((x) => x.id !== beat.correct && !x.territory), index + 3).slice(0, 3);
      const options = shuffle(limitChoices([{ id: beat.correct, correct: true }, ...distractors.map((d) => ({ id: d.id }))], p, index), index);
      const name = (id) => PROVINCES.find((x) => x.id === id).name;
      world?.showLabels(options.map((o) => `prov:${o.id}`));
      world?.highlight([]);
      const choose = (raw) => {
        const id = raw.replace(/^prov:/, '');
        if (done || !PROVINCES.some((x) => x.id === id)) return;
        tries++;
        if (id === beat.correct) {
          done = true;
          fb.textContent = `✅ ${T(beat.feedback)}`;
          fb.className = 'q-feedback good';
          world?.highlight([`prov:${id}`]);
          record(beat, { type: 'map', response: name(id), correct: tries === 1, attempts: tries });
          setReady(true);
        } else {
          fb.textContent = `🤔 That is ${name(id)}. Try again.`;
          fb.className = 'q-feedback try';
        }
        say(fb.textContent);
      };
      selectHandler = choose;
      body.append(h('p', { class: 'q-prompt' }, T(beat.prompt)), h('div', { class: 'q-options' }, options.map((o) => h('button', { class: 'q-option', onclick: () => choose(o.id) }, h('span', { class: 'sym', 'aria-hidden': 'true' }, '🗺️'), name(o.id)))), fb);
      say(T(beat.prompt));
    },

    sort3d(beat) {
      world?.goTo(beat.location);
      actions.resetFlags?.();
      const items = beat.items.map((id) => SERVICES.find((s) => s.id === id));
      let k = 0;
      let tries = 0;
      let firstTryAll = 0;
      const area = h('div', {});
      const fb = h('p', { class: 'q-feedback', 'aria-live': 'assertive' });
      const tally = h('p', { class: 'q-status' });
      const draw = () => {
        clear(area);
        tally.textContent = `${k} of ${items.length} sorted`;
        if (k >= items.length) {
          world?.highlight([]);
          area.append(h('p', { class: 'q-prompt' }, '✅ Every building has its flag.'));
          setReady(true);
          return;
        }
        const sv = items[k];
        world?.showLabels([`svc:${sv.id}`]);
        world?.highlight([`svc:${sv.id}`]);
        area.append(
          h('div', { class: 'q-sortcard' }, h('span', { class: 'q-exhibit-sym', 'aria-hidden': 'true' }, sv.symbol), h('div', {}, h('strong', {}, sv.name), h('p', {}, `Responsibility: ${sv.responsibility}`))),
          h('p', { class: 'q-prompt' }, plain ? 'Canada or Alberta?' : 'Whose responsibility is this?'),
          h('div', { class: 'q-options two' },
            h('button', { class: 'q-option', onclick: () => pick('federal') }, h('span', { class: 'sym', 'aria-hidden': 'true' }, '🍁'), 'Federal: Canada'),
            h('button', { class: 'q-option', onclick: () => pick('provincial') }, h('span', { class: 'sym', 'aria-hidden': 'true' }, '🏔️'), 'Provincial: Alberta')));
        say(`${sv.name}. ${sv.responsibility}. ${plain ? 'Canada or Alberta?' : 'Whose responsibility is this?'}`);
      };
      const pick = (level) => {
        const sv = items[k];
        tries++;
        if (sv.level === level) {
          if (tries === 1) firstTryAll++;
          record({ ...beat }, { type: 'sort3d', response: `${sv.responsibility} → ${level}`, correct: tries === 1, attempts: tries });
          actions.raiseFlag?.(sv.id, level);
          fb.textContent = `✅ ${sv.responsibility} is a ${level} responsibility.`;
          fb.className = 'q-feedback good';
          k++;
          tries = 0;
          draw();
        } else {
          fb.textContent = `🤔 Think again: is ${sv.responsibility.toLowerCase()} the same for all of Canada, or decided by each province?`;
          fb.className = 'q-feedback try';
          say(fb.textContent);
        }
      };
      body.append(tally, area, fb);
      draw();
    },

    sequence3d(beat) {
      world?.goTo(beat.location);
      actions.resetStations?.();
      let k = 0;
      let mistakes = 0;
      const fb = h('p', { class: 'q-feedback', 'aria-live': 'assertive' });
      const pool = h('div', { class: 'q-options' });
      const trail = h('ol', { class: 'q-trail' });
      const order = LAW_STATIONS.map((s) => s.id);
      const draw = () => {
        clear(pool);
        clear(trail);
        order.slice(0, k).forEach((id) => {
          const st = LAW_STATIONS.find((x) => x.id === id);
          trail.append(h('li', {}, st.symbol, ' ', st.name));
        });
        if (k >= order.length) {
          world?.highlight([]);
          record(beat, { type: 'sequence3d', response: 'All seven steps in order', correct: mistakes === 0, attempts: mistakes + 1 });
          fb.textContent = '✅ ROYAL ASSENT! The bill is now a law.';
          fb.className = 'q-feedback good';
          say(fb.textContent);
          setReady(true);
          return;
        }
        for (const id of shuffle(order.slice(k), k + 5)) {
          const st = LAW_STATIONS.find((x) => x.id === id);
          pool.append(h('button', { class: 'q-option', onclick: () => pick(id) }, h('span', { class: 'sym', 'aria-hidden': 'true' }, st.symbol), st.name));
        }
        world?.showLabels(order);
        world?.highlight([]);
      };
      const pick = (id) => {
        if (k >= order.length || !order.includes(id)) return;
        if (id === order[k]) {
          actions.lightStation?.(k);
          fb.textContent = `✅ Step ${k + 1}: ${LAW_STATIONS[k].name}.`;
          fb.className = 'q-feedback good';
          say(fb.textContent);
          k++;
        } else {
          mistakes++;
          fb.textContent = k ? `🤔 Not yet. What comes after “${LAW_STATIONS[k - 1].name}”?` : '🤔 Not yet. A law starts as a written plan.';
          fb.className = 'q-feedback try';
          say(fb.textContent);
        }
        draw();
      };
      selectHandler = pick;
      body.append(h('p', { class: 'q-prompt' }, plain ? 'Tap the next step.' : 'Tap the step that comes next, in the scene or below.'), trail, pool, fb);
      draw();
    },

    step(beat) {
      const lesson = getLesson(beat.lessonId);
      const st = lesson?.steps.find((s) => s.id === beat.stepId);
      world?.showLabels([]);
      world?.highlight([]);
      if (!st) {
        body.append(h('p', { class: 'q-status' }, 'This part of the lesson was removed or changed by the teacher. You can continue.'));
        setReady(true);
        return;
      }
      // The lesson player has its own Finish button, which continues the mission.
      nextBtn.hidden = true;
      const one = { ...lesson, id: mission.id, title: mission.title, steps: [{ ...st, sourceLessonId: lesson.id }] };
      body.append(renderPlayer(mission.id, 0, {
        site: true,
        lesson: one,
        silentFinish: true,
        renderFinish: () => {
          setTimeout(() => advance(true), 0);
          return h('p', { class: 'q-status' }, '✔ Done');
        },
      }));
    },

    reflect() {
      world?.showLabels([]);
      world?.highlight([]);
      const concepts = missionConcepts();
      const choices = [
        { id: 'explain', label: 'I can explain this', symbol: '💬' },
        { id: 'practice', label: 'I need more practice', symbol: '🔁' },
        { id: 'help', label: 'I want help with this', symbol: '🙋' },
      ];
      const fb = h('p', { class: 'q-feedback good', 'aria-live': 'polite' });
      body.append(
        h('p', { class: 'q-prompt' }, plain ? 'What you learned:' : 'The big ideas from this mission:'),
        h('ul', { class: 'q-concepts' }, concepts.map((c) => h('li', {}, c))),
        h('p', { class: 'q-prompt' }, 'How did it go?'),
        h('div', { class: 'q-options' }, choices.map((c) => h('button', { class: 'q-option', onclick: (e) => {
          body.querySelectorAll('.q-option').forEach((b) => b.classList.remove('picked'));
          e.currentTarget.classList.add('picked');
          record({ statementIds: [] }, { type: 'reflection', response: c.label, correct: null });
          fb.textContent = 'Thanks! Your teacher will see this.';
          setReady(true);
        } }, h('span', { class: 'sym', 'aria-hidden': 'true' }, c.symbol), c.label))),
        fb
      );
      say(concepts.join(' '));
    },
  };

  // ----- flow ---------------------------------------------------------------

  const head = h('div', { class: 'q-mission-head' });
  const root = h('div', { class: 'q-mission' }, head,
    h('div', { class: 'q-guide' }, h('span', { class: 'q-guide-avatar', 'aria-hidden': 'true' }, '🧭'), h('div', {}, h('strong', {}, 'Jordan, your guide'), guideText),
      p.narration !== 'off' && speechAvailable() ? h('button', { class: 'q-icon', 'aria-label': 'Read aloud', onclick: () => speak(lastLine || guideText.textContent, p.speechRate) }, '🔊') : null),
    body,
    h('div', { class: 'q-foot' }, h('button', { class: 'btn ghost', onclick: () => (stopSpeaking(), onExit?.()) }, 'Mission map'), assistBtn, nextBtn));

  function renderHead() {
    const cur = flat[index].phase;
    clear(head);
    head.append(
      h('p', { class: 'q-kicker' }, `${mission.icon} Mission`),
      h('h2', {}, mission.title),
      h('ol', { class: 'q-phases', 'aria-label': 'Mission phases' }, PHASES.map((ph) => {
        const pi = PHASES.findIndex((x) => x.id === cur);
        const me = PHASES.indexOf(ph);
        return h('li', { class: me < pi ? 'done' : me === pi ? 'now' : '', 'aria-current': me === pi ? 'step' : null }, h('span', { 'aria-hidden': 'true' }, ph.icon), h('span', { class: 'q-phase-label' }, ph.label));
      })));
  }

  function show() {
    stopSpeaking();
    selectHandler = null;
    clear(body);
    setReady(false);
    nextBtn.hidden = false;
    renderHead();
    const { beat } = flat[index];
    guide(T(beat.guide) || T(beat.prompt) || (index === 0 ? T(mission.goal) : 'Take your time. Tap Next when you are ready.'));
    (R[beat.type] || (() => body.append(h('p', {}, 'This activity type is not available.'))))(beat);
    save();
  }

  function advance(force = false) {
    if (!ready && !force) return;
    if (index < flat.length - 1) {
      index++;
      show();
    } else complete();
  }

  function complete() {
    stopSpeaking();
    selectHandler = null;
    world?.showLabels(null);
    world?.highlight([]);
    const first = results.filter(Boolean).length;
    const stars = results.length ? Math.max(1, Math.round((first / results.length) * 3)) : 3;
    const prev = missionProgress(mission.id);
    save({ done: true, index: 0, stars: Math.max(stars, prev?.stars || 0), completedAt: new Date().toISOString() });
    update((s) => s.evidence.push({ id: uid('ev'), sessionId, type: 'complete', lessonId: mission.lessonId, lessonTitle: mission.title, activityId: mission.id, stepId: null, stepTitle: `Completed mission: ${mission.title}`, response: `${stars} star(s); ${first} of ${results.length} first try`, correct: null, stars, statementIds: [], at: new Date().toISOString() }));
    clear(root);
    root.append(h('div', { class: 'q-complete' },
      h('p', { class: 'q-kicker' }, 'Mission complete'),
      h('p', { class: 'q-stars', 'aria-label': `${stars} of 3 stars` }, [1, 2, 3].map((i) => h('span', { class: i <= stars ? 'on' : 'off' }, '★'))),
      h('h2', {}, mission.title),
      h('p', {}, results.length ? `You got ${first} of ${results.length} right on the first try. Great perseverance!` : 'You explored every part of this mission.'),
      h('ul', { class: 'q-concepts' }, missionConcepts().map((c) => h('li', {}, c))),
      h('div', { class: 'q-foot' },
        nextMission ? h('button', { class: 'btn primary big', onclick: () => onNext?.(nextMission.id) }, `Next mission: ${nextMission.title} →`) : null,
        h('button', { class: 'btn ghost big', onclick: () => onNext?.(mission.id) }, 'Play again'),
        h('button', { class: 'btn ghost big', onclick: () => onExit?.() }, 'Mission map'))));
    say(`Mission complete. ${mission.title}.`);
  }

  panel.replaceChildren(root);
  show();
  return {
    handleSelect: (id) => selectHandler?.(id),
    exhibit: (id) => {
      if (selectHandler) return selectHandler(id);
      const card = exhibitCard(id);
      if (card) body.prepend(card);
    },
    dispose: () => stopSpeaking(),
  };
}
