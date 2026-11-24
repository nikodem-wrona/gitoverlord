import { parseShortcut } from "./shortcuts";
import type { Action, ActionSpec } from "./types";

/**
 * Makes an action from its fields.
 *
 * Give the action to `ActionButton`, or register it with `useRegisterActions` for
 * the command palette and the shortcuts. Each of them runs it in the same way:
 * the question, the progress, the result notification, and the refresh.
 */
export function defineAction(spec: ActionSpec): Action {
  const { shortcut, ...rest } = spec;
  return shortcut ? { ...rest, shortcut: parseShortcut(shortcut) } : rest;
}
