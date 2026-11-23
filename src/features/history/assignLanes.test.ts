import { describe, expect, it } from "vitest";

import type { Commit } from "@/ipc";

import { assignLanes } from "./assignLanes";

function commit(hash: string, parents: string[] = []): Commit {
  return { hash, subject: hash, author: "tester", time: 0, parents, refs: [] };
}

function lanesOf(commits: Commit[]): Record<string, number> {
  const laned = assignLanes(commits);
  return Object.fromEntries(laned.map((item) => [item.hash, item.lane]));
}

describe("assignLanes", () => {
  it("keeps a history without branches in one lane", () => {
    const lanes = lanesOf([
      commit("c", ["b"]),
      commit("b", ["a"]),
      commit("a"),
    ]);

    expect(lanes).toEqual({ a: 0, b: 0, c: 0 });
  });

  it("puts a second branch in its own lane until the branches meet", () => {
    // "c" and "d" are two branch tips that start at "b".
    const lanes = lanesOf([
      commit("d", ["b"]),
      commit("c", ["b"]),
      commit("b", ["a"]),
      commit("a"),
    ]);

    expect(lanes.d).toBe(0);
    expect(lanes.c).toBe(1);
    expect(lanes.b).toBe(0);
    expect(lanes.a).toBe(0);
  });

  it("gives the second parent of a merge its own lane", () => {
    // "d" merges "c" into the line "a", "b".
    const lanes = lanesOf([
      commit("d", ["b", "c"]),
      commit("c", ["a"]),
      commit("b", ["a"]),
      commit("a"),
    ]);

    expect(lanes.d).toBe(0);
    expect(lanes.b).toBe(0);
    expect(lanes.c).toBe(1);
    expect(lanes.a).toBe(0);
  });

  it("uses a free lane again", () => {
    // Two short branches, one after the other, from the same line.
    const lanes = lanesOf([
      commit("f", ["d"]),
      commit("e", ["d"]),
      commit("d", ["b"]),
      commit("c", ["b"]),
      commit("b", ["a"]),
      commit("a"),
    ]);

    expect(lanes.e).toBe(1);
    expect(lanes.c).toBe(1);
  });

  it("frees the lane of a commit that comes after its parent", () => {
    // The clock of "b" was wrong, so its parent "a" is before it in the list.
    const lanes = lanesOf([
      commit("c", ["a"]),
      commit("a"),
      commit("b", ["a"]),
      commit("z"),
    ]);

    expect(lanes.b).toBe(0);
    expect(lanes.z).toBe(0);
  });

  it("gives no commits for an empty history", () => {
    expect(assignLanes([])).toEqual([]);
  });
});
