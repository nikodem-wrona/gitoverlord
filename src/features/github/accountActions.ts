import type { QueryClient } from "@tanstack/react-query";

import { type Action, defineAction } from "@/actions";
import { type Account, commands, unwrap } from "@/ipc";

import type { GitHubApi } from "./githubContext";
import { githubKeys } from "./queries";

/** The GitHub actions of the command palette. */
export function accountActions(
  api: GitHubApi,
  client: QueryClient,
  account: Account | null | undefined,
): Action[] {
  const signIn = defineAction({
    id: "github.signIn",
    label: "Sign in to GitHub…",
    group: "GitHub",
    blocked: account ? `You are signed in as @${account.login}.` : undefined,
    run: () => api.openSignIn(),
  });
  const clone = defineAction({
    id: "github.clone",
    label: "Clone from GitHub…",
    group: "GitHub",
    run: () => api.openClone(),
  });
  return account ? [clone, signOutAction(client, account)] : [signIn, clone];
}

/** Removes the token from the keychain. */
export function signOutAction(client: QueryClient, account: Account): Action {
  return defineAction({
    id: "github.signOut",
    label: "Sign out of GitHub…",
    group: "GitHub",
    confirm: {
      title: "Sign out of GitHub",
      message: `The token of @${account.login} goes from the keychain. To use GitHub again, sign in again.`,
      confirm: "Sign out",
    },
    run: async () => {
      await unwrap(commands.githubSignOut());
      client.removeQueries({ queryKey: githubKeys.repositories });
      client.removeQueries({ queryKey: githubKeys.allPulls });
      client.setQueryData(githubKeys.account, null);
      return { title: "Signed out of GitHub", message: `@${account.login}` };
    },
  });
}
