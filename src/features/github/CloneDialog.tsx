import { useState } from "react";

import { useActions } from "@/actions";
import { QueryView } from "@/features/repository";
import { cloneUrlAction } from "@/features/sync";
import {
  Button,
  type Column,
  Dialog,
  EmptyState,
  Table,
  TextField,
} from "@/hud";
import type { HubRepository } from "@/ipc";

import styles from "./GitHub.module.css";
import { useGitHubAccount, useHubRepositories } from "./queries";

const COLUMNS: readonly Column<HubRepository>[] = [
  { id: "name", header: "Repository", render: (repo) => repo.fullName },
  {
    id: "private",
    header: "Access",
    width: "6rem",
    render: (repo) => (repo.private ? "Private" : "Public"),
  },
];

interface CloneDialogProps {
  onClose(): void;
  onCloned(path: string): void;
  onSignIn(): void;
}

/** The repositories of the GitHub account. A selected repository clones into a folder. */
export function CloneDialog({ onClose, onCloned, onSignIn }: CloneDialogProps) {
  const account = useGitHubAccount().data;
  const footer = <Button onClick={onClose}>Cancel</Button>;

  return (
    <Dialog title="Clone from GitHub" onClose={onClose} footer={footer}>
      {account ? (
        <RepositoryPicker onClose={onClose} onCloned={onCloned} />
      ) : (
        <EmptyState
          title="Not signed in"
          message="Sign in to GitHub to see your repositories."
          action={
            <Button variant="primary" onClick={onSignIn}>
              Sign in to GitHub
            </Button>
          }
        />
      )}
    </Dialog>
  );
}

function RepositoryPicker(props: Omit<CloneDialogProps, "onSignIn">) {
  const repositories = useHubRepositories(true);
  const { run } = useActions();
  const [filter, setFilter] = useState("");
  const select = (url: string) => {
    const repo = repositories.data?.find((entry) => entry.cloneUrl === url);
    props.onClose();
    if (repo) run(cloneUrlAction(repo.cloneUrl, repo.fullName, props.onCloned));
  };

  return (
    <div className={styles.list}>
      <TextField label="Filter" value={filter} onChange={setFilter} />
      <QueryView query={repositories}>
        {(data) => (
          <Table
            label="GitHub repositories"
            columns={COLUMNS}
            rows={data.filter((repo) => matches(repo, filter))}
            getRowKey={(repo) => repo.cloneUrl}
            onSelect={select}
          />
        )}
      </QueryView>
    </div>
  );
}

function matches(repo: HubRepository, filter: string): boolean {
  return repo.fullName.toLowerCase().includes(filter.trim().toLowerCase());
}
