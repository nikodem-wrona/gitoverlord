import { formatTime, QueryPanel, shortHash } from "@/features/repository";
import { type Column, EmptyState, Table, textColumn } from "@/hud";

import type { LanedCommit } from "./assignLanes";
import type { History } from "./useHistory";

const COLUMNS: readonly Column<LanedCommit>[] = [
  {
    id: "hash",
    header: "Hash",
    width: "4.5rem",
    render: (commit) => shortHash(commit.hash),
  },
  textColumn<LanedCommit>("subject", "Subject"),
  textColumn<LanedCommit>("author", "Author", { width: "7rem" }),
  {
    id: "refs",
    header: "Refs",
    width: "8rem",
    render: (commit) => commit.refs.join(", "),
  },
  {
    id: "time",
    header: "Time",
    width: "8.5rem",
    render: (commit) => formatTime(commit.time),
  },
];

interface CommitLogPanelProps {
  title: string;
  history: History;
  selectedHash?: string;
  onSelect(hash: string): void;
  delay?: number;
}

/** The commit log. It loads more commits when the user comes near the end. */
export function CommitLogPanel(props: CommitLogPanelProps) {
  const { title, history, selectedHash, onSelect, delay } = props;
  const more = history.hasMore ? "+" : "";

  return (
    <QueryPanel
      title={title}
      query={history.query}
      meta={(commits) => `${commits.length}${more} commits`}
      flush
      delay={delay}
    >
      {(commits) =>
        commits.length === 0 ? (
          <EmptyState
            title="No commits"
            message="This repository has no commits."
          />
        ) : (
          <Table
            label="Commit log"
            columns={COLUMNS}
            minWidth="40rem"
            rows={commits}
            getRowKey={(commit) => commit.hash}
            selectedKey={selectedHash}
            onSelect={onSelect}
            onEndReached={history.loadMore}
            // A merge commit is highlighted.
            getRowTone={(commit) =>
              commit.parents.length > 1 ? "highlight" : undefined
            }
          />
        )
      }
    </QueryPanel>
  );
}
