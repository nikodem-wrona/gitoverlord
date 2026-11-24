import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemePicker } from "./ThemePicker";
import { ThemeProvider } from "./ThemeProvider";

function renderPicker() {
  render(
    <ThemeProvider>
      <ThemePicker />
    </ThemeProvider>,
  );
  return screen.getByRole("button", { name: /^Theme:/ });
}

describe("ThemePicker", () => {
  it("starts with the Overlord theme on the root element", () => {
    const button = renderPicker();

    expect(button).toHaveTextContent("Theme: Overlord");
    expect(document.documentElement.dataset.theme).toBe("overlord");
  });

  it("changes the theme and keeps it for the next start", () => {
    const button = renderPicker();

    fireEvent.click(button);
    const current = screen.getByRole("menuitemradio", { name: /^Overlord/ });
    expect(current).toHaveAttribute("aria-checked", "true");
    expect(current).toHaveFocus();
    fireEvent.click(screen.getByRole("menuitemradio", { name: /^Amber/ }));

    expect(button).toHaveTextContent("Theme: Amber");
    expect(document.documentElement.dataset.theme).toBe("amber");
    expect(localStorage.getItem("gitoverlord.theme")).toBe("amber");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("reads the theme of the last start", () => {
    localStorage.setItem("gitoverlord.theme", "mono");

    expect(renderPicker()).toHaveTextContent("Theme: Mono");
  });
});
