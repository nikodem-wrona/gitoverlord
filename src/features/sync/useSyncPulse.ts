import { useEffect, useState } from "react";

import type { SyncOperation } from "@/ipc";

import { useSyncOperation } from "./useSyncProgress";

/** A short operation stays this long on the timeline, so the user sees it. */
const LINGER = 1200;

/**
 * The network operation of the repository for the sync pulse of the timeline,
 * or `null` when none runs. An operation stays for a short time after its end.
 */
export function useSyncPulse(repoPath: string): SyncOperation | null {
  // Only a new operation renders the timeline again, not each step.
  const running = useSyncOperation(repoPath);
  const [lingering, setLingering] = useState<SyncOperation | null>(null);
  // The last operation stays in the state while it runs, and for a short time after it.
  if (running && running !== lingering) setLingering(running);

  useEffect(() => {
    if (running) return undefined;
    const timer = setTimeout(() => setLingering(null), LINGER);
    return () => clearTimeout(timer);
  }, [running]);

  return running ?? lingering;
}
