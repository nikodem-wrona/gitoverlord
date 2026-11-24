import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockCommands } from "@/ipc";
import { renderWithProviders } from "@/test/renderWithProviders";
import { advanceInSteps } from "@/test/timers";

import { BootScreen } from "./BootScreen";
import { HOLD_MS, STEP_MS } from "./useBootSequence";

describe("BootScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCommands({ detectGit: () => ({ major: 2, minor: 54, patch: 0 }) });
  });

  it("shows the checks one after another, then finishes", () => {
    const onFinish = vi.fn<() => void>();
    renderWithProviders(<BootScreen onFinish={onFinish} />);
    expect(screen.queryByText("HUD kit")).not.toBeInTheDocument();

    advanceInSteps(STEP_MS, 1);
    expect(screen.getByText("HUD kit")).toBeInTheDocument();
    expect(screen.queryByText("Timeline")).not.toBeInTheDocument();

    advanceInSteps(STEP_MS, 3);
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();

    advanceInSteps(HOLD_MS, 1);
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("finishes when the user presses a key", () => {
    const onFinish = vi.fn<() => void>();
    renderWithProviders(<BootScreen onFinish={onFinish} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onFinish).toHaveBeenCalled();
  });
});
