import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useMemo, useState } from "react";

import { useRegisterActions } from "@/actions";

import { accountActions } from "./accountActions";
import { CloneDialog } from "./CloneDialog";
import { type GitHubApi, GitHubContext } from "./githubContext";
import { useGitHubAccount } from "./queries";
import { SignInDialog } from "./SignInDialog";

interface GitHubProviderProps {
  /** Opens a repository after a clone. */
  onCloned(path: string): void;
  children: ReactNode;
}

/** Holds the GitHub dialogs, and puts the GitHub actions in the command palette. */
export function GitHubProvider({ onCloned, children }: GitHubProviderProps) {
  const [dialog, setDialog] = useState<"signIn" | "clone" | null>(null);
  const client = useQueryClient();
  const account = useGitHubAccount().data;
  const api = useMemo<GitHubApi>(
    () => ({
      openSignIn: () => setDialog("signIn"),
      openClone: () => setDialog("clone"),
    }),
    [],
  );
  const close = () => setDialog(null);
  useRegisterActions(accountActions(api, client, account));

  return (
    <GitHubContext value={api}>
      {children}
      {dialog === "signIn" && <SignInDialog onClose={close} />}
      {dialog === "clone" && (
        <CloneDialog
          onClose={close}
          onCloned={onCloned}
          onSignIn={api.openSignIn}
        />
      )}
    </GitHubContext>
  );
}
