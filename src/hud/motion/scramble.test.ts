import { describe, expect, it } from "vitest";

import { scramble } from "./scramble";

// This generator always gives the first glyph, "A".
const firstGlyph = () => 0;

describe("scramble", () => {
  it("replaces each character at progress 0, but keeps the spaces", () => {
    expect(scramble("git log", 0, firstGlyph)).toBe("AAA AAA");
  });

  it("shows the start of the text at partial progress", () => {
    expect(scramble("abcd", 0.5, firstGlyph)).toBe("abAA");
  });

  it("shows all the text at progress 1", () => {
    expect(scramble("git log", 1)).toBe("git log");
  });

  it("limits the progress to the range from 0 to 1", () => {
    expect(scramble("ab", 2)).toBe("ab");
    expect(scramble("ab", -1, firstGlyph)).toBe("AA");
  });
});
