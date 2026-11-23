import type { Commit } from "@/features/repository";
import { createRandom, type Tone } from "@/hud";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 360;

const PADDING_X = 70;
const JITTER = 16;
const LABEL_OFFSET = 14;
const LANE_TONES: readonly Tone[] = ["accent", "fail", "warn", "ok"];

export interface MapPoint {
  x: number;
  y: number;
}

export interface StarNode extends MapPoint {
  hash: string;
  subject: string;
  tone: Tone;
  head: boolean;
}

export interface StarRoute {
  id: string;
  from: MapPoint;
  to: MapPoint;
  tone: Tone;
}

export interface LaneLabel extends MapPoint {
  text: string;
  tone: Tone;
  anchor: "start" | "end";
}

export interface StarMapLayout {
  nodes: StarNode[];
  routes: StarRoute[];
  labels: LaneLabel[];
}

/**
 * Places each commit on the star map. Time goes from left to right, and each branch has a lane.
 *
 * `commits` has the newest commit first. The same `seed` gives the same layout.
 */
export function layoutStarMap(
  commits: readonly Commit[],
  headHash: string | undefined,
  seed = 7,
): StarMapLayout {
  const ordered = [...commits].reverse();
  const lanes = [...new Set(ordered.map((commit) => commit.lane))];
  const random = createRandom(seed);
  const step = (MAP_WIDTH - 2 * PADDING_X) / Math.max(ordered.length - 1, 1);

  const nodes = ordered.map((commit, index): StarNode => {
    const lane = lanes.indexOf(commit.lane);
    return {
      hash: commit.hash,
      subject: commit.subject,
      x: PADDING_X + index * step,
      y: laneY(lane, lanes.length) + (random() - 0.5) * 2 * JITTER,
      tone: LANE_TONES[lane % LANE_TONES.length] ?? "accent",
      head: commit.hash === headHash,
    };
  });

  return {
    nodes,
    routes: buildRoutes(ordered, nodes),
    labels: buildLabels(ordered, nodes, lanes),
  };
}

function laneY(lane: number, laneCount: number): number {
  return (MAP_HEIGHT * (lane + 1)) / (laneCount + 1);
}

/** Makes one route from each parent to its child. */
function buildRoutes(
  ordered: readonly Commit[],
  nodes: readonly StarNode[],
): StarRoute[] {
  const byHash = new Map(nodes.map((node) => [node.hash, node]));
  return ordered.flatMap((commit) => {
    const to = byHash.get(commit.hash);
    return commit.parents.flatMap((parent) => {
      const from = byHash.get(parent);
      if (!from || !to) return [];
      return [{ id: `${parent}-${commit.hash}`, from, to, tone: to.tone }];
    });
  });
}

/** Puts the name of each lane next to its newest commit. */
function buildLabels(
  ordered: readonly Commit[],
  nodes: readonly StarNode[],
  lanes: readonly string[],
): LaneLabel[] {
  return lanes.flatMap((lane) => {
    const node = nodes[ordered.findLastIndex((commit) => commit.lane === lane)];
    if (!node) return [];
    const nearRightEdge = node.x > MAP_WIDTH * 0.8;
    return [
      {
        text: lane,
        tone: node.tone,
        x: node.x + (nearRightEdge ? -LABEL_OFFSET : LABEL_OFFSET),
        y: node.y - LABEL_OFFSET,
        anchor: nearRightEdge ? "end" : "start",
      },
    ];
  });
}
