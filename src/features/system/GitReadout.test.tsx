import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mockCommands } from "@/ipc";
import { neverSettles, rejectWith } from "@/test/commandResults";
import { renderWithProviders } from "@/test/renderWithProviders";

import { GitReadout } from "./GitReadout";

describe("GitReadout", () => {
  it("shows a pending state while the check runs", () => {
    mockCommands({ detectGit: neverSettles });

    renderWithProviders(<GitReadout />);

    expect(screen.getByRole("status")).toHaveTextContent("Scanning");
  });

  it("shows the git version when git is found", async () => {
    mockCommands({ detectGit: () => ({ major: 2, minor: 54, patch: 0 }) });

    renderWithProviders(<GitReadout />);

    expect(await screen.findByText("2.54.0")).toBeInTheDocument();
  });

  it("tells the user to install git when git is not found", async () => {
    mockCommands({ detectGit: rejectWith({ kind: "gitNotFound" }) });

    renderWithProviders(<GitReadout />);

    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute(
      "title",
      expect.stringMatching(/install git/i),
    );
  });

  it("gives the message from git when git fails", async () => {
    const message = "fatal: bad config";
    mockCommands({ detectGit: rejectWith({ kind: "commandFailed", message }) });

    renderWithProviders(<GitReadout />);

    expect(await screen.findByText("Failed")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("title", message);
  });

  it("reports no response when the backend has no such command", async () => {
    mockCommands({});

    renderWithProviders(<GitReadout />);

    expect(await screen.findByText("No response")).toBeInTheDocument();
  });
});
