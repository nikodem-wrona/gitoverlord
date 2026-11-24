import { StatusButton } from "../StatusButton";
import { useSound } from "./soundContext";

/** Turns the sound on and off, in the status bar. */
export function SoundToggle() {
  const { enabled, setEnabled } = useSound();
  return (
    <StatusButton
      aria-pressed={enabled}
      title={enabled ? "Turn off the sound." : "Play a sound for each result."}
      onClick={() => setEnabled(!enabled)}
    >
      Sound: {enabled ? "on" : "off"}
    </StatusButton>
  );
}
