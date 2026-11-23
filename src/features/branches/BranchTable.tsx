import { useState } from "react";

import type { Branch } from "@/features/repository";
import { type Column, Table, textColumn } from "@/hud";

const COLUMNS: readonly Column<Branch>[] = [
  {
    id: "name",
    header: "Branch",
    render: (branch) => (branch.current ? `▸ ${branch.name}` : branch.name),
  },
  textColumn<Branch>("upstream", "Upstream", { width: "10rem" }),
  textColumn<Branch>("ahead", "Ahead", { width: "4rem", align: "end" }),
  textColumn<Branch>("behind", "Behind", { width: "4rem", align: "end" }),
  textColumn<Branch>("updated", "Updated", { width: "6.5rem" }),
];

/** The local branches. The current branch is highlighted. */
export function BranchTable({ branches }: { branches: readonly Branch[] }) {
  const [selectedName, setSelectedName] = useState(
    branches.find((branch) => branch.current)?.name,
  );

  return (
    <Table
      label="Branches"
      columns={COLUMNS}
      rows={branches}
      getRowKey={(branch) => branch.name}
      selectedKey={selectedName}
      onSelect={setSelectedName}
      getRowTone={(branch) => (branch.current ? "highlight" : undefined)}
    />
  );
}
