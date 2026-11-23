import { useState } from "react";

import { ActionButton } from "@/actions";
import {
  formatTime,
  QueryPanel,
  type RepoWriter,
  useRepoWriter,
  useStashes,
  useWorkingTree,
} from "@/features/repository";
import { type Column, EmptyState, Table, ToolLayout } from "@/hud";
import type { StashEntry } from "@/ipc";

import {
  applyStashAction,
  dropStashAction,
  entryName,
  saveStashAction,
} from "./stashActions";

const COLUMNS: readonly Column<StashEntry>[] = [
  { id: "name", header: "Entry", width: "6rem", render: entryName },
  { id: "message", header: "Message", render: (entry) => entry.message },
  {
    id: "time",
    header: "Stashed",
    width: "8.5rem",
    render: (entry) => formatTime(entry.time),
  },
];

interface StashPanelProps {
  title: string;
  repoPath: string;
  /** Shows the files of an entry in the inspector. */
  onInspect(hash: string): void;
  delay?: number;
}

/** The stash entries. The newest entry is first. */
export function StashPanel(props: StashPanelProps) {
  const { title, repoPath, onInspect, delay } = props;
  const stashes = useStashes(repoPath);
  const repo = useRepoWriter(repoPath);
  const [picked, setPicked] = useState<string>();
  const list = stashes.data ?? [];
  const selected = list.find((entry) => entry.hash === picked) ?? list[0];
  const select = (hash: string) => {
    setPicked(hash);
    onInspect(hash);
  };

  return (
    <QueryPanel
      title={title}
      query={stashes}
      meta={(data) => `${data.length} entries`}
      flush
      delay={delay}
    >
      {(data) => (
        <ToolLayout
          label="Stash commands"
          tools={<StashTools repo={repo} selected={selected} />}
        >
          {data.length === 0 ? (
            <EmptyState
              title="Stash empty"
              message="Stash your changes to keep them for later."
            />
          ) : (
            <Table
              label="Stash entries"
              columns={COLUMNS}
              minWidth="30rem"
              rows={data}
              getRowKey={(entry) => entry.hash}
              selectedKey={selected?.hash}
              onSelect={select}
            />
          )}
        </ToolLayout>
      )}
    </QueryPanel>
  );
}

function StashTools(props: { repo: RepoWriter; selected?: StashEntry }) {
  const { repo, selected } = props;
  const tree = useWorkingTree(repo.path).data;
  const changes = (tree?.staged.length ?? 0) + (tree?.unstaged.length ?? 0);

  return (
    <>
      <ActionButton action={saveStashAction(repo, changes)} variant="primary" />
      <ActionButton
        action={applyStashAction(repo, selected, false)}
        text="Apply"
      />
      <ActionButton
        action={applyStashAction(repo, selected, true)}
        text="Pop"
      />
      <ActionButton
        action={dropStashAction(repo, selected)}
        variant="danger"
        text="Drop…"
      />
    </>
  );
}
