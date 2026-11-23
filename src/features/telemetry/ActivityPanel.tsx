import type { CSSProperties } from "react";

import { Panel } from "@/hud";

import styles from "./ActivityPanel.module.css";
import { barHeights, sparklinePath } from "./chartPaths";

const WIDTH = 240;
const HEIGHT = 56;
const BAR_DAYS = 14;
const MIN_BAR = 4;

interface ActivityPanelProps {
  /** Commits on each day. The oldest day is first. */
  activity: readonly number[];
  delay?: number;
}

/** A waveform of the commits per day, and bars for the last two weeks. */
export function ActivityPanel({ activity, delay }: ActivityPanelProps) {
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
