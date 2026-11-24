import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ActionButton } from "@/actions";
import { formatDay, QueryPanel, useBranches } from "@/features/repository";
import {
  Button,
  type Column,
  EmptyState,
  Panel,
  Table,
  ToolLayout,
} from "@/hud";
import type { PullList, PullRequest } from "@/ipc";

import { ChecksTag } from "./ChecksTag";
import { useGitHub } from "./githubContext";
import { createPullAction, openPullAction } from "./pullActions";
import { githubKeys, useGitHubAccount, usePullRequests } from "./queries";

const COLUMNS: readonly Column<PullRequest>[] = [
  {
    id: "number",
    header: "Number",
    shortHeader: "#",
    width: "3rem",
    render: (pull) => pull.number,
  },
  {
    id: "title",
    header: "Title",
    render: (pull) => (pull.draft ? `${pull.title} · Draft` : pull.title),
  },
  {
    id: "author",
    header: "Author",
    width: "6rem",
    render: (pull) => pull.author,
  },
  {
    id: "branch",
    header: "Branch",
    width: "9rem",
    render: (pull) => pull.head,
  },
  {
    id: "checks",
    header: "Checks",
    width: "6.5rem",
    render: (pull) => <ChecksTag checks={pull.checks} />,
  },
  {
    id: "updated",
    header: "Updated",
    width: "6rem",
    render: (pull) => formatDay(Date.parse(pull.updatedAt) / 1000),
  },
];

interface PullRequestPanelProps {
  title: string;
  repoPath: string;
  delay?: number;
}

/** The open pull requests on GitHub, with the state of their checks. */
export function PullRequestPanel(props: PullRequestPanelProps) {
  const account = useGitHubAccount();
  const { openSignIn } = useGitHub();
  if (account.data) return <OpenPulls {...props} />;

  return (
    <Panel title={props.title} meta="No link" flush delay={props.delay}>
      <EmptyState
        title={account.isPending ? "Scanning" : "Not signed in"}
        message="Sign in to GitHub to see the pull requests of this repository."
        action={
          <Button variant="primary" onClick={openSignIn}>
            Sign in to GitHub
          </Button>
        }
      />
    </Panel>
  );
}

function OpenPulls({ title, repoPath, delay }: PullRequestPanelProps) {
  const pulls = usePullRequests(repoPath, true);
  return (
    <QueryPanel
      title={title}
      query={pulls}
      meta={(data) => (data ? fullName(data) : "No link")}
      flush
      delay={delay}
    >
      {(data) =>
        data ? (
          <PullTable path={repoPath} list={data} />
        ) : (
          <EmptyState
            title="No GitHub remote"
            message="Add a remote on github.com to see its pull requests."
          />
        )
      }
    </QueryPanel>
  );
}

function PullTable({ path, list }: { path: string; list: PullList }) {
  const [picked, setPicked] = useState<number>();
  const selected = list.pulls.find((pull) => pull.number === picked);
  return (
    <ToolLayout
      label="Pull request commands"
      tools={<PullTools path={path} list={list} selected={selected} />}
    >
      {list.pulls.length === 0 ? (
        <EmptyState
          title="No open pull requests"
          message="Create one from a published branch."
        />
      ) : (
        <Table
          label="Pull requests"
          columns={COLUMNS}
          minWidth="40rem"
          rows={list.pulls}
          getRowKey={(pull) => String(pull.number)}
          selectedKey={selected ? String(selected.number) : undefined}
          onSelect={(key) => setPicked(Number(key))}
        />
      )}
    </ToolLayout>
  );
}

function fullName({ repository }: PullList): string {
  return `${repository.owner}/${repository.name}`;
}

interface PullToolsProps {
  path: string;
  list: PullList;
  selected?: PullRequest;
}

function PullTools({ path, list, selected }: PullToolsProps) {
  const client = useQueryClient();
  const current = useBranches(path).data?.find((branch) => branch.current);
  const refresh = () =>
    void client.invalidateQueries({ queryKey: githubKeys.pulls(path) });

  return (
    <>
      <ActionButton
        action={createPullAction(client, path, list, current)}
        text="Create…"
        variant="primary"
      />
      <ActionButton action={openPullAction(selected)} text="Open on GitHub" />
      <Button onClick={refresh}>Refresh</Button>
    </>
  );
}
