import type { ConflictFile, MockCommandHandlers } from "@/ipc";

import { put } from "./demoChanges";
import { type DemoRepository, reject } from "./demoRepository";

type ConflictHandlers = Pick<
  MockCommandHandlers,
  "conflictFile" | "resolveConflict" | "restoreConflict"
>;

/** The handlers of the conflict resolver of the demo. Each conflict shows the sample file. */
export function conflictHandlers(repo: DemoRepository): ConflictHandlers {
  return {
    conflictFile: ({ file }) =>
      findConflict(repo, file) ? sampleConflict(file) : missing(file),
    resolveConflict: ({ file }) => resolve(repo, file),
    restoreConflict: ({ file }) => restore(repo, file),
  };
}

function findConflict(repo: DemoRepository, path: string) {
  return repo.tree.unstaged.find(
    (file) => file.path === path && file.kind === "conflicted",
  );
}

/** Stages the file as resolved. The conflict stays for the undo. */
function resolve(repo: DemoRepository, path: string): null | Promise<never> {
  const conflict = findConflict(repo, path);
  if (!conflict) return missing(path);
  repo.tree.unstaged = repo.tree.unstaged.filter((file) => file !== conflict);
  repo.resolved.push(conflict);
  put(repo, "staged", [{ ...conflict, kind: "modified" }]);
  return null;
}

function restore(repo: DemoRepository, path: string): null | Promise<never> {
  const conflict = repo.resolved.find((file) => file.path === path);
  if (!conflict) return reject(`The file ${path} has no resolved conflict.`);
  repo.resolved = repo.resolved.filter((file) => file !== conflict);
  repo.tree.staged = repo.tree.staged.filter((file) => file.path !== path);
  put(repo, "unstaged", [conflict]);
  return null;
}

function missing(path: string): Promise<never> {
  return reject(`The file ${path} has no conflict.`);
}

/** A file with two conflicts between `HEAD` and `spike/radar`. */
export function sampleConflict(path: string): ConflictFile {
  const conflict = (line: number, ours: string[], theirs: string[]) => ({
    kind: "conflict" as const,
    line,
    ours,
    theirs,
    oursLabel: "HEAD",
    theirsLabel: "spike/radar",
  });
  return {
    path,
    text: true,
    oursDeleted: false,
    theirsDeleted: false,
    blocks: [
      {
        kind: "clean",
        lines: [":root {", "  color-scheme: dark;", "", "  /* Surfaces */"],
      },
      conflict(
        5,
        ["  --color-panel: rgb(11 11 11 / 92%);", "  --color-line: #1e1e1e;"],
        ["  --color-panel: rgb(8 8 8 / 90%);", "  --color-line: #242424;"],
      ),
      {
        kind: "clean",
        lines: ["", "  /* Signals */", "  --color-fail: #ff4d5e;"],
      },
      conflict(
        15,
        ["  --color-active: #74f8b2;"],
        ["  --color-active: #9dffcf;", "  --color-active-strong: #d4ffe9;"],
      ),
      { kind: "clean", lines: ["}"] },
    ],
  };
}
