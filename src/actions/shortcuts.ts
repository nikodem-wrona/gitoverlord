/** A key with its modifier keys. `mod` is Command on macOS and Control on other systems. */
export interface Shortcut {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  /** The `key` value of the keyboard event, in lower case. */
  key: string;
}

type KeyInput = Pick<
  KeyboardEvent,
  "key" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey"
>;

const MODIFIERS = new Set(["Mod", "Shift", "Alt"]);
const KEY_NAMES: Record<string, [mac: string, other: string]> = {
  enter: ["↩", "Enter"],
  escape: ["Esc", "Esc"],
};

/** Reads a shortcut such as `Mod+Shift+N`. A mistake in the text is a programming error. */
export function parseShortcut(text: string): Shortcut {
  const parts = text.split("+");
  const key = parts.pop();
  const unknown = parts.find((part) => !MODIFIERS.has(part));
  if (!key || unknown !== undefined) {
    throw new Error(`The shortcut "${text}" is not valid.`);
  }
  return {
    mod: parts.includes("Mod"),
    shift: parts.includes("Shift"),
    alt: parts.includes("Alt"),
    key: key.toLowerCase(),
  };
}

/** Tells if a keyboard event presses `shortcut`, with no other modifier key. */
export function matchesShortcut(
  shortcut: Shortcut,
  event: KeyInput,
  mac: boolean,
): boolean {
  const mod = mac ? event.metaKey : event.ctrlKey;
  const otherMod = mac ? event.ctrlKey : event.metaKey;
  return (
    mod === shortcut.mod &&
    !otherMod &&
    event.shiftKey === shortcut.shift &&
    event.altKey === shortcut.alt &&
    event.key.toLowerCase() === shortcut.key
  );
}

/** Writes a shortcut for the user: `⇧⌘N` on macOS, `Ctrl+Shift+N` on other systems. */
export function formatShortcut(shortcut: Shortcut, mac: boolean): string {
  const names = KEY_NAMES[shortcut.key];
  const key = names ? names[mac ? 0 : 1] : shortcut.key.toUpperCase();
  if (mac) {
    const symbols = [
      shortcut.alt && "⌥",
      shortcut.shift && "⇧",
      shortcut.mod && "⌘",
    ];
    return [...symbols.filter(Boolean), key].join("");
  }
  const words = [
    shortcut.mod && "Ctrl",
    shortcut.alt && "Alt",
    shortcut.shift && "Shift",
  ];
  return [...words.filter(Boolean), key].join("+");
}

/** Tells if the application runs on macOS, where `Mod` is the Command key. */
export function isMac(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.userAgent);
}
