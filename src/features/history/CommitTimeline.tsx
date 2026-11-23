import { useMemo } from "react";

import { Panel, useElementSize } from "@/hud";
import { isDemoBackend } from "@/ipc";

import type { LanedCommit } from "./assignLanes";
import styles from "./CommitTimeline.module.css";
import { commitsThatFit, layoutTimeline } from "./layoutTimeline";
import type { TimelineLayout } from "./timelineModel";
import { CommitMark, RefLabel, TimeAxis } from "./TimelineParts";
import { useTimelineWindow } from "./timelineWindow";

/** The size of the timeline before the browser gives the real size. */
const DEFAULT_SIZE = { width: 1000, height: 360 };

interface CommitTimelineProps {
  /** The loaded history. The newest commit is first. */
  commits: readonly LanedCommit[];
  headHash?: string;
  selectedHash?: string;
  onSelect(hash: string): void;
  delay?: number;
}

/**
 * The commit graph as a timeline. Time goes from left to right, and each branch is a lane.
 *
 * The timeline shows the commits near the selected commit. A wider panel shows more
 * commits. It is a visual aid: the commit log gives the same data to the keyboard.
 */
export function CommitTimeline(props: CommitTimelineProps) {
  const { commits, headHash, selectedHash, onSelect, delay } = props;
  const [frameRef, measured] = useElementSize<HTMLDivElement>();
  const size =
    measured.width > 0 && measured.height > 0 ? measured : DEFAULT_SIZE;
  const { visible, continued } = useTimelineWindow(
    commits,
    selectedHash,
    commitsThatFit(size.width),
  );
  const layout = useMemo(
    () => layoutTimeline(visible, { size, headHash, continued }),
    [visible, size, headHash, continued],
  );

  return (
    <Panel
      title="Commit timeline"
      meta={<TimelineMeta shown={visible.length} />}
      flush
      delay={delay}
    >
      <div ref={frameRef} className={styles.frame}>
        <TimelineDrawing
          label={`Commit graph: ${visible.length} of ${commits.length} commits`}
          layout={layout}
          width={size.width}
          selectedHash={selectedHash}
          onSelect={onSelect}
        />
      </div>
    </Panel>
  );
}

interface TimelineDrawingProps {
  /** The accessible name of the drawing. */
  label: string;
  layout: TimelineLayout;
  width: number;
  selectedHash?: string;
  onSelect(hash: string): void;
}

/** The axis, the links, the commits, and the labels, from the back to the front. */
function TimelineDrawing(props: TimelineDrawingProps) {
  const { label, layout, width, selectedHash, onSelect } = props;
  const selected = layout.nodes.find((node) => node.hash === selectedHash);

  return (
    <svg className={styles.svg} role="img" aria-label={label}>
      <TimeAxis layout={layout} width={width} />
      {layout.links.map((link) => (
        <path
          key={link.id}
          d={link.path}
          className={styles.link}
          data-tone={link.tone}
        />
      ))}
      {selected && (
        <line
          x1={selected.x}
          x2={selected.x}
          y1={0}
          y2={layout.axisY}
          className={styles.cursor}
        />
      )}
      {layout.nodes.map((node) => (
        <CommitMark
          key={node.hash}
          node={node}
          selected={node === selected}
          onSelect={onSelect}
        />
      ))}
      {layout.labels.map((item) => (
        <RefLabel key={item.hash} label={item} />
      ))}
    </svg>
  );
}

function TimelineMeta({ shown }: { shown: number }) {
  return (
    <>
      <span>{shown} commits in view</span>
      {isDemoBackend() && <span className={styles.alert}>Demo mode</span>}
    </>
  );
}
