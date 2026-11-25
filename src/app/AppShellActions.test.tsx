import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { AppShell } from "./AppShell";

async function renderOpenShell() {
  renderWithProviders(<AppShell />);
  await screen.findByRole("grid", { name: "Commit log" });
}

function openPalette() {
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  return screen.getByRole("textbox", { name: "Search the commands" });
}

describe("AppShell actions", () => {
  it("shows the commit console in place of the inspector on the Changes tab", async () => {
    mockRepository();
    await renderOpenShell();

    fireEvent.keyDown(window, { key: "1", ctrlKey: true });

    const inspector = await screen.findByRole("complementary", {
      name: "Inspector",
    });
    expect(
      within(inspector).getByRole("heading", { name: "Commit console" }),
    ).toBeInTheDocument();
  });

  it("shows the stash entries on the Stash tab", async () => {
    mockRepository();
    await renderOpenShell();

    fireEvent.click(screen.getByRole("tab", { name: "Stash" }));

    expect(await screen.findByText("Stash empty")).toBeInTheDocument();
  });

  it("switches the branch from the command palette", async () => {
    mockRepository();
    await renderOpenShell();
    await screen.findAllByText("feat/hud-kit");

    const search = openPalette();
    fireEvent.change(search, { target: { value: "switch" } });
    // The palette has one entry for all the branches, not one for each branch.
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.keyDown(search, { key: "Enter" });

    const branchSearch = await screen.findByRole("textbox", {
      name: "Search the branches",
    });
    fireEvent.change(branchSearch, { target: { value: "main" } });
    await screen.findByRole("option", { name: "main" });
    fireEvent.keyDown(branchSearch, { key: "Enter" });

    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(
      await within(notifications).findByText("Branch switched"),
    ).toBeInTheDocument();
    // The Branch readout of the top bar shows the new current branch.
    const readout = screen.getByText("Branch", { selector: "dt" });
    await waitFor(() =>
      expect(readout.nextElementSibling).toHaveTextContent("main"),
    );
  });

  it("opens the palette from the top bar", async () => {
    mockRepository();
    await renderOpenShell();

    fireEvent.click(screen.getByRole("button", { name: /Commands/ }));

    expect(
      screen.getByRole("dialog", { name: "Command palette" }),
    ).toBeInTheDocument();
  });
});
