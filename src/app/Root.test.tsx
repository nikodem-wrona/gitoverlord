import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { mockCommands } from "@/ipc";
import { mockReducedMotion } from "@/test/matchMedia";
import { renderWithProviders } from "@/test/renderWithProviders";

import { Root } from "./Root";

describe("Root", () => {
  beforeEach(() => {
    mockCommands({ detectGit: () => ({ major: 2, minor: 54, patch: 0 }) });
  });

  it("starts with the boot sequence when motion is on", () => {
    mockReducedMotion(false);

    renderWithProviders(<Root />);

    expect(screen.getByText("Press any key to skip")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("goes directly to the shell in calm mode", () => {
    mockReducedMotion(true);

    renderWithProviders(<Root />);

    expect(
      screen.getByRole("tablist", { name: "Modules" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Press any key to skip")).not.toBeInTheDocument();
  });
});
