import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { useToast } from "@/hud";
import { commands, errorMessage, unwrap } from "@/ipc";

import { repoKeys } from "./keys";
import { useRecentRepositories } from "./queries";

export interface RepoSession {
  /** The path of the open repository. `null` when no repository is open. */
  path: string | null;
  /** `true` while the backend opens a repository. */
  opening: boolean;
  /** Opens the repository that contains `path`. */
  open(path: string): void;
  /** Asks the user for a folder, then opens it. */
  pick(): void;
  /** Goes back to the list of repositories. */
  close(): void;
}

/** Holds the open repository. At the start it opens the last repository again. */
export function useRepoSession(): RepoSession {
  const [path, setPath] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const fail = (error: Error) =>
    toast.fail("Repository link failed", errorMessage(error));

  const opener = useMutation({
    mutationFn: (target: string) => unwrap(commands.openRepository(target)),
    onSuccess: (summary) => {
      queryClient.setQueryData(repoKeys.summary(summary.path), summary);
      void queryClient.invalidateQueries({ queryKey: repoKeys.recent });
      setPath(summary.path);
    },
    onError: fail,
  });
  const picker = useMutation({
    mutationFn: () => unwrap(commands.pickFolder("Open a repository")),
    onSuccess: (folder) => {
      if (folder !== null) opener.mutate(folder);
    },
    onError: fail,
  });
  useLastRepository(opener.mutate);

  return {
    path,
    opening: opener.isPending,
    open: opener.mutate,
    pick: picker.mutate,
    close: () => setPath(null),
  };
}

/** Opens the newest of the recent repositories, one time. */
function useLastRepository(open: (path: string) => void): void {
  const { data } = useRecentRepositories();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !data) return;
    done.current = true;
    const last = data[0];
    if (last) open(last.path);
  }, [data, open]);
}
