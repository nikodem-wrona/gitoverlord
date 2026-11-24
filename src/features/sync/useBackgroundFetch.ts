import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { RepoWriter } from "@/features/repository";
import { commands, errorMessage, type RepoSummary } from "@/ipc";

/** A background fetch starts when the last fetch is older than this time. */
export const FETCH_INTERVAL = 5 * 60 * 1000;
/** The time between two checks. */
const CHECK_INTERVAL = 30 * 1000;

/**
 * Fetches the remotes when the last fetch is old and the window is visible.
 *
 * It runs without an action, so it shows no notification. It returns the
 * error of the last background fetch, or `null`. A failed fetch waits for the
 * full interval before it tries again.
 */
export function useBackgroundFetch(
  repo: RepoWriter,
  summary?: RepoSummary,
): string | null {
  const [error, setError] = useState<string | null>(null);
  const tried = useRef(0);
  const fetched = summary?.fetched ?? null;
  const remotes = summary?.remotes.length ?? 0;

  const active = remotes > 0;

  const fetchIfDue = useEffectEvent(() => {
    const last = Math.max((fetched ?? 0) * 1000, tried.current);
    if (document.hidden || Date.now() - last < FETCH_INTERVAL) return;
    tried.current = Date.now();
    repo.write(commands.fetchRemotes(repo.path)).then(
      () => setError(null),
      (failure: unknown) => setError(errorMessage(failure)),
    );
  });

  // The checks start when the summary shows a remote.
  useEffect(() => {
    if (!active) return;
    fetchIfDue();
    const timer = setInterval(fetchIfDue, CHECK_INTERVAL);
    document.addEventListener("visibilitychange", fetchIfDue);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", fetchIfDue);
    };
  }, [active]);

  return error;
}
