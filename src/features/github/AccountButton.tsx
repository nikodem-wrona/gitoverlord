import { useQueryClient } from "@tanstack/react-query";

import { ActionButton } from "@/actions";
import { Button } from "@/hud";

import { signOutAction } from "./accountActions";
import { useGitHub } from "./githubContext";
import { useGitHubAccount } from "./queries";

/** The GitHub account in the top bar. A click signs in, or signs out after a question. */
export function AccountButton() {
  const account = useGitHubAccount();
  const client = useQueryClient();
  const { openSignIn } = useGitHub();

  if (account.isPending) return null;
  if (!account.data) {
    return (
      <Button onClick={openSignIn} aria-label="Sign in to GitHub">
        Sign in
      </Button>
    );
  }
  return (
    <ActionButton
      action={signOutAction(client, account.data)}
      text={`@${account.data.login}`}
    />
  );
}
