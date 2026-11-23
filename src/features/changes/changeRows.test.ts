import { describe, expect, it } from "vitest";

import type { FileDelta } from "@/ipc";

import { changeRows, selectedRowKey } from "./changeRows";

function file(path: string): FileDelta {
  return { path, oldPath: null, kind: "modified", additions: 1, deletions: 0 };
}

describe("changeRows", () => {
  it("lists the staged files first, and each file with its area", () => {
    const rows = changeRows({
      staged: [file("a.txt")],
      unstaged: [file("a.txt"), file("b.txt")],
    });

    expect(rows.map((row) => row.key)).toEqual([
      "staged:a.txt",
      "unstaged:a.txt",
      "unstaged:b.txt",
    ]);
  });
});

describe("selectedRowKey", () => {
  it("gives the row of a working tree file", () => {
    expect(selectedRowKey({ kind: "unstaged", path: "a.txt" })).toBe(
      "unstaged:a.txt",
    );
  });

  it("gives no row for a commit file or for no target", () => {
    const target = { kind: "commit" as const, hash: "abc", path: "a.txt" };

    expect(selectedRowKey(target)).toBeUndefined();
    expect(selectedRowKey(undefined)).toBeUndefined();
  });
});
