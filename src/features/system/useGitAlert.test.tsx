import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mockCommands } from "@/ipc";
import { rejectWith } from "@/test/commandResults";
import { renderWithProviders } from "@/test/renderWithProviders";

import { GitReadout } from "./GitReadout";
import { useGitAlert } from "./useGitAlert";

function AlertProbe() {
  useGitAlert();
  return <GitReadout />;
}

describe("useGitAlert", () => {
  it("shows a notification with the hint when git is not found", async () => {
    mockCommands({ detectGit: rejectWith({ kind: "gitNotFound" }) });

    renderWithProviders(<AlertProbe />);

    expect(await screen.findByText("Git: Not found")).toBeInTheDocument();
    expect(
      screen.getByText("Install Git, then restart gitoverlord."),
    ).toBeInTheDocument();
  });

  it("stays quiet when git works", async () => {
    mockCommands({ detectGit: () => ({ major: 2, minor: 54, patch: 0 }) });

    renderWithProviders(<AlertProbe />);

    expect(await screen.findByText("2.54.0")).toBeInTheDocument();
    expect(screen.queryByText(/^Git:/)).not.toBeInTheDocument();
  });
});
