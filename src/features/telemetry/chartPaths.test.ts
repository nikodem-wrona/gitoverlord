import { describe, expect, it } from "vitest";

import { barHeights, sparklinePath } from "./chartPaths";

describe("sparklinePath", () => {
  it("draws nothing for no values", () => {
    expect(sparklinePath([], 100, 10)).toBe("");
  });

  it("connects the values from left to right, with the largest at the top", () => {
    expect(sparklinePath([0, 5, 10], 100, 10)).toBe("M0 10 L50 5 L100 0");
  });

  it("puts a single value at the left edge", () => {
    expect(sparklinePath([4], 100, 10)).toBe("M0 0");
  });
});

describe("barHeights", () => {
  it("converts values to percent of the largest value", () => {
    expect(barHeights([0, 5, 10])).toEqual([0, 50, 100]);
  });

  it("gives zero heights when all values are zero", () => {
    expect(barHeights([0, 0])).toEqual([0, 0]);
  });
});
