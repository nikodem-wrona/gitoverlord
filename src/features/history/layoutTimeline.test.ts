import { describe, expect, it } from "vitest";

import type { LanedCommit } from "./assignLanes";
import { commitsThatFit, layoutTimeline } from "./layoutTimeline";
import { COMMIT_STEP } from "./timelineModel";

const SIZE = { width: 1000, height: 360 };
const DAY_ONE = new Date(2026, 10, 22, 10).getTime() / 1000;
const DAY_TWO = new Date(2026, 10, 23, 10).getTime() / 1000;

interface Fields {
  parents?: string[];
  refs?: string[];
  time?: number;
}

function commit(hash: string, lane: number, fields: Fields = {}): LanedCommit {
  const { parents = [], refs = [], time = DAY_ONE } = fields;
  return {
    hash,
    subject: `subject ${hash}`,
    author: "tester",
    time,
    parents,
    refs,
    lane,
  };
}

// The newest commit is first: "d" merges the feature branch "c" into main.
const COMMITS = [
  commit("d", 0, { parents: ["b", "c"], refs: ["main"], time: DAY_TWO }),
  commit("c", 1, { parents: ["a"], refs: ["feature", "tag: v1"] }),
  commit("b", 0, { parents: ["a"] }),
  commit("a", 0),
];

function layout(commits: LanedCommit[] = COMMITS, width = SIZE.width) {
  return layoutTimeline(commits, {
    size: { ...SIZE, width },
    headHash: "d",
  });
}

describe("layoutTimeline nodes", () => {
  it("puts the oldest commit at the left, with one step between commits", () => {
    const { nodes } = layout();
    const [first, second] = nodes;

    expect(nodes.map((node) => node.hash)).toEqual(["a", "b", "c", "d"]);
    expect((second?.x ?? 0) - (first?.x ?? 0)).toBe(COMMIT_STEP);
  });

  it("puts each lane in one straight row, with its own tone", () => {
    const { nodes } = layout();
    const of = (hash: string) => nodes.find((node) => node.hash === hash);

    expect(of("a")?.y).toBe(of("b")?.y);
    expect(of("b")?.y).toBe(of("d")?.y);
    expect(of("c")?.y).toBeGreaterThan(of("a")?.y ?? 0);
    expect(of("c")?.tone).not.toBe(of("a")?.tone);
  });

  it("keeps the lanes above the time axis", () => {
    const many = Array.from({ length: 30 }, (_, lane) =>
      commit(`c${lane}`, lane),
    );
    const { nodes, axisY } = layout(many);

    for (const node of nodes) {
      expect(node.y).toBeGreaterThan(0);
      expect(node.y).toBeLessThan(axisY);
    }
  });

  it("marks the HEAD commit and the merge commits", () => {
    const { nodes } = layout();
    const marked = (key: "head" | "merge") =>
      nodes.filter((node) => node[key]).map((node) => node.hash);

    expect(marked("head")).toEqual(["d"]);
    expect(marked("merge")).toEqual(["d"]);
  });
});

describe("layoutTimeline links", () => {
  const pathOf = (id: string) =>
    layout().links.find((link) => link.id === id)?.path ?? "";

  it("draws one link for each parent", () => {
    const ids = layout().links.map((link) => link.id);

    expect(ids.sort()).toEqual(["a-b", "a-c", "b-d", "c-d"]);
  });

  it("draws a straight line between two commits of one lane", () => {
    expect(pathOf("a-b")).toMatch(/^M\d+ \d+H\d+$/);
  });

  it("starts a branch with a curve, then follows the lane of the branch", () => {
    expect(pathOf("a-c")).toMatch(/^M[\d. ]+C[\d. ]+H\d+$/);
  });

  it("follows the lane of a merged branch, then ends with a curve", () => {
    expect(pathOf("c-d")).toMatch(/^M[\d. ]+H\d+C[\d. ]+$/);
  });

  it("gives the link of a branch the tone of the branch", () => {
    const { links, nodes } = layout();
    const branchTone = nodes.find((node) => node.hash === "c")?.tone;

    expect(links.find((link) => link.id === "a-c")?.tone).toBe(branchTone);
    expect(links.find((link) => link.id === "c-d")?.tone).toBe(branchTone);
  });

  it("draws a line to the left side for a parent that is out of view", () => {
    const { links } = layout([commit("x", 0, { parents: ["gone"] })]);

    expect(links.map((link) => link.id)).toEqual(["older-x"]);
    expect(links[0]?.path).toMatch(/^M0 /);
  });

  it("draws a line to the right side for a commit with a newer commit out of view", () => {
    const { links } = layoutTimeline([commit("x", 0)], {
      size: SIZE,
      continued: new Set(["x"]),
    });

    expect(links.map((link) => link.id)).toEqual(["newer-x"]);
    expect(links[0]?.path).toMatch(new RegExp(`^M${SIZE.width} `));
  });
});

describe("layoutTimeline labels", () => {
  it("shows the first name of a commit and counts the other names", () => {
    const texts = layout().labels.map((label) => label.text);

    expect(texts).toEqual(["main", "feature +1"]);
  });

  it("puts a label near the right side to the left of its commit", () => {
    const { labels } = layout(COMMITS, 160);

    expect(labels.find((label) => label.text === "main")?.anchor).toBe("end");
  });

  it("leaves out a label that does not fit before the next label of its lane", () => {
    const close = [
      commit("b", 0, { parents: ["a"], refs: ["a-long-branch-name"] }),
      commit("a", 0, { refs: ["another-long-branch-name"] }),
    ];

    expect(layout(close).labels.map((label) => label.hash)).toEqual(["b"]);
  });

  it("cuts a very long name", () => {
    const long = [commit("a", 0, { refs: ["x".repeat(60)] })];

    expect(layout(long).labels[0]?.text).toHaveLength(28);
  });
});

describe("layoutTimeline days", () => {
  it("marks the first commit of each day with its date", () => {
    const { days } = layout();

    expect(days.map((day) => day.text)).toEqual(["2026-11-22", "2026-11-23"]);
  });

  it("gives no date to a day that is too near the last date", () => {
    const near = [
      commit("b", 0, { parents: ["a"], time: DAY_TWO }),
      commit("a", 0),
    ];

    expect(layout(near).days.map((day) => day.text)).toEqual([
      "2026-11-22",
      "",
    ]);
  });
});

describe("commitsThatFit", () => {
  it("gives more commits to a wider timeline", () => {
    expect(commitsThatFit(2000)).toBeGreaterThan(commitsThatFit(1000));
  });

  it("gives a minimum number of commits to a narrow timeline", () => {
    expect(commitsThatFit(0)).toBe(8);
  });
});
