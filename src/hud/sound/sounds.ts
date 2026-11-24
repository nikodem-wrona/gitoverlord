/** The sounds of the application. Each one matches the tone of a result. */
export type SoundCue = "ok" | "warn" | "fail";

/** One tone of a sound. The times are in seconds from the start of the sound. */
export interface Note {
  frequency: number;
  start: number;
  length: number;
}

interface Cue {
  wave: OscillatorType;
  notes: readonly Note[];
}

/** Short synthesized tones. The application has no sound files. */
export const CUES: Record<SoundCue, Cue> = {
  ok: {
    wave: "triangle",
    notes: [
      { frequency: 880, start: 0, length: 0.07 },
      { frequency: 1320, start: 0.07, length: 0.1 },
    ],
  },
  warn: {
    wave: "triangle",
    notes: [
      { frequency: 660, start: 0, length: 0.08 },
      { frequency: 660, start: 0.13, length: 0.08 },
    ],
  },
  fail: {
    wave: "sawtooth",
    notes: [
      { frequency: 220, start: 0, length: 0.12 },
      { frequency: 165, start: 0.12, length: 0.18 },
    ],
  },
};

/** The loudness of each tone, from 0 to 1. Soft, so that it does not disturb. */
const VOLUME = 0.04;
/** An exponential ramp cannot end at 0. */
const SILENT = 0.0001;

/** Plays one sound on `context`. */
export function playCue(context: AudioContext, cue: SoundCue): void {
  const { wave, notes } = CUES[cue];
  for (const note of notes) {
    const start = context.currentTime + note.start;
    const end = start + note.length;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = note.frequency;
    gain.gain.setValueAtTime(VOLUME, start);
    gain.gain.exponentialRampToValueAtTime(SILENT, end);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end);
  }
}

/**
 * Makes a function that plays a sound. The audio context starts at the first sound,
 * after a click of the user. Where there is no Web Audio, the function does nothing.
 */
export function createPlayer(): (cue: SoundCue) => void {
  let context: AudioContext | null = null;
  return (cue) => {
    if (typeof AudioContext === "undefined") return;
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    playCue(context, cue);
  };
}
