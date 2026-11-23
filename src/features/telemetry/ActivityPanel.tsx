import type { CSSProperties } from "react";

import { useActivity } from "@/features/repository";
import { Panel } from "@/hud";

import styles from "./ActivityPanel.module.css";
import { barHeights, sparklinePath } from "./chartPaths";

const WIDTH = 240;
const HEIGHT = 56;
const BAR_DAYS = 14;
const MIN_BAR = 4;
/** The chart is flat until the counts arrive. */
const NO_ACTIVITY: readonly number[] = Array.from({ length: 30 }, () => 0);

interface ActivityPanelProps {
  repoPath: string;
  delay?: number;
}

/** A waveform of the commits per day, and bars for the last two weeks. */
export function ActivityPanel({ repoPath, delay }: ActivityPanelProps) {
  const activity = useActivity(repoPath).data ?? NO_ACTIVITY;
  const total = activity.reduce((sum, value) => sum + value, 0);
  const line = sparklinePath(activity, WIDTH, HEIGHT);

  return (
    <Panel title="Activity" meta={`${activity.length} days`} delay={delay}>
      <svg
        viewBox={`0 -4 ${WIDTH} ${HEIGHT + 8}`}
        preserveAspectRatio="none"
        className={styles.wave}
        role="img"
        aria-label={`${total} commits in ${activity.length} days`}
      >
        <path
          d={`${line} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`}
          className={styles.area}
        />
        <path d={line} pathLength={1} className={styles.line} />
      </svg>
      <div className={styles.bars} aria-hidden="true">
        {barHeights(activity.slice(-BAR_DAYS)).map((height, index) => (
          <span
            key={index}
            className={styles.bar}
            style={
              {
                height: `${Math.max(height, MIN_BAR)}%`,
                "--index": index,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <p className={styles.total}>
        <span>{total}</span> commits
      </p>
    </Panel>
  );
}
