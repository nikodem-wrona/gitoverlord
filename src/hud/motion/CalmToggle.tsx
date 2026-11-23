import { Checkbox } from "../Checkbox";
import { useMotion } from "./motionContext";

/** Turns calm mode on and off. It is locked on when the system asks for reduced motion. */
export function CalmToggle() {
  const { calmSetting, systemCalm, setCalmSetting } = useMotion();

  return (
    <Checkbox
      label="Calm mode"
      checked={calmSetting || systemCalm}
      disabled={systemCalm}
      onChange={setCalmSetting}
      title={
        systemCalm
          ? "Your system asks for reduced motion."
          : "Stop the animations."
      }
    />
  );
}
