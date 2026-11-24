import { type Action, defineAction } from "@/actions";
import { type RepoWriter, shortHash } from "@/features/repository";
import { commands, type Operation } from "@/ipc";

import {
  type HistoryState,
  OPERATION_NAMES,
  OPERATION_TITLES,
} from "./historyState";
import { operationOutcome } from "./operationOutcome";

const NOTHING = "No merge, rebase, cherry-pick, or revert has stopped.";

/** Commits the resolved changes of the operation that stopped, and goes on. */
export function continueAction(repo: RepoWriter, state: HistoryState): Action {
  const { operation } = state;
  const name = operation ? OPERATION_NAMES[operation.kind] : "operation";
  return defineAction({
    id: "history.continue",
    label: `Continue the ${name}`,
    group: "History",
    blocked: !operation
      ? NOTHING
      : state.conflicts > 0
        ? "Resolve each conflict first. The Changes tab shows them."
        : undefined,
    run: async () => {
      const result = await repo.write(commands.continueOperation(repo.path));
      return operationOutcome(
        repo,
        titleOf(operation),
        result,
        `The ${name} is complete.`,
      );
    },
  });
}

/** Drops the commit that the stopped rebase, cherry-pick, or revert applies. */
export function skipAction(repo: RepoWriter, state: HistoryState): Action {
  const { operation } = state;
  const commit = operation?.commit
    ? shortHash(operation.commit)
    : "this commit";
  return defineAction({
    id: "history.skip",
    label: `Skip ${commit}…`,
    group: "History",
    blocked: !operation
      ? NOTHING
      : operation.kind === "merge"
        ? "A merge has no commit to skip."
        : undefined,
    confirm: {
      title: "Skip commit",
      message: `The changes of ${commit} are not applied. Your resolutions of its conflicts go.`,
      confirm: "Skip",
    },
    run: async () => {
      const result = await repo.write(commands.skipOperation(repo.path));
      return operationOutcome(
        repo,
        titleOf(operation),
        result,
        `${commit} was skipped.`,
      );
    },
  });
}

/** Stops the operation and puts back the state from before it. */
export function abortAction(repo: RepoWriter, state: HistoryState): Action {
  const { operation } = state;
  const name = operation ? OPERATION_NAMES[operation.kind] : "operation";
  return defineAction({
    id: "history.abort",
    label: `Abort the ${name}…`,
    group: "History",
    blocked: operation ? undefined : NOTHING,
    confirm: {
      title: `Abort the ${name}`,
      message: `The repository goes back to its state from before the ${name}. Your resolutions of the conflicts go.`,
      confirm: "Abort",
    },
    run: async () => {
      await repo.write(commands.abortOperation(repo.path));
      return {
        title: `${titleOf(operation)} aborted`,
        message: "The repository is as it was before.",
      };
    },
  });
}

/** The actions for the operation that stopped: continue, skip, and abort. */
export function stepActions(repo: RepoWriter, state: HistoryState): Action[] {
  if (!state.operation) return [];
  const actions = [continueAction(repo, state), abortAction(repo, state)];
  if (state.operation.kind !== "merge") actions.push(skipAction(repo, state));
  return actions;
}

function titleOf(operation: Operation | null): string {
  return operation ? OPERATION_TITLES[operation.kind] : "Operation";
}
