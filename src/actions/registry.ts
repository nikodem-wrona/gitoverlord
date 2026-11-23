import type { Action } from "./types";

/** Holds the actions of the components on the screen, for the palette and the shortcuts. */
export interface ActionRegistry {
  /** Replaces the actions of `owner`. */
  set(owner: string, actions: readonly Action[]): void;
  remove(owner: string): void;
  list(): Action[];
}

/**
 * Makes an empty registry.
 *
 * A change does not render the screen again. The palette and the shortcuts
 * read the list when they need it.
 */
export function createActionRegistry(): ActionRegistry {
  const owners = new Map<string, readonly Action[]>();
  return {
    set: (owner, actions) => void owners.set(owner, actions),
    remove: (owner) => void owners.delete(owner),
    list: () => [...owners.values()].flat(),
  };
}
