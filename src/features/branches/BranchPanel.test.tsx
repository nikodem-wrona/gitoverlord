import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import type { MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { BranchPanel } from "./BranchPanel";

async function renderPanel() {
  renderWithProviders(
    <BranchPanel title="Branch registry" repoPath={SAMPLE_SUMMARY.path} />,
  );
  return screen.findByRole("grid", { name: "Branches" });
}

describe("BranchPanel", () => {
  it("creates a branch with the name that the user types", async () => {
    const createBranch = vi.fn<MockCommandHandlers["createBranch"]>(() => null);
    mockRepository({ createBranch });
    await renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "New branch…" }));
    const name = screen.getByRole("textbox", { name: "Branch name" });
    fireEvent.change(name, { target: { value: "feat/vault" } });
    fireEvent.submit(name);

    await waitFor(() =>
      expect(createBranch).toHaveBeenCalledWith(
        expect.objectContaining({ name: "feat/vault", start: null }),
      ),
    );
  });

  it("switches to the selected branch", async () => {
    mockRepository();
    const grid = await renderPanel();

    fireEvent.click(within(grid).getByText("main"));
    fireEvent.click(screen.getByRole("button", { name: "Switch to main" }));

    expect(await within(grid).findByText("▸ main")).toBeInTheDocument();
  });

  it("does not delete the current branch", async () => {
    mockRepository();
    await renderPanel();

    const remove = screen.getByRole("button", {
      name: /^Delete feat\/hud-kit/,
    });

    expect(remove).toBeDisabled();
  });

  it("deletes a branch after a confirmation, and Undo makes it again", async () => {
    const restoreBranch = vi.fn<MockCommandHandlers["restoreBranch"]>(
      () => null,
    );
    mockRepository({ restoreBranch });
    const grid = await renderPanel();

    fireEvent.click(within(grid).getByText("spike/radar"));
    fireEvent.click(
      screen.getByRole("button", { name: "Delete spike/radar…" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Delete branch" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Branch deleted")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(restoreBranch).toHaveBeenCalledWith(
        expect.objectContaining({ name: "spike/radar", hash: "6c02f8e" }),
      ),
    );
  });
});
