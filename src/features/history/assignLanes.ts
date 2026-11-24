import type { Commit } from "@/ipc";

/** A commit with its lane: the row of the timeline that shows it. */
export interface LanedCommit extends Commit {
  lane: number;
}

/**
 * Gives each commit a lane, so that a branch stays in one row of the timeline.
 *
 * `commits` has the newest commit first. A commit continues in the lane of its first
 * parent. Each other parent gets a free lane.
 */
export function assignLanes(commits: readonly Commit[]): LanedCommit[] {
  // The hash that each lane waits for. An empty slot is a free lane.
  const waiting: (string | undefined)[] = [];
  // A wrong clock can put a parent before its child. No lane waits for such a parent.
  const seen = new Set<string>();

  return commits.map((commit) => {
    const expected = waiting.indexOf(commit.hash);
    const lane = expected === -1 ? freeLane(waiting) : expected;
    seen.add(commit.hash);
    // Branches that start at this commit end here.
    waiting.forEach((hash, index) => {
      if (hash === commit.hash) waiting[index] = undefined;
    });

    const [first, ...others] = commit.parents.filter(
      (parent) => !seen.has(parent),
    );
    waiting[lane] = first;
    for (const parent of others) {
      if (!waiting.includes(parent)) waiting[freeLane(waiting)] = parent;
    }
    return { ...commit, lane };
  });
}

function freeLane(waiting: readonly (string | undefined)[]): number {
  const free = waiting.indexOf(undefined);
  return free === -1 ? waiting.length : free;
}
