import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import type { MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { ConflictPanel } from "./ConflictPanel";

/** The sample working tree has a conflict in this file. */
const PATH = "src/hud/tokens.css";

async function renderPanel(onResolved = vi.fn<(path: string) => void>()) {
  renderWithProviders(
    <ConflictPanel
      repoPath={SAMPLE_SUMMARY.path}
      path={PATH}
      onClose={() => {}}
      onResolved={onResolved}
    />,
  );
  await screen.findByRole("group", { name: `Conflicts of ${PATH}` });
  return onResolved;
}

describe("ConflictPanel", () => {
  it("resolves the file with one choice for each conflict, and Undo puts the conflicts back", async () => {
    const resolveConflict = vi.fn<MockCommandHandlers["resolveConflict"]>(
      () => null,
    );
    const restoreConflict = vi.fn<MockCommandHandlers["restoreConflict"]>(
      () => null,
    );
    mockRepository({ resolveConflict, restoreConflict });
    const onResolved = await renderPanel();
    const resolve = screen.getByRole("button", {
      name: `Resolve the conflicts of ${PATH}`,
    });
    expect(resolve).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Conflict 1: keep current" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Conflict 2: keep both" }),
    );
    fireEvent.click(resolve);

    await waitFor(() =>
      expect(resolveConflict).toHaveBeenCalledWith(
        expect.objectContaining({
          file: PATH,
          resolution: { kind: "blocks", choices: ["ours", "both"] },
        }),
      ),
    );
    expect(onResolved).toHaveBeenCalledWith(PATH);
    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(
      await within(notifications).findByText("Conflict resolved"),
    ).toBeInTheDocument();
    fireEvent.click(
      within(notifications).getByRole("button", { name: "Undo" }),
    );
    await waitFor(() =>
      expect(restoreConflict).toHaveBeenCalledWith(
        expect.objectContaining({ file: PATH }),
      ),
    );
  });

  it("marks the kept lines of a choice", async () => {
    mockRepository();
    await renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "All incoming" }));

    const kept = screen.getByText("--color-active: #9dffcf;");
    const dropped = screen.getByText("--color-active: #74f8b2;");
    expect(kept).toHaveAttribute("data-kept", "true");
    expect(dropped).toHaveAttribute("data-kept", "false");
    expect(
      screen.getByRole("button", { name: "Conflict 2: keep incoming" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the whole file of one side after a confirmation", async () => {
    const resolveConflict = vi.fn<MockCommandHandlers["resolveConflict"]>(
      () => null,
    );
    mockRepository({ resolveConflict });
    await renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /Whole file/ }));
    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Keep the incoming file (spike/radar)…",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Keep one side" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep" }));

    await waitFor(() =>
      expect(resolveConflict).toHaveBeenCalledWith(
        expect.objectContaining({
          resolution: { kind: "file", side: "theirs" },
        }),
      ),
    );
  });
});
