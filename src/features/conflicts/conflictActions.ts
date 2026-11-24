import { type Action, defineAction, type Outcome } from "@/actions";
import { FILES_CHANGED, type RepoWriter } from "@/features/repository";
import {
  type ConflictChoice,
  type ConflictSide,
  commands,
  type Resolution,
} from "@/ipc";

/** Writes the chosen lines of each conflict to the file, and stages it. */
export function resolveAction(
  repo: RepoWriter,
  path: string,
  choices: readonly (ConflictChoice | undefined)[],
  onDone: () => void,
): Action {
  const chosen = choices.filter((choice) => choice !== undefined);
  const missing = choices.length - chosen.length;
  return defineAction({
    id: `conflicts.resolve:${path}`,
    label: `Resolve the conflicts of ${path}`,
    group: "Changes",
    blocked:
      missing > 0
        ? `Choose the lines of ${missing === 1 ? "1 more conflict" : `${missing} more conflicts`}.`
        : undefined,
    run: () => resolve(repo, path, { kind: "blocks", choices: chosen }, onDone),
  });
}

/** Keeps the full file of one side. The other side and the merged lines go. */
export function keepSideAction(
  repo: RepoWriter,
  path: string,
  side: ConflictSide,
  label: string,
  onDone: () => void,
): Action {
  const name = side === "ours" ? "current" : "incoming";
  return defineAction({
    id: `conflicts.keep-${side}:${path}`,
    label: `Keep the ${name} file (${label})…`,
    group: "Changes",
    confirm: {
      title: "Keep one side",
      message: `${path} gets the ${name} version of ${label}. The lines of the other side go. You can undo this.`,
      confirm: "Keep",
    },
    run: () => resolve(repo, path, { kind: "file", side }, onDone),
  });
}

/** Stages a file that has no conflict markers now, for example after an edit in an editor. */
export function markResolvedAction(
  repo: RepoWriter,
  path: string,
  onDone: () => void,
): Action {
  return defineAction({
    id: `conflicts.mark:${path}`,
    label: `Mark ${path} as resolved`,
    group: "Changes",
    run: async () => {
      await repo.write(commands.stageFiles(repo.path, [path]), FILES_CHANGED);
      onDone();
      return resolved(repo, path);
    },
  });
}

async function resolve(
  repo: RepoWriter,
  path: string,
  resolution: Resolution,
  onDone: () => void,
): Promise<Outcome> {
  const command = commands.resolveConflict(repo.path, path, resolution);
  await repo.write(command, FILES_CHANGED);
  onDone();
  return resolved(repo, path);
}

/** The undo puts the conflict markers back in the file. */
function resolved(repo: RepoWriter, path: string): Outcome {
  const undo = () =>
    repo.write(commands.restoreConflict(repo.path, path), FILES_CHANGED);
  return { title: "Conflict resolved", message: `${path} is staged.`, undo };
}
