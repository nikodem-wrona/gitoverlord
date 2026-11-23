import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Tree } from "./Tree";
import type { TreeNode } from "./treeTypes";

const NODES: TreeNode[] = [
  {
    id: "branches",
    label: "Branches",
    icon: "folder",
    meta: "2",
    children: [
      { id: "main", label: "main", icon: "branch" },
      { id: "dev", label: "dev", icon: "branch" },
    ],
  },
];

describe("Tree", () => {
  it("hides the children of a closed node", () => {
    render(<Tree label="Test tree" nodes={NODES} />);

    expect(screen.getByRole("button", { name: /Branches/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.queryByRole("button", { name: "main" }),
    ).not.toBeInTheDocument();
  });

  it("opens and closes a node on click", () => {
    render(<Tree label="Test tree" nodes={NODES} />);
    const group = screen.getByRole("button", { name: /Branches/ });

    fireEvent.click(group);
    expect(screen.getByRole("button", { name: "main" })).toBeInTheDocument();

    fireEvent.click(group);
    expect(
      screen.queryByRole("button", { name: "main" }),
    ).not.toBeInTheDocument();
  });

  it("selects a leaf and marks the selected leaf as current", () => {
    const onSelect = vi.fn<(id: string) => void>();
    render(
      <Tree
        label="Test tree"
        nodes={NODES}
        selectedId="dev"
        onSelect={onSelect}
        defaultExpanded={["branches"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "main" }));

    expect(onSelect).toHaveBeenCalledWith("main");
    expect(screen.getByRole("button", { name: "dev" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
