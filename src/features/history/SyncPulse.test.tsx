import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MotionProvider } from "@/hud";
import { mockReducedMotion } from "@/test/matchMedia";

import { SyncPulse } from "./SyncPulse";
import type { TimelineLayout } from "./timelineModel";

const LAYOUT: TimelineLayout = {
  nodes: [
    {
      hash: "b7e41c9",
      subject: "feat: add the star map",
      x: 400,
      y: 60,
      tone: "active",
      head: true,
      merge: false,
    },
  ],
  links: [],
  labels: [],
  days: [],
  axisY: 200,
};

function renderPulse(operation: "push" | "fetch" | "clone") {
  return render(
    <MotionProvider>
      <svg>
        <SyncPulse layout={LAYOUT} width={1000} operation={operation} />
      </svg>
    </MotionProvider>,
  );
}

describe("SyncPulse", () => {
  it("moves a pulse from HEAD to the remote while a push runs", () => {
    mockReducedMotion(false);
    const { container } = renderPulse("push");

    expect(screen.getByText("Push ▸ remote")).toBeInTheDocument();
    const motion = container.querySelector("animateMotion");
    expect(motion).toHaveAttribute("path", "M400 60H1000");
  });

  it("moves the pulse from the remote to HEAD while a fetch runs", () => {
    mockReducedMotion(false);
    const { container } = renderPulse("fetch");

    const motion = container.querySelector("animateMotion");
    expect(motion).toHaveAttribute("path", "M1000 60H400");
  });

  it("shows the track without the pulse in calm mode", () => {
    const { container } = renderPulse("push");

    expect(screen.getByText("Push ▸ remote")).toBeInTheDocument();
    expect(container.querySelector("animateMotion")).toBeNull();
  });

  it("shows nothing for a clone", () => {
    const { container } = renderPulse("clone");

    expect(container.querySelector("g")).toBeNull();
  });
});
