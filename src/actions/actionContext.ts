import { createContext, useContext, useEffect, useId } from "react";

import type { ActionRegistry } from "./registry";
import type { Action } from "./types";

/** The result of the last action, for the status bar. */
export interface LastOutcome {
  /** A new id for each result, so the status bar can animate each one. */
  id: number;
  title: string;
  tone: "ok" | "warn" | "fail";
}

export interface ActionsApi {
  /** Asks the question of the action, if it has one, then runs it. */
  run(action: Action): void;
  openPalette(): void;
  /** The action that runs now. Other actions wait until it is done. */
  busy: Action | null;
  last: LastOutcome | null;
  registry: ActionRegistry;
}

export const ActionContext = createContext<ActionsApi | null>(null);

export function useActions(): ActionsApi {
  const api = useContext(ActionContext);
  if (!api) throw new Error("useActions needs an ActionProvider above it.");
  return api;
}

/**
 * Puts `actions` in the command palette and turns on their shortcuts while the
 * component is on the screen.
 */
export function useRegisterActions(actions: readonly Action[]): void {
  const { registry } = useActions();
  const owner = useId();

  // Each render can give actions with new data. The registry does not render.
  useEffect(() => {
    registry.set(owner, actions);
  });
  useEffect(() => () => registry.remove(owner), [registry, owner]);
}
