import { createContext, useContext } from "react";

import type { SoundCue } from "./sounds";

export interface Sound {
  /** The sound setting of the user. The sound is off by default. */
  enabled: boolean;
  setEnabled(enabled: boolean): void;
  /** Plays a sound when the sound is on. */
  play(cue: SoundCue): void;
}

// Without a SoundProvider, there is no sound.
export const SoundContext = createContext<Sound>({
  enabled: false,
  setEnabled: () => {},
  play: () => {},
});

/** Gives the sound setting and a function that plays a sound. */
export function useSound(): Sound {
  return useContext(SoundContext);
}
