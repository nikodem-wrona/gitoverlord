import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { mockCommands } from "@/ipc";
import { renderWithProviders } from "@/test/renderWithProviders";

import { AppShell } from "./AppShell";

function openTab(name: string) {
  fireEvent.click(screen.getByRole("tab", { name }));
}

describe("AppShell", () => {
  beforeEach(() => {
    mockCommands({ detectGit: () => ({ major: 2, minor: 54, patch: 0 }) });
  });

  it("opens on the commit log with the HEAD commit in the inspector", () => {
    renderWithProviders(<AppShell />);

    expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("grid", { name: "Commit log" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "feat: add the star map" }),
    ).toBeInTheDocument();
  });

  it("shows the commit that the user selects in the inspector", () => {
    renderWithProviders(<AppShell />);

    fireEvent.click(screen.getByText("fix: embed the windows manifest"));

    expect(
      screen.getByRole("heading", { name: "fix: embed the windows manifest" }),
    ).toBeInTheDocument();
  });

  it("shows the working tree on the Changes tab, with conflicts as alerts", () => {
    renderWithProviders(<AppShell />);

    openTab("Changes");

    expect(
      screen.getByRole("grid", { name: "Working tree changes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("src/hud/tokens.css").closest("tr"),
    ).toHaveAttribute("data-tone", "alert");
  });

  it("tells the user when a module is not ready", () => {
    renderWithProviders(<AppShell />);

    openTab("Pull requests");

    expect(
      screen.getByText("This module arrives in phase 5."),
    ).toBeInTheDocument();
  });

  it("tells the user that sync is offline", () => {
    renderWithProviders(<AppShell />);

    fireEvent.click(screen.getByRole("button", { name: "Push" }));

    expect(screen.getByText("Sync is offline")).toBeInTheDocument();
  });
});
