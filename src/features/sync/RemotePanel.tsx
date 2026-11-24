import { ActionButton } from "@/actions";
import {
  QueryPanel,
  type RepoWriter,
  useRemotes,
  useRepoWriter,
} from "@/features/repository";
import { type Column, EmptyState, Table, textColumn, ToolLayout } from "@/hud";
import type { Remote } from "@/ipc";

import { addOriginAction } from "./remoteActions";
import { fetchAction } from "./syncActions";

const COLUMNS: readonly Column<Remote>[] = [
  textColumn<Remote>("name", "Remote", { width: "8rem" }),
  { id: "url", header: "URL", render: (remote) => remote.url ?? "None" },
  {
    id: "branches",
    header: "Branches",
    width: "6rem",
    align: "end",
    render: (remote) => remote.branches.length,
  },
];

interface RemotePanelProps {
  title: string;
  repoPath: string;
  delay?: number;
}

/** The remotes, with the count of their branches from the last fetch. */
export function RemotePanel({ title, repoPath, delay }: RemotePanelProps) {
  const remotes = useRemotes(repoPath);
  const repo = useRepoWriter(repoPath);

  return (
    <QueryPanel
      title={title}
      query={remotes}
      meta={(data) => `${data.length} remotes`}
      flush
      delay={delay}
    >
      {(data) => (
        <ToolLayout
          label="Remote commands"
          tools={<RemoteTools repo={repo} remotes={data} />}
        >
          {data.length === 0 ? (
            <EmptyState
              title="No remotes"
              message="Add the remote origin, then publish a branch."
            />
          ) : (
            <Table
              label="Remotes"
              columns={COLUMNS}
              minWidth="30rem"
              rows={data}
              getRowKey={(remote) => remote.name}
            />
          )}
        </ToolLayout>
      )}
    </QueryPanel>
  );
}

function RemoteTools(props: { repo: RepoWriter; remotes: readonly Remote[] }) {
  const { repo, remotes } = props;
  const names = remotes.map((remote) => remote.name);
  return (
    <>
      <ActionButton
        action={fetchAction(repo, remotes.length)}
        text="Fetch"
        variant="primary"
      />
      <ActionButton action={addOriginAction(repo, names)} text="Add origin…" />
    </>
  );
}
