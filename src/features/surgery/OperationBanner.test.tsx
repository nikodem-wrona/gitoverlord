import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import { BranchPanel } from "@/features/branches";
import { ChangesPanel } from "@/features/changes";
import { commands, type MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { OperationBanner } from "./OperationBanner";

const PATH = SAMPLE_SUMMARY.path;

/**
 * Merges `spike/radar`. The demo stops this merge at a conflict.
 *
 * A merge cannot start while a file has conflicts, so the conflict of the sample
 * working tree is resolved first.
 */
async function mergeRadar(more?: ReactNode) {
  await commands.stageFiles(PATH, ["src/hud/tokens.css"]);
  renderWithProviders(
    <>
      <OperationBanner repoPath={PATH} />
      <BranchPanel title="Branch registry" repoPath={PATH} />
      {more}
    </>,
  );
  const grid = await screen.findByRole("grid", { name: "Branches" });
  fireEvent.click(within(grid).getByText("spike/radar"));
  fireEvent.click(
    screen.getByRole("button", { name: "Merge spike/radar into feat/hud-kit" }),
  );
  return screen.findByRole("region", { name: "Merge in progress" });
}

describe("OperationBanner", () => {
  it("shows a merge that stopped, with the count of the conflicts", async () => {
    mockRepository();

    const banner = await mergeRadar();

    expect(
      within(banner).getByText("1 file with conflicts"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Merge stopped")).toBeInTheDocument();
    expect(
      within(banner).getByRole("button", { name: "Continue the merge" }),
    ).toBeDisabled();
    expect(within(banner).queryByRole("button", { name: /Skip/ })).toBeNull();
  });

  it("aborts the merge after a confirmation", async () => {
    const abortOperation = vi.fn<MockCommandHandlers["abortOperation"]>(
      () => null,
    );
    mockRepository({ abortOperation });
    const banner = await mergeRadar();

    fireEvent.click(
      within(banner).getByRole("button", { name: "Abort the merge…" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Abort the merge" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Abort" }));

    await waitFor(() => expect(abortOperation).toHaveBeenCalled());
  });

  it("continues the merge when no conflict is left, and Undo moves the branch back", async () => {
    const restoreHead = vi.fn<MockCommandHandlers["restoreHead"]>(() => null);
    mockRepository({ restoreHead });
    const banner = await mergeRadar(
      <ChangesPanel title="Working tree" repoPath={PATH} onSelect={() => {}} />,
    );

    // A stage of a file with conflicts marks it as resolved.
    fireEvent.click(screen.getByRole("button", { name: "Stage all changes" }));
    await within(banner).findByText("No conflicts left");
    fireEvent.click(
      within(banner).getByRole("button", { name: "Continue the merge" }),
    );

    expect(await screen.findByText("Merge complete")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Merge in progress" }),
      ).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(restoreHead).toHaveBeenCalledWith(
        expect.objectContaining({ hash: SAMPLE_SUMMARY.head.hash }),
      ),
    );
  });
});
