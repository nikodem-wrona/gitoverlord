import { type Action, defineAction } from "@/actions";
import type { RepoWriter } from "@/features/repository";
import { commands, type StashEntry } from "@/ipc";

const NO_ENTRY = "Select a stash entry.";

/** The name that `git` gives an entry, for example `stash@{0}`. */
export function entryName(entry: StashEntry): string {
  return `stash@{${entry.index}}`;
}

/** Asks for an optional message, then moves each change to a new entry. */
export function saveStashAction(repo: RepoWriter, changes: number): Action {
  return defineAction({
    id: "stash.save",
    label: "Stash all changes…",
    group: "Stash",
    shortcut: "Mod+Shift+S",
    blocked: changes === 0 ? "There are no changes to stash." : undefined,
    prompt: {
      title: "Stash changes",
      label: "Message",
      placeholder: "This is optional",
      submit: "Stash",
      optional: true,
    },
    run: async (message) => {
      await repo.write(commands.stashChanges(repo.path, message));
      return {
        title: "Changes stashed",
        message: "The working tree is clean.",
      };
    },
  });
}

/** Applies an entry. `pop` also removes it from the list. */
export function applyStashAction(
  repo: RepoWriter,
  entry: StashEntry | undefined,
  pop: boolean,
): Action {
  const verb = pop ? "Pop" : "Apply";
  const name = entry ? entryName(entry) : "";
  return defineAction({
    id: `stash.${verb.toLowerCase()}:${entry?.hash ?? ""}`,
    label: `${verb} ${name || "a stash entry"}`,
    group: "Stash",
    blocked: entry ? undefined : NO_ENTRY,
    run: async () => {
      const hash = entry?.hash ?? "";
      const command = pop
        ? commands.popStash(repo.path, hash)
        : commands.applyStash(repo.path, hash);
      await repo.write(command);
      return { title: pop ? "Stash popped" : "Stash applied", message: name };
    },
  });
}

/** Removes an entry from the list. The undo puts it back. */
export function dropStashAction(repo: RepoWriter, entry?: StashEntry): Action {
  const name = entry ? entryName(entry) : "";
  return defineAction({
    id: `stash.drop:${entry?.hash ?? ""}`,
    label: `Drop ${name || "a stash entry"}…`,
    group: "Stash",
    blocked: entry ? undefined : NO_ENTRY,
    confirm: {
      title: "Drop stash entry",
      message: `${name} "${entry?.message ?? ""}" leaves the stash. You can undo this.`,
      confirm: "Drop",
    },
    run: async () => {
      const { hash = "", message = "" } = entry ?? {};
      await repo.write(commands.dropStash(repo.path, hash));
      const undo = () =>
        repo.write(commands.restoreStash(repo.path, hash, message));
      return { title: "Stash entry dropped", message: name, undo };
    },
  });
}

/** The stash actions for the command palette. */
export function stashActions(
  repo: RepoWriter,
  changes: number,
  entries: readonly StashEntry[] = [],
): Action[] {
  const newest = entries[0];
  return [
    saveStashAction(repo, changes),
    ...(newest ? [applyStashAction(repo, newest, true)] : []),
  ];
}
