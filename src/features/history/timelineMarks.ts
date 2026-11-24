import { formatDay } from "@/features/repository";

import type { LanedCommit } from "./assignLanes";
import {
  COMMIT_STEP,
  type DayMark,
  type TimelineLabel,
  type TimelineNode,
} from "./timelineModel";

/** The approximate width of one character of a label, in pixels. */
const CHAR_WIDTH = 7.1;
const MAX_NAME_LENGTH = 28;
/** The distance from a commit up to the text of its label. */
const LABEL_RISE = 11;
/** The distance from the center of a commit to the start of its label. */
const LABEL_INSET = 4;
const LABEL_GAP = 8;
const DAY_LABEL_GAP = 84;

/**
 * Puts the name of a branch or tag above each commit that has one.
 *
 * A label that does not fit before the next label of its lane is not shown. The labels of
 * newer commits come first.
 */
export function buildLabels(
  ordered: readonly LanedCommit[],
  nodes: readonly TimelineNode[],
  width: number,
): TimelineLabel[] {
  // For each lane, the left side of the label that was put there last.
  const taken = new Map<number, number>();
  const labels: TimelineLabel[] = [];

  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const node = nodes[index];
    const refs = ordered[index]?.refs ?? [];
    if (!node || refs.length === 0) continue;
    const text = labelText(refs);
    const textWidth = text.length * CHAR_WIDTH;
    // A label near the right side goes to the left of its commit.
    const anchor = node.x + textWidth > width ? "end" : "start";
    const x = node.x + (anchor === "end" ? LABEL_INSET : -LABEL_INSET);
    const [left, right] =
      anchor === "end" ? [x - textWidth, x] : [x, x + textWidth];
    if (right + LABEL_GAP > (taken.get(node.y) ?? Infinity)) continue;
    taken.set(node.y, left);
    labels.push({
      hash: node.hash,
      text,
      x,
      y: node.y - LABEL_RISE,
      tone: node.tone,
      anchor,
    });
  }
  return labels;
}

/** Gives the first name, and the number of the other names. */
function labelText(refs: readonly string[]): string {
  const [first = "", ...others] = refs;
  const name =
    first.length > MAX_NAME_LENGTH
      ? `${first.slice(0, MAX_NAME_LENGTH - 1)}…`
      : first;
  return others.length > 0 ? `${name} +${others.length}` : name;
}

/** Marks the first commit of each day. `ordered` has the oldest commit first. */
export function buildDays(
  ordered: readonly LanedCommit[],
  nodes: readonly TimelineNode[],
): DayMark[] {
  const marks: DayMark[] = [];
  let lastDay: string | undefined;
  let lastLabelX = -Infinity;

  ordered.forEach((commit, index) => {
    const node = nodes[index];
    const day = formatDay(commit.time);
    if (!node || day === lastDay) return;
    lastDay = day;
    const x = node.x - COMMIT_STEP / 2;
    const hasSpace = x - lastLabelX >= DAY_LABEL_GAP;
    if (hasSpace) lastLabelX = x;
    marks.push({ x, text: hasSpace ? day : "" });
  });
  return marks;
}
