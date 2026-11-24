import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { events } from "@/ipc";

import { refreshRepository } from "./refreshRepository";

/** Reads the repository again when the backend reports a change on the disk. */
export function useRepoWatcher(path: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const listener = events.repoChanged.listen(({ payload }) => {
      if (payload.path === path) {
        refreshRepository(queryClient, path, payload.change);
      }
    });
    // Without a backend there is nothing to stop.
    const stop = () => listener.then((unlisten) => unlisten()).catch(() => {});
    return () => void stop();
  }, [path, queryClient]);
}
