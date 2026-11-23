import { BranchTable } from "@/features/branches";
import { ChangesTable } from "@/features/changes";
import { CommitTable } from "@/features/history";
import type { Repository } from "@/features/repository";
import { EmptyState, Panel, TabPanel } from "@/hud";

import { MODULE_TABS_ID, MODULES, type ModuleId } from "./modules";
import styles from "./Workspace.module.css";

interface WorkspaceProps {
  moduleId: ModuleId;
  repository: Repository;
  selectedHash?: string;
  onSelectCommit(hash: string): void;
}

/** The panel under the star map. The module tabs choose its content. */
export function Workspace(props: WorkspaceProps) {
  const module = MODULES[props.moduleId];

  return (
    <TabPanel
      idPrefix={MODULE_TABS_ID}
      activeId={module.id}
      className={styles.workspace}
    >
      <Panel
        key={module.id}
        title={module.title}
        meta={moduleMeta(props)}
        flush
        delay={60}
      >
        <ModuleContent {...props} />
      </Panel>
    </TabPanel>
  );
}

function ModuleContent({
  moduleId,
  repository,
  selectedHash,
  onSelectCommit,
}: WorkspaceProps) {
  switch (moduleId) {
    case "changes":
      return <ChangesTable changes={repository.changes} />;
    case "history":
      return (
        <CommitTable
          commits={repository.commits}
          selectedHash={selectedHash}
          onSelect={onSelectCommit}
        />
      );
    case "branches":
      return <BranchTable branches={repository.branches} />;
    default:
      return (
        <EmptyState
          title="Module offline"
          message={`This module arrives in phase ${MODULES[moduleId].phase}.`}
        />
      );
  }
}

function moduleMeta({ moduleId, repository }: WorkspaceProps): string {
  switch (moduleId) {
    case "changes":
      return `${repository.changes.length} files`;
    case "history":
      return `${repository.commits.length} commits`;
    case "branches":
      return `${repository.branches.length} branches`;
    default:
      return "Offline";
  }
}
