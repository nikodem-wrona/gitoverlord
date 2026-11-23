import { useEffect, useState } from "react";

import { events, type SyncProgress } from "@/ipc";

/**
 * The current step of a network operation, or `null` when none runs.
 *
 * `path` selects the operations of one repository. `null` selects the clones.
 */
export function useSyncProgress(path: string | null): SyncProgress | null {
  const [current, setCurrent] = useState<SyncProgress | null>(null);

  useEffect(() => {
    const listener = events.syncProgress.listen(({ payload }) => {
      const clone = payload.operation === "clone";
      if (path === null ? clone : !clone && payload.path === path) {
        setCurrent(payload.step ? payload : null);
      }
    });
    // Without a backend there is nothing to stop.
    const stop = () => listener.then((unlisten) => unlisten()).catch(() => {});
    return () => void stop();
  }, [path]);

  return current;
}
