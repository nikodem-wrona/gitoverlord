import { useQuery } from "@tanstack/react-query";

import { commands, unwrap } from "@/ipc";

import { describeGit, type GitStatus } from "./describeGit";

/** Asks the backend for the system `git`, and describes the result. */
export function useGitStatus(): GitStatus {
  const query = useQuery({
    queryKey: ["system", "gitVersion"],
    queryFn: () => unwrap(commands.detectGit()),
  });
  return describeGit(query);
}
