import { describe, expect, it } from "vitest";

import { buildNavigatorTree } from "./buildNavigatorTree";
import type { Branch, Repository } from "./types";

function branch(name: string, current = false): Branch {
  return {
    name,
    upstream: `origin/${name}`,
    ahead: 0,
    behind: 0,
    updated: "",
    current,
  };
}

const REPOSITORY: Repository = {
  name: "demo",
  path: "~/demo",
  head: "main",
  ahead: 0,
  behind: 0,
  commits: [],
  changes: [],
  branches: [branch("main", true), branch("dev")],
  remotes: ["origin"],
  tags: [],
  activity: [],
};

describe("buildNavigatorTree", () => {
  const [root] = buildNavigatorTree(REPOSITORY);
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
