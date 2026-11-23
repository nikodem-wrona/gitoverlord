import { describe, expect, it } from "vitest";

import { createRandom } from "./random";

describe("createRandom", () => {
  it("gives the same numbers for the same seed", () => {
    const first = createRandom(42);
    const second = createRandom(42);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("gives different numbers for different seeds", () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it("gives numbers from 0 up to but not including 1", () => {
    const random = createRandom(7);
    const values = Array.from({ length: 1000 }, random);

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});
