import { BranchPanel } from "@/features/branches";
import { ChangesPanel } from "@/features/changes";
import { CommitLogPanel, type History } from "@/features/history";
import { StashPanel } from "@/features/stash";
import { RemotePanel } from "@/features/sync";
import { EmptyState, Panel, TabPanel } from "@/hud";
import type { DiffTarget } from "@/ipc";

import { MODULE_TABS_ID, MODULES, type ModuleId } from "./modules";
import styles from "./Workspace.module.css";

const REVEAL_DELAY = 60;

interface WorkspaceProps {
  moduleId: ModuleId;
  repoPath: string;
  history: History;
  selectedHash?: string;
  onSelectCommit(hash: string): void;
  /** The file that the diff viewer shows. */
  target?: DiffTarget;
  /** Opens a file in the diff viewer. */
  onInspect(target: DiffTarget): void;
}

/** The panel under the timeline. The module tabs choose its content. */
export function Workspace(props: WorkspaceProps) {
  return (
    <TabPanel
      idPrefix={MODULE_TABS_ID}
      activeId={props.moduleId}
      className={styles.workspace}
    >
      <ModulePanel key={props.moduleId} {...props} />
    </TabPanel>
  );
}

function ModulePanel(props: WorkspaceProps) {
  const { moduleId, repoPath } = props;
  const { title, phase } = MODULES[moduleId];

  switch (moduleId) {
    case "changes":
      return (
        <ChangesPanel
          title={title}
          repoPath={repoPath}
          selected={props.target}
          onSelect={props.onInspect}
          delay={REVEAL_DELAY}
        />
      );
    case "history":
      return (
        <CommitLogPanel
          title={title}
          history={props.history}
          selectedHash={props.selectedHash}
          onSelect={props.onSelectCommit}
          delay={REVEAL_DELAY}
        />
      );
    case "branches":
      return (
        <BranchPanel title={title} repoPath={repoPath} delay={REVEAL_DELAY} />
      );
    case "remotes":
      return (
        <RemotePanel title={title} repoPath={repoPath} delay={REVEAL_DELAY} />
      );
    case "stash":
      return (
        <StashPanel
          title={title}
          repoPath={repoPath}
          onInspect={props.onSelectCommit}
          delay={REVEAL_DELAY}
        />
      );
    default:
      return <OfflinePanel title={title} phase={phase} />;
  }
}

/** A module that a later phase of the roadmap makes. */
function OfflinePanel({ title, phase }: { title: string; phase?: number }) {
  return (
    <Panel title={title} meta="Offline" flush delay={REVEAL_DELAY}>
      <EmptyState
        title="Module offline"
        message={`This module arrives in phase ${phase}.`}
      />
    </Panel>
  );
}
