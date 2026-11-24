import { type ReactNode, useMemo, useState } from "react";

import { readSetting, writeSetting } from "../settings";
import { type Sound, SoundContext } from "./soundContext";
import { createPlayer } from "./sounds";

const SOUND_KEY = "gitoverlord.sound";

/** Holds the sound setting of the user. The sound is off until the user turns it on. */
export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(
    () => readSetting(SOUND_KEY) === "on",
  );
  const [player] = useState(createPlayer);

  const value = useMemo<Sound>(
    () => ({
      enabled,
      setEnabled: (next) => {
        writeSetting(SOUND_KEY, next ? "on" : "off");
        setEnabledState(next);
        // The user hears the sound that the setting turns on.
        if (next) player("ok");
      },
      play: (cue) => {
        if (enabled) player(cue);
      },
    }),
    [enabled, player],
  );

  return <SoundContext value={value}>{children}</SoundContext>;
}
