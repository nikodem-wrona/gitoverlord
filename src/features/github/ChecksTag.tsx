import type { Tone } from "@/hud";
import type { Checks } from "@/ipc";

import styles from "./GitHub.module.css";

const TONES: Record<Checks, Tone> = {
  passing: "ok",
  failing: "fail",
  pending: "warn",
  none: "dim",
};

const LABELS: Record<Checks, string> = {
  passing: "Passing",
  failing: "Failing",
  pending: "Pending",
  none: "No checks",
};

/** The combined state of the checks of a pull request, in its color. */
export function ChecksTag({ checks }: { checks: Checks }) {
  return (
    <span className={styles.tag} data-tone={TONES[checks]}>
      {LABELS[checks]}
    </span>
  );
}
