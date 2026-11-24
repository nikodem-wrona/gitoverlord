import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PathText } from "./PathText";

describe("PathText", () => {
  it("separates the folder from the file name", () => {
    render(<PathText path="src/hud/Panel.tsx" />);

    expect(screen.getByText("src/hud/")).toBeInTheDocument();
    expect(screen.getByText("Panel.tsx")).toBeInTheDocument();
    expect(screen.getByTitle("src/hud/Panel.tsx")).toBeInTheDocument();
  });

  it("shows a file in the root folder without a folder part", () => {
    render(<PathText path="README.md" />);

    expect(screen.getByText("README.md")).toBeInTheDocument();
  });
});
