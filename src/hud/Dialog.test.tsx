import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("puts the focus on the first field, and closes with the Escape key", () => {
    const onClose = vi.fn<() => void>();
    const behind = vi.fn<(event: KeyboardEvent) => void>();
    window.addEventListener("keydown", behind);
    render(
      <Dialog title="Rename" onClose={onClose}>
        <input aria-label="Name" />
      </Dialog>,
    );

    const field = screen.getByRole("textbox", { name: "Name" });
    expect(field).toHaveFocus();
    fireEvent.keyDown(field, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
    // The panel under the dialog does not also get the key.
    expect(behind).not.toHaveBeenCalled();
    window.removeEventListener("keydown", behind);
  });

  it("closes on a click outside the dialog only", () => {
    const onClose = vi.fn<() => void>();
    render(
      <Dialog title="Rename" onClose={onClose}>
        <p>Body</p>
      </Dialog>,
    );

    fireEvent.mouseDown(screen.getByText("Body"));
    expect(onClose).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "Rename" });
    fireEvent.mouseDown(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
