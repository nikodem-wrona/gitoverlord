import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mockReducedMotion } from "@/test/matchMedia";

import { DecodeText } from "./DecodeText";
import { MotionProvider } from "./MotionProvider";

function renderDecode() {
  return render(
    <MotionProvider>
      <DecodeText text="Access granted" duration={500} />
    </MotionProvider>,
  );
}

describe("DecodeText", () => {
  it("shows the text immediately in calm mode", () => {
    mockReducedMotion(true);
    renderDecode();

    expect(screen.getByText("Access granted")).toBeInTheDocument();
  });

  it("decodes the text over its duration", () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const { container } = renderDecode();

    // While the text decodes, assistive technology gets the real text.
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector(".visually-hidden")).toHaveTextContent(
      "Access granted",
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText("Access granted")).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
