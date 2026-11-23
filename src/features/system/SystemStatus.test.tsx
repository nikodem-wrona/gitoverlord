import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mockCommands } from "@/ipc";
import { neverSettles, rejectWith } from "@/test/commandResults";
import { renderWithProviders } from "@/test/renderWithProviders";

import { SystemStatus } from "./SystemStatus";

describe("SystemStatus", () => {
  it("shows a pending line while the check runs", () => {
    mockCommands({ detectGit: neverSettles });

    renderWithProviders(<SystemStatus />);

    expect(screen.getByText("[ .. ]")).toBeInTheDocument();
    expect(screen.getByText("Scanning")).toBeInTheDocument();
  });

  it("shows the git version when git is found", async () => {
    mockCommands({ detectGit: () => ({ major: 2, minor: 54, patch: 0 }) });

    renderWithProviders(<SystemStatus />);

    expect(await screen.findByText("2.54.0")).toBeInTheDocument();
    expect(screen.getByText("[ OK ]")).toBeInTheDocument();
  });

  it("tells the user to install git when git is not found", async () => {
    mockCommands({ detectGit: rejectWith({ kind: "gitNotFound" }) });

    renderWithProviders(<SystemStatus />);

    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(screen.getByText("[FAIL]")).toBeInTheDocument();
    expect(screen.getByText(/install git/i)).toBeInTheDocument();
  });

  it("shows the message from git when git fails", async () => {
    const message = "fatal: bad config";
    mockCommands({
      detectGit: rejectWith({ kind: "commandFailed", message }),
    });

    renderWithProviders(<SystemStatus />);

    expect(await screen.findByText("Failed")).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("reports no response when the backend has no such command", async () => {
    mockCommands({});

    renderWithProviders(<SystemStatus />);

    expect(await screen.findByText("No response")).toBeInTheDocument();
  });
});
