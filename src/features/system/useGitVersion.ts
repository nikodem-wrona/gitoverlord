import { useQuery } from "@tanstack/react-query";

import { commands, unwrap } from "@/ipc";

/** Asks the backend for the version of the system `git`. */
export function useGitVersion() {
  return useQuery({
    queryKey: ["system", "gitVersion"],
    queryFn: () => unwrap(commands.detectGit()),
  });
}
