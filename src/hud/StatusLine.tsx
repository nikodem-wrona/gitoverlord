import styles from "./StatusLine.module.css";

export type StatusState = "pending" | "ok" | "fail";

interface StatusLineProps {
  label: string;
  state: StatusState;
  value: string;
}

// Each badge has the same width, so the lines stay aligned.
const BADGES: Record<StatusState, string> = {
  pending: "[ .. ]",
  ok: "[ OK ]",
  fail: "[FAIL]",
};

/** One line of a status readout: a badge, a label, and a value. */
export function StatusLine({ label, state, value }: StatusLineProps) {
  return (
    <div className={styles.line} data-state={state}>
      <span className={styles.badge}>{BADGES[state]}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.leader} aria-hidden="true" />
      <span className={styles.value}>{value}</span>
    </div>
  );
}
