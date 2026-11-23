import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { FileDiff } from "@/ipc";

import { DiffView } from "./DiffView";

const DIFF: FileDiff = {
  binary: false,
  truncated: false,
  hunks: [
    {
      header: "@@ -1,2 +1,2 @@",
      lines: [
        { kind: "context", oldLine: 1, newLine: 1, text: "one" },
        { kind: "removed", oldLine: 2, newLine: null, text: "two" },
        { kind: "added", oldLine: null, newLine: 2, text: "three" },
      ],
    },
  ],
};

function rowOf(text: string): HTMLElement {
  const row = screen.getByText(text).closest("[data-row]");
  if (!(row instanceof HTMLElement)) throw new Error(`No row holds ${text}.`);
  return row;
}

describe("DiffView", () => {
  it("shows the hunk header and each line with its kind", () => {
    render(<DiffView label="Diff of file.txt" diff={DIFF} />);

    expect(
      screen.getByRole("group", { name: "Diff of file.txt" }),
    ).toBeVisible();
    expect(rowOf("@@ -1,2 +1,2 @@")).toHaveAttribute("data-kind", "hunk");
    expect(rowOf("two")).toHaveAttribute("data-kind", "removed");
    expect(rowOf("three")).toHaveAttribute("data-kind", "added");
  });

  it("shows the old and the new line numbers", () => {
    render(<DiffView label="Diff" diff={DIFF} />);

    expect(rowOf("two")).toHaveTextContent("2−two");
    expect(rowOf("three")).toHaveTextContent("2+three");
    expect(rowOf("one")).toHaveTextContent("11 one");
  });

  it("tells the user that a binary file has no lines", () => {
    render(
      <DiffView label="Diff" diff={{ ...DIFF, binary: true, hunks: [] }} />,
    );

    expect(screen.getByText("Binary file")).toBeInTheDocument();
  });

  it("tells the user when the file has no changed lines", () => {
    render(<DiffView label="Diff" diff={{ ...DIFF, hunks: [] }} />);

    expect(screen.getByText("No changed lines")).toBeInTheDocument();
  });

  it("tells the user when the diff is too long", () => {
    render(<DiffView label="Diff" diff={{ ...DIFF, truncated: true }} />);

    expect(screen.getByText(/too long/)).toHaveAttribute("data-kind", "note");
  });
});
