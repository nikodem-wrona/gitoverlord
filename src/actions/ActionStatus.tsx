import { DecodeText, PulseDot } from "@/hud";

import { useActions } from "./actionContext";
import styles from "./ActionStatus.module.css";

/** The action that runs now, or the result of the last action. For the status bar. */
export function ActionStatus() {
  const { busy, last } = useActions();

  if (busy) {
    return (
      <span className={styles.status} role="status">
        <PulseDot pulse />
        {busy.label}
      </span>
    );
  }
  return (
    <span
      className={styles.status}
      role="status"
      data-tone={last?.tone ?? "dim"}
    >
      {last ? <DecodeText key={last.id} text={last.title} /> : "Ready"}
    </span>
  );
}
