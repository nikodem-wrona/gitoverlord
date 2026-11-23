import type { Tone } from "@/hud";

import type { LanedCommit } from "./assignLanes";
import { buildLinks } from "./timelineLinks";
import { buildDays, buildLabels } from "./timelineMarks";
import {
  COMMIT_STEP,
  type TimelineLayout,
  type TimelineNode,
  type TimelineSize,
} from "./timelineModel";

const PADDING_X = 32;
/** The space above the first lane, for its labels. */
const TOP = 32;
/** The space below the time axis, for the dates. */
const AXIS_SPACE = 28;
/** The space between the last lane and the time axis. */
const LANE_MARGIN = 22;
const MAX_LANE_GAP = 36;
const MIN_COMMITS = 8;
const LANE_TONES: readonly Tone[] = ["accent", "fail", "warn", "ok"];
const NO_COMMITS: ReadonlySet<string> = new Set();

interface TimelineOptions {
  size: TimelineSize;
  headHash?: string;
  /** The hashes of the commits that have a newer commit out of view. */
  continued?: ReadonlySet<string>;
}

/** Returns the number of commits that a timeline of `width` pixels shows. */
export function commitsThatFit(width: number): number {
  const steps = Math.floor((width - 2 * PADDING_X) / COMMIT_STEP);
  return Math.max(steps + 1, MIN_COMMITS);
}

/**
 * Places each commit on the timeline. Time goes from left to right, and each lane is a
 * straight row.
 *
 * `commits` has the newest commit first.
 */
export function layoutTimeline(
  commits: readonly LanedCommit[],
  { size, headHash, continued = NO_COMMITS }: TimelineOptions,
): TimelineLayout {
  const ordered = [...commits].reverse();
  const axisY = size.height - AXIS_SPACE;
  const nodes = placeNodes(ordered, headHash, axisY - LANE_MARGIN);

  return {
    nodes,
    links: buildLinks(ordered, nodes, continued, size.width),
    labels: buildLabels(ordered, nodes, size.width),
    days: buildDays(ordered, nodes),
    axisY,
  };
}

/** Puts the lanes in the middle of the space between `TOP` and `bottom`. */
function placeNodes(
  ordered: readonly LanedCommit[],
  headHash: string | undefined,
  bottom: number,
): TimelineNode[] {
  const lanes = [...new Set(ordered.map((commit) => commit.lane))].sort(
    (left, right) => left - right,
  );
  const space = Math.max(bottom - TOP, 0);
  const gap =
    lanes.length > 1 ? Math.min(MAX_LANE_GAP, space / (lanes.length - 1)) : 0;
  const firstY = TOP + (space - gap * (lanes.length - 1)) / 2;

  return ordered.map((commit, index) => {
    const row = lanes.indexOf(commit.lane);
    return {
      hash: commit.hash,
      subject: commit.subject,
      x: PADDING_X + index * COMMIT_STEP,
      y: Math.round(firstY + row * gap),
      tone: LANE_TONES[row % LANE_TONES.length] ?? "accent",
      head: commit.hash === headHash,
      merge: commit.parents.length > 1,
    };
  });
}
