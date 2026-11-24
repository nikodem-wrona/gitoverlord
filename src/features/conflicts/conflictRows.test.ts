import { describe, expect, it } from "vitest";

import { sampleConflict } from "@/demo";

import { conflictCount, conflictRows, keeps, sideLabels } from "./conflictRows";

const FILE = sampleConflict("src/hud/tokens.css");

describe("conflictRows", () => {
  it("gives each conflict a header, then the name and the lines of each side", () => {
    const rows = conflictRows(FILE.blocks);

    const first = rows
      .slice(4, 11)
      .map((row) =>
        row.type === "clean" || row.type === "code" ? row.text : row.type,
      );
    expect(first).toEqual([
      "header",
      "side",
      "  --color-panel: rgb(11 11 11 / 92%);",
      "  --color-line: #1e1e1e;",
      "side",
      "  --color-panel: rgb(8 8 8 / 90%);",
      "  --color-line: #242424;",
    ]);
    const headers = rows.filter((row) => row.type === "header");
    expect(headers.map((row) => row.index)).toEqual([0, 1]);
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  });

  it("counts the conflicts and reads the names of the sides", () => {
    expect(conflictCount(FILE.blocks)).toBe(2);
    expect(sideLabels(FILE.blocks)).toEqual({
      ours: "HEAD",
      theirs: "spike/radar",
    });
  });

  it("keeps the lines of the chosen side, or of both sides", () => {
    expect(keeps(undefined, "ours")).toBeUndefined();
    expect(keeps("theirs", "ours")).toBe(false);
    expect(keeps("both", "theirs")).toBe(true);
  });
});
