import type { MenuPoint } from "@/hud";
import type { SyncOperation } from "@/ipc";

import styles from "./CommitTimeline.module.css";
import { SyncPulse } from "./SyncPulse";
import type { TimelineLayout } from "./timelineModel";
import { CommitMark, RefLabel, TimeAxis } from "./TimelineParts";

interface TimelineDrawingProps {
  /** The accessible name of the drawing. */
  label: string;
  layout: TimelineLayout;
  width: number;
  selectedHash?: string;
  onSelect(hash: string): void;
  onMenu(hash: string, at: MenuPoint): void;
  sync?: SyncOperation;
}

/**
 * The axis, the links, the sync pulse, the commits, and the labels, from the back to the front.
 *
 * A commit and a link that come into view animate in. Calm mode shows them at once.
 */
export function TimelineDrawing(props: TimelineDrawingProps) {
  const { label, layout, width, selectedHash, onSelect, onMenu } = props;
  const selected = layout.nodes.find((node) => node.hash === selectedHash);

  return (
    <svg className={styles.svg} role="img" aria-label={label}>
      <TimeAxis layout={layout} width={width} />
      {layout.links.map((link) => (
        <path
          key={link.id}
          d={link.path}
          // One path length makes the dash of the draw animation fit each link.
          pathLength={1}
          className={styles.link}
          data-tone={link.tone}
        />
      ))}
      {props.sync && (
        <SyncPulse layout={layout} width={width} operation={props.sync} />
      )}
      {selected && (
        <line
          x1={selected.x}
          x2={selected.x}
          y1={0}
          y2={layout.axisY}
          className={styles.cursor}
        />
      )}
      {layout.nodes.map((node, order) => (
        <CommitMark
          key={node.hash}
          node={node}
          order={order}
          selected={node === selected}
          onSelect={onSelect}
          onMenu={onMenu}
        />
      ))}
      {layout.labels.map((item) => (
        <RefLabel key={item.hash} label={item} />
      ))}
    </svg>
  );
}
