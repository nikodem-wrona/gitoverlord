import type { Shortcut } from "./shortcuts";

/** The sections of the command palette, in their order. */
export const ACTION_GROUPS = [
  "Changes",
  "Commit",
  "Branches",
  "History",
  "Stash",
  "Sync",
  "GitHub",
  "Repository",
  "View",
  "Application",
] as const;

export type ActionGroup = (typeof ACTION_GROUPS)[number];

/** The question before a destructive action. */
export interface Confirmation {
  title: string;
  message: string;
  /** The text of the button that runs the action. */
  confirm: string;
}

/** A text that the user types before the action runs, for example a branch name. */
export interface Prompt {
  title: string;
  label: string;
  /** The text of the button that runs the action. */
  submit: string;
  placeholder?: string;
  /** The text in the field when the dialog opens. */
  initial?: string;
  /** `true` permits an empty text. */
  optional?: boolean;
}

/** A list that the user searches, then picks one item from, for example a branch. */
export interface Choice {
  title: string;
  /** The name of the search field for a screen reader. */
  label: string;
  placeholder?: string;
  options: readonly string[];
  /** The text when no option agrees with the search. */
  empty: string;
}

/** The result that the notification shows. `undo` adds an Undo button. */
export interface Outcome {
  title: string;
  message?: string;
  /** `warn` shows a result that needs the user, for example a merge that stopped. */
  tone?: "ok" | "warn";
  undo?(): Promise<unknown>;
  /** The action that the runner starts after this result. Its question shows at once. */
  next?: Action;
}

/** The fields that `defineAction` takes. */
export interface ActionSpec {
  /** A unique name, for example `branches.create`. */
  id: string;
  label: string;
  group: ActionGroup;
  /** For example `Mod+Shift+N`. `Mod` is Command on macOS and Control on other systems. */
  shortcut?: string;
  /** The reason why the action cannot run now. The button is then disabled. */
  blocked?: string;
  /** Asks before the action runs. Use it for each destructive action. */
  confirm?: Confirmation;
  /** Asks for a text before the action runs. */
  prompt?: Prompt;
  /** Asks the user to pick one option before the action runs. */
  choose?: Choice;
  /**
   * Does the work. `text` is the answer to the prompt, the picked option, or an empty string.
   *
   * Return an `Outcome` to show a notification. A thrown error shows a failure.
   */
  run(text: string): Promise<Outcome | void> | void;
}

/** A command of the application. One action gives a button, a palette entry, and a shortcut. */
export interface Action extends Omit<ActionSpec, "shortcut"> {
  shortcut?: Shortcut;
}
