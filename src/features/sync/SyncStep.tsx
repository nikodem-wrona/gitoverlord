import { Meter } from "@/hud";
import type { SyncOperation, SyncProgress } from "@/ipc";

import styles from "./SyncPanel.module.css";

const NAMES: Record<SyncOperation, string> = {
  fetch: "Fetch",
  pull: "Pull",
  push: "Push",
  clone: "Clone",
};

/** The current step of a network operation: the percent, and the phase that `git` reports. */
export function SyncStep({ progress }: { progress: SyncProgress }) {
  const { operation, step } = progress;
  return (
    <div className={styles.step}>
      <Meter label={NAMES[operation]} value={step?.percent ?? 0} max={100} />
      <span className={styles.status}>{step?.phase}</span>
    </div>
  );
}
