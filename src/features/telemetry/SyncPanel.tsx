import { useBranches } from "@/features/repository";
import { Meter, Panel } from "@/hud";

import styles from "./SyncPanel.module.css";

const GAUGE_MAX = 10;

interface SyncPanelProps {
  repoPath: string;
  delay?: number;
}

/**
 * Gauges for the commits of the current branch that are not pushed and not pulled.
 *
 * The counts are against the last fetch. The application does not fetch before phase 4.
 */
export function SyncPanel({ repoPath, delay }: SyncPanelProps) {
  const branches = useBranches(repoPath).data ?? [];
  const current = branches.find((branch) => branch.current);

  return (
    <Panel
      title="Sync status"
      meta={current?.upstream ?? "No upstream"}
      delay={delay}
    >
      <div className={styles.meters}>
        <Meter
          label="Ahead"
          value={current?.ahead ?? 0}
          max={GAUGE_MAX}
          tone="accent"
        />
        <Meter
          label="Behind"
          value={current?.behind ?? 0}
          max={GAUGE_MAX}
          tone="fail"
        />
      </div>
    </Panel>
  );
}
