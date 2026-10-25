import { createContext, useContext } from 'react';
import type { Mission, Novel, StepResponse } from '../data/types';
import { useApp } from '../state/store';
import { responseKey } from '../data/synthetic';

export const PREVIEW_STUDENT = 'teacher-preview';

interface MissionCtx {
  mission: Mission;
  novel: Novel;
  studentId: string;
  preview: boolean;
  /** Route prefix for this mission: student play or teacher preview. */
  base: string;
}

const Ctx = createContext<MissionCtx | null>(null);
export const MissionProvider = Ctx.Provider;

export function useMissionCtx() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMissionCtx outside MissionProvider');
  return v;
}

/** The current student's saved response for a step, plus a saver bound to them. */
export function useStepResponse(stepId: string) {
  const { mission, studentId } = useMissionCtx();
  const response = useApp((s) => s.responses[responseKey(studentId, mission.id, stepId)]);
  const saveResponse = useApp((s) => s.saveResponse);
  const settings = useApp((s) => s.settings);
  const save = (data: Record<string, unknown>, opts: { submit?: boolean; revision?: string } = {}) =>
    saveResponse(mission.id, stepId, data, { ...opts, studentId, supports: activeSupports(settings) });
  return { response, data: (response?.data ?? {}) as Record<string, unknown>, save };
}

function activeSupports(s: ReturnType<typeof useApp.getState>['settings']): string[] {
  const out: string[] = [];
  if (s.plainLanguage) out.push('plain language');
  if (s.shortInstructions) out.push('short instructions');
  if (s.readAloud) out.push('read aloud');
  if (s.sentenceFrames) out.push('sentence starters');
  if (s.textScale > 1) out.push('larger text');
  return out;
}

export type StepState = 'locked' | 'available' | 'in-progress' | 'done';

export function stepStates(mission: Mission, responses: Record<string, StepResponse>, studentId: string, preview = false): StepState[] {
  const out: StepState[] = [];
  mission.steps.forEach((step, i) => {
    const r = responses[responseKey(studentId, mission.id, step.id)];
    if (r?.status === 'submitted') return out.push('done');
    const prevDone = i === 0 || out[i - 1] === 'done';
    if (!prevDone && !preview) return out.push('locked');
    out.push(r ? 'in-progress' : 'available');
  });
  return out;
}
