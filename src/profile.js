// Teacher-controlled individualization settings.
//
// Defaults are deliberately neutral (standard text, all response modes
// available, no reduced choices). Nothing here is inferred from a diagnosis:
// every support is switched on by the teacher based on what they know about
// the student.

export const RESPONSE_MODES = [
  { id: 'tap', label: 'Tap / point to an answer', icon: '👆' },
  { id: 'speak', label: 'Say it (teacher records)', icon: '🗣️' },
  { id: 'type', label: 'Type or write', icon: '⌨️' },
  { id: 'draw', label: 'Draw it', icon: '✏️' },
  { id: 'sort', label: 'Sort or match cards', icon: '🃏' },
  { id: 'aac', label: 'AAC device / symbol board', icon: '🔤' },
  { id: 'yesno', label: 'Yes / no or thumbs', icon: '👍' },
  { id: 'demonstrate', label: 'Show or act it out', icon: '🎭' },
  { id: 'photo', label: 'Photo or video evidence', icon: '📷' },
];

export const PROMPT_LEVELS = [
  { id: 'independent', label: 'Independent' },
  { id: 'gesture', label: 'Gesture / visual cue' },
  { id: 'verbal', label: 'Verbal prompt' },
  { id: 'model', label: 'Modelled' },
  { id: 'physical', label: 'Hand-over-hand / full support' },
];

export const DEFAULT_PROFILE = {
  studentName: '',
  textSupport: 'standard', // standard | plain | plain-symbols | keywords
  narration: 'on-demand', // off | on-demand (🔊 button, nothing plays unless pressed) | auto
  speechRate: 0.9,
  visuals: 'supporting', // minimal | supporting | rich
  pacing: 'section', // one-step | section | full
  choicesPerQuestion: 4, // 2–4
  practiceRounds: 1, // 1–3 repetitions of practice items
  responseModes: RESPONSE_MODES.map((m) => m.id),
  targetPromptLevel: 'independent',
  fontScale: 1,
  highContrast: false,
  reduceMotion: false,
  extraTime: false,
  communityName: '',
  interests: '',
  goals: [], // [{id, text, area}] — individualized learning goals written by the teacher
  notes: '',
};

export const TEXT_SUPPORT_OPTIONS = [
  { id: 'standard', label: 'Standard text', help: 'Show lesson text as written.' },
  { id: 'plain', label: 'Plain language', help: 'Show the plain-language version of each explanation when the teacher has written one.' },
  { id: 'plain-symbols', label: 'Plain language + symbols', help: 'Plain language with a picture symbol beside key words.' },
  { id: 'keywords', label: 'Key words and pictures', help: 'Show key-word cards and pictures; full text available on request.' },
];

export function withDefaults(profile) {
  return { ...DEFAULT_PROFILE, ...(profile || {}), goals: profile?.goals || [] };
}

/** Pick the explanation text to show for a step given the profile. */
export function textForStep(step, profile) {
  const p = withDefaults(profile);
  if (p.textSupport === 'standard') return step.text || step.plainText || '';
  return step.plainText || step.text || '';
}

/** Limit multiple-choice options while always keeping the correct answer. */
export function limitChoices(options, profile, seed = 0) {
  const n = Math.max(2, Math.min(4, withDefaults(profile).choicesPerQuestion));
  if (options.length <= n) return options;
  const correct = options.filter((o) => o.correct);
  const wrong = options.filter((o) => !o.correct);
  const keepWrong = wrong.slice(seed % Math.max(1, wrong.length)).concat(wrong).slice(0, Math.max(0, n - correct.length));
  const kept = new Set([...correct, ...keepWrong]);
  return options.filter((o) => kept.has(o));
}
