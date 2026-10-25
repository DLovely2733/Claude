// Synthesized interface sounds (no audio files). Off by default so a class
// set of laptops starts quiet; students turn it on in Settings.

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

type Cue = 'tap' | 'open' | 'success' | 'unlock' | 'soft-fail' | 'pin';

const CUES: Record<Cue, { f: number[]; d: number; type: OscillatorType; gain: number }> = {
  tap: { f: [660], d: 0.05, type: 'sine', gain: 0.05 },
  open: { f: [440, 660], d: 0.09, type: 'triangle', gain: 0.05 },
  pin: { f: [520, 780], d: 0.06, type: 'sine', gain: 0.05 },
  success: { f: [523, 659, 784], d: 0.12, type: 'triangle', gain: 0.06 },
  unlock: { f: [392, 523, 659, 1046], d: 0.11, type: 'sine', gain: 0.06 },
  // A gentle low tone, never a buzzer: "not yet" rather than "wrong".
  'soft-fail': { f: [330, 294], d: 0.12, type: 'sine', gain: 0.04 },
};

export function play(cue: Cue) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    ctx ??= new AudioContext();
    const spec = CUES[cue];
    const now = ctx.currentTime;
    spec.f.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = spec.type;
      osc.frequency.value = freq;
      const t = now + i * spec.d;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(spec.gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + spec.d * 1.8);
      osc.connect(g).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + spec.d * 2);
    });
  } catch {
    // Audio is decoration; failing quietly is correct.
  }
}
