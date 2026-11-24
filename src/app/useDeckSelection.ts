import { useCallback, useState } from "react";

import { useHistory } from "@/features/history";
import { useRepoSummary } from "@/features/repository";
import type { DiffTarget } from "@/ipc";

import type { ModuleId } from "./modules";

/** The file in the diff viewer, and the module tab that opened it. */
interface Inspection {
  moduleId: ModuleId;
  target: DiffTarget;
}

/**
 * Holds what the user looks at: the selected commit, and the file in the diff viewer.
 *
 * Without a selection, `HEAD` is the selected commit. A different module tab closes
 * the diff viewer.
 */
export function useDeckSelection(repoPath: string, moduleId: ModuleId) {
  const summary = useRepoSummary(repoPath).data;
  const headHash = summary?.head.hash ?? undefined;
  const history = useHistory(repoPath);
  const [pickedHash, setPickedHash] = useState<string>();
  const [inspection, setInspection] = useState<Inspection>();
  const selectedHash = pickedHash ?? headHash;
  const target =
    inspection?.moduleId === moduleId ? inspection.target : undefined;
  const closeDiff = useCallback(() => setInspection(undefined), []);

  return {
    operation: Boolean(summary?.operation),
    headHash,
    history,
    selectedHash,
    /** The selected commit, when it is in the loaded history. A stash entry is not. */
    selected: history.commits.find(({ hash }) => hash === selectedHash),
    target,
    inspect: (next: DiffTarget) => setInspection({ moduleId, target: next }),
    closeDiff,
    selectCommit: (hash: string) => {
      setPickedHash(hash);
      closeDiff();
    },
  };
}
