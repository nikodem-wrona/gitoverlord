import type { GitStatus } from "@/features/system";
import type { StatusState } from "@/hud";
import { isDemoBackend } from "@/ipc";

export interface BootStep {
  label: string;
  state: StatusState;
  value: string;
}

/** The lines that the boot screen shows, in order. */
export function bootSteps(git: GitStatus): BootStep[] {
  return [
    { label: "HUD kit", state: "ok", value: "Online" },
    { label: "Git core", state: git.state, value: git.value },
    { label: "Repository link", state: "ok", value: linkValue() },
    { label: "Timeline", state: "ok", value: "Calibrated" },
  ];
}

function linkValue(): string {
  return isDemoBackend() ? "Demo data" : "Ready";
}
