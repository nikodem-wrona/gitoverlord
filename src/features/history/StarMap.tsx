import { useMemo } from "react";

import type { Commit } from "@/features/repository";
import { Panel } from "@/hud";

import { layoutStarMap, MAP_HEIGHT, MAP_WIDTH } from "./layoutStarMap";
import styles from "./StarMap.module.css";
import { LaneText, MapBackdrop, RouteLine, StarMark } from "./StarMapParts";

interface StarMapProps {
  commits: readonly Commit[];
  headHash?: string;
  selectedHash?: string;
  onSelect(hash: string): void;
  delay?: number;
}

/**
 * The commit graph as a star map. Branches are routes and commits are stars.
 *
 * The map is a visual aid. The commit log gives the same data to the keyboard.
 */
export function StarMap(props: StarMapProps) {
  const { commits, headHash, selectedHash, onSelect, delay } = props;
  const layout = useMemo(
    () => layoutStarMap(commits, headHash),
    [commits, headHash],
  );
  const summary = `Commit graph: ${commits.length} commits on ${layout.labels.length} branches`;

  return (
    <Panel title="Commit star map" meta={<MapMeta />} flush delay={delay}>
      <div className={styles.map}>
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label={summary}
        >
          <MapBackdrop />
          {layout.routes.map((route) => (
            <RouteLine key={route.id} route={route} />
          ))}
          {layout.labels.map((label) => (
            <LaneText key={label.text} label={label} />
          ))}
          {layout.nodes.map((node) => (
            <StarMark
              key={node.hash}
              node={node}
              selected={node.hash === selectedHash}
              onSelect={onSelect}
            />
          ))}
        </svg>
        <div className={styles.sweep} aria-hidden="true" />
      </div>
    </Panel>
  );
}

function MapMeta() {
  return (
    <>
      <span>Live repository link</span>
      <span className={styles.alert}>Demo mode</span>
    </>
  );
}
