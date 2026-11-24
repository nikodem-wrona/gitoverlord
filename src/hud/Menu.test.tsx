import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Menu, type MenuItem } from "./Menu";

const ITEMS: MenuItem[] = [
  { id: "pick", label: "Cherry-pick" },
  { id: "revert", label: "Revert", blocked: "An operation runs." },
  { id: "reset", label: "Reset…", danger: true },
];

function renderMenu() {
  const onSelect = vi.fn<(id: string) => void>();
  const onClose = vi.fn<() => void>();
  render(
    <Menu
      label="Commit commands"
      items={ITEMS}
      at={{ x: 10, y: 10 }}
      onSelect={onSelect}
      onClose={onClose}
    />,
  );
  return { onSelect, onClose, menu: screen.getByRole("menu") };
}

describe("Menu", () => {
  it("gives the first item the focus and moves the focus with the arrow keys", () => {
    const { menu } = renderMenu();
    const [pick, revert, reset] = screen.getAllByRole("menuitem");

    expect(pick).toHaveFocus();
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(revert).toHaveFocus();
    fireEvent.keyDown(menu, { key: "End" });
    expect(reset).toHaveFocus();
  });

  it("selects an item, but not an item that is blocked", () => {
    const { onSelect } = renderMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Revert" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Reset…" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("reset");
  });

  it("closes on the Escape key and on a press outside", () => {
    const { onClose, menu } = renderMenu();

    fireEvent.keyDown(menu, { key: "Escape" });
    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
