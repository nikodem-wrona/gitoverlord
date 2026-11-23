import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useToast } from "./toastContext";
import { ToastProvider } from "./ToastProvider";

function Trigger() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.ok("Saved", "All good")}>
      Notify
    </button>
  );
}

function renderToasts(duration?: number) {
  render(
    <ToastProvider duration={duration}>
      <Trigger />
    </ToastProvider>,
  );
  return screen.getByRole("button", { name: "Notify" });
}

describe("toasts", () => {
  it("shows a notification with its title and message", () => {
    fireEvent.click(renderToasts());

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("closes a notification after its duration", () => {
    vi.useFakeTimers();
    fireEvent.click(renderToasts(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("closes a notification with the dismiss button", () => {
    fireEvent.click(renderToasts());

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("keeps only the four newest notifications", () => {
    const trigger = renderToasts();

    for (let count = 0; count < 5; count += 1) fireEvent.click(trigger);

    expect(screen.getAllByText("Saved")).toHaveLength(4);
  });

  it("needs a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
  });
});
