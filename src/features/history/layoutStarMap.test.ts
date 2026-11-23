import { describe, expect, it } from "vitest";

import type { Commit } from "@/features/repository";

import { layoutStarMap, MAP_HEIGHT, MAP_WIDTH } from "./layoutStarMap";

function commit(hash: string, lane: string, parents: string[] = []): Commit {
  return {
    hash,
    subject: `subject ${hash}`,
    author: "tester",
    lane,
    time: "01-01 00:00",
    parents,
    files: [],
  };
}

// The newest commit is first: "d" merges the feature branch "c" into main.
const COMMITS = [
  commit("d", "main", ["b", "c"]),
  commit("c", "feature", ["a"]),
  commit("b", "main", ["a"]),
  commit("a", "main"),
];

describe("layoutStarMap", () => {
  it("places one star for each commit, with the oldest at the left", () => {
    const { nodes } = layoutStarMap(COMMITS, "d");
    const xs = nodes.map((node) => node.x);

    expect(nodes.map((node) => node.hash)).toEqual(["a", "b", "c", "d"]);
    expect(xs).toEqual([...xs].sort((left, right) => left - right));
  });

  it("keeps each star inside the map", () => {
    const { nodes } = layoutStarMap(COMMITS, "d");

    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(MAP_WIDTH);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(MAP_HEIGHT);
    }
  });

  it("draws one route for each parent link", () => {
    const { routes } = layoutStarMap(COMMITS, "d");

    expect(routes.map((route) => route.id).sort()).toEqual([
      "a-b",
      "a-c",
      "b-d",
      "c-d",
    ]);
  });

  it("skips parents that are not in the list", () => {
    const { routes } = layoutStarMap([commit("x", "main", ["gone"])], "x");

    expect(routes).toEqual([]);
  });

  it("gives each lane its own tone and one label", () => {
    const { nodes, labels } = layoutStarMap(COMMITS, "d");
    const toneOf = (hash: string) =>
      nodes.find((node) => node.hash === hash)?.tone;

    expect(labels.map((label) => label.text)).toEqual(["main", "feature"]);
    expect(toneOf("c")).not.toBe(toneOf("a"));
    expect(toneOf("b")).toBe(toneOf("a"));
  });

  it("marks only the HEAD commit", () => {
    const { nodes } = layoutStarMap(COMMITS, "d");

    expect(nodes.filter((node) => node.head).map((node) => node.hash)).toEqual([
      "d",
    ]);
  });

  it("gives the same layout for the same seed", () => {
    expect(layoutStarMap(COMMITS, "d", 3)).toEqual(
      layoutStarMap(COMMITS, "d", 3),
    );
  });
});
