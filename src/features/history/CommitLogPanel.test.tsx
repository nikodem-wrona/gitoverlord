import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_COMMITS } from "@/demo";
import type { LogPage } from "@/ipc";
import { rejectWith } from "@/test/commandResults";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { CommitLogPanel } from "./CommitLogPanel";
import { useHistory } from "./useHistory";

function Harness({ onSelect = () => {} }: { onSelect?(hash: string): void }) {
  const history = useHistory("~/repo");
  return (
    <CommitLogPanel title="Commit log" history={history} onSelect={onSelect} />
  );
}

/** Gives the sample commits in pages of `size`, whatever the limit of the request is. */
function pagesOf(size: number) {
  return ({ skip }: { skip: number }): LogPage => {
    const end = skip + size;
    return {
      commits: SAMPLE_COMMITS.slice(skip, end),
      next: end < SAMPLE_COMMITS.length ? end : null,
    };
  };
}

describe("CommitLogPanel", () => {
  it("loads the next pages while the end of the log is in view", async () => {
    const repoLog = vi.fn<(args: { skip: number }) => LogPage>(pagesOf(6));
    mockRepository({ repoLog });

    renderWithProviders(<Harness />);

    expect(
      await screen.findByText("chore: initial commit"),
    ).toBeInTheDocument();
    expect(repoLog.mock.calls.map(([args]) => args.skip)).toEqual([0, 6, 12]);
    expect(screen.getByText("16 commits")).toBeInTheDocument();
  });

  it("shows the short hash, the refs, and the time of a commit", async () => {
    mockRepository();

    renderWithProviders(<Harness />);

    const row = (await screen.findByText("b7e41c9")).closest("tr");
    expect(row).toHaveTextContent("feat/hud-kit");
    expect(row).toHaveTextContent("2026-11-23 12:04");
  });

  it("highlights a merge commit, and reports the commit that the user selects", async () => {
    const onSelect = vi.fn<(hash: string) => void>();
    mockRepository();
    renderWithProviders(<Harness onSelect={onSelect} />);

    const merge = await screen.findByText("merge: fix/windows-ci");
    fireEvent.click(merge);

    expect(merge.closest("tr")).toHaveAttribute("data-tone", "highlight");
    expect(onSelect).toHaveBeenCalledWith("e2c71aa");
  });

  it("tells the user when the repository has no commits", async () => {
    mockRepository({ repoLog: () => ({ commits: [], next: null }) });

    renderWithProviders(<Harness />);

    expect(await screen.findByText("No commits")).toBeInTheDocument();
  });

  it("shows the failure when the log cannot be read", async () => {
    mockRepository({
      repoLog: rejectWith({ kind: "readFailed", message: "bad object" }),
    });

    renderWithProviders(<Harness />);

    expect(await screen.findByText("Signal lost")).toBeInTheDocument();
    expect(screen.getByText("bad object")).toBeInTheDocument();
  });
});
