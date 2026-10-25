import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CurriculumProfile, Mission, Novel, Rubric, Settings, Student, StepResponse, TeacherReview,
} from '../data/types';
import { endersGame } from '../data/novels/endersGame';
import { pressurePoint } from '../data/missions/pressurePoint';
import { ALBERTA_ELA_HEADINGS } from '../data/curriculum';
import { ROSTER, DEMO_STUDENT_ID, seedResponses, responseKey } from '../data/synthetic';

export const DEFAULT_SETTINGS: Settings = {
  textScale: 1,
  wideSpacing: false,
  highContrast: false,
  reducedMotion: false,
  plainLanguage: false,
  shortInstructions: false,
  readAloud: false,
  sentenceFrames: false,
  sound: false,
  scene: 'auto',
  mentor: true,
};

export const DEFAULT_RUBRIC: Rubric = {
  levelNames: ['Emerging', 'Developing', 'Proficient', 'Insightful'],
  criteria: [
    { id: 'interpretation', name: 'Interpretation',
      levels: ['Restates events; meaning is not yet explored.', 'Offers a basic interpretation that is mostly literal.', 'Offers a clear, reasonable interpretation of characters or ideas.', 'Offers a perceptive interpretation that considers complexity or ambiguity.'] },
    { id: 'evidence', name: 'Use of evidence',
      levels: ['Little or no reference to the text.', 'Refers to the text in general terms.', 'Uses relevant, specific evidence from the chapters.', 'Selects the most telling evidence and uses it precisely.'] },
    { id: 'reasoning', name: 'Reasoning',
      levels: ['Connection between evidence and claim is unclear.', 'Some connection between evidence and claim.', 'Explains clearly how evidence supports the claim.', 'Explains convincingly and addresses other readings or counter-evidence.'] },
    { id: 'communication', name: 'Communication',
      levels: ['Ideas are difficult to follow.', 'Ideas are understandable but loosely organized.', 'Ideas are clear and organized.', 'Ideas are precise, fluent and purposefully organized.'] },
    { id: 'creativity', name: 'Creativity & insight',
      levels: ['Relies on obvious responses.', 'Shows some original thought.', 'Shows thoughtful, original choices.', 'Shows inventive thinking that deepens understanding.'] },
  ],
};

interface AppState {
  settings: Settings;
  novels: Record<string, Novel>;
  missions: Record<string, Mission>;
  profiles: CurriculumProfile[];
  activeProfileId: string;
  rubric: Rubric;
  roster: Student[];
  activeStudentId: string;
  responses: Record<string, StepResponse>;
  seenIntro: boolean;

  setSettings: (s: Partial<Settings>) => void;
  setActiveStudent: (id: string) => void;
  markIntroSeen: () => void;

  saveResponse: (missionId: string, stepId: string, data: Record<string, unknown>, opts?: { submit?: boolean; revision?: string; supports?: string[]; studentId?: string }) => void;
  reviewResponse: (key: string, review: Omit<TeacherReview, 'at'>) => void;
  resetMissionProgress: (studentId: string, missionId: string) => void;

  saveNovel: (n: Novel) => void;
  deleteNovel: (id: string) => void;
  saveMission: (m: Mission) => void;
  deleteMission: (id: string) => void;

  saveProfile: (p: CurriculumProfile) => void;
  setActiveProfile: (id: string) => void;
  saveRubric: (r: Rubric) => void;
  saveStudentPresets: (id: string, presets: Partial<Settings>) => void;

  resetDemo: () => void;
}

// localStorage can throw (private windows, blocked storage). The app must
// still work for the session, so fall back to memory.
const memory = new Map<string, string>();
const safeStorage = {
  getItem: (k: string) => {
    try { return localStorage.getItem(k); } catch { return memory.get(k) ?? null; }
  },
  setItem: (k: string, v: string) => {
    try { localStorage.setItem(k, v); } catch { memory.set(k, v); }
  },
  removeItem: (k: string) => {
    try { localStorage.removeItem(k); } catch { memory.delete(k); }
  },
};

const initialData = () => ({
  settings: DEFAULT_SETTINGS,
  novels: { [endersGame.id]: endersGame },
  missions: { [pressurePoint.id]: pressurePoint },
  profiles: [ALBERTA_ELA_HEADINGS],
  activeProfileId: ALBERTA_ELA_HEADINGS.id,
  rubric: DEFAULT_RUBRIC,
  roster: ROSTER,
  activeStudentId: DEMO_STUDENT_ID,
  responses: seedResponses(),
  seenIntro: false,
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      setActiveStudent: (id) => {
        const student = get().roster.find((r) => r.id === id);
        set({ activeStudentId: id, settings: { ...DEFAULT_SETTINGS, ...student?.presets } });
      },
      markIntroSeen: () => set({ seenIntro: true }),

      saveResponse: (missionId, stepId, data, opts = {}) => {
        const studentId = opts.studentId ?? get().activeStudentId;
        const key = responseKey(studentId, missionId, stepId);
        const prev = get().responses[key];
        const revisions = prev?.revisions ?? [];
        // A change after submitting is a revision: keep what came before so
        // the teacher can see how the thinking developed.
        const isRevision = prev?.status === 'submitted' && (opts.submit || opts.revision);
        const next: StepResponse = {
          studentId, missionId, stepId,
          status: opts.submit || prev?.status === 'submitted' ? 'submitted' : 'in-progress',
          data: { ...prev?.data, ...data },
          supports: opts.supports ?? prev?.supports ?? [],
          revisions: isRevision ? [...revisions, { at: Date.now(), summary: opts.revision ?? 'Resubmitted', data: prev.data }] : revisions,
          updatedAt: Date.now(),
          review: prev?.review,
        };
        set({ responses: { ...get().responses, [key]: next } });
      },

      reviewResponse: (key, review) => {
        const r = get().responses[key];
        if (!r) return;
        set({ responses: { ...get().responses, [key]: { ...r, review: { ...review, at: Date.now() } } } });
      },

      resetMissionProgress: (studentId, missionId) => {
        const responses = { ...get().responses };
        for (const k of Object.keys(responses)) if (k.startsWith(`${studentId}|${missionId}|`)) delete responses[k];
        set({ responses });
      },

      saveNovel: (n) => set({ novels: { ...get().novels, [n.id]: n } }),
      deleteNovel: (id) => {
        const novels = { ...get().novels };
        delete novels[id];
        const missions = Object.fromEntries(Object.entries(get().missions).filter(([, m]) => m.novelId !== id));
        set({ novels, missions });
      },
      saveMission: (m) => set({ missions: { ...get().missions, [m.id]: { ...m, updatedAt: Date.now() } } }),
      deleteMission: (id) => {
        const missions = { ...get().missions };
        delete missions[id];
        set({ missions });
      },

      saveProfile: (p) => {
        const exists = get().profiles.some((x) => x.id === p.id);
        set({ profiles: exists ? get().profiles.map((x) => (x.id === p.id ? p : x)) : [...get().profiles, p] });
      },
      setActiveProfile: (id) => set({ activeProfileId: id }),
      saveRubric: (r) => set({ rubric: r }),
      saveStudentPresets: (id, presets) =>
        set({ roster: get().roster.map((s) => (s.id === id ? { ...s, presets } : s)) }),

      resetDemo: () => set(initialData()),
    }),
    {
      name: 'novelverse:v1',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

// ---------------------------------------------------------------- selectors

export const useNovel = (id: string | undefined) => useApp((s) => (id ? s.novels[id] : undefined));
export const useMission = (id: string | undefined) => useApp((s) => (id ? s.missions[id] : undefined));

export function useResponse(missionId: string, stepId: string): StepResponse | undefined {
  return useApp((s) => s.responses[responseKey(s.activeStudentId, missionId, stepId)]);
}

export function useOutcomeLookup() {
  const profiles = useApp((s) => s.profiles);
  return (id: string) => {
    for (const p of profiles) {
      const o = p.outcomes.find((x) => x.id === id);
      if (o) return o;
    }
    return undefined;
  };
}
