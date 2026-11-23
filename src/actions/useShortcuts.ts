import { useEffect } from "react";

import type { ActionRegistry } from "./registry";
import { matchesShortcut, parseShortcut, isMac } from "./shortcuts";
import type { Action } from "./types";

/** Opens the command palette. */
export const PALETTE_SHORTCUT = parseShortcut("Mod+K");

interface ShortcutOptions {
  /** `true` while a dialog is open. Only the palette shortcut works then. */
  paused: boolean;
  openPalette(): void;
}

/** Runs the registered action whose shortcut the user presses. */
export function useShortcuts(
  registry: ActionRegistry,
  run: (action: Action) => void,
  { paused, openPalette }: ShortcutOptions,
): void {
  useEffect(() => {
    const mac = isMac();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (matchesShortcut(PALETTE_SHORTCUT, event, mac)) {
        event.preventDefault();
        if (!paused) openPalette();
        return;
      }
      if (paused) return;
      const action = registry
        .list()
        .find(
          ({ shortcut }) => shortcut && matchesShortcut(shortcut, event, mac),
        );
      if (!action) return;
      event.preventDefault();
      run(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [registry, run, paused, openPalette]);
}
