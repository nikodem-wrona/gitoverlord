import { useState } from "react";

import { formatTime, QueryPanel, useBranches } from "@/features/repository";
import { type Column, EmptyState, Table, textColumn } from "@/hud";
import type { Branch } from "@/ipc";

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
  const [picked, setPicked] = useState<string>();
  const current = branches.data?.find((branch) => branch.current)?.name;

  return (
    <QueryPanel
      title={title}
      query={branches}
      meta={(data) => `${data.length} branches`}
      flush
      delay={delay}
    >
      {(data) =>
        data.length === 0 ? (
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
            selectedKey={picked ?? current}
            onSelect={setPicked}
            getRowTone={(branch) => (branch.current ? "highlight" : undefined)}
          />
        )
      }
    </QueryPanel>
  );
}
