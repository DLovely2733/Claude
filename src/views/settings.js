// Priority 2: teacher-controlled individualization settings.

import { h, field, select, input, textarea, checkbox, toast } from '../ui.js';
import { getState, update } from '../store.js';
import { rerender } from '../router.js';
import { RESPONSE_MODES, PROMPT_LEVELS, TEXT_SUPPORT_OPTIONS, withDefaults } from '../profile.js';
import { CONTENT_AREAS } from '../curriculum/model.js';
import { uid } from '../util.js';
import { pageHeader } from './common.js';

export function renderSettings() {
  const p = withDefaults(getState().profile);
  getState().profile = p;
  const save = () => update(() => {});

  return h(
    'section',
    { class: 'settings' },
    pageHeader('Student settings', 'Choose supports based on what you know about this student. Nothing is assumed from a diagnosis: every support below is off or standard until you change it, and can be changed at any time.'),
    h('div', { class: 'alert info' }, 'These settings shape how lessons are presented. They do not change the curriculum outcome the class is working on. Individualized goals (below) are tracked separately from Grade 9 outcomes.'),

    h('div', { class: 'card' },
      h('h2', {}, 'Student'),
      h('div', { class: 'grid2' },
        field('Student name or initials (shown on reports)', input(p.studentName, (v) => ((p.studentName = v), save()))),
        field('Community name (used for local examples)', input(p.communityName, (v) => ((p.communityName = v), save())), 'e.g. the student’s town, city, First Nation or Métis Settlement.')),
      field('Interests (to make examples concrete)', input(p.interests, (v) => ((p.interests = v), save())), 'e.g. hockey, music, animals.')
    ),

    h('div', { class: 'card' },
      h('h2', {}, 'Reading and text'),
      h('div', { class: 'grid2' },
        field('Text support', select(TEXT_SUPPORT_OPTIONS, p.textSupport, (v) => ((p.textSupport = v), save(), rerender())), TEXT_SUPPORT_OPTIONS.find((o) => o.id === p.textSupport)?.help),
        field('Text size', select([{ id: 1, label: 'Standard' }, { id: 1.2, label: 'Large' }, { id: 1.45, label: 'Extra large' }].map((o) => ({ ...o, id: String(o.id) })), String(p.fontScale), (v) => ((p.fontScale = Number(v)), save())))),
      checkbox('High-contrast colours', p.highContrast, (v) => ((p.highContrast = v), save())),
      checkbox('Reduce motion and animation', p.reduceMotion, (v) => ((p.reduceMotion = v), save()))
    ),

    h('div', { class: 'card' },
      h('h2', {}, 'Visual and auditory supports'),
      h('div', { class: 'grid2' },
        field('Visuals', select([{ id: 'minimal', label: 'Minimal' }, { id: 'supporting', label: 'Supporting pictures' }, { id: 'rich', label: 'Rich (pictures on every step)' }], p.visuals, (v) => ((p.visuals = v), save()))),
        field('Narration', select([{ id: 'off', label: 'Off' }, { id: 'on-demand', label: 'On request (🔊 button)' }, { id: 'auto', label: 'Read each step aloud automatically' }], p.narration, (v) => ((p.narration = v), save())), 'Uses the device’s built-in text-to-speech.')),
      field(`Speech rate (${p.speechRate})`, input(p.speechRate, (v) => ((p.speechRate = v), save()), { type: 'range', min: 0.5, max: 1.3, step: 0.1 }))
    ),

    h('div', { class: 'card' },
      h('h2', {}, 'Pacing and practice'),
      h('div', { class: 'grid2' },
        field('Steps per screen', select([{ id: 'one-step', label: 'One small step at a time' }, { id: 'section', label: 'One lesson part at a time' }, { id: 'full', label: 'Whole lesson on one page' }], p.pacing, (v) => ((p.pacing = v), save()))),
        field('Answer choices per question', select(['2', '3', '4'], String(p.choicesPerQuestion), (v) => ((p.choicesPerQuestion = Number(v)), save())), 'The correct answer is always kept.'),
        field('Practice repetitions', select(['1', '2', '3'], String(p.practiceRounds), (v) => ((p.practiceRounds = Number(v)), save())), 'How many times practice activities repeat (shuffled).'),
        field('Target support level', select(PROMPT_LEVELS, p.targetPromptLevel, (v) => ((p.targetPromptLevel = v), save())), 'Used in assessment criteria and progress reports.')),
      checkbox('Allow extra time (no timers)', p.extraTime, (v) => ((p.extraTime = v), save()))
    ),

    h('div', { class: 'card' },
      h('h2', {}, 'Ways to respond and show understanding'),
      h('p', { class: 'help' }, 'Turn on every method the student can use. Lessons offer only enabled methods.'),
      h('div', { class: 'mode-grid' }, RESPONSE_MODES.map((m) =>
        checkbox(`${m.icon} ${m.label}`, p.responseModes.includes(m.id), (v) => {
          p.responseModes = v ? [...new Set([...p.responseModes, m.id])] : p.responseModes.filter((x) => x !== m.id);
          if (!p.responseModes.length) toast('At least one response method should be enabled.', 'warn');
          save();
        })
      ))
    ),

    goalsCard(p, save),

    h('div', { class: 'card' }, h('h2', {}, 'Teacher notes'), textarea(p.notes, (v) => ((p.notes = v), save()), { rows: 4, 'aria-label': 'Teacher notes' }))
  );
}

function goalsCard(p, save) {
  return h(
    'div',
    { class: 'card' },
    h('h2', {}, 'Individualized learning goals'),
    h('p', { class: 'help' }, 'Goals from the student’s learning plan (e.g. IPP). These are different from curriculum adaptations: progress on a goal is reported as goal progress, not as achievement of a Grade 9 outcome.'),
    p.goals.length ? null : h('p', {}, h('em', {}, 'No goals yet.')),
    p.goals.map((g, i) =>
      h('div', { class: 'goal-row' },
        textarea(g.text, (v) => ((g.text = v), save()), { rows: 2, 'aria-label': `Goal ${i + 1}` }),
        select([{ id: '', label: 'Any area' }, { id: 'communication', label: 'Communication' }, { id: 'literacy', label: 'Literacy' }, { id: 'social', label: 'Social / participation' }, { id: 'independence', label: 'Independence' }, ...CONTENT_AREAS.map((a) => ({ id: a.id, label: a.name }))], g.area || '', (v) => ((g.area = v), save())),
        h('button', { class: 'small ghost danger', onclick: () => ((p.goals = p.goals.filter((x) => x !== g)), save(), rerender()) }, 'Remove'))
    ),
    h('button', { class: 'small', onclick: () => (p.goals.push({ id: uid('goal'), text: '', area: '' }), save(), rerender()) }, '+ Add goal')
  );
}
