import { gridPath, makeStars } from "./backdrop";
import type { LaneLabel, StarNode, StarRoute } from "./layoutStarMap";
import styles from "./StarMap.module.css";

const STARS = makeStars(170, 42);
const GRID = gridPath();

/** The grid and the stars behind the commits. */
export function MapBackdrop() {
  return (
    <g>
      <path d={GRID} className={styles.grid} />
      {STARS.map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          opacity={star.opacity}
          className={styles.star}
        />
      ))}
    </g>
  );
}

export function RouteLine({ route }: { route: StarRoute }) {
  const { from, to, tone } = route;
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      className={styles.route}
      data-tone={tone}
    />
  );
}

export function LaneText({ label }: { label: LaneLabel }) {
  return (
    <text
      x={label.x}
      y={label.y}
      textAnchor={label.anchor}
      className={styles.laneLabel}
      data-tone={label.tone}
    >
      {label.text}
    </text>
  );
}

interface StarMarkProps {
  node: StarNode;
  selected: boolean;
  onSelect(hash: string): void;
}

/** One commit. The HEAD commit pulses, and the selected commit has a reticle. */
export function StarMark({ node, selected, onSelect }: StarMarkProps) {
  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      className={styles.node}
      data-tone={node.tone}
      onClick={() => onSelect(node.hash)}
    >
      <title>{`${node.hash}  ${node.subject}`}</title>
      <circle r={14} className={styles.hit} />
      {node.head && <circle r={12} className={styles.headRing} />}
      <circle r={selected ? 5 : 3.5} className={styles.dot} />
      {selected && (
        <g className={styles.reticle}>
          <circle r={11} />
          <path d="M-18 0h-7 M18 0h7 M0 -18v-7 M0 18v7" />
        </g>
      )}
    </g>
  );
}
