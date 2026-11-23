import { useState } from "react";

import { type Commit, SAMPLE_REPOSITORY } from "@/features/repository";
import {
  type Column,
  Meter,
  Panel,
  Readout,
  ReadoutList,
  Table,
  textColumn,
  Tree,
  type TreeNode,
} from "@/hud";

import styles from "./Gallery.module.css";

const ROWS = SAMPLE_REPOSITORY.commits.slice(0, 8);

const COLUMNS: readonly Column<Commit>[] = [
  textColumn<Commit>("hash", "Hash", { width: "5rem" }),
  textColumn<Commit>("subject", "Subject"),
  textColumn<Commit>("time", "Time", { width: "6rem" }),
];

const NODES: readonly TreeNode[] = [
  {
    id: "root",
    label: "Server Z09",
    icon: "folder",
    meta: "2",
    children: [
      { id: "a", label: "origin", icon: "remote" },
      { id: "b", label: "v1.0.0", icon: "tag" },
    ],
  },
];

/** Tables, trees, readouts, and meters. */
export function DataSection() {
  const [selected, setSelected] = useState(ROWS[0]?.hash);
  const [node, setNode] = useState("a");

  return (
    <>
      <Panel title="Table" meta="Arrow keys select" flush>
        <div className={styles.frame}>
          <Table
            label="Sample commits"
            columns={COLUMNS}
            rows={ROWS}
            getRowKey={(row) => row.hash}
            selectedKey={selected}
            onSelect={setSelected}
            getRowTone={(row) => (row.parents.length > 1 ? "alert" : undefined)}
          />
        </div>
      </Panel>
      <Panel title="Tree">
        <Tree
          label="Sample tree"
          nodes={NODES}
          selectedId={node}
          onSelect={setNode}
          defaultExpanded={["root"]}
        />
      </Panel>
      <Panel title="Readouts and meters">
        <div className={styles.stack}>
          <ReadoutList>
            <Readout label="Start" value="Madrid 9:55" />
            <Readout label="Delay" value="10 min" tone="warn" />
          </ReadoutList>
          <Meter label="Load" value={7} max={10} />
          <Meter label="Alarm" value={3} max={10} tone="fail" />
        </div>
      </Panel>
    </>
  );
}
