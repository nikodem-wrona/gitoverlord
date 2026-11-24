import type { Outcome } from "@/actions";
import type { RepoWriter } from "@/features/repository";
import { commands, type OperationResult } from "@/ipc";

/**
 * The notification for the result of a merge, rebase, cherry-pick, or revert.
 *
 * A complete operation gets an undo that moves the branch back. A stop at
 * conflicts tells the user what to do next.
 */
export function operationOutcome(
  repo: RepoWriter,
  title: string,
  result: OperationResult,
  message: string,
): Outcome {
  if (result.kind === "stopped") {
    return {
      title: `${title} stopped`,
      tone: "warn",
      message: `${conflictCount(result.conflicts.length)}. Resolve them on the Changes tab, then continue.`,
    };
  }
  if (result.previous === result.head) {
    return { title: `${title} complete`, message: "Nothing changed." };
  }
  const undo = () =>
    repo.write(commands.restoreHead(repo.path, result.previous));
  return { title: `${title} complete`, message, undo };
}

function conflictCount(count: number): string {
  return count === 1 ? "1 file has conflicts" : `${count} files have conflicts`;
}
