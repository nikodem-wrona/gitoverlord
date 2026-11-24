import { ActionButton } from "@/actions";
import {
  QueryPanel,
  type RepoWriter,
  useRepoWriter,
  useWorkingTree,
} from "@/features/repository";
import { EmptyState, Table, ToolLayout } from "@/hud";
import type { DiffTarget, WorkingTree } from "@/ipc";

import { changeColumns } from "./changeColumns";
import { changesActions, discardAction } from "./changeActions";
import { changeRows, selectedRowKey } from "./changeRows";

interface ChangesPanelProps {
  title: string;
  repoPath: string;
  /** The file that the diff viewer shows. */
  selected?: DiffTarget;
  onSelect(target: DiffTarget): void;
  delay?: number;
}

/** The files that are not committed. A click on a file opens its diff. Conflicts show in red. */
export function ChangesPanel(props: ChangesPanelProps) {
  const { title, repoPath, selected, onSelect, delay } = props;
  const tree = useWorkingTree(repoPath);
  const repo = useRepoWriter(repoPath);
  const rows = tree.data ? changeRows(tree.data) : [];
  const select = (key: string) => {
    const row = rows.find((candidate) => candidate.key === key);
    if (row) onSelect({ kind: row.area, path: row.path });
  };

  return (
    <QueryPanel
      title={title}
      query={tree}
      meta={() => `${rows.length} files`}
      flush
      delay={delay}
    >
      {(data) => (
        <ToolLayout
          label="Change commands"
          tools={<ChangeTools repo={repo} tree={data} selected={selected} />}
        >
          {rows.length === 0 ? (
            <EmptyState
              title="Working tree clean"
              message="There are no changes to commit."
            />
          ) : (
            <Table
              label="Working tree changes"
              columns={changeColumns(repo)}
              minWidth="36rem"
              rows={rows}
              getRowKey={(row) => row.key}
              selectedKey={selectedRowKey(selected)}
              onSelect={select}
              getRowTone={(row) =>
                row.kind === "conflicted" ? "alert" : undefined
              }
            />
          )}
        </ToolLayout>
      )}
    </QueryPanel>
  );
}

interface ChangeToolsProps {
  repo: RepoWriter;
  tree: WorkingTree;
  selected?: DiffTarget;
}

function ChangeTools({ repo, tree, selected }: ChangeToolsProps) {
  const [stageAll, unstageAll] = changesActions(repo, tree);
  // The selected file must still have unstaged changes.
  const row = tree.unstaged.find(
    ({ path }) => selected?.kind === "unstaged" && path === selected.path,
  );
  const file = row?.path;
  const conflicted = row?.kind === "conflicted";
  const discard = discardAction(repo, file && !conflicted ? [file] : [], {
    id: "changes.discard-file",
    label: file ? `Discard the changes of ${file}…` : "Discard…",
    empty: conflicted
      ? "Resolve the conflict first. A conflict cannot be discarded."
      : "Select an unstaged file.",
  });

  return (
    <>
      {stageAll && <ActionButton action={stageAll} text="Stage all" />}
      {unstageAll && <ActionButton action={unstageAll} text="Unstage all" />}
      <ActionButton action={discard} variant="danger" text="Discard…" />
    </>
  );
}
