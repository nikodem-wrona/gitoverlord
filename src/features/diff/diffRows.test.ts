import { describe, expect, it } from "vitest";

import type { DiffLine, FileDiff } from "@/ipc";

import { diffRows } from "./diffRows";

const LINE: DiffLine = { kind: "added", oldLine: null, newLine: 1, text: "x" };

function diff(hunkSizes: number[], truncated = false): FileDiff {
  const hunks = hunkSizes.map((size, index) => ({
    header: `@@ hunk ${index} @@`,
    lines: Array.from({ length: size }, () => LINE),
  }));
  return { binary: false, truncated, hunks };
}

describe("diffRows", () => {
  it("puts each hunk header before its lines", () => {
    const rows = diffRows(diff([2, 1]));

    expect(rows.map((row) => row.type)).toEqual([
      "hunk",
      "line",
      "line",
      "hunk",
      "line",
    ]);
  });

  it("gives each row a different key", () => {
    const keys = diffRows(diff([3, 3], true)).map((row) => row.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("adds a note at the end of a diff that is too long", () => {
    expect(diffRows(diff([1], true)).at(-1)?.type).toBe("note");
    expect(diffRows(diff([1])).at(-1)?.type).toBe("line");
  });
});
