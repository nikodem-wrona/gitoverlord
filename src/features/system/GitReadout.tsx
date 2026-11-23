import { PulseDot, type StatusState, type Tone } from "@/hud";

import styles from "./GitReadout.module.css";
import { useGitStatus } from "./useGitStatus";

const TONES: Record<StatusState, Tone> = {
  pending: "dim",
  ok: "ok",
  fail: "fail",
};

/** A compact readout of the system `git` for the status bar. */
export function GitReadout() {
  const git = useGitStatus();
  const tone = TONES[git.state];

  return (
    <span
      role="status"
      className={styles.readout}
      data-tone={tone}
      title={git.hint}
    >
      <PulseDot tone={tone} pulse={git.state === "ok"} />
      <span>Git</span>
      <span className={styles.value}>{git.value}</span>
    </span>
  );
}
