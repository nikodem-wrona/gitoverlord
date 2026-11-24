import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_COMMITS, SAMPLE_SUMMARY } from "@/demo";
import { type Commit, commands, type MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { CommitTools } from "./CommitTools";

const PATH = SAMPLE_SUMMARY.path;
/** The tip of `spike/radar`. */
const RADAR = SAMPLE_COMMITS.find(({ hash }) => hash === "6c02f8e") as Commit;

/** Resolves the conflict of the sample working tree, so that the commands can run. */
async function renderTools() {
  await commands.stageFiles(PATH, ["src/hud/tokens.css"]);
  renderWithProviders(<CommitTools repoPath={PATH} commit={RADAR} />);
  const pick = await screen.findByRole("button", {
    name: "Cherry-pick 6c02f8e onto feat/hud-kit",
  });
  await waitFor(() => expect(pick).toBeEnabled());
  return pick;
}

function notifications() {
  return within(screen.getByRole("region", { name: "Notifications" }));
}

describe("CommitTools", () => {
  it("cherry-picks the commit onto the current branch", async () => {
    const cherryPick = vi.fn<MockCommandHandlers["cherryPick"]>(() => ({
      kind: "done",
      previous: "b7e41c9",
      head: "c0ffee1",
    }));
    mockRepository({ cherryPick });

    fireEvent.click(await renderTools());

    expect(
      await notifications().findByText("Cherry-pick complete"),
    ).toBeInTheDocument();
    expect(cherryPick).toHaveBeenCalledWith(
      expect.objectContaining({ hash: "6c02f8e" }),
    );
  });

  it("resets hard after a confirmation, and Undo gives the receipt back", async () => {
    const receipt = {
      mode: "hard",
      previous: "b7e41c9",
      backup: "abc",
    } as const;
    const resetBranch = vi.fn<MockCommandHandlers["resetBranch"]>(
      () => receipt,
    );
    const undoReset = vi.fn<MockCommandHandlers["undoReset"]>(() => null);
    mockRepository({ resetBranch, undoReset });
    await renderTools();

    fireEvent.click(screen.getByRole("button", { name: /^Reset/ }));
    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Reset feat/hud-kit to 6c02f8e, discard the changes…",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Reset branch" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reset" }));

    expect(
      await notifications().findByText("Branch reset"),
    ).toBeInTheDocument();
    expect(resetBranch).toHaveBeenCalledWith(
      expect.objectContaining({ hash: "6c02f8e", mode: "hard" }),
    );
    fireEvent.click(notifications().getByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(undoReset).toHaveBeenCalledWith(
        expect.objectContaining({ receipt }),
      ),
    );
  });

  it("does not start an operation while a file has conflicts", async () => {
    mockRepository();
    renderWithProviders(<CommitTools repoPath={PATH} commit={RADAR} />);

    const revert = await screen.findByRole("button", {
      name: "Revert 6c02f8e",
    });

    await waitFor(() =>
      expect(revert).toHaveAttribute("title", "Resolve the conflicts first."),
    );
    expect(revert).toBeDisabled();
  });
});
