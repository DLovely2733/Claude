// An optional ambient soundscape per visual world, synthesized live (no audio
// files). Off by default; it fades in and out and never plays without a
// student or teacher turning it on.

import type { Skin } from '../data/types';

const TONES: Record<Skin, { freqs: number[]; filter: number; type: OscillatorType }> = {
  holo: { freqs: [55, 82.4, 110.2], filter: 600, type: 'sawtooth' },
  noir: { freqs: [65.4, 77.8, 98], filter: 420, type: 'triangle' },
  archive: { freqs: [73.4, 110, 146.8], filter: 900, type: 'sine' },
  surveillance: { freqs: [49, 51.9, 98], filter: 350, type: 'square' },
  atlas: { freqs: [65.4, 98, 130.8], filter: 800, type: 'triangle' },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let nodes: AudioScheduledSourceNode[] = [];
let current: Skin | null = null;

export function setAmbient(on: boolean, skin: Skin) {
  if (typeof window === 'undefined') return;
  if (!on) { stop(); return; }
  if (current === skin && nodes.length) return;
  stop(true);
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const spec = TONES[skin];
    master = ctx.createGain();
    master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = spec.filter;
    filter.connect(master).connect(ctx.destination);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = spec.filter * 0.4;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    nodes = [lfo];
    spec.freqs.forEach((f, i) => {
      const o = ctx!.createOscillator();
      o.type = spec.type;
      o.frequency.value = f;
      o.detune.value = (i - 1) * 6;
      const g = ctx!.createGain();
      g.gain.value = 0.25 / spec.freqs.length;
      o.connect(g).connect(filter);
      o.start();
      nodes.push(o);
    });
    master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2.5);
    current = skin;
  } catch {
    stop();
  }
}

function stop(immediate = false) {
  if (!ctx || !master) { nodes = []; current = null; return; }
  const old = nodes;
  const g = master;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + (immediate ? 0.1 : 1.2));
  setTimeout(() => old.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }), immediate ? 150 : 1300);
  nodes = [];
  master = null;
  current = null;
}
