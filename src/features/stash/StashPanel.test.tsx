import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { StashPanel } from "./StashPanel";

function renderPanel(onInspect = vi.fn<(hash: string) => void>()) {
  renderWithProviders(
    <StashPanel
      title="Stash vault"
      repoPath={SAMPLE_SUMMARY.path}
      onInspect={onInspect}
    />,
  );
  return onInspect;
}

async function stash(message: string) {
  const button = await screen.findByRole("button", {
    name: "Stash all changes…",
  });
  // The button waits for the working tree.
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  const field = screen.getByRole("textbox", { name: "Message" });
  fireEvent.change(field, { target: { value: message } });
  fireEvent.submit(field);
  return screen.findByRole("grid", { name: "Stash entries" });
}

describe("StashPanel", () => {
  it("stashes the changes, then pops the entry", async () => {
    mockRepository();
    renderPanel();
    expect(await screen.findByText("Stash empty")).toBeInTheDocument();

    const grid = await stash("try the vault");
    expect(
      within(grid).getByText("On feat/hud-kit: try the vault"),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Pop stash@{0}" }));
    expect(await screen.findByText("Stash empty")).toBeInTheDocument();
  });

  it("shows the files of the entry that the user selects", async () => {
    mockRepository();
    const onInspect = renderPanel();
    const grid = await stash("first");

    fireEvent.click(within(grid).getByText("stash@{0}"));

    expect(onInspect).toHaveBeenCalledWith(expect.any(String));
  });

  it("drops an entry after a confirmation, and Undo puts it back", async () => {
    mockRepository();
    renderPanel();
    await stash("keep me");

    fireEvent.click(screen.getByRole("button", { name: "Drop stash@{0}…" }));
    const dialog = screen.getByRole("dialog", { name: "Drop stash entry" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Drop" }));
    expect(await screen.findByText("Stash empty")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(screen.getByText("On feat/hud-kit: keep me")).toBeVisible(),
    );
  });
});
