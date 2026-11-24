import { describe, expect, it } from "vitest";

import type { Branch, RepoSummary } from "@/ipc";

import { buildNavigatorTree } from "./buildNavigatorTree";

function branch(name: string, current = false): Branch {
  return {
    name,
    current,
    upstream: `origin/${name}`,
    ahead: 0,
    behind: 0,
    tip: "abc1234",
    updated: 0,
  };
}

const SUMMARY: RepoSummary = {
  name: "demo",
  path: "~/demo",
  head: { branch: "main", hash: "abc1234" },
  remotes: ["origin"],
  tags: [],
  fetched: null,
  operation: null,
};

describe("buildNavigatorTree", () => {
  const [root] = buildNavigatorTree(SUMMARY, [
    branch("main", true),
    branch("dev"),
  ]);
  const groups = root?.children ?? [];

  it("puts the repository at the root", () => {
    expect(root?.label).toBe("demo");
    expect(root?.icon).toBe("repository");
  });

  it("groups the branches, remotes, and tags with their counts", () => {
    expect(groups.map((group) => [group.label, group.meta])).toEqual([
      ["Branches", "2"],
      ["Remotes", "1"],
      ["Tags", "0"],
    ]);
  });

  it("marks the current branch as HEAD", () => {
    const branches = groups[0]?.children ?? [];

    expect(branches.map((node) => [node.label, node.meta])).toEqual([
      ["main", "HEAD"],
      ["dev", undefined],
    ]);
  });
});
