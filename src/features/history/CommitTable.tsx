import type { Commit } from "@/features/repository";
import { type Column, Table, textColumn } from "@/hud";

const COLUMNS: readonly Column<Commit>[] = [
  textColumn<Commit>("hash", "Hash", { width: "5.5rem" }),
  textColumn<Commit>("subject", "Subject"),
  textColumn<Commit>("author", "Author", { width: "6rem" }),
  textColumn<Commit>("lane", "Branch", { width: "8.5rem" }),
  textColumn<Commit>("time", "Time", { width: "6.5rem" }),
];

interface CommitTableProps {
  commits: readonly Commit[];
  selectedHash?: string;
  onSelect(hash: string): void;
}

/** The commit log. Merge commits are highlighted. */
export function CommitTable({
  commits,
  selectedHash,
  onSelect,
}: CommitTableProps) {
  return (
    <Table
      label="Commit log"
      columns={COLUMNS}
      rows={commits}
      getRowKey={(commit) => commit.hash}
      selectedKey={selectedHash}
      onSelect={onSelect}
      getRowTone={(commit) =>
        commit.parents.length > 1 ? "highlight" : undefined
      }
    />
  );
}
