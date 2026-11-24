import type { QueryClient } from "@tanstack/react-query";

import { type Action, defineAction } from "@/actions";
import {
  type Branch,
  commands,
  type PullList,
  type PullRequest,
  unwrap,
} from "@/ipc";

import { fromGitHub, githubKeys } from "./queries";

/** Asks for a title, then opens a pull request from the current branch into the default branch. */
export function createPullAction(
  client: QueryClient,
  path: string,
  list: PullList | null | undefined,
  branch: Branch | undefined,
): Action {
  const base = list?.defaultBranch ?? "";
  return defineAction({
    id: "github.createPull",
    label: "Create a pull request…",
    group: "GitHub",
    blocked: createBlocked(list, branch),
    prompt: {
      title: `Pull request into ${base}`,
      label: "Title",
      placeholder: "Add the sync panel",
      submit: "Create",
    },
    run: async (title) => {
      const created = await fromGitHub(
        client,
        commands.githubCreatePullRequest(path, title, base),
      );
      void client.invalidateQueries({ queryKey: githubKeys.pulls(path) });
      return {
        title: `Pull request #${created.number} opened`,
        message: `${branch?.name} → ${base}`,
      };
    },
  });
}

function createBlocked(
  list: PullList | null | undefined,
  branch: Branch | undefined,
): string | undefined {
  if (list === undefined) return "Sign in to GitHub first.";
  if (list === null) return "The repository has no GitHub remote.";
  if (!branch) return "Switch to a branch that has a commit.";
  if (!branch.upstream) return "Publish the branch first.";
  if (branch.name === list.defaultBranch) {
    return `Switch from ${branch.name} to the branch with the changes.`;
  }
  return undefined;
}

/** Opens the page of a pull request in the browser. */
export function openPullAction(pull?: PullRequest): Action {
  return defineAction({
    id: `github.openPull:${pull?.number ?? ""}`,
    label: pull ? `Open #${pull.number} on GitHub` : "Open on GitHub",
    group: "GitHub",
    blocked: pull ? undefined : "Select a pull request.",
    run: async () => {
      if (pull) await unwrap(commands.openGithubPage(pull.url));
    },
  });
}
