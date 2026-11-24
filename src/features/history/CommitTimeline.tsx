import { useMemo } from "react";

import { type Action, ActionMenu } from "@/actions";
import { shortHash } from "@/features/repository";
import { type MenuPoint, Panel, useElementSize } from "@/hud";
import { isDemoBackend } from "@/ipc";

import type { LanedCommit } from "./assignLanes";
import styles from "./CommitTimeline.module.css";
import { commitsThatFit, layoutTimeline } from "./layoutTimeline";
import type { TimelineLayout } from "./timelineModel";
import { type OpenMenu, useTimelineControls } from "./timelineControls";
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
  /** The commands of a commit, for its context menu. */
  commitMenu?(hash: string): readonly Action[];
  delay?: number;
}

/** The frame takes the keys of the timeline. */
const FRAME_PROPS = {
  role: "group",
  "aria-label": "Commit graph",
  "aria-keyshortcuts": "ArrowLeft ArrowRight Shift+F10",
  title:
    "The arrow keys select a commit. Right-click a commit, or press Shift+F10, for its commands.",
  tabIndex: 0,
} as const;

/**
 * The commit graph as a timeline. Time goes from left to right, and each branch is a lane.
 *
 * The timeline shows the commits near the selected commit. A wider panel shows more
 * commits. The arrow keys move the selection, and a right-click opens the commands
 * of a commit. The commit log gives the same data and commands to the keyboard.
 */
export function CommitTimeline(props: CommitTimelineProps) {
  const { commits, headHash, selectedHash, onSelect, commitMenu, delay } =
    props;
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
  const keys = { commits, selectedHash, onSelect, layout };
  const controls = useTimelineControls(keys);

  return (
    <Panel
      title="Commit timeline"
      meta={<TimelineMeta shown={visible.length} />}
      flush
      delay={delay}
    >
      <div
        ref={frameRef}
        {...FRAME_PROPS}
        className={styles.frame}
        onKeyDown={controls.onKeyDown}
      >
        <TimelineDrawing
          label={`Commit graph: ${visible.length} of ${commits.length} commits`}
          layout={layout}
          width={size.width}
          selectedHash={selectedHash}
          onSelect={onSelect}
          onMenu={controls.openMenu}
        />
      </div>
      <CommitMenu
        open={controls.menu}
        actions={commitMenu}
        onClose={controls.closeMenu}
      />
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
  onMenu(hash: string, at: MenuPoint): void;
}

/** The axis, the links, the commits, and the labels, from the back to the front. */
function TimelineDrawing(props: TimelineDrawingProps) {
  const { label, layout, width, selectedHash, onSelect, onMenu } = props;
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
          onMenu={onMenu}
        />
      ))}
      {layout.labels.map((item) => (
        <RefLabel key={item.hash} label={item} />
      ))}
    </svg>
  );
}

interface CommitMenuProps {
  open: OpenMenu | null;
  actions?(hash: string): readonly Action[];
  onClose(): void;
}

/** The commands of one commit, at the place of the right-click. */
function CommitMenu({ open, actions, onClose }: CommitMenuProps) {
  if (!open || !actions) return null;
  return (
    <ActionMenu
      label={`Commands for ${shortHash(open.hash)}`}
      actions={actions(open.hash)}
      at={open.at}
      onClose={onClose}
    />
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
