import { Meter, Panel } from "@/hud";

import styles from "./SyncPanel.module.css";

const GAUGE_MAX = 10;

interface SyncPanelProps {
  remote: string;
  ahead: number;
  behind: number;
  delay?: number;
}

/** Gauges for the commits that are not pushed and not pulled. */
export function SyncPanel({ remote, ahead, behind, delay }: SyncPanelProps) {
  return (
    <Panel title="Sync status" meta={remote} delay={delay}>
      <div className={styles.meters}>
        <Meter label="Ahead" value={ahead} max={GAUGE_MAX} tone="accent" />
        <Meter label="Behind" value={behind} max={GAUGE_MAX} tone="fail" />
      </div>
    </Panel>
  );
}
