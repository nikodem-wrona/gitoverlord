import { createContext, useContext } from "react";

/** Opens the GitHub dialogs. */
export interface GitHubApi {
  openSignIn(): void;
  openClone(): void;
}

export const GitHubContext = createContext<GitHubApi | null>(null);

export function useGitHub(): GitHubApi {
  const api = useContext(GitHubContext);
  if (!api) throw new Error("useGitHub must be inside GitHubProvider.");
  return api;
}
