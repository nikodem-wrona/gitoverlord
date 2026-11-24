import { useMotion } from "@/hud";
import type { SyncOperation } from "@/ipc";

import styles from "./CommitTimeline.module.css";
import type { TimelineLayout } from "./timelineModel";

/** `out` moves from HEAD to the remote, `in` from the remote to HEAD. */
const DIRECTIONS: Record<SyncOperation, "out" | "in" | null> = {
  push: "out",
  fetch: "in",
  pull: "in",
  clone: null,
};

const NAMES: Record<SyncOperation, string> = {
  push: "Push",
  fetch: "Fetch",
  pull: "Pull",
  clone: "Clone",
};

const PULSE_RADIUS = 3.5;
/** The time of one trip between HEAD and the edge, in seconds. */
const TRIP = 0.8;
const LABEL_INSET = 6;
const LABEL_RISE = 9;

interface SyncPulseProps {
  layout: TimelineLayout;
  width: number;
  operation: SyncOperation;
}

/**
 * A pulse between HEAD and the right edge, where the remote is, while a network
 * operation runs. Calm mode shows the track and the name, without the pulse.
 */
export function SyncPulse({ layout, width, operation }: SyncPulseProps) {
  const { calm } = useMotion();
  const head = layout.nodes.find((node) => node.head);
  const direction = DIRECTIONS[operation];
  if (!head || !direction) return null;
  const [from, to] = direction === "out" ? [head.x, width] : [width, head.x];
  const arrow = direction === "out" ? "▸" : "◂";

  return (
    <g data-tone="active" aria-hidden="true">
      <path d={`M${head.x} ${head.y}H${width}`} className={styles.syncTrack} />
      <text
        x={width - LABEL_INSET}
        y={head.y - LABEL_RISE}
        textAnchor="end"
        className={styles.label}
      >
        {`${NAMES[operation]} ${arrow} remote`}
      </text>
      {!calm && (
        <circle r={PULSE_RADIUS} className={styles.syncDot}>
          <animateMotion
            dur={`${TRIP}s`}
            repeatCount="indefinite"
            path={`M${from} ${head.y}H${to}`}
          />
        </circle>
      )}
    </g>
  );
}
