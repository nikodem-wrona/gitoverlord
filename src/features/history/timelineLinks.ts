import type { LanedCommit } from "./assignLanes";
import {
  COMMIT_STEP,
  type TimelineLink,
  type TimelineNode,
} from "./timelineModel";

/**
 * Makes one link from each parent to its child.
 *
 * A commit with a parent or a child that is out of view gets a line to the edge of the view.
 * `continued` holds the hashes of the commits that have a newer commit out of view.
 */
export function buildLinks(
  ordered: readonly LanedCommit[],
  nodes: readonly TimelineNode[],
  continued: ReadonlySet<string>,
  width: number,
): TimelineLink[] {
  const byHash = new Map(nodes.map((node) => [node.hash, node]));

  return ordered.flatMap((commit) => {
    const to = byHash.get(commit.hash);
    if (!to) return [];
    const links = commit.parents.flatMap((parent, index) => {
      const from = byHash.get(parent);
      return from ? [linkBetween(from, to, index === 0)] : [];
    });
    const [firstParent] = commit.parents;
    if (firstParent !== undefined && !byHash.has(firstParent)) {
      links.push(edgeLink(`older-${to.hash}`, 0, to));
    }
    if (continued.has(to.hash)) {
      links.push(edgeLink(`newer-${to.hash}`, width, to));
    }
    return links;
  });
}

function linkBetween(
  from: TimelineNode,
  to: TimelineNode,
  firstParent: boolean,
): TimelineLink {
  const sameLane = from.y === to.y;
  return {
    id: `${from.hash}-${to.hash}`,
    path: linkPath(from, to, firstParent),
    // A link between two lanes has the color of the branch lane.
    tone: firstParent || sameLane ? to.tone : from.tone,
  };
}

function edgeLink(id: string, edgeX: number, node: TimelineNode): TimelineLink {
  return { id, path: `M${edgeX} ${node.y}H${node.x}`, tone: node.tone };
}

/**
 * Draws the line from a parent to its child.
 *
 * A branch leaves its first parent in a curve, then follows the lane of the child.
 * A merged branch follows the lane of the parent, then goes into the child in a curve.
 */
function linkPath(
  from: TimelineNode,
  to: TimelineNode,
  firstParent: boolean,
): string {
  const start = `M${from.x} ${from.y}`;
  if (from.y === to.y) return `${start}H${to.x}`;
  if (firstParent) {
    const bendEnd = Math.min(from.x + COMMIT_STEP, to.x);
    return `${start}${curve(from.x, from.y, bendEnd, to.y)}H${to.x}`;
  }
  const bendStart = Math.max(to.x - COMMIT_STEP, from.x);
  return `${start}H${bendStart}${curve(bendStart, from.y, to.x, to.y)}`;
}

/** An S-shaped curve from the current point `(x0, y0)` to `(x1, y1)`. */
function curve(x0: number, y0: number, x1: number, y1: number): string {
  const middle = (x0 + x1) / 2;
  return `C${middle} ${y0} ${middle} ${y1} ${x1} ${y1}`;
}
