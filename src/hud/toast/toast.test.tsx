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

function ActionTrigger({ run }: { run(): void }) {
  const toast = useToast();
  const notify = () => {
    toast.ok("Deleted", undefined, { action: { label: "Undo", run } });
    const id = toast.info("Working", undefined, { sticky: true });
    if (id < 0) throw new Error("A notification has a positive id.");
  };
  return (
    <button type="button" onClick={notify}>
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

  it("stops the time while the pointer is on a notification", () => {
    vi.useFakeTimers();
    fireEvent.click(renderToasts(1000));
    const toast = screen.getByText("Saved").closest("li") as HTMLElement;

    act(() => vi.advanceTimersByTime(600));
    fireEvent.mouseEnter(toast);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("Saved")).toBeInTheDocument();

    fireEvent.mouseLeave(toast);
    act(() => vi.advanceTimersByTime(399));
    expect(screen.getByText("Saved")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
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

  it("runs the button of a notification, then closes the notification", () => {
    const run = vi.fn<() => void>();
    render(
      <ToastProvider>
        <ActionTrigger run={run} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notify" }));

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(run).toHaveBeenCalledOnce();
    expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
  });

  it("keeps a sticky notification after the duration", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider duration={1000}>
        <ActionTrigger run={() => {}} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notify" }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText("Working")).toBeInTheDocument();
    expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
  });

  it("needs a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
  });
});
