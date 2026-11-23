import { describe, expect, it } from "vitest";

import { nextKey } from "./keys";

const KEYS = ["a", "b", "c"];

describe("nextKey", () => {
  it("moves down and up in a vertical list", () => {
    expect(nextKey(KEYS, "a", "ArrowDown", "vertical")).toBe("b");
    expect(nextKey(KEYS, "b", "ArrowUp", "vertical")).toBe("a");
  });

  it("moves right and left in a horizontal list", () => {
    expect(nextKey(KEYS, "a", "ArrowRight", "horizontal")).toBe("b");
    expect(nextKey(KEYS, "b", "ArrowLeft", "horizontal")).toBe("a");
  });

  it("stops at the ends of the list", () => {
    expect(nextKey(KEYS, "c", "ArrowDown", "vertical")).toBe("c");
    expect(nextKey(KEYS, "a", "ArrowUp", "vertical")).toBe("a");
  });

  it("jumps to the first and the last item", () => {
    expect(nextKey(KEYS, "b", "Home", "vertical")).toBe("a");
    expect(nextKey(KEYS, "b", "End", "vertical")).toBe("c");
  });

  it("starts at the first item when nothing is selected", () => {
    expect(nextKey(KEYS, undefined, "ArrowDown", "vertical")).toBe("a");
  });

  it("ignores other keys and the keys of the other axis", () => {
    expect(nextKey(KEYS, "a", "Enter", "vertical")).toBeUndefined();
    expect(nextKey(KEYS, "a", "ArrowRight", "vertical")).toBeUndefined();
  });

  it("returns nothing for an empty list", () => {
    expect(nextKey([], undefined, "ArrowDown", "vertical")).toBeUndefined();
  });
});
