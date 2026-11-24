import { describe, expect, it } from "vitest";

import type { FileDelta } from "@/ipc";

import { lineCountColumns, lineTotals } from "./lineCounts";

type Counts = Pick<FileDelta, "additions" | "deletions">;

const COUNTED: Counts = { additions: 3, deletions: 1 };
const NOT_COUNTED: Counts = { additions: null, deletions: null };

describe("lineTotals", () => {
  it("adds the line counts and skips the files without counts", () => {
    expect(lineTotals([COUNTED, COUNTED, NOT_COUNTED])).toEqual({
      added: 6,
      removed: 2,
      counted: 2,
    });
  });
});

describe("lineCountColumns", () => {
  it("shows an empty cell for a file without line counts", () => {
    const [added, removed] = lineCountColumns<Counts>();

    expect(added?.render(COUNTED)).toBe(3);
    expect(removed?.render(COUNTED)).toBe(1);
    expect(added?.render(NOT_COUNTED)).toBe("");
  });
});
