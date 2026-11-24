import { useEffect, useState } from "react";

import { events, type SyncOperation, type SyncProgress } from "@/ipc";

/**
 * The current step of a network operation, or `null` when none runs.
 *
 * `path` selects the operations of one repository. `null` selects the clones.
 */
export function useSyncProgress(path: string | null): SyncProgress | null {
  return useSyncState(path, currentStep);
}

/**
 * The network operation that runs now, or `null`. A new step of the same
 * operation does not render the component again.
 */
export function useSyncOperation(path: string | null): SyncOperation | null {
  return useSyncState(path, runningOperation);
}

function currentStep(payload: SyncProgress): SyncProgress | null {
  return payload.step ? payload : null;
}

function runningOperation(payload: SyncProgress): SyncOperation | null {
  return payload.step ? payload.operation : null;
}

/** Keeps the value that `select` reads from each `SyncProgress` event of `path`. */
function useSyncState<T>(
  path: string | null,
  select: (payload: SyncProgress) => T | null,
): T | null {
  const [current, setCurrent] = useState<T | null>(null);

  useEffect(() => {
    const listener = events.syncProgress.listen(({ payload }) => {
      const clone = payload.operation === "clone";
      if (path === null ? clone : !clone && payload.path === path) {
        setCurrent(select(payload));
      }
    });
    // Without a backend there is nothing to stop.
    const stop = () => listener.then((unlisten) => unlisten()).catch(() => {});
    return () => void stop();
  }, [path, select]);

  return current;
}
