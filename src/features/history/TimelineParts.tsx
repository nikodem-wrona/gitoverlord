import { shortHash } from "@/features/repository";
import type { MenuPoint } from "@/hud";

import styles from "./CommitTimeline.module.css";
import type {
  TimelineLabel,
  TimelineLayout,
  TimelineNode,
} from "./timelineModel";

const DOT_RADIUS = 4;
const HEAD_RADIUS = 8;
const SELECTION_RADIUS = 11;
/** The area around a commit that takes a click. */
const HIT_RADIUS = 13;
const TICK_LENGTH = 4;
/** The distance from the time axis down to the text of a date. */
const DATE_DROP = 17;
const DATE_INSET = 5;

interface TimeAxisProps {
  layout: TimelineLayout;
  width: number;
}

/** The time axis with one tick for each commit, and a line and a date for each day. */
export function TimeAxis({ layout, width }: TimeAxisProps) {
  const { nodes, days, axisY } = layout;
  const ticks = nodes.map((node) => `M${node.x} ${axisY}v${TICK_LENGTH}`);

  return (
    <g>
      {days.map((day) => (
        <line
          key={day.x}
          x1={day.x}
          x2={day.x}
          y1={0}
          y2={axisY + DATE_DROP}
          className={styles.day}
        />
      ))}
      <path
        d={`M0 ${axisY}H${width}${ticks.join("")}`}
        className={styles.axis}
      />
      {days.map((day) => (
        <text
          key={day.x}
          x={day.x + DATE_INSET}
          y={axisY + DATE_DROP}
          className={styles.date}
        >
          {day.text}
        </text>
      ))}
    </g>
  );
}

export function RefLabel({ label }: { label: TimelineLabel }) {
  return (
    <text
      x={label.x}
      y={label.y}
      textAnchor={label.anchor}
      className={styles.label}
      data-tone={label.tone}
    >
      {label.text}
    </text>
  );
}

interface CommitMarkProps {
  node: TimelineNode;
  selected: boolean;
  onSelect(hash: string): void;
  /** Opens the commands of the commit at the mouse position. */
  onMenu(hash: string, at: MenuPoint): void;
}

/** One commit. A merge commit is hollow, HEAD has a ring, and the selected commit has a larger ring. */
export function CommitMark(props: CommitMarkProps) {
  const { node, selected, onSelect, onMenu } = props;
  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      className={styles.node}
      data-tone={node.tone}
      data-merge={node.merge || undefined}
      onClick={() => onSelect(node.hash)}
      onContextMenu={(event) => {
        event.preventDefault();
        onMenu(node.hash, { x: event.clientX, y: event.clientY });
      }}
    >
      <title>{`${shortHash(node.hash)}  ${node.subject}`}</title>
      <circle r={HIT_RADIUS} className={styles.hit} />
      {node.head && (
        <>
          <circle r={HEAD_RADIUS} className={styles.headPulse} />
          <circle r={HEAD_RADIUS} className={styles.headRing} />
        </>
      )}
      {selected && <circle r={SELECTION_RADIUS} className={styles.selection} />}
      <circle r={DOT_RADIUS} className={styles.dot} />
    </g>
  );
}
