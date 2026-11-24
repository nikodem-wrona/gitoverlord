import type {
  MockCommandHandlers,
  OperationResult,
  ResetMode,
  ResetReceipt,
} from "@/ipc";

import { moveHead } from "./demoBranches";
import {
  currentBranch,
  type DemoRepository,
  newHash,
  now,
  reject,
} from "./demoRepository";
import {
  addCommit,
  busy,
  CONFLICT_FILE,
  cherryPick,
  mergeBranch,
  rebaseBranch,
  revertCommit,
} from "./demoSurgery";

const NOTHING = "No merge, rebase, cherry-pick, or revert has stopped.";

type Result = OperationResult | Promise<never>;

type SurgeryHandlers = Pick<
  MockCommandHandlers,
  | "mergeBranch"
  | "rebaseBranch"
  | "cherryPick"
  | "revertCommit"
  | "continueOperation"
  | "skipOperation"
  | "abortOperation"
  | "resetBranch"
  | "undoReset"
  | "restoreHead"
>;

/** The handlers of the history operations of the demo. */
export function surgeryHandlers(repo: DemoRepository): SurgeryHandlers {
  return {
    mergeBranch: ({ target }) => mergeBranch(repo, target),
    rebaseBranch: ({ onto }) => rebaseBranch(repo, onto),
    cherryPick: ({ hash }) => cherryPick(repo, hash),
    revertCommit: ({ hash }) => revertCommit(repo, hash),
    continueOperation: () => continueOperation(repo),
    skipOperation: () => skipOperation(repo),
    abortOperation: () => abortOperation(repo),
    resetBranch: ({ hash, mode }) => resetBranch(repo, hash, mode),
    undoReset: ({ receipt }) => undoReset(repo, receipt),
    restoreHead: ({ hash }) => restoreHead(repo, hash),
  };
}

function continueOperation(repo: DemoRepository): Result {
  const { stopped } = repo;
  if (!stopped) return reject(NOTHING);
  if (repo.tree.unstaged.some(({ kind }) => kind === "conflicted")) {
    return reject(
      "Committing is not possible because you have unmerged files.",
    );
  }
  const previous = repo.summary.head.hash ?? "";
  end(repo);
  repo.tree.staged = repo.tree.staged.filter(
    ({ path }) => path !== CONFLICT_FILE.path,
  );
  const head = addCommit(repo, stopped.subject, stopped.parents);
  return { kind: "done", previous, head };
}

function skipOperation(repo: DemoRepository): Result {
  const { stopped } = repo;
  if (!stopped) return reject(NOTHING);
  if (stopped.kind === "merge") return reject("A merge has no commit to skip.");
  repo.tree = stopped.tree;
  end(repo);
  const head = repo.summary.head.hash ?? "";
  return { kind: "done", previous: head, head };
}

function abortOperation(repo: DemoRepository): null | Promise<never> {
  const { stopped } = repo;
  if (!stopped) return reject(NOTHING);
  repo.tree = stopped.tree;
  end(repo);
  return null;
}

/** Moves the branch. A hard reset keeps the uncommitted changes in a stash entry. */
function resetBranch(
  repo: DemoRepository,
  hash: string,
  mode: ResetMode,
): ResetReceipt | Promise<never> {
  const blocked = busy(repo);
  if (blocked) return blocked;
  const previous = repo.summary.head.hash ?? "";
  const { staged, unstaged } = repo.tree;
  let backup: string | null = null;
  if (mode === "hard" && staged.length + unstaged.length > 0) {
    backup = newHash(repo);
    const message = "Reset by gitoverlord: the uncommitted changes";
    repo.stashes.unshift({
      hash: backup,
      message,
      time: now(),
      tree: repo.tree,
    });
    repo.tree = { staged: [], unstaged: [] };
  }
  moveHead(repo, hash, 0);
  return { mode, previous, backup };
}

function undoReset(
  repo: DemoRepository,
  receipt: ResetReceipt,
): null | Promise<never> {
  moveHead(repo, receipt.previous, 0);
  const backup = repo.stashes.find(({ hash }) => hash === receipt.backup);
  if (backup) {
    repo.stashes = repo.stashes.filter((entry) => entry !== backup);
    repo.tree = backup.tree;
  }
  return null;
}

/** Moves the branch back. A commit of the demo at `HEAD` leaves the history. */
function restoreHead(repo: DemoRepository, hash: string): null {
  const head = repo.summary.head.hash;
  const made = repo.history[0];
  if (made?.commit.hash === head && made.commit.author === "you") {
    repo.history.shift();
  }
  moveHead(repo, hash, -1);
  return null;
}

/** Ends the operation that stopped. A rebase puts its branch back. */
function end(repo: DemoRepository): void {
  const branch = repo.stopped?.branch ?? currentBranch(repo)?.name ?? null;
  repo.summary.operation = null;
  repo.summary.head.branch = branch;
  repo.stopped = null;
}
