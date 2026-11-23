import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mockReducedMotion } from "@/test/matchMedia";

import { useMotion } from "./motionContext";
import { MotionProvider } from "./MotionProvider";

function Probe() {
  const { calm, calmSetting, setCalmSetting } = useMotion();
  return (
    <>
      <p>calm: {String(calm)}</p>
      <button type="button" onClick={() => setCalmSetting(!calmSetting)}>
        Toggle
      </button>
    </>
  );
}

function renderProbe() {
  return render(
    <MotionProvider>
      <Probe />
    </MotionProvider>,
  );
}

describe("MotionProvider", () => {
  it("uses calm mode when the system asks for reduced motion", () => {
    mockReducedMotion(true);
    renderProbe();

    expect(screen.getByText("calm: true")).toBeInTheDocument();
    expect(document.documentElement.dataset.motion).toBe("calm");
  });

  it("runs the animations when nothing asks for calm", () => {
    mockReducedMotion(false);
    renderProbe();

    expect(screen.getByText("calm: false")).toBeInTheDocument();
    expect(document.documentElement.dataset.motion).toBe("full");
  });

  it("keeps the calm mode setting of the user for the next start", () => {
    mockReducedMotion(false);
    const { unmount } = renderProbe();
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByText("calm: true")).toBeInTheDocument();

    unmount();
    renderProbe();

    expect(screen.getByText("calm: true")).toBeInTheDocument();
  });

  it("stops all motion when there is no provider", () => {
    mockReducedMotion(false);
    render(<Probe />);

    expect(screen.getByText("calm: true")).toBeInTheDocument();
  });
});
