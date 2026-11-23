import { describe, expect, it } from "vitest";

import { formatShortcut, matchesShortcut, parseShortcut } from "./shortcuts";

function press(key: string, modifiers: Partial<KeyboardEvent> = {}) {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...modifiers,
  };
}

describe("parseShortcut", () => {
  it("reads the modifier keys and the key", () => {
    expect(parseShortcut("Mod+Shift+N")).toEqual({
      mod: true,
      shift: true,
      alt: false,
      key: "n",
    });
  });

  it("rejects an unknown modifier and a missing key", () => {
    expect(() => parseShortcut("Hyper+N")).toThrow(/not valid/);
    expect(() => parseShortcut("Mod+")).toThrow(/not valid/);
  });
});

describe("matchesShortcut", () => {
  const shortcut = parseShortcut("Mod+Shift+N");

  it("uses the Command key on macOS and the Control key on other systems", () => {
    const command = press("N", { metaKey: true, shiftKey: true });
    const control = press("N", { ctrlKey: true, shiftKey: true });

    expect(matchesShortcut(shortcut, command, true)).toBe(true);
    expect(matchesShortcut(shortcut, control, true)).toBe(false);
    expect(matchesShortcut(shortcut, control, false)).toBe(true);
  });

  it("needs each modifier key, and no other", () => {
    const noShift = press("n", { ctrlKey: true });
    const extraAlt = press("N", {
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
    });

    expect(matchesShortcut(shortcut, noShift, false)).toBe(false);
    expect(matchesShortcut(shortcut, extraAlt, false)).toBe(false);
  });
});

describe("formatShortcut", () => {
  it("writes symbols on macOS and words on other systems", () => {
    expect(formatShortcut(parseShortcut("Mod+Shift+N"), true)).toBe("⇧⌘N");
    expect(formatShortcut(parseShortcut("Mod+Shift+N"), false)).toBe(
      "Ctrl+Shift+N",
    );
    expect(formatShortcut(parseShortcut("Mod+Enter"), true)).toBe("⌘↩");
    expect(formatShortcut(parseShortcut("Mod+Enter"), false)).toBe(
      "Ctrl+Enter",
    );
  });
});
