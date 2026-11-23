import { describe, expect, it } from "vitest";

import { windowStart } from "./timelineWindow";

describe("windowStart", () => {
  it("stays in position while the selected commit is in view", () => {
    expect(windowStart(10, 15, 100, 20)).toBe(10);
  });

  it("puts a selected commit outside the view in the middle", () => {
    expect(windowStart(0, 50, 100, 20)).toBe(40);
  });

  it("does not go past the first and the last commit", () => {
    expect(windowStart(40, 2, 100, 20)).toBe(0);
    expect(windowStart(0, 99, 100, 20)).toBe(80);
  });

  it("moves back when the history becomes shorter", () => {
    expect(windowStart(80, -1, 30, 20)).toBe(10);
  });

  it("starts at the first commit when all commits fit", () => {
    expect(windowStart(0, 5, 8, 20)).toBe(0);
  });
});
