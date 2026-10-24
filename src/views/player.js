// Priority 4: student-facing interactive lessons.

import { h, clear, speak, stopSpeaking, speechAvailable, toast } from '../ui.js';
import { getState, getLesson, update } from '../store.js';
import { go } from '../router.js';
import { renderVisual } from '../visuals.js';
import { activityStatementIds } from '../alignment.js';
import { withDefaults, textForStep, limitChoices, RESPONSE_MODES, PROMPT_LEVELS } from '../profile.js';
import { uid } from '../util.js';
import { alignmentFor, empty } from './common.js';

function shuffle(arr, seed) {
  const a = [...arr];
  let x = seed + 1;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {string} lessonId
 * @param {number|string} [startAt] step index
 * @param {object} [opts] Embedding options used by the student site:
 *   lesson – a lesson-like object to play instead of a stored lesson (activities);
 *   site – hide teacher-only controls; renderFinish(result, restart) – custom end screen.
 */
export function renderPlayer(lessonId, startAt, opts = {}) {
  const lesson = opts.lesson || getLesson(lessonId);
  if (!lesson) return empty('Lesson not found.', h('a', { href: '#/student' }, 'Choose a lesson'));
  const p = withDefaults(getState().profile);
  const r = alignmentFor(lesson);
  const sessionId = uid('session');
  const root = h('section', {
    class: `player ${p.highContrast ? 'contrast' : ''} ${p.reduceMotion ? 'calm' : ''}`,
    style: { '--scale': p.fontScale },
    'aria-label': `Lesson: ${lesson.title}`,
  });

  const steps = lesson.steps || [];
  let index = Math.min(Number(startAt) || 0, steps.length);

  const results = [];
  const record = (step, data) => {
    // Activity steps file their evidence under the lesson they practise.
    const target = (step.sourceLessonId && getLesson(step.sourceLessonId)) || lesson;
    results.push({ stepId: step.id, correct: data.correct });
    update((s) =>
      s.evidence.push({
        id: uid('ev'),
        sessionId,
        lessonId: target.id,
        lessonTitle: target.title,
        activityId: opts.lesson ? lesson.id : undefined,
        stepId: step.id,
        stepTitle: opts.lesson ? `${lesson.title}: ${step.title}` : step.title,
        stepKind: step.kind,
        curriculumVersionId: lesson.curriculumVersionId,
        curriculumVersionLabel: lesson.curriculumVersionLabel,
        alignmentStatus: r.status,
        statementIds: activityStatementIds(lesson, step),
        conceptIds: step.conceptIds || [],
        promptLevel: null,
        at: new Date().toISOString(),
        ...data,
      })
    );
  };

  const teacherBar = h('div', { class: 'teacher-bar no-print' },
    h('a', { href: `#/lesson/${lesson.id}`, class: 'button small ghost' }, '✎ Teacher: edit'),
    r.status !== 'verified' ? h('span', { class: 'badge warn', title: r.warnings.map((w) => w.message).join('\n') }, r.status === 'unverified' ? '⛔ No verified curriculum connection' : '⚠ Curriculum link needs review') : h('span', { class: 'badge ok' }, '✔ Curriculum-linked'));

  const stage = h('div', { class: 'stage' });
  if (!opts.site) root.append(teacherBar);
  root.append(h('h1', { class: 'lesson-title' }, lesson.title), stage);

  function renderStep() {
    stopSpeaking();
    clear(stage);
    if (p.pacing === 'full') {
      steps.forEach((st, i) => stage.append(stepView(st, i)));
      stage.append(finishView());
      return;
    }
    opts.onStep?.(index);
    if (index >= steps.length) return stage.append(finishView());
    stage.append(progress(), stepView(steps[index], index), navButtons());
    if (p.narration === 'auto') narrate(steps[index]);
  }

  function progress() {
    return h('ol', { class: 'progress', 'aria-label': `Step ${index + 1} of ${steps.length}` }, steps.map((st, i) => h('li', { class: i < index ? 'done' : i === index ? 'current' : '', 'aria-current': i === index ? 'step' : null }, h('span', { class: 'sr' }, st.title))));
  }

  function navButtons() {
    return h('div', { class: 'nav-buttons' },
      h('button', { class: 'big ghost', disabled: index === 0, onclick: () => ((index = Math.max(0, index - 1)), renderStep()) }, '⬅ Back'),
      h('button', { class: 'big primary', onclick: () => ((index += 1), renderStep()) }, index === steps.length - 1 ? 'Finish ✔' : 'Next ➡'));
  }

  function narrationText(st) {
    return st.narration || [st.title, textForStep(st, p), st.interaction?.prompt].filter(Boolean).join('. ');
  }
  function narrate(st) {
    speak(narrationText(st), p.speechRate);
  }

  function stepView(st, i) {
    const text = textForStep(st, p);
    const view = h('article', { class: `step kind-${st.kind}` });
    view.append(
      h('header', {},
        h('span', { class: 'kind-label' }, { connect: '🔗 My class', teach: '💡 Learn', practice: '🔁 Practise', apply: '🧭 Use it', check: '⭐ Show me' }[st.kind] || ''),
        h('h2', {}, st.title),
        p.narration !== 'off' && speechAvailable() ? h('button', { class: 'speak', 'aria-label': 'Read aloud', onclick: () => narrate(st) }, '🔊') : null)
    );
    const vis = renderVisual(st, p);
    if (vis) view.append(vis);
    if (p.textSupport === 'keywords' && st.keywords?.length && text) {
      view.append(h('details', { class: 'more-text' }, h('summary', {}, 'Read more'), h('p', { class: 'text' }, text)));
    } else if (text) {
      view.append(h('p', { class: 'text' }, text));
    }
    if (st.chunks?.length) view.append(chunkList(st));
    if (st.interaction) view.append(interaction(st, i));
    if (!opts.site) view.append(teacherSupport(st));
    return view;
  }

  function chunkList(st) {
    if (p.pacing !== 'one-step') return h('ol', { class: 'chunks' }, st.chunks.map((c) => h('li', {}, c)));
    let shown = 1;
    const list = h('ol', { class: 'chunks' });
    const more = h('button', { class: 'small' }, 'Next part ➡');
    const draw = () => {
      clear(list);
      st.chunks.slice(0, shown).forEach((c) => list.append(h('li', {}, c)));
      more.hidden = shown >= st.chunks.length;
    };
    more.addEventListener('click', () => {
      shown++;
      draw();
      if (p.narration !== 'off') speak(st.chunks[shown - 1], p.speechRate);
    });
    draw();
    return h('div', {}, list, more);
  }

  function teacherSupport(st) {
    const sel = h('select', { 'aria-label': 'Support level used (teacher)' }, h('option', { value: '' }, 'Teacher: support used…'), PROMPT_LEVELS.map((l) => h('option', { value: l.id }, l.label)));
    sel.addEventListener('change', () => {
      update((s) => {
        const ev = [...s.evidence].reverse().find((e) => e.sessionId === sessionId && e.stepId === st.id);
        if (ev) ev.promptLevel = sel.value || null;
        else s.evidence.push({ id: uid('ev'), sessionId, lessonId: lesson.id, lessonTitle: lesson.title, stepId: st.id, stepTitle: st.title, stepKind: st.kind, type: 'observation', response: 'Teacher observation', correct: null, promptLevel: sel.value, statementIds: activityStatementIds(lesson, st), conceptIds: st.conceptIds || [], curriculumVersionId: lesson.curriculumVersionId, curriculumVersionLabel: lesson.curriculumVersionLabel, alignmentStatus: r.status, at: new Date().toISOString() });
      });
      toast('Support level recorded.', 'info');
    });
    return h('div', { class: 'teacher-support no-print' }, sel);
  }

  // --- interactions --------------------------------------------------------

  function interaction(st, i) {
    const it = st.interaction;
    const rounds = st.kind === 'practice' ? Math.max(1, p.practiceRounds) : 1;
    const box = h('div', { class: 'interaction', role: 'group', 'aria-label': it.prompt || 'Activity' });
    let round = 0;
    const next = () => {
      round++;
      clear(box);
      if (rounds > 1) box.append(h('p', { class: 'round' }, `Round ${round} of ${rounds}`));
      if (it.prompt) box.append(h('p', { class: 'prompt' }, it.prompt));
      const done = (data) => {
        record(st, { type: it.type, round, ...data });
        if (round < rounds) box.append(h('button', { class: 'big', onclick: next }, '🔁 Practise again'));
      };
      const seed = i * 7 + round;
      const fn = { choice: choiceInt, yesno: yesNoInt, sort: sortInt, sequence: sequenceInt, decision: decisionInt, respond: respondInt }[it.type];
      if (fn) box.append(fn(st, it, done, seed));
    };
    next();
    return box;
  }

  function feedbackEl() {
    return h('p', { class: 'feedback', 'aria-live': 'assertive' });
  }
  function say(fb, text, good) {
    fb.textContent = `${good ? '✅' : '🤔'} ${text}`;
    fb.className = `feedback ${good ? 'good' : 'try'}`;
    if (p.narration !== 'off') speak(text, p.speechRate);
  }

  function choiceInt(st, it, done, seed) {
    const opts = shuffle(limitChoices(it.options || [], p, seed), seed);
    const fb = feedbackEl();
    let attempts = 0;
    let finished = false;
    const wrap = h('div', { class: 'choices' }, opts.map((o) =>
      h('button', { class: 'choice', onclick: (e) => {
        if (finished) return;
        attempts++;
        if (o.correct) {
          finished = true;
          e.currentTarget.classList.add('correct');
          say(fb, it.feedback?.correct || 'Yes! Great job.', true);
          done({ response: o.label, correct: attempts === 1, attempts });
        } else {
          e.currentTarget.classList.add('wrong');
          e.currentTarget.disabled = true;
          say(fb, it.feedback?.incorrect || 'Not yet. Try another one.', false);
        }
      } }, h('span', { class: 'sym' }, o.symbol || ''), h('span', {}, o.label))
    ));
    return h('div', {}, wrap, fb);
  }

  function yesNoInt(st, it, done) {
    const fb = feedbackEl();
    let attempts = 0;
    let finished = false;
    const pick = (val) => {
      if (finished) return;
      attempts++;
      if (val === it.answer) {
        finished = true;
        say(fb, it.feedback?.correct || 'Yes! That’s right.', true);
        done({ response: val ? 'Yes' : 'No', correct: attempts === 1, attempts });
      } else say(fb, it.feedback?.incorrect || 'Think again.', false);
    };
    return h('div', {}, h('div', { class: 'choices two' }, h('button', { class: 'choice', onclick: () => pick(true) }, h('span', { class: 'sym' }, '👍'), 'Yes'), h('button', { class: 'choice', onclick: () => pick(false) }, h('span', { class: 'sym' }, '👎'), 'No')), fb);
  }

  function sortInt(st, it, done, seed) {
    // Tap a card, then tap a group. Works with touch, mouse, keyboard and switch access.
    const items = shuffle(it.items || [], seed);
    const placed = new Map();
    let selected = null;
    let attempts = 0;
    const fb = feedbackEl();
    const pool = h('div', { class: 'card-pool', 'aria-label': 'Cards to sort' });
    const groups = h('div', { class: 'groups' });
    const draw = () => {
      clear(pool);
      clear(groups);
      for (const item of items.filter((x) => !placed.has(x.id))) {
        pool.append(h('button', { class: `sort-card ${selected === item.id ? 'selected' : ''}`, 'aria-pressed': selected === item.id, onclick: () => ((selected = item.id), draw()) }, h('span', { class: 'sym' }, item.symbol || ''), item.label));
      }
      for (const cat of it.categories || []) {
        groups.append(h('div', { class: 'group' },
          h('button', { class: 'group-target', disabled: !selected, onclick: () => {
            if (!selected) return;
            placed.set(selected, cat.id);
            selected = null;
            draw();
          } }, h('span', { class: 'sym' }, cat.symbol || ''), h('strong', {}, cat.label), selected ? h('small', {}, 'Tap to put card here') : null),
          h('div', { class: 'group-items' }, items.filter((x) => placed.get(x.id) === cat.id).map((x) => h('span', { class: 'placed' }, x.symbol, ' ', x.label)))));
      }
      if (placed.size === items.length && items.length) check();
    };
    const check = () => {
      attempts++;
      const wrong = items.filter((x) => placed.get(x.id) !== x.categoryId);
      if (!wrong.length) {
        say(fb, 'All sorted! Well done.', true);
        done({ response: items.map((x) => `${x.label} → ${(it.categories.find((c) => c.id === placed.get(x.id)) || {}).label}`).join('; '), correct: attempts === 1, attempts, score: `${items.length}/${items.length}` });
      } else {
        say(fb, `${items.length - wrong.length} of ${items.length} are right. Try the others again.`, false);
        for (const w of wrong) placed.delete(w.id);
        setTimeout(draw, p.reduceMotion ? 0 : 900);
      }
    };
    draw();
    return h('div', { class: 'sorter' }, pool, groups, fb);
  }

  function sequenceInt(st, it, done, seed) {
    const correct = it.items || [];
    const shuffled = shuffle(correct, seed + 3);
    let chosen = [];
    let attempts = 0;
    const fb = feedbackEl();
    const pool = h('div', { class: 'card-pool' });
    const answer = h('ol', { class: 'sequence-answer', 'aria-label': 'Your order' });
    const draw = () => {
      clear(pool);
      clear(answer);
      chosen.forEach((x) => answer.append(h('li', {}, x.symbol, ' ', x.label)));
      shuffled.filter((x) => !chosen.includes(x)).forEach((x) => pool.append(h('button', { class: 'sort-card', onclick: () => {
        chosen.push(x);
        draw();
        if (chosen.length === correct.length) check();
      } }, h('span', { class: 'sym' }, x.symbol || ''), x.label)));
    };
    const check = () => {
      attempts++;
      const right = chosen.filter((x, k) => x.id === correct[k].id).length;
      if (right === correct.length) {
        say(fb, 'Perfect order!', true);
        done({ response: chosen.map((x) => x.label).join(' → '), correct: attempts === 1, attempts, score: `${right}/${correct.length}` });
      } else {
        say(fb, `${right} of ${correct.length} are in the right place. Let’s try again.`, false);
        // Keep the correct beginning so the student builds on success.
        let keep = 0;
        while (keep < chosen.length && chosen[keep].id === correct[keep].id) keep++;
        chosen = chosen.slice(0, keep);
        setTimeout(draw, p.reduceMotion ? 0 : 900);
      }
    };
    draw();
    return h('div', { class: 'sequencer' }, h('p', { class: 'help' }, 'Tap the cards in order: first, next, last.'), answer, pool, h('button', { class: 'small ghost', onclick: () => ((chosen = []), draw()) }, '↺ Start again'), fb);
  }

  function decisionInt(st, it, done) {
    let choice = null;
    const reasons = new Set();
    const out = h('div', {});
    const draw = () => {
      clear(out);
      out.append(h('div', { class: 'choices' }, (it.options || []).map((o) =>
        h('button', { class: `choice ${choice === o.id ? 'selected' : ''}`, 'aria-pressed': choice === o.id, onclick: () => ((choice = o.id), draw()) }, h('span', { class: 'sym' }, o.symbol || ''), h('span', {}, o.label), o.detail ? h('small', {}, o.detail) : null))));
      if (choice && it.reasons?.length) {
        out.append(h('p', { class: 'prompt' }, it.reasonPrompt || 'Why?'));
        out.append(h('div', { class: 'choices small' }, it.reasons.map((rs) =>
          h('button', { class: `choice ${reasons.has(rs.id) ? 'selected' : ''}`, 'aria-pressed': reasons.has(rs.id), onclick: () => (reasons.has(rs.id) ? reasons.delete(rs.id) : reasons.add(rs.id), draw()) }, h('span', { class: 'sym' }, rs.symbol || ''), rs.label))));
      }
      const ready = choice && (!it.reasons?.length || reasons.size >= (it.minReasons || 1));
      if (ready) {
        out.append(h('button', { class: 'big primary', onclick: () => {
          const opt = it.options.find((o) => o.id === choice);
          const why = it.reasons?.filter((x) => reasons.has(x.id)).map((x) => x.label) || [];
          const sentence = `I chose ${opt.label}${why.length ? ` because ${why.join(' and ').toLowerCase()}` : ''}.`;
          clear(out);
          out.append(h('div', { class: 'decision-result' }, h('span', { class: 'sym big' }, opt.symbol || '✔'), h('p', {}, sentence)), it.discussion ? h('p', { class: 'teacher-note' }, '🧑‍🏫 ', it.discussion) : null);
          if (p.narration !== 'off') speak(sentence, p.speechRate);
          done({ response: sentence, choice: opt.label, reasons: why, correct: null, attempts: 1 });
        } }, 'This is my decision ✔'));
      }
    };
    draw();
    return out;
  }

  function respondInt(st, it, done) {
    const allowed = RESPONSE_MODES.filter((m) => p.responseModes.includes(m.id) && (!(lesson.demonstrationModes || []).length || lesson.demonstrationModes.includes(m.id)));
    const modes = allowed.length ? allowed : RESPONSE_MODES.filter((m) => p.responseModes.includes(m.id));
    const area = h('div', { class: 'respond-area' });
    const pickMode = (m) => {
      clear(area);
      area.append(h('p', { class: 'help' }, `${m.icon} ${m.label}`));
      if (m.id === 'type') {
        const ta = h('textarea', { rows: 4, 'aria-label': 'Your answer' });
        area.append(ta, h('button', { class: 'big primary', onclick: () => ta.value.trim() && (done({ response: ta.value.trim(), mode: m.id, correct: null }), area.replaceChildren(h('p', { class: 'feedback good' }, '✅ Saved!'))) }, 'Save ✔'));
      } else if (m.id === 'draw') {
        area.append(drawingPad((dataUrl) => (done({ response: 'Drawing', mode: m.id, media: dataUrl, correct: null }), area.replaceChildren(h('p', { class: 'feedback good' }, '✅ Drawing saved!')))));
      } else if (m.id === 'photo') {
        const f = h('input', { type: 'file', accept: 'image/*', capture: 'environment' });
        f.addEventListener('change', async () => {
          if (!f.files[0]) return;
          const dataUrl = await shrinkImage(f.files[0]);
          done({ response: 'Photo', mode: m.id, media: dataUrl, correct: null });
          area.replaceChildren(h('p', { class: 'feedback good' }, '✅ Photo saved!'), h('img', { src: dataUrl, alt: 'Student photo evidence', class: 'thumb' }));
        });
        area.append(f);
      } else {
        // Speaking, AAC, demonstrating, pointing, yes/no: the teacher records what happened.
        const note = h('textarea', { rows: 3, placeholder: 'Teacher: write what the student said, selected or showed.', 'aria-label': 'Teacher note of response' });
        area.append(h('p', {}, 'Show or tell your teacher. 🧑‍🏫'), note, h('button', { class: 'big primary', onclick: () => (done({ response: note.value.trim() || `Responded by ${m.label.toLowerCase()}`, mode: m.id, correct: null, teacherRecorded: true }), area.replaceChildren(h('p', { class: 'feedback good' }, '✅ Recorded!'))) }, 'Record response ✔'));
      }
    };
    return h('div', {}, h('div', { class: 'choices small' }, modes.map((m) => h('button', { class: 'choice', onclick: () => pickMode(m) }, h('span', { class: 'sym' }, m.icon), m.label))), area);
  }

  function finishView() {
    if (opts.renderFinish) {
      const scored = results.filter((x) => x.correct === true || x.correct === false);
      const firstTry = scored.filter((x) => x.correct === true).length;
      const stars = scored.length ? Math.max(1, Math.round((firstTry / scored.length) * 3)) : 3;
      const result = { stars, firstTry, scored: scored.length };
      update((s) => s.evidence.push({ id: uid('ev'), sessionId, type: 'complete', lessonId: opts.lesson ? (steps[0]?.sourceLessonId || lesson.id) : lesson.id, lessonTitle: lesson.title, activityId: opts.lesson ? lesson.id : undefined, stepId: null, stepTitle: `Finished: ${lesson.title}`, response: `${stars} star(s)`, correct: null, stars, statementIds: [], at: new Date().toISOString() }));
      return opts.renderFinish(result, () => ((index = 0), results.length = 0, renderStep()));
    }
    return h('div', { class: 'finish' },
      h('p', { class: 'sym huge', 'aria-hidden': 'true' }, '🎉'),
      h('h2', {}, 'You did it!'),
      h('p', {}, `You finished “${lesson.title}”.`),
      h('div', { class: 'nav-buttons' },
        h('button', { class: 'big ghost', onclick: () => ((index = 0), renderStep()) }, '🔁 Do it again'),
        h('button', { class: 'big', onclick: () => go(`evidence/${lesson.id}`) }, 'Teacher: review evidence')));
  }

  renderStep();
  return root;
}

function drawingPad(onSave) {
  const canvas = h('canvas', { width: 600, height: 360, class: 'pad', 'aria-label': 'Drawing area' });
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1b2a4a';
  let drawing = false;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * canvas.width, ((e.clientY - r.top) / r.height) * canvas.height];
  };
  canvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    ctx.beginPath();
    ctx.moveTo(...pos(e));
  });
  canvas.addEventListener('pointermove', (e) => drawing && (ctx.lineTo(...pos(e)), ctx.stroke()));
  canvas.addEventListener('pointerup', () => (drawing = false));
  const colours = ['#1b2a4a', '#c62828', '#2e7d32', '#1565c0', '#f9a825'];
  return h('div', { class: 'pad-wrap' },
    canvas,
    h('div', { class: 'row-actions' },
      colours.map((c) => h('button', { class: 'swatch', style: { background: c }, 'aria-label': `Colour ${c}`, onclick: () => (ctx.strokeStyle = c) })),
      h('button', { class: 'small ghost', onclick: () => ((ctx.fillStyle = '#fff'), ctx.fillRect(0, 0, canvas.width, canvas.height)) }, 'Clear'),
      h('button', { class: 'big primary', onclick: () => onSave(canvas.toDataURL('image/jpeg', 0.6)) }, 'Save drawing ✔')));
}

function shrinkImage(file, max = 640) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
