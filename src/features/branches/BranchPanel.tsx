import { useState } from "react";

import { ActionButton } from "@/actions";
import {
  formatTime,
  QueryPanel,
  type RepoWriter,
  useBranches,
  useRepoWriter,
} from "@/features/repository";
import { mergeAction, rebaseAction, useHistoryState } from "@/features/surgery";
import { type Column, EmptyState, Table, textColumn, ToolLayout } from "@/hud";
import type { Branch } from "@/ipc";

import {
  deleteBranchAction,
  newBranchAction,
  renameBranchAction,
  switchBranchAction,
} from "./branchActions";

const COLUMNS: readonly Column<Branch>[] = [
  {
    id: "name",
    header: "Branch",
    render: (branch) => (branch.current ? `▸ ${branch.name}` : branch.name),
  },
  {
    id: "upstream",
    header: "Upstream",
    width: "12rem",
    render: (branch) => branch.upstream ?? "None",
  },
  textColumn<Branch>("ahead", "Ahead", { width: "4rem", align: "end" }),
  textColumn<Branch>("behind", "Behind", { width: "4rem", align: "end" }),
  {
    id: "updated",
    header: "Updated",
    width: "8.5rem",
    render: (branch) => formatTime(branch.updated),
  },
];

interface BranchPanelProps {
  title: string;
  repoPath: string;
  delay?: number;
}

/** The local branches. The current branch is highlighted. */
export function BranchPanel({ title, repoPath, delay }: BranchPanelProps) {
  const branches = useBranches(repoPath);
  const repo = useRepoWriter(repoPath);
  const [picked, setPicked] = useState<string>();
  const list = branches.data ?? [];
  const selected =
    list.find((branch) => branch.name === picked) ??
    list.find((branch) => branch.current);

  return (
    <QueryPanel
      title={title}
      query={branches}
      meta={(data) => `${data.length} branches`}
      flush
      delay={delay}
    >
      {(data) => (
        <ToolLayout
          label="Branch commands"
          tools={<BranchTools repo={repo} selected={selected} />}
        >
          {data.length === 0 ? (
            <EmptyState
              title="No branches"
              message="A branch shows here after the first commit."
            />
          ) : (
            <Table
              label="Branches"
              columns={COLUMNS}
              minWidth="40rem"
              rows={data}
              getRowKey={(branch) => branch.name}
              selectedKey={selected?.name}
              onSelect={setPicked}
              getRowTone={(branch) =>
                branch.current ? "highlight" : undefined
              }
            />
          )}
        </ToolLayout>
      )}
    </QueryPanel>
  );
}

function BranchTools({
  repo,
  selected,
}: {
  repo: RepoWriter;
  selected?: Branch;
}) {
  const state = useHistoryState(repo.path);
  const target = selected?.name ?? "";
  return (
    <>
      <ActionButton action={newBranchAction(repo)} variant="primary" />
      <ActionButton action={switchBranchAction(repo, selected)} text="Switch" />
      <ActionButton action={mergeAction(repo, state, target)} text="Merge" />
      <ActionButton
        action={rebaseAction(repo, state, target)}
        text="Rebase onto…"
      />
      <ActionButton
        action={renameBranchAction(repo, selected)}
        text="Rename…"
      />
      <ActionButton
        action={deleteBranchAction(repo, selected)}
        variant="danger"
        text="Delete…"
      />
    </>
  );
}
