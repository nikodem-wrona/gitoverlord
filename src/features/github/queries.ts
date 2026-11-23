import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { CommandError, type CommandResult, commands, unwrap } from "@/ipc";

/** The pull requests change on GitHub, not on the disk. One minute is current enough. */
const PULLS_STALE_TIME = 60_000;

/** The cache keys of the GitHub data. They do not start with the repository key, so a change on the disk does not ask GitHub again. */
export const githubKeys = {
  all: ["github"],
  account: ["github", "account"],
  repositories: ["github", "repositories"],
  allPulls: ["github", "pulls"],
  pulls: (path: string) => ["github", "pulls", path],
} as const;

/** The signed-in account. `null` when the user is not signed in. */
export function useGitHubAccount() {
  return useQuery({
    queryKey: githubKeys.account,
    queryFn: () => unwrap(commands.githubAccount()),
  });
}

export function useHubRepositories(enabled: boolean) {
  const client = useQueryClient();
  return useQuery({
    queryKey: githubKeys.repositories,
    queryFn: () => fromGitHub(client, commands.githubRepositories()),
    enabled,
  });
}

/** The open pull requests. `null` when the repository has no GitHub remote. */
export function usePullRequests(path: string, enabled: boolean) {
  const client = useQueryClient();
  return useQuery({
    queryKey: githubKeys.pulls(path),
    queryFn: () => fromGitHub(client, commands.githubPullRequests(path)),
    enabled,
    staleTime: PULLS_STALE_TIME,
  });
}

/**
 * Returns the data of a GitHub command. When GitHub refused the token, the
 * backend removed it, so the account reads again and shows the sign-in.
 */
export async function fromGitHub<T>(
  client: QueryClient,
  command: Promise<CommandResult<T>>,
): Promise<T> {
  try {
    return await unwrap(command);
  } catch (error) {
    if (
      error instanceof CommandError &&
      error.detail.kind === "signInExpired"
    ) {
      client.setQueryData(githubKeys.account, null);
    }
    throw error;
  }
}
