import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { mockReducedMotion } from "@/test/matchMedia";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { Root } from "./Root";

describe("Root", () => {
  beforeEach(() => {
    mockRepository();
  });

  it("starts with the boot sequence when motion is on", () => {
    mockReducedMotion(false);

    renderWithProviders(<Root />);

    expect(screen.getByText("Press any key to skip")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("goes directly to the shell in calm mode", async () => {
    mockReducedMotion(true);

    renderWithProviders(<Root />);

    expect(
      await screen.findByRole("tablist", { name: "Modules" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Press any key to skip")).not.toBeInTheDocument();
  });
});
